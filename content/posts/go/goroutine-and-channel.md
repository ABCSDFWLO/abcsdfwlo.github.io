+++
date = '2026-10-13T16:40:00+09:00'
title = 'Go 고루틴(Goroutine)과 채널(Channel) 완전 정복'
+++

Go 동시성의 두 기둥은 **고루틴(실행 단위)**과 **채널(통신 수단)**이다. Go의 철학은 다음 한 문장으로 요약된다.

> Do not communicate by sharing memory; instead, share memory by communicating.

메모리를 공유해 통신하지 말고, 통신(채널)으로 메모리를 공유하라는 뜻이다. 락 기반의 공유 메모리 방식은 [Go 동시성 제어: Context, WaitGroup, RWMutex와 Graceful Shutdown]({{< relref "concurrency-context-and-sync.md" >}})에서 다루며, 이 글은 그 기반이 되는 고루틴과 채널의 동작 원리를 설명한다.

---

## 1. 고루틴 (Goroutine)

### 1) 개념
- `go f()` 로 실행하는 **Go 런타임이 관리하는 경량 실행 단위**다. OS 스레드가 아니다.
- 초기 스택이 약 2KB이며 필요에 따라 동적으로 늘고 줄어, 수십만 개도 생성할 수 있다.
- 호출한 쪽은 완료를 기다리지 않고 즉시 다음 줄로 진행한다. `main`이 끝나면 살아있는 모든 고루틴이 강제 종료된다.

### 2) G-M-P 스케줄러
| 구성 | 의미 |
|------|------|
| **G** (Goroutine) | 실행할 작업 |
| **M** (Machine) | OS 스레드 |
| **P** (Processor) | 논리 프로세서. G를 M에 배정하는 스케줄링 컨텍스트 (개수 = `GOMAXPROCS`) |

- 각 P는 로컬 실행 큐를 가지며, 비면 다른 P의 큐에서 작업을 훔쳐온다(work stealing).
- 고루틴이 채널/락/I/O로 블로킹되면 런타임이 해당 G를 내리고 다른 G를 실행하므로 스레드가 낭비되지 않는다.

### 3) 흔한 실수: 루프 변수 캡처
```go
for i := 0; i < 3; i++ {
    go func() { fmt.Println(i) }() // Go 1.22 미만: 같은 i를 공유해 결과가 뒤죽박죽
}

for i := 0; i < 3; i++ {
    go func(n int) { fmt.Println(n) }(i) // 인자로 전달하면 모든 버전에서 안전
}
```
Go 1.22부터는 반복마다 변수가 새로 만들어져 문제가 해결되었지만, 구버전 호환이 필요하면 인자로 넘긴다.

### 4) 고루틴 누수 (Leak)
종료되지 않고 영원히 블로킹된 고루틴은 메모리를 계속 점유한다. 대표 원인은 **아무도 받지 않는 채널에 보내기 / 아무도 닫지 않는 채널에서 받기**다. 종료 조건을 반드시 설계하고, 취소 전파는 `context`를 사용한다. 자세한 패턴은 [Context 편]({{< relref "concurrency-context-and-sync.md" >}})을 참고한다.

---

## 2. 채널 (Channel)

### 1) 생성과 기본 연산
```go
ch := make(chan int)     // 언버퍼드 채널
bch := make(chan int, 3) // 버퍼 크기 3인 채널

ch <- 1        // 송신
v := <-ch      // 수신
v, ok := <-ch  // ok == false: 닫혔고 비어 있음
close(ch)      // 송신 측에서 닫기
```

### 2) 언버퍼드 vs 버퍼드
| 구분 | 언버퍼드 | 버퍼드 |
|------|----------|--------|
| 송신 | 수신자가 나타날 때까지 블로킹 | 버퍼가 가득 찼을 때만 블로킹 |
| 수신 | 송신자가 나타날 때까지 블로킹 | 버퍼가 비었을 때만 블로킹 |
| 성질 | 동기화(랑데부) 보장 | 생산자/소비자 속도 차이 완충 |

버퍼 크기는 "성능 튜닝용 마법 숫자"가 아니라 **동작 의미를 바꾸는 설계 요소**다. 기본은 언버퍼드로 시작하고, 이유가 있을 때 버퍼를 둔다.

### 3) nil 채널과 닫힌 채널의 동작
| 상황 | 송신 | 수신 | close |
|------|------|------|-------|
| `nil` 채널 | 영원히 블로킹 | 영원히 블로킹 | **panic** |
| 열린 채널 | 정상 | 정상 | 정상 |
| 닫힌 채널 | **panic** | 남은 값을 모두 받은 뒤 제로값 + `ok=false` | **panic** |

- **닫기는 송신자의 책임**이다. 수신자가 닫거나, 여러 송신자 중 하나가 닫으면 "닫힌 채널에 송신" 패닉이 발생하기 쉽다. 송신자가 여럿이면 [`sync.WaitGroup`]({{< relref "concurrency-context-and-sync.md" >}})으로 모두 끝난 뒤 한 곳에서 닫는다.
- `close`는 필수가 아니다. 수신자에게 "더 이상 값이 없다"를 알려야 할 때(`range` 등)만 필요하다.
- `nil` 채널의 블로킹 특성은 `select`에서 특정 case를 **비활성화**하는 데 활용된다.

### 4) 방향 있는 채널
```go
func producer(out chan<- int) { out <- 1 } // 송신 전용
func consumer(in <-chan int)  { <-in }     // 수신 전용
```
함수 시그니처에 방향을 명시하면 컴파일러가 오용을 막아주고 의도가 드러난다. 양방향 채널은 자동으로 변환된다.

### 5) range로 수신
```go
for v := range ch { // 채널이 닫히고 비워질 때까지 반복
    fmt.Println(v)
}
```
닫지 않으면 `range`는 영원히 끝나지 않는다(→ 고루틴 누수).

---

## 3. select

여러 채널 연산 중 **준비된 것을 하나 골라** 실행한다. 둘 이상 준비되면 무작위로 선택한다.

```go
select {
case v := <-ch1:
    fmt.Println("ch1:", v)
case ch2 <- 42:
    fmt.Println("ch2로 송신")
case <-time.After(time.Second):
    fmt.Println("타임아웃")
default:
    fmt.Println("준비된 채널 없음(논블로킹)")
}
```
- `default`가 있으면 블로킹하지 않는다. 단, `for { select { default: } }`는 CPU를 100% 소모하는 **busy loop**가 되므로 주의한다.
- `<-ctx.Done()`은 사실 `struct{}` 채널을 `select`로 감시하는 것이며, 취소 신호를 받는 표준 방식이다. → [Context 편]({{< relref "concurrency-context-and-sync.md" >}})
- 루프 안의 `time.After`는 매번 타이머를 만든다. 반복 용도라면 `time.NewTimer`/`Ticker`를 재사용한다.

---

## 4. 실전 패턴

### 1) 완료 신호 (done 채널)
```go
done := make(chan struct{})
go func() {
    defer close(done)
    // 작업 수행
}()
<-done // 작업 끝날 때까지 대기
```
`struct{}`는 크기가 0이라 신호 전용으로 적합하다. 닫힌 채널은 **모든 수신자에게 동시에 브로드캐스트**된다는 점이 핵심이다.

### 2) 워커 풀 (Fan-out / Fan-in)
```go
func main() {
    jobs := make(chan int)
    results := make(chan int)

    var wg sync.WaitGroup
    for w := 0; w < 3; w++ {
        wg.Add(1)
        go func() { // Fan-out: 여러 워커가 같은 jobs를 소비
            defer wg.Done()
            for j := range jobs {
                results <- j * j
            }
        }()
    }

    go func() { // 송신자(생산자)가 jobs를 닫는다
        defer close(jobs)
        for i := 1; i <= 9; i++ {
            jobs <- i
        }
    }()

    go func() { // 모든 워커가 끝나면 results를 닫는다 (Fan-in 종료 조건)
        wg.Wait()
        close(results)
    }()

    sum := 0
    for r := range results {
        sum += r
    }
    fmt.Println("합계:", sum) // 285
}
```
`WaitGroup`은 "언제 채널을 닫을 것인가"를 결정하는 데 쓰인다. 이 둘을 조합하는 것이 가장 흔한 형태다.

### 3) 취소 가능한 파이프라인
```go
func gen(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done(): // 소비자가 떠나도 고루틴이 갇히지 않음
                return
            }
        }
    }()
    return out
}
```
송신 지점을 `select`로 감싸 `ctx.Done()`과 함께 기다리면 누수를 막을 수 있다.

### 4) 세마포어로 동시 실행 수 제한
```go
sem := make(chan struct{}, 5) // 최대 5개 동시 실행
for _, task := range tasks {
    sem <- struct{}{} // 슬롯 획득 (가득 차면 대기)
    go func() {
        defer func() { <-sem }() // 슬롯 반환
        run(task)
    }()
}
```

---

## 5. 채널 vs 뮤텍스: 무엇을 쓸까

| 상황 | 권장 |
|------|------|
| 데이터의 **소유권 이전**, 작업 분배, 파이프라인, 이벤트/신호 | 채널 |
| 캐시·카운터처럼 **공유 상태를 보호** | `sync.Mutex` / `sync.RWMutex` ([상세]({{< relref "concurrency-context-and-sync.md" >}})) |
| 취소·타임아웃 전파 | `context` |
| N개 고루틴 완료 대기 | `sync.WaitGroup` |

채널로 캐시를 구현하는 것은 가능하지만 복잡해지기 쉽다. 단순한 공유 상태에는 락이 더 간결하다. 반대로 락으로 작업 큐를 만드는 것은 채널보다 번거롭다.

---

## 6. 정리 및 체크리스트

- [ ] 모든 고루틴은 **언제, 어떻게 끝나는지** 설명할 수 있는가?
- [ ] 채널은 **송신자 측에서 한 번만** 닫는가?
- [ ] 블로킹 가능한 송신/수신에 `ctx.Done()` 탈출구가 있는가?
- [ ] 버퍼 크기에 근거가 있는가?
- [ ] `go test -race`로 데이터 레이스를 점검했는가?

종료 신호 전파와 공유 자원 보호, Graceful Shutdown의 통합 예제는 [Context, WaitGroup, RWMutex 편]({{< relref "concurrency-context-and-sync.md" >}})에서 이어서 확인할 수 있다.

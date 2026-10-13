+++
date = '2026-10-13T12:40:00+09:00'
title = 'Go 동시성 제어: Context, WaitGroup, RWMutex와 Graceful Shutdown'
+++

Go에서 안전하고 견고한 동시성(Concurrency) 프로그램을 작성하려면 고루틴 생성뿐만 아니라, **종료 신호 전달(`context.Context`)**, **작업 완료 대기(`sync.WaitGroup`)**, **공유 자원 보호(`sync.RWMutex`)**의 삼총사를 적재적소에 조합해야 한다.

> 고루틴과 채널 자체의 동작 원리(스케줄러, 버퍼드/언버퍼드, `select`, 파이프라인 패턴 등)는 [Go 고루틴(Goroutine)과 채널(Channel) 완전 정복]({{< relref "goroutine-and-channel.md" >}})에서 다룬다. 이 글은 그 위에서 **종료·대기·보호**를 담당하는 도구들에 집중한다.
---

## 1. 핵심 동기화 프리미티브 이해

### 1) `context.Context` (고루틴 킬 스위치)
부모 고루틴이 여러 자식 고루틴에게 "이제 작업을 중단하고 종료하라"는 취소 신호나 타임아웃을 전파하는 통로다.
- 자식 고루틴은 `select` 문에서 `<-ctx.Done()` 채널을 감시하며 루프를 탈출한다. (`Done()`은 취소 시 닫히는 채널이며, 닫힌 채널이 모든 수신자에게 브로드캐스트되는 원리는 [채널 편]({{< relref "goroutine-and-channel.md#1-완료-신호-done-채널" >}})을 참고)
- 채널 송수신에서 블로킹된 고루틴이 영원히 갇히지 않도록 `select`에 `ctx.Done()`을 함께 두는 패턴은 [취소 가능한 파이프라인]({{< relref "goroutine-and-channel.md#3-취소-가능한-파이프라인" >}})에 정리되어 있다.
- `context.Context`에는 왜 `*`가 없는지, `*sync.WaitGroup` 같은 포인터 인자는 호출할 때 어떻게 전달하는지 궁금하다면 [Go의 포인터와 인터페이스 읽는 법]({{< relref "pointers-and-interfaces.md" >}})을 참고한다.

### 2) `sync.WaitGroup` (작업 카운터)
모든 고루틴이 작업을 마칠 때까지 블로킹 대기한다.
- `Add(n)`: 실행할 고루틴 수만큼 카운터를 올린다. (반드시 `go` 실행 전에 호출)
- `Done()`: 작업 완료 시 카운터를 1 줄인다 (`defer wg.Done()`).
- `Wait()`: 카운터가 0이 될 때까지 대기한다.
- 채널과 함께 쓸 때는 `wg.Wait()` 후 채널을 `close`하는 방식으로 "마지막 송신자 이후 닫기"를 구현한다. ([워커 풀 예제]({{< relref "goroutine-and-channel.md#2-워커-풀-fan-out--fan-in" >}}) 참고)
- **주의**: 카운터가 음수가 되면 즉시 패닉이 발생하므로 `Done()`이 `Add()`보다 초과 호출되지 않도록 주의해야 한다.

### 3) `sync.RWMutex` (읽기/쓰기 분리 락)
- 일반 `sync.Mutex`는 읽기든 쓰기든 무조건 한 번에 하나의 고루틴만 허용한다.
- `sync.RWMutex`는 **`RLock()`(읽기 락)**과 **`Lock()`(쓰기 락)**을 구분한다.
  - 여러 고루틴이 동시에 `RLock()`을 걸고 읽는 것은 허용된다 (읽기 카운터만 증가).
  - 데이터를 수정하는 `Lock()`이 걸리면, 진행 중인 모든 읽기(`RLock`)와 쓰기가 해제될 때까지 대기하며 배타적으로 잠근다.

---

## 2. 실전 통합 예제: Graceful Shutdown을 지원하는 동시성 캐시 워커

아래는 세 개념을 결합하여, 여러 워커가 공유 캐시를 안전하게 갱신하고 시스템 종료 신호 시 안전하게 마무리(Graceful Shutdown)하는 완결된 예제다.

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// 동시성 안전한 캐시 저장소
type SafeStats struct {
    mu    sync.RWMutex
    stats map[string]int
}

func NewSafeStats() *SafeStats {
    return &SafeStats{stats: make(map[string]int)}
}

func (s *SafeStats) Increment(key string) {
    s.mu.Lock() // 쓰기 락: 배타적 접근
    defer s.mu.Unlock()
    s.stats[key]++
}

func (s *SafeStats) Get(key string) int {
    s.mu.RLock() // 읽기 락: 다른 RLock과 동시 접근 허용
    defer s.mu.RUnlock()
    return s.stats[key]
}

// 백그라운드 워커 함수
func worker(id int, ctx context.Context, wg *sync.WaitGroup, stats *SafeStats) {
    defer wg.Done() // 고루틴 종료 시 카운터 감소 보장

    for {
        select {
        case <-ctx.Done():
            // 부모 컨텍스트로부터 킬 스위치가 눌림
            fmt.Printf("[Worker %d] 종료 신호 감지, 자원 정리 후 퇴근\n", id)
            return
        default:
            // 실제 비즈니스 작업 수행
            stats.Increment("processed_jobs")
            time.Sleep(100 * time.Millisecond)
        }
    }
}

func main() {
    // 1초 뒤에 자동으로 취소 신호를 보내는 컨텍스트 생성
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()

    stats := NewSafeStats()
    var wg sync.WaitGroup

    workerCount := 3
    for i := 1; i <= workerCount; i++ {
        wg.Add(1) // 반드시 go 호출 전에 Add
        go worker(i, ctx, &wg, stats)
    }

    // 모든 워커가 완전히 종료될 때까지 대기 (Graceful Shutdown)
    wg.Wait()

    fmt.Printf("최종 처리 건수: %d\n", stats.Get("processed_jobs"))
    fmt.Println("모든 워커가 안전하게 종료되었습니다.")
}
```
> 이 예제는 공유 상태를 `RWMutex`로 보호했지만, 작업 분배가 목적이라면 채널 기반 워커 풀이 더 자연스럽다. 선택 기준은 [채널 vs 뮤텍스]({{< relref "goroutine-and-channel.md#5-채널-vs-뮤텍스-무엇을-쓸까" >}})를 참고한다.

이 구조를 통해 레이스 컨디션(Race Condition) 없는 메모리 접근과 고루틴 누수(Leak) 없는 깔끔한 수명 관리가 완성된다.

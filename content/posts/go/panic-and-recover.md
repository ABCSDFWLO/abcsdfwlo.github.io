+++
date = '2026-10-13T12:35:00+09:00'
title = 'Go의 패닉 제어: panic, defer, recover와 Must 패턴'
+++

Go는 다른 언어들의 `try-catch` 예외 처리 메커니즘을 의도적으로 배제하고, 에러를 평범한 반환값(`error`)으로 다루도록 강제한다. 그렇다면 `panic`은 언제, 어떻게 사용해야 하는가?

---

## 1. panic과 recover의 기본 메커니즘

`defer`는 패닉 전용 기능이 아니다. 함수가 정상적으로 끝나거나 `return`으로 반환할 때도 예약된 함수가 실행되며, `panic`이 발생하면 함수가 스택을 풀어 가는 동안에도 실행된다.

`panic`이 호출되면 현재 함수의 실행이 즉각 중단되고, 지연 실행 예약된 **`defer` 함수들이 역순으로 실행**되면서 콜스택을 거슬러 올라가 최종적으로 프로그램이 강제 종료된다.

### `defer`의 실행 시점

`defer`로 등록한 호출은 등록된 함수가 끝날 때 실행된다. 함수 끝에 자연스럽게 도달하는 경우와 `return`으로 반환하는 경우 모두 해당한다. 여러 개를 등록했다면 나중에 등록한 것부터 실행된다.

```go
func writeFile() {
    file, err := os.Create("output.txt")
    if err != nil {
        return
    }
    defer file.Close()

    fmt.Fprintln(file, "작업 완료")
} // 정상 종료 시에도 file.Close()가 실행됨
```

따라서 `defer`는 파일 닫기나 잠금 해제처럼 함수가 어떤 경로로 끝나든 수행해야 하는 정리에 유용하다. 단, `os.Exit`처럼 프로세스를 즉시 종료하는 경우에는 `defer`가 실행되지 않는다.

이를 런타임 종료 없이 가로채 복구하는 함수가 **`recover()`**다.

```go
package main

import "fmt"

func safeFunction() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("패닉 감지 및 복구 완료: %v\n", r)
        }
    }()

    println("작업 시작")
    panic("치명적인 오류 발생!")
    println("이 줄은 실행되지 않음")
}

func main() {
    safeFunction()
    println("프로그램이 죽지 않고 정상 지속됨")
}
```

- `recover()`는 반드시 `defer` 블록 내부에서 직접 호출되어야만 유효하게 동작한다.

---

## 2. panic 사용의 규칙과 컨벤션

### 1) 일반 비즈니스 로직에서는 panic 금지
Go 커뮤니티의 엄격한 원칙이다. 파일이 없거나 네트워크가 끊기는 등의 통상적인 오류는 무조건 `error`를 반환해야 한다.

### 2) 시작/초기화 단계에서의 허용
서버 부팅 시 필수 설정 파일이 없거나, DB 연결 문자열이 잘못되어 더 이상 애플리케이션을 구동하는 의미가 없는 초기화 단계(`init()` 또는 `main()` 시작점)에서는 프로세스를 즉각 셧다운하기 위해 `panic`을 사용하는 것이 정당화된다.

### 3) `Must...` 함수 네이밍 컨벤션
라이브러리나 패키지를 작성할 때, 에러를 반환하는 대신 패닉을 일으키는 헬퍼 함수는 이름 접두사에 **`Must`**를 붙이는 것이 Go 표준 라이브러리의 확립된 관례다.

```go
// 표준 라이브러리 예시:
// regexp.Compile은 (Regexp, error) 반환
// regexp.MustCompile은 에러 발생 시 즉시 panic 발생
var emailRegex = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
```
정적 상수로 정규표현식이나 템플릿을 컴파일할 때 유용하다.

---

## 3. 고루틴과 패닉의 전파

많은 초심자가 오해하는 부분 중 하나는 **"서브 고루틴에서 발생한 패닉이 부모 고루틴의 recover로 잡히는가?"**이다.

**잡히지 않는다.**

각 고루틴은 독립된 스택 프레임을 가지므로, 서브 고루틴 내부에서 발생한 패닉을 해당 고루틴 안에서 `recover`하지 않으면 **메인 프로세스 전체가 즉시 강제 종료(Crash)**된다.

따라서 백그라운드 고루틴을 실행할 때는 안전한 래퍼를 씌우는 것이 필수적이다:

```go
func SafeGo(fn func()) {
    go func() {
        defer func() {
            if r := recover(); r != nil {
                log.Printf("[Worker Panic Recovered] %v", r)
            }
        }()
        fn()
    }()
}
```

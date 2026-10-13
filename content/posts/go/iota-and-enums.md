+++
date = '2026-10-13T12:15:00+09:00'
title = 'iota를 활용한 Go 스타일의 Enum 구현'
+++

Go에는 별도의 `enum` 키워드가 존재하지 않는다. 대신 `const` 블록과 특수 식별자인 **`iota`**를 결합하여 열거형(Enum)을 구현한다.

---

## 1. iota의 기본 동작

`iota`는 `const` 블록 내부에서 0부터 시작하여 줄(라인)이 넘어갈 때마다 1씩 증가하는 상수 카운터다.

```go
package main

import "fmt"

type Weekday int

const (
    Sunday Weekday = iota // 0
    Monday                // 1
    Tuesday               // 2
    Wednesday             // 3
    Thursday              // 4
    Friday                // 5
    Saturday              // 6
)
```

상수 식을 반복해서 쓰지 않고 이름만 나열해도 직전 식(`Weekday = iota`)의 규칙이 그대로 연속 적용된다.

---

## 2. 오프셋 및 건너뛰기

제로값(0)을 유효하지 않은 기본 상태로 두고 1부터 시작하고 싶다면 산술 연산을 더할 수 있다.

```go
type Status int

const (
    StatusUnknown Status = iota // 0: 초기화되지 않은 제로값
    StatusActive                // 1
    StatusPending               // 2
    StatusInactive              // 3
)
```

특정 값을 건너뛰고 싶다면 빈 식별자(`_`)를 활용한다.

```go
const (
    _ = iota             // 0은 버림
    KB = 1 << (10 * iota) // 1 << 10 (1024)
    MB                   // 1 << 20
    GB                   // 1 << 30
)
```

---

## 3. 실전 Enum 패턴: Stringer 인터페이스 구현

Go에서 Enum을 실무에 적용할 때는 커스텀 타입을 정의하고 `fmt.Stringer` 인터페이스(`String() string`)를 구현하여 출력 시 사람이 읽을 수 있는 문자열을 제공하는 것이 정석이다.

```go
package main

import "fmt"

type OrderState int

const (
    OrderCreated OrderState = iota + 1
    OrderPaid
    OrderShipped
    OrderDelivered
    OrderCancelled
)

func (s OrderState) String() string {
    switch s {
    case OrderCreated:
        return "CREATED"
    case OrderPaid:
        return "PAID"
    case OrderShipped:
        return "SHIPPED"
    case OrderDelivered:
        return "DELIVERED"
    case OrderCancelled:
        return "CANCELLED"
    default:
        return "UNKNOWN"
    }
}

func main() {
    state := OrderPaid
    fmt.Printf("현재 주문 상태: %s (코드: %d)\n", state, state)
    // 출력: 현재 주문 상태: PAID (코드: 2)
}
```

+++
date = '2026-10-13T12:20:00+09:00'
title = 'Go 인터페이스와 컴파일 타임 타입 검증'
+++

Go의 인터페이스는 Java나 C#과 달리 `implements` 같은 명시적 키워드가 없다. 어떤 타입이 인터페이스에 선언된 메서드들을 모두 구현하고 있다면 그 인터페이스를 만족하는 것으로 인정하는 **덕 타이핑(Duck Typing)** 방식을 취한다.

---

## 1. 인터페이스의 존재 이유

Go에서 인터페이스를 사용하는 핵심 이유는 다음과 같다:

1. **다형성(Polymorphism)**: 구체적인 구현체에 의존하지 않고 동작(메서드 시그니처)에만 집중할 수 있다.
2. **느슨한 결합과 테스트 용이성**: DB나 외부 API 호출부를 인터페이스로 감싸면, 단위 테스트 작성 시 손쉽게 Mock 객체로 교체할 수 있다.

---

## 2. 컴파일 타임 인터페이스 검증 트릭

Go는 암시적으로 인터페이스를 만족하기 때문에, 실수로 메서드 파라미터나 반환 타입을 다르게 구현하거나 메서드 하나를 빠뜨렸을 때 컴파일 에러가 나지 않고 런타임에 호출할 때 뒤늦게 문제가 발견될 수 있다.

이를 방지하기 위해 패키지 전역에 다음과 같은 관용구를 작성한다:

```go
package service

import "io"

type CustomWriter struct{}

func (c *CustomWriter) Write(p []byte) (n int, err error) {
    return len(p), nil
}

// 컴파일 타임 인터페이스 구현 여부 검증
var _ io.Writer = (*CustomWriter)(nil)
```

### 동작 원리

- `(*CustomWriter)(nil)`: `CustomWriter` 포인터 타입의 nil 값을 생성한다.
- `var _ io.Writer = ...`: 이 nil 포인터가 `io.Writer` 인터페이스에 할당 가능한지 컴파일러가 확인한다.
- `_` (Blank Identifier): 실제로 메모리에 변수를 생성하거나 런타임 리소스를 쓰지 않고, 오직 컴파일러의 타입 체커만 통과시키는 용도로 사용한다.
- 만약 `Write` 메서드의 시그니처가 틀렸거나 누락되었다면 빌드 시점에 즉시 컴파일 에러가 발생한다.

---

## 3. 타입 단언(Type Assertion)과 타입 스위치

인터페이스 변수에 담긴 실제 구체 타입을 복원하거나 확인할 때는 타입 단언을 사용한다.

```go
func Process(val any) { // Go 1.18+ 에서 interface{}의 별칭은 any
    // 안전한 타입 단언 (Comma-ok 관용구)
    if str, ok := val.(string); ok {
        println("문자열:", str)
        return
    }

    // 타입 스위치
    switch v := val.(type) {
    case int:
        println("정수:", v)
    case bool:
        println("불리언:", v)
    default:
        println("알 수 없는 타입")
    }
}
```
단언 시 `ok`를 받지 않고 `val.(string)`으로 단언하면 런타임에 패닉(`panic`)이 발생하므로 반드시 comma-ok 패턴이나 타입 스위치를 사용해야 한다.

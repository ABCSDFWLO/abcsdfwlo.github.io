+++
date = '2026-10-13T12:55:00+09:00'
title = 'Go의 리플렉션(reflect)과 제네릭의 시대'
+++

Go의 정적 타입 시스템 아래에서, 런타임에 임의의 객체 타입과 구조체 태그 메타데이터를 검사하고 다루기 위해 표준 라이브러리 `reflect` 패키지를 사용한다.

---

## 1. 리플렉션(Reflection)의 기본 원리

Go 컴파일러는 바이너리에 각 구조체와 필드의 이름, 타입, 오프셋, 태그 등의 메타데이터를 기록해 둔다. `reflect`는 런타임에 이 메타데이터를 역참조하여 객체의 정보를 읽어온다.

- **`reflect.TypeOf()`**: 값의 구체 타입(`reflect.Type`) 정보를 반환.
- **`reflect.ValueOf()`**: 실제 값의 인스턴스(`reflect.Value`) 정보를 반환.

### 구조체 태그(Struct Tag) 파싱 예시

JSON 역직렬화 라이브러리나 ORM들이 구조체 태그를 읽어오는 방식의 축소판이다:

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    Name string `json:"name" validate:"required"`
    Age  int    `json:"age" validate:"min=1"`
}

func inspectTags(v any) {
    t := reflect.TypeOf(v)

    // 포인터가 넘어왔다면 역참조
    if t.Kind() == reflect.Pointer {
        t = t.Elem()
    }

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        jsonTag := field.Tag.Get("json")
        validateTag := field.Tag.Get("validate")
        fmt.Printf("필드: %s | JSON 태그: %s | 검증 규칙: %s\n", field.Name, jsonTag, validateTag)
    }
}

func main() {
    u := User{Name: "Gopher", Age: 10}
    inspectTags(u)
}
```

---

## 2. 리플렉션의 한계와 비용

1. **런타임 성능 저하**: 컴파일 시점의 정적 메모리 오프셋 접근이 아니라 런타임 룩업과 힙 할당(Boxing)이 일어나므로 일반 코드보다 수십 배 느리다.
2. **타입 안전성 상실**: 잘못된 타입이나 포인터가 아닌 값에 `Elem().Set()` 등을 시도하면 컴파일 타임 에러가 아니라 런타임 패닉이 발생한다.
3. **IDE 지원 부재**: 태그 문자열(`"..."`) 내부의 오타나 스키마 불일치는 컴파일러가 감지할 수 없다.

---

## 3. Go 1.18 제네릭(Generics)으로의 전환

과거 Go(1.17 이전)에서는 다양한 타입을 처리하는 자료구조(스택, 큐)나 유틸리티 함수(Map, Filter)를 만들 때 어쩔 수 없이 `interface{}`와 `reflect`를 동원해야 했다.

그러나 **Go 1.18에서 제네릭**이 정식 도입되면서 상황이 완전히 바뀌었다:

```go
// 과거 방식: interface{}와 타입 단언/리플렉션 필요 (타입 불일치 시 런타임 에러)
func ContainsReflect(slice []any, target any) bool { ... }

// 현대 방식: 제네릭을 통한 컴파일 타임 타입 보장
func Contains[T comparable](slice []T, target T) bool {
    for _, item := range slice {
        if item == target {
            return true
        }
    }
    return false
}
```

현대 Go에서는 JSON 직렬화/역직렬화처럼 런타임 메타데이터 파싱이 절대적으로 필요한 특수한 프레임워크 수준의 영역을 제외하고는, **리플렉션을 지양하고 제네릭과 정적 인터페이스를 사용하는 것이 공식적인 권장 철학**이다.

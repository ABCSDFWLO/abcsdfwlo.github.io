+++
date = '2026-10-13T12:05:00+09:00'
title = 'Go 스타일 가이드와 코딩 컨벤션'
+++

Go는 언어 설계 단계부터 단일하고 일관된 코드 스타일을 지향한다. Effective Go 및 공식 스타일 가이드에서 권장하는 핵심 규칙들을 정리한다.

---

### 1. 패키지 네이밍
- 짧고, 명확하며, 전부 소문자로 작성한다.
- 복수형(`users`)보다는 **단수형(`user`)**을 권장한다.
- 불필요하게 긴 이름이나 `util`, `common` 같은 모호한 이름은 피한다.

---

### 2. 변수 및 상수 네이밍
- `camelCase` / `PascalCase`를 사용한다.
  - **대문자 시작**: 패키지 외부로 노출(Exported).
  - **소문자 시작**: 패키지 내부 전용(Unexported).
- **약어(Acronym)**는 전체를 대문자 또는 소문자로 유지한다.
  - 좋은 예: `userID`, `httpURL`, `jsonRPC`, `ServeHTTP`
  - 나쁜 예: `userId`, `HttpUrl`, `JsonRpc`

---

### 3. 함수 네이밍
- 동사형으로 시작하며 역할이 명확해야 한다.
- Getter 함수는 `Get` 접두사를 생략하는 것이 관례이다.
  - 좋은 예: `user.Name()`
  - 나쁜 예: `user.GetName()`
- Setter 함수는 `Set` 접두사를 사용한다 (`user.SetName("alice")`).

---

### 4. 파일 및 디렉토리 네이밍
- 소문자 알파벳을 사용하며, 언더스코어(`_`)는 가급적 사용하지 않는다.
- 언더스코어는 주로 빌드 태그(`user_windows.go`, `user_linux_amd64.go`)나 테스트 파일(`user_test.go`)에 한해 사용된다.

---

### 5. 포맷팅
- 들여쓰기, 줄바꿈 논쟁 없이 **`go fmt`**(또는 `goimports`) 사용이 필수이자 표준이다.

---

### 6. 임포트(Import) 정리
`goimports` 기준 3단락 그룹화:
1. 표준 라이브러리 (Standard Library)
2. 외부/서드파티 라이브러리 (External Dependencies)
3. 현재 프로젝트 내부 패키지 (Local Packages)

```go
import (
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"

    "myproject/internal/config"
)
```

---

### 7. 에러 처리 (Error Handling)
- 에러는 반환값으로 명시적으로 다루며, 항상 `if err != nil`로 점검한다.
- **에러 메시지 작성 규칙**: 소문자로 시작하고 마침표(`.`)를 찍지 않는다 (다른 컨텍스트와 체이닝되어 출력될 수 있기 때문).
- 에러를 감쌀(Wrap) 때는 `fmt.Errorf`에 `%w` 동사를 사용한다.

```go
if err != nil {
    return fmt.Errorf("failed to open file: %w", err)
}
```

---

### 8. 구조체 태그 (Struct Tag)
- JSON 태그 등 직렬화 태그는 `snake_case`를 사용하는 것이 보편적이다.

```go
type User struct {
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
}
```

---

### 9. 인터페이스 작성 규칙
- 메서드가 1~2개인 경우 접미사로 **`-er`**를 붙인다 (`Reader`, `Writer`, `Closer`, `Formatter`).
- 인터페이스는 가능한 한 작게 유지하여 단일 책임 원칙을 지킨다. (표준 라이브러리의 `io.Reader`, `io.Writer`가 대표적이다.)

---

### 10. 포인터 vs 값 전달 기준
- **값 전달(Value Receiver / Argument)**:
  - 구조체 크기가 작고 불변성을 유지하고 싶을 때.
  - 기본 타입(`int`, `string`) 및 참조형 타입(`slice`, `map`, `channel`) 자체.
- **포인터 전달(Pointer Receiver / Argument)**:
  - 메서드나 함수 내부에서 구조체의 상태를 직접 변경해야 할 때.
  - 구조체의 메모리 크기가 커서 복사 비용이 부담스러울 때.
  - `sync.Mutex` 등 복사되면 안 되는 필드를 포함하고 있을 때.

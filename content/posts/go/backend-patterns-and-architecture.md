+++
date = '2026-10-13T13:00:00+09:00'
title = 'Go 백엔드 아키텍처: Store 패턴, DI, SQL 파라미터, healthz'
+++

Go로 웹 서버 및 백엔드 애플리케이션을 구축할 때 마주치는 아키텍처 철학과 실전 설계 패턴들을 정리한다.

---

## 1. Go다운 의존성 주입 (Dependency Injection)

Java의 Spring이나 NestJS처럼 무거운 리플렉션/어노테이션 기반 DI 프레임워크를 쓰는 대신, Go에서는 **`main()` 함수에서 명시적으로 인터페이스와 구현체를 조립(Pure / Manual DI)**하는 방식을 선호한다.

- 인터페이스를 통해 모듈 간 결합도를 낮추고 테스트용 Mock 주입을 가능하게 한다.
- 모든 객체의 스코프와 생명주기가 `main()` 한눈에 드러나 추적하기 쉽다.

---

## 2. Store (Repository) 패턴

DB 쿼리와 영속성(Persistence) 로직을 비즈니스 로직(Service/Handler)으로부터 격리하기 위해 `Store` 인터페이스를 둔다.

```go
type User struct {
    ID   string
    Name string
}

// 데이터 저장소 인터페이스 정의
type UserStore interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}
```

서비스 계층은 이 인터페이스에만 의존하므로, 실제 DB가 MySQL이든 PostgreSQL이든, 혹은 단위 테스트용 인메모리 맵이든 아무 상관 없이 비즈니스 로직을 검증할 수 있다.

---

## 3. SQL Positional Parameters와 SQL Injection 방지

데이터베이스에 쿼리를 날릴 때 문자열을 직접 조합(`fmt.Sprintf`)하지 않고 파라미터 바인딩을 사용하는 이유는 드라이버 프로토콜의 동작 원리에 있다:

- **MySQL**: `?` 플레이스홀더 사용
- **PostgreSQL**: `$1, $2` 위치 기반 플레이스홀더 사용
- **Oracle**: `:1` 또는 `:name` 사용

```go
// 올바른 예: Prepared Statement 바인딩
row := db.QueryRowContext(ctx, "SELECT id, name FROM users WHERE id = $1", userID)
```

이 방식이 안전한 이유는 쿼리 템플릿 문자열이 먼저 DB 엔진의 문법 파서(Syntax Parser)로 전달되어 **SQL의 문법 구조(AST)가 확정된 후**, 바인딩된 값들이 순수 리터럴 값으로만 취급되어 전달되기 때문이다. 악의적인 SQL 구문이 쿼리 구조 자체를 변경할 수 없으므로 SQL Injection이 원천 차단된다.

---

## 4. `healthz`와 z-pages 엔드포인트

쿠버네티스(k8s)나 Go 기반 클라우드 인프라에서는 서버 상태 체크 URL로 흔히 `/healthz`를 사용한다.

- **유래**: 구글 내부에서 운영자/개발자 디버깅용 페이지를 일반 사용자용 페이지와 구분하기 위해 접미사 `z`를 붙이던 관례(z-pages: `statusz`, `healthz`, `rpcz`)에서 유래했다.
- 쿠버네티스의 Liveness/Readiness 프로브 기본 권장 엔드포인트로 자리잡았다.

---

## 5. 실전 통합 아키텍처 예제

위 네 가지 개념(DI, Store, Positional Params, healthz)을 하나로 엮은 Go 표준 라이브러리(`net/http`) 기반의 서버 구조다:

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "sync"
    "time"
)

// 1. 도메인 및 Store 인터페이스
type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

type UserStore interface {
    Get(ctx context.Context, id string) (*User, error)
}

// 2. 구현체: 인메모리 스토어 (실제 환경에선 database/sql 구현체로 교체)
type MemoryUserStore struct {
    mu    sync.RWMutex
    users map[string]*User
}

func (s *MemoryUserStore) Get(ctx context.Context, id string) (*User, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    user, exists := s.users[id]
    if !exists {
        return nil, fmt.Errorf("user not found")
    }
    return user, nil
}

// 3. HTTP 핸들러 (Store 인터페이스 주입받음)
type Server struct {
    store UserStore
}

func (s *Server) handleGetUser(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    user, err := s.store.Get(r.Context(), id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }
    json.NewEncoder(w).Encode(user)
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("ok"))
}

// 4. main 진입점: 명시적 DI 조립
func main() {
    store := &MemoryUserStore{
        users: map[string]*User{
            "1": {ID: "1", Name: "Gopher"},
        },
    }

    srv := &Server{store: store}

    mux := http.NewServeMux()
    mux.HandleFunc("/healthz", srv.handleHealthz) // 클라우드 헬스체크
    mux.HandleFunc("/user", srv.handleGetUser)

    httpServer := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    fmt.Println("서버 시작: :8080")
    if err := httpServer.ListenAndServe(); err != nil {
        panic(err)
    }
}
```
프레임워크 없이 표준 라이브러리만으로도 인터페이스 기반의 깔끔하고 테스트 용이한 계층 구조를 완성할 수 있다.

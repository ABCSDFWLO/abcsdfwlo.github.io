+++
date = '2026-10-13T16:30:00+09:00'
title = 'Go signal 패키지로 OS 시그널 처리하기'
+++

서버 프로세스가 종료 요청을 받았을 때 즉시 끝내는 대신 진행 중인 요청을 마무리하려면 OS 시그널을 감지하고 애플리케이션의 종료 절차와 연결해야 한다. Go의 표준 라이브러리 `os/signal` 패키지는 시그널을 채널로 전달하거나, 시그널 수신을 `context.Context`의 취소로 바꿔 준다.

---

## 1. `signal.Notify`로 시그널 받기

`signal.Notify`는 지정한 시그널을 채널로 전달하도록 등록한다. 다음은 `Ctrl+C`에 해당하는 인터럽트를 감지하는 기본 예제다.

```go
package main

import (
	"fmt"
	"os"
	"os/signal"
)

func main() {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt)
	defer signal.Stop(signals)

	fmt.Println("종료하려면 Ctrl+C를 누르세요.")
	sig := <-signals
	fmt.Printf("시그널 수신: %v\n", sig)
}
```

`signal.Notify`를 호출한 뒤 시그널이 채널에 전달될 때까지 기다린다. `signal.Stop`은 해당 채널의 등록을 해제한다. 채널은 시그널 패키지가 닫아 주지 않으므로 직접 닫지 않는다.

### 채널 버퍼가 필요한 이유

시그널 전달은 채널 송신이 막히지 않도록 동작한다. 버퍼가 없는 채널이나 가득 찬 채널에는 시그널이 전달되지 않을 수 있으므로, 보통 수신 채널을 최소 한 칸 버퍼로 만든다.

```go
signals := make(chan os.Signal, 1)
```

버퍼를 두더라도 시그널마다 반드시 별도의 알림이 도착한다고 가정하면 안 된다. 여러 번 발생한 시그널은 합쳐지거나 일부가 누락될 수 있으므로, 이를 작업 큐처럼 사용하지 않는다.

---

## 2. `signal.NotifyContext`로 취소 신호 연결하기

종료 시그널을 `select` 문에서 직접 다루지 않고 싶다면 `signal.NotifyContext`를 사용할 수 있다. 지정한 시그널을 받으면 반환된 컨텍스트가 취소된다.

```go
ctx, stop := signal.NotifyContext(
	context.Background(),
	os.Interrupt,
	syscall.SIGTERM,
)
defer stop()

<-ctx.Done()
fmt.Println("종료 요청을 받았습니다.")
```

`os.Interrupt`는 일반적으로 터미널의 `Ctrl+C`에 대응하며, Unix 계열 서버에서는 서비스 관리자 등이 보내는 `SIGTERM`도 함께 처리하는 경우가 많다. `SIGTERM`은 운영체제별 지원이 다를 수 있으므로 대상 플랫폼을 확인해야 한다. `SIGKILL`처럼 프로세스를 강제로 끝내는 시그널은 프로그램이 처리하거나 무시할 수 없다.

`stop`은 컨텍스트의 시그널 등록을 해제하고 관련 자원을 정리한다. 시그널을 처리한 직후 `stop()`을 호출하면, 같은 종료 시그널이 다시 왔을 때 기본 동작으로 종료되게 할 수 있다.

---

## 3. HTTP 서버에 graceful shutdown 적용하기

아래 예제는 인터럽트나 `SIGTERM`을 받으면 새 연결 수락을 중단하고, 진행 중인 요청이 끝날 때까지 최대 10초간 기다린다.

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello, Go!")
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	serverErr := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		return fmt.Errorf("serve HTTP: %w", err)
	case <-ctx.Done():
	}

	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shut down HTTP server: %w", err)
	}

	log.Println("서버가 정상적으로 종료되었습니다.")
	return nil
}
```

`Shutdown`은 서버를 정상적으로 닫고 진행 중인 요청이 끝나기를 기다린다. 주어진 제한 시간 안에 완료되지 않으면 오류를 반환하므로, 이 예제는 종료 실패를 호출자에게 전달한다. 실제 서비스에서는 이 상황을 기록하고 필요하다면 `Close`로 남은 연결을 강제 종료하는 정책을 추가할 수 있다.

## 정리

- 단순한 시그널 수신에는 `signal.Notify`와 버퍼가 있는 채널을 사용한다.
- 시그널을 기존 취소 흐름에 연결할 때는 `signal.NotifyContext`를 사용한다.
- 등록을 끝낼 때는 `signal.Stop` 또는 반환된 `stop` 함수를 호출하고, 시그널 채널은 직접 닫지 않는다.
- 시그널 수신은 종료 절차의 시작일 뿐이다. `http.Server.Shutdown`처럼 애플리케이션의 자원을 안전하게 정리하는 작업은 별도로 구현해야 한다.

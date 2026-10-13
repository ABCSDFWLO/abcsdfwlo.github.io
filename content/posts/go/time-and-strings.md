+++
date = '2026-10-13T12:45:00+09:00'
title = 'Go 표준 라이브러리: time 포맷팅 규칙과 strings 패키지'
+++

Go의 내장 패키지 중 가장 자주 쓰이면서도 독특한 철학을 지닌 `time` 패키지의 포맷팅 방식과 `strings` 패키지의 주요 활용법을 정리한다.

---

## 1. `time.Format`의 기묘한 기준일: 2006-01-02 15:04:05

Go에서는 Java나 Python처럼 `YYYY-MM-DD HH:mm:ss` 같은 형식 지정자를 사용하지 않는다. 대신 **특정 고정 시점의 날짜 문자열**을 템플릿으로 제공해야 한다.

그 기준 시각이 바로 **`2006-01-02 15:04:05`**다.

### 왜 하필 2006년 1월 2일인가?
이 수치들은 순서대로 나열하면 다음과 같은 기가 막힌 규칙을 갖는다:

```
월(Month):   01
일(Day):     02
시(Hour):    03 (또는 24시간 형식의 15시)
분(Minute):  04
초(Second):  05
연도(Year):  06 (또는 2006)
타임존(MST): -0700
```

즉, **`1, 2, 3, 4, 5, 6, 7`**의 일련번호를 연상하도록 고안된 기준 시점(`Mon Jan 2 15:04:05 MST 2006`)이다.

### 포맷팅 예시

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    now := time.Now()

    // 2026-10-13 12:45:00 형태로 포맷팅
    formatted := now.Format("2006-01-02 15:04:05")
    fmt.Println(formatted)

    // 날짜만 출력 (2026/10/13)
    fmt.Println(now.Format("2006/01/02"))

    // Go 1.20+ 부터는 자주 쓰는 포맷 상수가 표준 제공됨
    fmt.Println(now.Format(time.DateTime)) // "2006-01-02 15:04:05" 와 동일
    fmt.Println(now.Format(time.DateOnly)) // "2006-01-02" 와 동일
    fmt.Println(now.Format(time.RFC3339))
}
```

---

## 2. `strings` 패키지 핵심 함수

문자열 파싱과 가공에서 기본이 되는 함수들이다.

### 1) 문자열 자르기와 검사
```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    // Split: 구분자로 쪼개기
    parts := strings.Split("apple,banana,grape", ",") // []string{"apple", "banana", "grape"}

    // Trim / TrimSpace: 앞뒤 특정 문자 또는 공백 제거
    clean := strings.Trim("  hello world! \n", " \n") // "hello world!"
    cut := strings.Trim("##title##", "#")             // "title"

    // HasPrefix / HasSuffix: 접두사/접미사 판별
    url := "https://example.com"
    if strings.HasPrefix(url, "https://") {
        fmt.Println("보안 연결 지원")
    }

    // Join: 슬라이스를 구분자로 결합
    csv := strings.Join(parts, ";") // "apple;banana;grape"
}
```

### 2) 성능 최적화: `strings.Builder`
반복문 안에서 `str += "abc"` 형태로 문자열을 계속 더하면 매번 새로운 문자열 힙 메모리가 할당되어 성능이 급격히 저하된다. 이때는 버퍼를 재사용하는 `strings.Builder`를 사용한다.

```go
var builder strings.Builder

for i := 0; i < 1000; i++ {
    builder.WriteString("data,")
}

result := builder.String()
```
`strings.Builder`는 내부 버퍼를 string으로 변환할 때 제로 카피(Zero-copy)를 수행하므로 대용량 문자열 조합에서 매우 빠르다.

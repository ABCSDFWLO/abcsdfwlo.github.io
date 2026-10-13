+++
date = '2026-10-13T12:25:00+09:00'
title = '상속 대신 합성: 구조체 임베딩과 생성자(New) 패턴'
+++

Go는 클래스와 상속(`extends`) 개념이 없다. 대신 **구조체 임베딩(Composition)**과 **생성자 함수(`New...`)**를 통해 객체지향적 설계를 구현한다.

---

## 1. 구조체 임베딩 (Embedding)

구조체 안에 다른 구조체를 필드명 없이 타입만 선언하여 포함시키는 방식을 임베딩이라 한다.

```go
type Engine struct {
    Horsepower int
}

func (e Engine) Start() {
    println("엔진 시동")
}

type Car struct {
    Engine // Engine 구조체를 임베딩 (Composition)
    Brand  string
}
```

- `Car` 인스턴스는 `Engine`의 필드와 메서드를 자신의 것처럼 직접 접근할 수 있다 (**메서드 승격, Method Promotion**).
  ```go
  c := Car{Brand: "Genesis", Engine: Engine{Horsepower: 380}}
  c.Start() // Engine.Start()가 그대로 호출됨
  ```

---

## 2. 오버라이딩과 메서드 섀도잉 (Shadowing)

상속의 오버라이드와 유사하게, 외부 구조체에서 내부 구조체와 동일한 이름의 메서드를 정의하면 외부 구조체의 메서드가 우선 호출된다.

```go
func (c Car) Start() {
    println("스마트키 감지 후 자동차 시동")
    c.Engine.Start() // 명시적으로 내부 임베딩 메서드를 호출할 수도 있음
}
```

이는 가상 함수 테이블(vtable) 기반의 다형성 오버라이드가 아니라, **컴파일러가 필드/메서드를 탐색할 때 최상위 스코프를 먼저 확인하고 없을 때 내부 임베딩 타입을 탐색하는 섀도잉(Shadowing)** 원리로 동작한다.

### 다중 임베딩 시의 모호성 에러 (Ambiguity)
서로 다른 두 구조체가 같은 이름의 메서드를 갖고 있는데, 둘 다 하나의 구조체에 임베딩되면 컴파일 에러가 발생한다.

```go
type Logger struct{}
func (l Logger) Print() {}

type Printer struct{}
func (p Printer) Print() {}

type Device struct {
    Logger
    Printer
}

func main() {
    d := Device{}
    // d.Print() // 컴파일 에러: ambiguous selector d.Print
    d.Logger.Print()  // 명시적으로 타입을 밝혀주어야 함
}
```

---

## 3. 생성자 함수와 포인터 반환 (`New...` 패턴)

Go에서 일반 구조체 변수를 선언하거나 전달하면 항상 **값 복사(Call by Value)**가 일어난다.

```go
func modify(c Car) {
    c.Brand = "NewBrand" // 원본에 영향 없음 (복사본 수정)
}
```

따라서 상태를 유지하고 변경을 보장하며, 복사 비용을 줄이기 위해서는 포인터(`*Car`)를 다루어야 한다. 

Go에는 `class` 전용 생성자 키워드가 없으므로 관례적으로 **`New구조체명`** 형태의 팩토리 함수를 만들어 포인터를 반환한다:

```go
package vehicle

type Car struct {
    brand      string // 소문자로 시작하여 외부 패키지 직접 변경 차단 (캡슐화)
    horsepower int
}

// 생성자 함수: 유효성 검사 및 기본값을 설정하고 *Car 포인터를 반환
func NewCar(brand string, horsepower int) (*Car, error) {
    if horsepower <= 0 {
        return nil, fmt.Errorf("horsepower must be positive")
    }
    return &Car{
        brand:      brand,
        horsepower: horsepower,
    }, nil
}

func (c *Car) SetBrand(brand string) {
    c.brand = brand // 포인터 리시버이므로 원본 인스턴스가 수정됨
}
```
이 패턴을 통해 객체의 불변 규칙을 강제하고 캡슐화를 완성할 수 있다.

+++
date = '2026-10-13T12:50:00+09:00'
title = 'Go 표준 라이브러리: image와 draw 패키지의 인터페이스 설계'
+++

Go는 비트맵 이미지 처리를 위해 표준 라이브러리로 `image`와 `image/draw` 패키지를 제공한다. 이 패키지들은 Go의 깔끔한 인터페이스 계층 구조를 보여주는 훌륭한 예시 중 하나다.

---

## 1. `image.Image` vs `draw.Image` 인터페이스

### 1) `image.Image` (읽기 전용 인터페이스)
이미지의 픽셀 데이터를 읽어오는 기본적인 메서드만 정의되어 있다.

```go
type Image interface {
    ColorModel() color.Model // 색상 모델 반환
    Bounds() Rectangle       // 이미지의 경계 좌표계 반환
    At(x, y int) color.Color // 특정 픽셀의 색상 조회 (Read)
}
```

### 2) `draw.Image` (쓰기 가능 확장 인터페이스)
`image.Image` 인터페이스를 그대로 임베딩하고, 픽셀을 수정할 수 있는 **`Set` 메서드**를 추가한 형태다.

```go
type Image interface {
    image.Image                      // 읽기 인터페이스 임베딩
    Set(x, y int, c color.Color)     // 특정 픽셀의 색상 지정 (Write)
}
```

- `draw.Image`는 `image.Image`의 모든 규격을 만족하므로, `image.Image`를 인자로 받는 모든 함수(예: 파일 인코더 `png.Encode`)에 곧바로 전달할 수 있다.

---

## 2. 실전 비트맵 생성 및 픽셀 렌더링

실제 메모리 상에서 이미지를 조작할 때는 이 인터페이스들을 구현한 구체 타입인 `*image.RGBA`를 생성하여 사용한다.

```go
package main

import (
    "image"
    "image/color"
    "image/draw"
    "image/png"
    "os"
)

func main() {
    width, height := 200, 100
    upLeft := image.Point{0, 0}
    lowRight := image.Point{width, height}

    // 1. RGBA 픽셀 버퍼 생성 (*image.RGBA는 draw.Image를 만족함)
    img := image.NewRGBA(image.Rectangle{upLeft, lowRight})

    // 2. 전체 배경을 파란색으로 채우기 (draw.Draw 활용)
    blue := color.RGBA{0, 102, 204, 255}
    draw.Draw(img, img.Bounds(), &image.Uniform{blue}, image.Point{}, draw.Src)

    // 3. 개별 픽셀 직접 쓰기 (Set 메서드)
    white := color.RGBA{255, 255, 255, 255}
    for x := 50; x < 150; x++ {
        img.Set(x, 50, white) // 가로 직선 긋기
    }

    // 4. PNG 파일로 저장
    f, err := os.Create("output.png")
    if err != nil {
        panic(err)
    }
    defer f.Close()

    png.Encode(f, img) // img는 image.Image 인터페이스로 넘겨짐
}
```

구체 타입인 `*image.RGBA`가 내부 메모리 포인터에 픽셀 데이터를 연속된 바이트 배열(`img.Pix`)로 들고 있으며, 이를 `draw.Image` 인터페이스를 통해 안전하게 수정하고 `image.Image` 인터페이스를 통해 읽어내는 구조다.

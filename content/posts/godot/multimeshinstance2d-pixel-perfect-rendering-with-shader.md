+++
date = '2026-10-11T18:50:53+09:00'
title = 'MultimeshInstance2D Pixel Perfect Rendering With Shader'
+++

## 기존 방식 

`atlas_map` 객체에서 아틀라스 크기와, 각 `Tile`에 따른 아틀라스 좌표 매핑 정보를 가지고 있고, uv를 계산하는 함수가 존재했었음.

mmi에서는 `set_instance_color`를 통해 `Color(u_sclae, v_scale, u_offset, v_offset)`를 셰이더에 전달.

## 기존 방식의 문제점

`set_instance_color`를 통해 전달하면

1. `Color`의 각 속성이 8비트로 압축됨. (엔진 내부적인 최적화. Compatibility 모드를 사용했기 때문인 것도 있음)
    
    아틀라스의 크기가 당시에 36 * 49 크기의 유닛을 16 * 14개 있었기 때문에, 최대 1/576의 정확도가 필요함.

    이는 8비트로 저장할 수 없는 수준이고, 2.25픽셀 단위로 UV 오류가 발생할 수 있음.

2. Shader에서 `Color`를 다시 `(1.0,1.0,1.0,1.0)`으로 덮어써야 하는 문제도 있었음.

결과적으로 camera zoom이 (1,1)이었음에도 불구하고, uv 변경 시 1픽셀씩 Jitter가 있었고,

놀랍게도 camera zoom이 (2,2)일 때만 이러한 현상이 나타나지 않았다.

아틀라스 파일을 1픽셀 단위로 검토하는 삽질을 했었으나, 아틀라스 파일에는 문제가 없었다.

## 해결책 

`set_instance_custom_data`를 통해서 우선 Shader에서의 `Color` 덮어쓰기를 줄이고,

( custom_data 넘기는 것이 mmi3d에서만 되고 mmi2d에서는 안 되는 줄 알고 있었는데, Godot 3 -> 4로 업그레이드되면서 2d도 쓸 수 있게 업데이트되었다고 한다. )

uv를 직접 전달하는 것이 아닌, custom_data에 각 아틀라스 좌표만 정수로 전달한다.

그러면 atlas_map에서 아틀라스 크기를 관리하는 것이 아닌 각 shader 파일에서 아틀라스 크기를 상수로 관리해야 하지 않는가 의문이 들 수 있는데,

이는 `_setup_mmi()` 함수에서 shader material 자체에 `uniform` 변수로 넘겨주면 관리하기 쉬워진다.

## 기타

`MultiMeshInstance2D`는 기본적으로 C++ `vector<float>` 형태로 저장되기 때문에,

(인스턴스 수) * (24B transform / 16B color / 16B custom_data)의 RAM 할당이 이루어진다.

물론 color와 custom_data는 사용할지 말지 결정 가능.

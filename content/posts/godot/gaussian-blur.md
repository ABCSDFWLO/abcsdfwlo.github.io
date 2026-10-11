+++
date = '2026-10-11T18:49:09+09:00'
draft = true
title = 'Gaussian Blur'
+++

Gemini한테 가우시안 블러를 위한 gdshader를 만들어달라고 했더니 다음과 같은 문제 발생.

1. blur radius를 늘리면 모자이크 느낌의 경계선이 너무 심하게 보임.
2. blur iteration을 늘리면 속도가 현저히 저하됨.

근데 웹에서 사용하는 Blur 효과는 이런 문제가 없었던 것 같아서, Gemini에게 빠르고 효과적인 블러 방법을 물어본 결과

* covolution연산을 x방향, y방향에 각각 한 번씩 적용하여 `O(N^2)`이 아닌 `O(2N)`으로 축소한다고 한다.

대신 Godot에서 그걸 하려면, `ColorRect` 두 개 사이에 `BackBufferCopy` 노드를 Copy Mode : Viewport 옵션으로 추가해야 함.
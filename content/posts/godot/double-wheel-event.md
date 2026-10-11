+++
date = '2026-10-12T03:34:42+09:00'
draft = false
title = 'Double Wheel Event'
+++

* 문제 상황 : 마우스 휠 입력 시 스크롤이 한 칸 되어야 하는데, 두 칸 되는 중.
* 원인 : 휠 이벤트도 `InputEventMouseButton`이라 pressed / released 둘 다 있어서 동시에 적용된다네요...
* 해결 : `event.is_pressed()` 체크를 추가.

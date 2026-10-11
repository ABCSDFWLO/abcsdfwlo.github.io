+++
date = '2026-10-08T21:51:39+09:00'
title = 'RefCounted'
+++

Godot은 `RefCounted` 타입을 통해, GC 없이 참조가 없어지면 C++ 코어에서 `delete`로 곧바로 메모리를 해제한다.

이는 사실 순환 참조가 발생하지 않는 것을 전제로 구현된 시스템이다.

{{< details summary="순환참조란" >}}
```gdscript
var a = Node.new()
var b = Node.new()
a.target = b
b.target = a # 둘 다 메모리에서 안 지워짐! 
```
{{< /details >}}

GDScript라는 언어 자체가, Godot 씬 트리를 제어하기 위한 용도로만 사용되는 언어로 구현된 이유 때문이다.

Tree는 계층 구조가 명확하기 때문에, 개발자는 알아서 이런 구조 만들지 말라는 것이다.

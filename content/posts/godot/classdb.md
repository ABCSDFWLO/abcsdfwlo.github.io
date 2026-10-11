+++
date = '2026-10-11T20:06:47+09:00'
title = 'ClassDB'
+++

`ClassDB`는 C++로 작성된 엔진 코어에 있는 커스텀 RTTI임.

대충 말하자면 Godot의 모든 클래스, 메서드 정보에 대해 매핑해놓은 테이블이 있는데,

동적 캐스팅을 정적 캐스팅 수준으로 쓸 수 있게끔 했다는 거임.

언어(C++) 차원의 리플렉션 쓰기 싫어서 리플렉션을 쳐낼 거 쳐내고 직접 구현한? 뭐 그런 거임.

## 바인딩

Godot의 모든 C++ `Object` 파생 클래스는 `ClassDB`에 자신을 등록하기 위해 두 가지를 구현함.

```C++
// C++ 엔진 내부 코드 예시
class CharacterBody2D : public PhysicsBody2D {
    GDCLASS(CharacterBody2D, PhysicsBody2D); // 1. 클래스 계층 및 타입 정보 매핑

protected:
    static void _bind_methods() {
        // 2. 메서드 바인딩
        ClassDB::bind_method(D_METHOD("move_and_slide"), &CharacterBody2D::move_and_slide);
        
        // 3. 프로퍼티(변수) 및 Setter/Getter 바인딩
        ClassDB::bind_method(D_METHOD("set_velocity", "velocity"), &CharacterBody2D::set_velocity);
        ClassDB::bind_method(D_METHOD("get_velocity"), &CharacterBody2D::get_velocity);
        
        ADD_PROPERTY(PropertyInfo(Variant::VECTOR2, "velocity"), "set_velocity", "get_velocity");
    }
};
```

### 1. `GDCLASS`는 매크로다.

GDCLASS(현재클래스명,부모클래스명)으로 등록해서 상속 관계 매핑.

결론적으로 Godot의 `Object::cast_to<T>(p_object)`를 통해 C++의 `dynamic_cast<T*>` 대신 `static_cast<T*>`를 하겠단 거임.

{{< details summary="구체적으로 어떤 코드로 치환되는가?" >}}
```C++
// GDCLASS(MyNode, godot::Node) 매크로가 치환되어 생성되는 코드 예시

private:
    // 객체 복사 생성 및 대입 연산 방지 (엔진 안전성 확보)
    void operator=(const MyNode &p_rval);

public:
    // 1. 클래스 및 부모 클래스의 타입 별칭(Type Alias) 정의
    typedef MyNode self_type;
    typedef godot::Node inherited_type;

    // 2. 클래스 이름 반환 함수 (에디터 및 GDScript 노출용)
    static _force_inline_ String get_class_static() {
        return "MyNode";
    }
    virtual String get_class() const override {
        return get_class_static();
    }
    static _force_inline_ String get_parent_class_static() {
        return "Node";
    }

    // 3. 타입 검사 함수 (RTTI 및 dynamic_cast 대용)
    virtual bool is_class(const String &p_class) const override {
        return (p_class == "MyNode") ? true : godot::Node::is_class(p_class);
    }
    static bool is_class_static(const String &p_class) {
        return (p_class == "MyNode") ? true : godot::Node::is_class_static(p_class);
    }

    // 4. 엔진 초기화 및 바인딩 관련 내부 함수들
    static void initialize_class();
    static void _bind_methods();
```
{{< /details >}}

### 2. `_bind_methods()`: 엔진 부팅 시점에 단 한 번 호출.

객체가 만들어질 때마다 호출되는 게 아님.

엔진 부팅 시점에 딱 한 번임.

C++ 메서드들의 함수 포인터 주소와 매개변수 정보를 `ClassDB`의 룩업 테이블에 등록함.

그 외에도 프로퍼티 / 시그널 / 상수 전부 이 곳에서 한 번에 등록함.

{{< details summary="이름이 _bind_method()인데 왜 전부 여기서..?" >}}

사실 나도 뭐 처음엔 함수만 바인딩했었나? 했는데,

1.0 기준 코드에서도 프로퍼티랑 시그널이 이미 함께 등록되던 중이었음.

뭐 여러가지 원인이 있겠지만, 이름 바꾸기 어려운 하위 호환성 때문일 수도 있을 거고,

Property를 Setter/Getter로 포장했기 때문도 있을 것이다.

(Setter/Getter를 먼저 등록한 후 add_property를 호출하는 순서가 존재.)

물론 굳이 한 곳에 다 때려박은 이유는 온갖 언어(GDScript, C# 등)에 래핑을 하기 위해선 ClassDB에 전부 통합해서 등록하려고 했던 것이고,

그런다면 하나의 메서드로 규격화하는 것이 합리적인 선택이었을 것으로 추정.

이름은 왜 그런지 나도 모름 ㅋㅋ

{{< /details >}}


## 메서드 호출

위에서 확인한 `_bind_methods()`를 통해 등록된 함수들은 `MethodBind` 객체로 래핑되어 ClassDB에 저장됨.

이를 호출하는 방법은 대충 다음과 같음.

### 1. `call()`

`Variant` 기반으로 진짜 동적 호출.

GDScript에서 타입을 명시하지 않았을 때 등.

`MethodBind`가 인자/타입 검증 후 실행.

### 2. `ptrcall()`

`Variant` 안 거치고 냅다 포인터(`const void**`) 주소로 호출.
오버헤드가 그냥 네이티브 함수 호출 급.

GDScript에서 타입 힌트가 적용되어 있거나, GDExtension / C#에서 호출할 때 쓰임.

## 문자열 탐색

위의 코드 스니펫 등을 확인해보면 메서드를 ClassDB에 등록할 때 메서드 이름을 string 형태로 등록하는 걸 볼 수 있는데,

그러면 strcmp 같은 걸로 느려질 수 밖에 없는 것 아닌가? 싶을 수 있음

놀랍게도 여기 나온 string 비슷한 뭐시기는 전부 `StringName`으로,

이것도 엔진 부팅 시점에 사용되는 모든 `StringName`을 포인터로 지정해서 비교하기 때문에,

오버헤드 없음

자세한 건 [StringName]("/posts/godot/stringname) 페이지에.

## 공식 문서

* ClassDB 레퍼런스 문서
https://docs.godotengine.org/en/stable/classes/class_classdb.html

* ClassDB 헤더 파일 (class_db.h)
https://github.com/godotengine/godot/blob/master/core/object/class_db.h

* Object 타입에 대한 설명
https://docs.godotengine.org/en/stable/engine_details/architecture/object_class.html


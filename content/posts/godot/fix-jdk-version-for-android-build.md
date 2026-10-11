+++
date = '2026-10-11T18:58:29+09:00'
draft = true
title = 'Fix Jdk Version for Android Build'
+++

Java 21 LTS는 생각보다 많은 걸 변화시켰다.

https://docs.oracle.com/en/java/javase/21/migrate/significant-changes-jdk-release.html

가장 큰 변화는 Virtual Thread 기능의 정식 도입으로,
Hotspot JVM의 내부 스케쥴링 코어 로직이 크게 업데이트됐다.

그러나 Android는 아직 Gradle build에 있어서 Java 17버전을 권장하고 있는데,
이유는 간단히 정리하면 다음과 같다.

1. 이자식들 표준 JVM 안 쓰고 ART라고 자체 런타임 쓰고 있었음 (Android 5.0부터)
2. 코틀린으로 갈아탈라고 작정한 뒤(2019+)로는 코루틴으로 모든 걸 해결 중이었음
3. 하위호환성 챙겨야 함.

따라서 안드로이드 입장에서는 굳이? 런타임 코어를 갈아엎어야 하는가?

Godot 4는 공식적으로 Eclipse Temurin (Adoptium) JDK 17을 권장한다.

https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html

기존에는 별 생각 없이 JDK 21로 여러 환경에서 빌드했더니 매번 패키지 충돌 오류 발생.

따라서 앞으로는 Openjdk 17로 고정해서 개발할 예정.

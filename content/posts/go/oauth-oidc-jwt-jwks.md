+++
date = '2026-10-13T20:30:00+09:00'
title = 'OAuth부터 OIDC까지: JWT와 JWKS를 한 번에 이해하기'
+++

로그인 연동 코드를 보다 보면 `JWT`, `OAuth`, `OIDC`, `JWKS` 같은 단어가 한꺼번에 등장한다. 서로 연결되어 있지만 같은 규약은 아니다. JWT가 토큰의 표현 형식이라면, OAuth는 권한을 위임하는 절차이고, OIDC는 그 위에 로그인과 사용자 식별 규칙을 더한다. 이 구분을 먼저 잡으면 토큰 검증 코드가 무엇을 확인하는지 읽기 쉬워진다.

## 1. OAuth는 토큰의 모양이 아니라 권한 위임 절차다

OAuth 2.0은 사용자가 어떤 애플리케이션에 권한을 허용하고, 그 애플리케이션이 권한 서버로부터 토큰을 받는 절차를 정의한다. 예를 들어 사용자는 사진 서비스에 로그인한 뒤, 별도의 앱이 사진을 읽도록 허용할 수 있다.

OAuth의 핵심 질문은 “클라이언트가 어떤 절차로 권한을 얻는가?”이다. OAuth 2.0 자체는 발급된 토큰이 반드시 JWT여야 한다고 규정하지 않는다. 토큰은 불투명한 문자열일 수도 있고, JWT일 수도 있다. 토큰을 받은 API가 그 의미와 유효성을 확인하는 방법 역시 토큰 종류와 제공자의 규약에 따라 달라진다.

또한 OAuth는 본래 권한 위임 규약이지, 그 자체만으로 사용자의 로그인 신원과 프로필을 표준화하는 규약은 아니다. “Google로 로그인”처럼 인증 결과로 사용자를 식별하는 데에는 보통 OIDC가 함께 쓰인다.

## 2. OIDC는 OAuth에 로그인과 신원 정보를 더한다

OpenID Connect(OIDC)는 OAuth 2.0 위에서 동작하는 인증 계층이다. OAuth 흐름으로 토큰을 얻되, 사용자가 누구인지 전달하는 **ID Token**과 그 토큰을 확인하는 규칙을 정의한다.

ID Token에는 보통 다음과 같은 클레임(claim)이 들어 있다.

| 클레임 | 의미 |
| --- | --- |
| `iss` | 토큰을 발급한 주체(issuer) |
| `sub` | 해당 발급자 안에서 사용자를 식별하는 값(subject) |
| `aud` | 이 토큰을 받도록 지정된 대상(audience), 보통 클라이언트 ID |
| `exp` | 토큰이 만료되는 시각(Unix 초) |
| `iat` | 토큰이 발급된 시각(Unix 초) |
| `nbf` | 이 시각 전에는 토큰을 사용할 수 없다는 선택적 조건 |
| `azp` | 토큰을 사용할 권한이 있는 클라이언트(authorized party)를 나타낼 수 있는 값 |

`sub`는 사용자를 가리키는 식별자이지, 반드시 이메일이나 서비스 전체에서 영구적으로 같은 값이라는 뜻은 아니다. 특히 서로 다른 issuer의 `sub`를 서로 같은 사용자로 취급하면 안 된다. 사용자 키를 만들 때는 대개 `(iss, sub)` 쌍을 사용한다.

OAuth에서 흔히 말하는 **access token**과 OIDC의 **ID Token**도 목적이 다르다. Access token은 리소스 서버(API)에 접근할 권한을 제시하는 토큰이다. ID Token은 클라이언트가 인증 결과를 확인하고 사용자를 식별하는 토큰이다. Access token이 JWT라고 보장되지 않으므로, API용 access token을 ID Token처럼 해석하거나 검증해서는 안 된다.

## 3. JWT의 점 세 개는 무엇을 뜻하나?

JWT(JSON Web Token)는 클레임을 전달하는 토큰 형식이다. 흔히 보는 서명된 JWT는 다음과 같은 세 부분으로 구성된다.

```text
header.payload.signature
```

각 부분은 JSON 바이트를 Base64URL로 인코딩한 문자열이다. 일반적인 Base64와 달리 URL에 안전한 문자 집합을 쓰며, 이 형식에서는 끝의 `=` 패딩을 생략할 수 있다.

예를 들어 디코딩한 헤더와 페이로드는 대략 이런 모습이다.

```json
// header
{
  "alg": "RS256",
  "kid": "key-2026-01",
  "typ": "JWT"
}
```

```json
// payload
{
  "iss": "https://issuer.example",
  "sub": "user-123",
  "aud": "my-client-id",
  "exp": 1791900000,
  "iat": 1791896400
}
```

Base64URL은 암호화가 아니다. 누구나 헤더와 페이로드를 디코딩해 내용을 읽을 수 있다. JWT에 비밀번호나 비밀키 같은 민감한 값을 넣어서는 안 된다.

위의 세 부분으로 된 형식은 정확히는 서명된 JSON Web Signature(JWS)의 Compact Serialization이다. JWT는 클레임을 담는 토큰 개념이고, JWS는 서명을 붙이는 방식이다. JWT를 암호화하는 JSON Web Encryption(JWE)도 있지만, 여기서 다루는 ID Token 검증 코드는 세 부분의 **서명된 토큰**을 대상으로 한다.

### 서명은 암호화가 아니다

`RS256`은 SHA-256으로 서명 대상의 해시를 만들고 RSA 서명을 적용하는 알고리즘이다. 발급자는 개인 키로 서명하고, 검증자는 공개 키로 서명을 확인한다. 공개 키를 이용해 페이로드를 복호화하는 것이 아니다.

JWS 서명 대상은 디코딩한 JSON 자체가 아니라 원래의 인코딩된 문자열을 점으로 이어 붙인 값이다.

```text
BASE64URL(header) + "." + BASE64URL(payload)
```

헤더나 페이로드의 바이트가 한 글자라도 바뀌면 서명이 맞지 않는다. 서명이 맞는다는 것은 신뢰하는 개인 키의 소유자가 그 내용을 서명했다는 뜻이다. 하지만 그것만으로 토큰이 현재도 유효하거나, 우리 서비스를 위한 토큰임이 증명되지는 않는다. 만료 시각과 발급자, 대상 등의 클레임도 따로 검사해야 한다.

## 4. JWKS는 검증용 공개 키 목록이다

JWKS(JSON Web Key Set)는 JSON Web Key(JWK) 형식으로 표현한 키들을 모아 놓은 JSON 문서다. 발급자는 개인 키를 안전하게 보관하고, 검증자에게는 서명 확인에 쓸 공개 키를 JWKS로 공개할 수 있다.

RSA 공개 키를 담은 JWK는 대략 이런 형태다.

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "key-2026-01",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

`n`과 `e`는 RSA 공개 키의 구성 요소이고, `kid`는 키의 식별자다. JWT 헤더의 `kid`와 JWKS 안의 `kid`를 맞춰 해당 공개 키를 고른다. 키를 교체하는 동안 발급자가 여러 공개 키를 잠시 함께 공개할 수도 있다.

JWKS 주소는 일반적으로 신뢰해 둔 발급자의 OIDC Discovery 문서에서 찾는다. Discovery 문서의 `jwks_uri`가 키 목록의 주소다. 검증기는 토큰 안에 들어 있는 임의의 URL을 따라가지 말고, 설정된 issuer나 신뢰하는 Discovery 문서에서 얻은 주소만 사용해야 한다. 그렇지 않으면 공격자가 자기 키를 가리키게 해 검증을 속이려는 위험이 생긴다.

운영 환경에서는 JWKS를 보통 캐시한다. 매 토큰마다 네트워크 요청을 할 필요는 없지만, 캐시한 키로 모르는 `kid`가 나타나면 키를 새로 가져오는 절차가 필요하다. 이 동작은 발급자의 키 교체를 지원한다. 다만 실패를 조용히 무시하거나 토큰에 포함된 키를 대체 키처럼 신뢰해서는 안 된다.

## 5. 검증 함수는 어떤 순서로 확인하나?

다음과 같은 Go 코드가 있다고 하자.

```go
func (v *JWTVerifier) Verify(ctx context.Context, token string) (string, error) {
    // token의 형식과 크기를 검사
    // header의 alg와 kid를 확인하고 JWKS에서 공개 키를 선택
    // signature를 공개 키로 검증
    // payload의 OIDC 클레임을 검사
    // 유효하면 sub를 반환
}
```

검증은 대체로 아래 순서로 읽으면 된다.

### 5.1 설정과 입력 형식 검사

`audience`가 비어 있는지 확인하는 것은 검증 대상 클라이언트가 설정되지 않았다는 뜻이다. 토큰 길이를 제한하고 점으로 세 부분으로 나누는 것은 잘못되거나 과도하게 큰 입력을 초기에 거르는 방어다.

이 단계에서는 토큰의 내용을 신뢰하지 않는다. 점으로 나눠지고 JSON으로 디코딩된다는 사실도 토큰이 진짜라는 뜻은 아니다.

### 5.2 헤더에서 알고리즘과 키 ID 확인

헤더의 `alg`가 `RS256`인지, `kid`가 있는지 확인한다. `alg`를 토큰이 제시하는 값에 무조건 맡기지 않고 검증기가 허용한 알고리즘으로 제한하는 것이 중요하다. 여기서는 RSA-SHA256만 허용한다.

`kid`를 이용해 JWKS에서 키를 선택하지만, 헤더는 아직 서명 전의 사용자 입력이다. 따라서 `kid`는 키를 **찾는 힌트**일 뿐, 그 키를 신뢰해야 한다는 증거가 아니다. 최종 신뢰 여부는 서명 검증 및 나머지 클레임 검사까지 통과해야 결정된다.

### 5.3 공개 키로 서명 확인

`parts[0] + "." + parts[1]`의 SHA-256 해시를 만든 뒤 RSA 공개 키로 서명을 확인한다. 서명이 맞지 않으면 페이로드에 적힌 `sub`, `iss`, `aud` 등이 발급자에 의해 서명된 내용이라고 볼 수 없으므로 거부한다.

### 5.4 OIDC 클레임 확인

서명이 맞아도 다음 검사가 필요하다.

- `iss`가 이 검증기가 신뢰하도록 설정된 발급자인가?
- `aud`에 이 클라이언트의 ID가 포함되어 있는가?
- `exp`가 지나지 않았는가?
- `sub`가 있는가?
- `iat`가 타당한가?
- `nbf`가 있다면 아직 유효 시작 전은 아닌가?
- `azp`가 있다면 이 클라이언트가 기대하는 값인가?

마지막에 `sub`를 반환하면 호출 측은 그 값으로 해당 발급자 안의 사용자를 찾을 수 있다. 로그인 세션 생성이나 권한 부여는 그 다음 애플리케이션 정책의 영역이다.

## 6. `aud`와 `azp`는 어떤 관계인가?

`aud`는 토큰의 수신 대상이다. 문자열 하나일 수도, 여러 문자열의 배열일 수도 있다. 검증기는 자기 클라이언트 ID가 `aud`에 포함되어 있는지 확인해야 한다.

`azp`는 authorized party를 나타내며 선택적으로 존재할 수 있다. OIDC ID Token 검증 규칙에서는 `azp`가 있으면 그 값이 해당 클라이언트에 맞는지 확인하고, `aud`에 여러 값이 있으면 `azp`가 있는지 확인하도록 요구한다. 따라서 `aud`가 하나일 때 `azp`가 없어도 되는 경우가 있지만, `azp`가 존재하는데 무시해도 된다는 뜻은 아니다.

다만 여러 앱과 서버가 함께 있는 로그인 구성에서 어떤 ID가 `aud` 또는 `azp`가 되어야 하는지는 토큰을 요청한 클라이언트와 제공자의 문서에 맞춰 판단해야 한다. `azp`를 언제나 “모바일 앱 ID”, 또는 언제나 “백엔드 ID”라고 일반화할 수는 없다.

예시 검증기의 다음 조건은 단일 audience 구성에서는 `azp`를 생략할 수 있게 하고, `azp`가 있거나 audience가 여러 개라면 이를 `v.audience`와 대조한다.

```go
(len(audiences) > 1 && claims.AuthorizedParty != v.audience) ||
(claims.AuthorizedParty != "" && claims.AuthorizedParty != v.audience)
```

이 정책이 올바른지는 해당 verifier의 `audience`가 실제 OIDC 클라이언트 ID인지, 그리고 제공자가 발행하는 `azp`의 의미와 맞는지에 달려 있다. 특정 Google 또는 Apple 로그인 구성에서는 두 값이 다르게 나타날 수 있으므로, 실제 토큰과 공식 제공자 문서에 맞춰 설정해야 한다. 표준을 구현했다고 해서 모든 제공자 조합이 자동으로 호환된다고 단정하면 안 된다.

## 7. 어디까지 표준이고 어디부터 제공자 설정인가?

| 항목 | 주된 규약·영역 | 요점 |
| --- | --- | --- |
| JWT 클레임 표현 | JWT (RFC 7519) | `iss`, `sub`, `aud`, `exp` 같은 등록 클레임의 의미 |
| 세 부분 서명 포맷 | JWS (RFC 7515) | 헤더·페이로드·서명을 Compact Serialization으로 표현 |
| `RS256`, `kid` 등의 의미 | JWA (RFC 7518) | 알고리즘과 JOSE 헤더 파라미터 |
| 공개 키 JSON과 키 묶음 | JWK/JWKS (RFC 7517) | 공개 키를 표현하고 배포하는 형식 |
| 인가 코드 흐름 등 | OAuth 2.0 | 권한을 위임하고 토큰을 얻는 흐름 |
| ID Token과 로그인 검증 | OIDC Core | OAuth 위에 인증 정보와 ID Token 검증 규칙 추가 |
| issuer, client ID, 키 주소 | 제공자 설정 | Google·Apple 등 각 발급자가 실제로 사용하는 값 |

표준은 필드가 무엇을 뜻하고 검증기가 무엇을 확인할지 정한다. 하지만 사용할 issuer URL, client ID, Discovery URL은 애플리케이션 등록과 제공자별 설정에서 온다. Google이나 Apple 같은 제공자는 OIDC를 제공하지만, 모든 로그인 방식과 모든 앱 구성이 토큰을 똑같이 발행하는 것은 아니다. 사용하는 제품/API의 공식 문서에 제시된 issuer, audience, 서명 알고리즘, 키 주소를 확인해야 한다.

예를 들어 Google은 일반적으로 `https://accounts.google.com` issuer와 Google의 공개 키 주소를 사용하고, Apple의 Sign in with Apple은 `https://appleid.apple.com` issuer와 `https://appleid.apple.com/auth/keys` 키 주소를 사용한다. 이것은 설정 예시이지, issuer나 키 URL을 코드에 무조건 고정해도 된다는 뜻은 아니다. OIDC Discovery를 사용하는지와 실제로 어떤 client ID를 audience로 쓰는지는 각 연동 구성에 맞춰야 한다.

## 8. 예시 코드에서 특히 확인할 점

예시 검증기는 핵심적인 흐름, 즉 허용 알고리즘 확인 → JWKS 키 선택 → 서명 검증 → 발급자·대상·시간·사용자 클레임 확인을 보여 준다. 그러나 이 코드만으로 모든 OIDC 흐름의 검증이 끝난다고 볼 수는 없다.

- `nonce`를 인증 요청에 보냈다면 응답 ID Token의 `nonce`와 비교해야 한다. 이 함수의 클레임 구조에는 `nonce`가 없으므로 이 검증은 다른 곳에서 해야 한다.
- 코드의 `nbf > now + 60` 검사는 `nbf`가 현재보다 조금 미래인 토큰을 최대 60초까지 통과시킨다. 60초를 시계 오차 허용치로 의도했다면 정책을 문서화해야 한다. 반대로 현재 시각 이전에만 허용하려는 정책이라면 비교식이 달라야 한다.
- `iat`, `exp`의 누락 여부는 JSON 디코딩 후 기본값으로 남는 `0` 등을 통해 일부 걸러지지만, 제공자와 토큰 종류에 맞춰 필수 클레임 및 시간 오차 정책을 명시적으로 검토하는 편이 안전하다.
- signature 검증은 토큰의 발급자를 자동으로 신뢰하게 해 주지 않는다. 허용된 `iss`와 `aud`를 정확히 확인해야 하며, 여러 issuer를 함께 허용한다면 각 issuer의 키 출처와 정책도 안전하게 연결해야 한다.
- ID Token을 검증하는 코드라면 그 입력이 실제 ID Token인지 호출 흐름에서도 보장해야 한다. Access token과 ID Token은 이름이 비슷해도 서로 바꿔 쓸 수 없다.

## 9. Go로 'Google로 로그인' 구현하기

웹 서버에서 Google 로그인을 구현할 때는 브라우저를 Google로 보내고, 돌아온 인가 코드를 서버에서 토큰으로 교환한다. 아래 예시는 `golang.org/x/oauth2`로 OAuth 흐름을 처리하고, `github.com/coreos/go-oidc/v3/oidc`로 ID Token을 검증한다. 직접 JWT 서명과 JWKS 캐시를 구현하는 대신 검증 라이브러리를 사용하는 편이 안전하다.

먼저 Google Cloud에서 OAuth 클라이언트를 만들고, 클라이언트 ID와 시크릿을 서버 환경 변수로 설정한다. Redirect URI는 Google 콘솔에 등록한 주소와 코드의 값이 정확히 일치해야 한다. 필요한 패키지는 다음과 같다.

```text
go get golang.org/x/oauth2 github.com/coreos/go-oidc/v3/oidc
```

아래 코드 조각에 필요한 import는 다음과 같다.

```go
import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)
```

### 로그인 시작: `state`, `nonce`, PKCE 생성

```go
type LoginAttempt struct {
	Nonce        string
	PKCEVerifier string
}

type LoginAttemptStore interface {
	Save(ctx context.Context, sessionID, state string, attempt LoginAttempt, expires time.Time) error
	Consume(ctx context.Context, sessionID, state string) (LoginAttempt, error)
}

type BrowserSessions interface {
	SessionID(*http.Request) (string, error)
}

type GoogleLogin struct {
	oauth    *oauth2.Config
	verifier *oidc.IDTokenVerifier
	attempts LoginAttemptStore
	sessions BrowserSessions
}

func randomToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b[:]), nil
}

func NewGoogleLogin(
	ctx context.Context,
	clientID, clientSecret, redirectURL string,
	attempts LoginAttemptStore,
	sessions BrowserSessions,
) (*GoogleLogin, error) {
	provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
	if err != nil {
		return nil, fmt.Errorf("discover Google OIDC provider: %w", err)
	}

	oauthConfig := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "email", "profile"},
	}
	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	return &GoogleLogin{
		oauth:    oauthConfig,
		verifier: verifier,
		attempts: attempts,
		sessions: sessions,
	}, nil
}

func (g *GoogleLogin) Start(w http.ResponseWriter, r *http.Request) {
	sessionID, err := g.sessions.SessionID(r)
	if err != nil {
		http.Error(w, "login session unavailable", http.StatusInternalServerError)
		return
	}
	state, err := randomToken()
	if err != nil {
		http.Error(w, "could not start login", http.StatusInternalServerError)
		return
	}
	nonce, err := randomToken()
	if err != nil {
		http.Error(w, "could not start login", http.StatusInternalServerError)
		return
	}

	pkceVerifier := oauth2.GenerateVerifier()
	attempt := LoginAttempt{Nonce: nonce, PKCEVerifier: pkceVerifier}
	if err := g.attempts.Save(r.Context(), sessionID, state, attempt, time.Now().Add(10*time.Minute)); err != nil {
		http.Error(w, "could not start login", http.StatusInternalServerError)
		return
	}

	url := g.oauth.AuthCodeURL(
		state,
		oauth2.SetAuthURLParam("nonce", nonce),
		oauth2.S256ChallengeOption(pkceVerifier),
	)
	http.Redirect(w, r, url, http.StatusFound)
}
```

`LoginAttemptStore`는 `state`와 `nonce`를 짧은 시간만 보관하고, 콜백에서 한 번만 꺼내는 서버 측 저장소를 뜻한다. `sessionID`에 연결해 저장하는 이유는 다른 브라우저에서 시작한 로그인을 현재 브라우저에 끼워 넣는 로그인 CSRF도 막기 위해서다. `BrowserSessions`는 HTTPS 전용이고 예측하기 어려운 세션 ID를 제공하는 앱의 세션 관리 계층이다.

- `state`는 콜백이 이 브라우저에서 시작한 로그인 요청에 대한 응답인지 연결한다.
- `nonce`는 반환된 ID Token이 이 로그인 요청을 위해 발급된 것인지 확인한다.
- PKCE verifier는 인가 코드 교환 때 사용한다. 브라우저가 인가 코드를 가로채더라도 verifier 없이는 토큰으로 교환하기 어렵게 한다.

### 콜백: 코드 교환 후 ID Token 검증

```go
func (g *GoogleLogin) Callback(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("error") != "" {
		http.Error(w, "Google login was not completed", http.StatusUnauthorized)
		return
	}
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	if state == "" || code == "" {
		http.Error(w, "invalid login callback", http.StatusBadRequest)
		return
	}

	sessionID, err := g.sessions.SessionID(r)
	if err != nil {
		http.Error(w, "login session unavailable", http.StatusInternalServerError)
		return
	}
	attempt, err := g.attempts.Consume(r.Context(), sessionID, state)
	if err != nil {
		http.Error(w, "invalid or expired login attempt", http.StatusBadRequest)
		return
	}

	token, err := g.oauth.Exchange(
		r.Context(),
		code,
		oauth2.VerifierOption(attempt.PKCEVerifier),
	)
	if err != nil {
		http.Error(w, "could not exchange authorization code", http.StatusUnauthorized)
		return
	}
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		http.Error(w, "Google did not return an ID Token", http.StatusUnauthorized)
		return
	}

	idToken, err := g.verifier.Verify(r.Context(), rawIDToken)
	if err != nil {
		http.Error(w, "invalid ID Token", http.StatusUnauthorized)
		return
	}
	var claims struct {
		Nonce string `json:"nonce"`
	}
	if err := idToken.Claims(&claims); err != nil ||
		claims.Nonce == "" ||
		subtle.ConstantTimeCompare([]byte(claims.Nonce), []byte(attempt.Nonce)) != 1 {
		http.Error(w, "ID Token nonce mismatch", http.StatusUnauthorized)
		return
	}

	// idToken.Subject를 (issuer, subject) 사용자 키로 사용해
	// 애플리케이션 자체의 로그인 세션을 만든다.
	w.WriteHeader(http.StatusNoContent)
}
```

콜백에서 `Exchange`는 인가 코드를 토큰으로 바꾼다. 이어 `IDTokenVerifier.Verify`가 Google의 OIDC 설정에서 신뢰할 issuer와 JWKS를 찾아 서명, issuer, audience, 만료 시각 등을 확인한다. 마지막 nonce 비교는 요청을 시작할 때 저장한 값과 ID Token의 값을 연결한다.

### 브라우저와 서버 사이에 오가는 응답은 세 단계다

“Google의 응답”은 한 덩어리 JSON이 아니다. 브라우저가 Google을 오가는 리다이렉트와, 우리 서버가 Google 서버와 주고받는 토큰 응답을 나눠 보면 쉽다.

**1. 로그인 시작 응답 — 브라우저를 Google로 보낸다**

`Start` 핸들러가 반환하는 것은 토큰 JSON이 아니라 HTTP 리다이렉트다.

```http
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid+email+profile&state=...&nonce=...&code_challenge=...&code_challenge_method=S256
```

브라우저는 `Location` 주소를 열어 Google 로그인 화면을 보여준다. URL의 `state`, `nonce`, PKCE 값은 앞에서 서버가 만든 로그인 시도와 연결된다.

**2. 로그인 후 브라우저 콜백 — 임시 인가 코드만 돌아온다**

사용자가 동의하면 Google은 브라우저를 등록된 콜백 주소로 돌려보낸다. 성공 응답은 보통 JSON이 아니라 이와 같은 URL이다.

```http
GET /auth/google/callback?code=4%2F0Ab...&state=랜덤한-state HTTP/1.1
Host: app.example.com
```

`code`는 최종 로그인 토큰이 아니라 짧은 시간만 쓸 수 있는 임시 교환권이다. 서버는 `state`가 저장해 둔 값과 맞는지 확인한 뒤, 이 `code`를 Google 토큰 엔드포인트에 서버 대 서버로 보낸다. 사용자가 취소하거나 오류가 나면 `code` 대신 `error`가 돌아올 수 있다.

**3. 서버의 토큰 교환 응답 — 여러 토큰이 담긴 JSON**

`g.oauth.Exchange(...)`가 받아 오는 응답은 개념적으로 아래와 같은 JSON이다. 값은 모두 설명을 위한 가짜 예시이며 실제 토큰이 아니다.

```json
{
  "access_token": "<Google API에 보낼 토큰>",
  "expires_in": 3599,
  "scope": "openid email profile",
  "token_type": "Bearer",
  "id_token": "<header의Base64URL>.<payload의Base64URL>.<서명Base64URL>"
}
```

`refresh_token`은 설정과 동의 상황에 따라 추가될 수 있으며 항상 오는 필드는 아니다. 실제 `scope` 문자열도 제공자가 반환한 허용 범위에 따라 달라질 수 있다.

- `access_token`: Google API에 접근할 때 쓰는 권한 토큰이다. 사용자 식별용 ID Token과 역할이 다르다.
- `id_token`: 로그인 결과를 담은 OIDC ID Token이다. 코드의 `token.Extra("id_token")`이 바로 이 값을 꺼낸다.
- `expires_in`: 토큰 수명의 초 단위 값이다.
- `token_type`: 보통 API 요청의 `Authorization: Bearer ...` 헤더에 넣는 토큰 종류다.

이 예제의 서버 로그인 흐름에서는 브라우저가 이 토큰 응답 JSON을 직접 받지 않는다. 서버가 코드를 교환하고 ID Token을 검증한다. Google API를 호출하지 않는다면 로그인 식별을 위해 `access_token`을 따로 보관할 필요도 없다.

ID Token의 값은 점으로 나뉘며, 각 부분을 디코딩하면 대략 아래와 같은 헤더와 페이로드가 나온다.

```json
// 디코딩한 header
{
  "alg": "RS256",
  "kid": "google-key-id",
  "typ": "JWT"
}
```

```json
// 디코딩한 payload의 예: 클레임은 요청 범위와 계정에 따라 달라질 수 있다
{
  "iss": "https://accounts.google.com",
  "sub": "109876543210987654321",
  "aud": "1234567890-example.apps.googleusercontent.com",
  "exp": 1791900000,
  "iat": 1791896400,
  "nonce": "로그인 시작 때 저장한 nonce",
  "email": "person@example.com",
  "email_verified": true
}
```

실제 토큰의 점 세 부분 중 첫째와 둘째를 Base64URL로 디코딩하면 이런 JSON을 읽을 수 있다. 그렇다고 이 JSON을 믿어도 된다는 뜻은 아니다. 공개 키로 셋째 부분의 서명을 확인하고 `iss`, `aud`, `exp` 등을 검증한 뒤에야 `sub`를 로그인 사용자 식별에 쓴다. `email` 같은 프로필 클레임은 항상 존재한다고 가정하지 말고, 꼭 필요하다면 범위와 검증 정책을 따로 확인한다.

마지막의 `204 No Content`는 예시를 간결하게 보이기 위한 자리다. 실제 서비스에서는 검증된 ID Token의 `Subject`를 Google 계정의 식별자로 사용해 애플리케이션 자체 세션을 만들고, 그 세션을 보안 쿠키로 전달해야 한다. ID Token이나 access token을 애플리케이션 로그인 세션 대신 그대로 브라우저에 보관하지 않는다. 또 `LoginAttemptStore`의 만료·원자적 1회 소비, 세션 쿠키의 `Secure`, `HttpOnly`, 적절한 `SameSite` 설정 및 HTTPS 적용은 앱의 구현 책임이다.

이 예시는 로그인 신원 확인에 필요한 ID Token을 검증한다. Google API를 대신 호출할 목적이 없다면 access token은 로그인 식별에 필요하지 않다. 이메일을 화면에 표시하거나 계정 연락처로 쓰려면 별도로 이메일 검증 여부와 서비스 정책을 확인하고, 계정의 기본 식별자는 이메일보다 `(iss, sub)`를 사용하는 것이 안전하다.

## 10. 전체 흐름 요약

```text
OAuth 흐름으로 토큰을 받는다
        ↓
OIDC라면 로그인 결과로 ID Token을 받는다
        ↓
JWT/JWS 형식을 분해하고 허용된 알고리즘인지 확인한다
        ↓
kid로 신뢰하는 issuer의 JWKS에서 공개 키를 고른다
        ↓
공개 키로 JWS 서명을 검증한다
        ↓
OIDC 클레임(iss, sub, aud, exp 등)과 필요한 흐름별 값(nonce 등)을 확인한다
        ↓
검증된 (iss, sub)를 사용자 식별에 사용한다
```

한 문장으로 줄이면 이렇다. **OAuth는 토큰을 얻는 권한 위임 절차, OIDC는 그 절차에 로그인 신원 정보를 더하는 규약, JWT/JWS는 토큰을 표현하고 서명하는 형식, JWKS는 서명을 확인할 공개 키를 배포하는 형식이다.** 이 구분을 기억하면 검증 코드에서 각 검사가 어느 계층을 책임지는지 훨씬 명확해진다.

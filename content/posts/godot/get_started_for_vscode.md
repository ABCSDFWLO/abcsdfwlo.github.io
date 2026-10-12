+++
date = '2026-10-12T15:05:37+09:00'
draft = false
title = 'Visual Studio Code와 Godot 환경 설정 시작하기'
+++

Godot 프로젝트를 처음 내려받아 실행하고, 필요할 때 VS Code에서 코드를 수정하는 방법을 설명합니다.

## 개발 환경

- Godot 4 최신 안정판의 **Standard** 에디터
- GitHub 계정과 프로젝트 저장소 접근 권한
- 코드를 수정한다면 [Visual Studio Code](https://code.visualstudio.com/)

프로젝트에 지정된 Godot 버전이 있다면 해당 버전을 우선 사용하세요. Godot은 GDScript를 사용하는 Standard 에디터와 C#을 사용할 수 있는 .NET 에디터를 제공합니다.

### GDScript와 .NET(C#) 비교

.NET 에디터의 설치나 사용 방법은 이 안내에서 다루지 않습니다. 프로젝트를 새로 시작하거나 스크립트 언어를 선택할 때 다음 차이만 참고하세요.

| 항목 | GDScript | .NET(C#) |
| --- | --- | --- |
| Godot 연동 | Godot 기능과 문서 예제를 바로 적용하기 쉽습니다. | C# API와 Godot의 연동 방식을 함께 이해해야 합니다. |
| 학습 난이도 | 문법이 간결하고 씬·노드 기반 작업에 빠르게 적응할 수 있습니다. | C# 경험이 있다면 익숙하지만, 처음 접하면 더 많은 언어 개념을 익혀야 합니다. |
| 개발 생산성 | 짧은 코드와 빠른 반복 작업에 유리합니다. | 타입, 인터페이스, IDE 분석 기능을 활용한 규모 있는 코드 관리에 유리합니다. |
| 성능과 규모 | 일반적인 게임 로직과 대부분의 프로젝트에 충분합니다. | 정적 타입과 C# 생태계를 활용할 수 있어 복잡한 시스템과 대규모 코드에 유리할 수 있습니다. |
| 생태계 | Godot 튜토리얼과 예제가 많고 플랫폼 호환성이 단순합니다. | .NET 라이브러리를 활용할 수 있지만 버전과 플랫폼 호환성을 확인해야 합니다. |

간단한 프로토타입, Godot 기능 중심의 개발, 폭넓은 플랫폼 지원이 중요하면 GDScript가 편리합니다. 기존 C# 코드나 .NET 라이브러리를 활용해야 하거나 팀이 C#에 익숙하고 큰 규모의 코드베이스를 관리한다면 .NET을 고려할 수 있습니다. 두 방식의 장단점보다 프로젝트와 팀의 기존 기술 선택이 우선입니다.

### 렌더링 모드 선택

Godot 4 프로젝트를 만들 때는 목표 기기의 그래픽 기능과 빌드 플랫폼에 맞춰 렌더링 모드를 선택합니다.

| 모드 | 적합한 빌드 목적 | 특징 |
| --- | --- | --- |
| **Forward+** | 고사양 데스크톱·노트북 중심의 3D 게임 | Vulkan 기반의 고급 조명과 렌더링 기능을 활용할 수 있지만, 지원되지 않는 그래픽 장치에서는 실행되지 않을 수 있습니다. |
| **Compatibility** | 저사양 PC, 다양한 내장 그래픽, 모바일, Web 등 폭넓은 기기 지원 | 지원 범위가 넓고 요구 사양이 낮은 대신 Forward+의 일부 고급 3D 기능과 시각적 품질을 사용할 수 없습니다. |

고사양 PC에서 최신 3D 효과가 핵심이면 Forward+를, 다양한 기기에서 안정적으로 실행하는 것이 목표면 Compatibility를 우선 고려하세요. 2D 프로젝트는 두 모드의 차이가 상대적으로 작지만, 배포 대상이 넓다면 Compatibility가 안전한 선택일 수 있습니다. 렌더링 모드는 나중에 바꿀 수 있어도 조명과 셰이더 결과가 달라질 수 있으므로 초기부터 실제 대상 기기에서 테스트하는 것이 좋습니다.

## 처음 시작하기

### 1. Git과 GitHub 준비

- **Git**은 컴퓨터에서 파일 변경 이력을 관리하는 프로그램입니다.
- **GitHub**는 Git으로 관리하는 프로젝트를 인터넷에 저장하고 함께 작업하는 서비스입니다.
- Git 명령어가 익숙하지 않다면 [GitHub Desktop](https://desktop.github.com/)을 사용할 수 있습니다. GitHub Desktop에는 Git이 포함되어 있습니다.

#### GitHub Desktop 사용

1. [GitHub 계정 만들기](https://github.com/signup)에서 계정을 만들고 이메일 주소를 확인합니다. 이미 계정이 있다면 건너뜁니다.
2. [GitHub Desktop](https://desktop.github.com/)에서 운영체제에 맞는 설치 파일을 내려받습니다.
3. GitHub Desktop을 실행하고 **Sign in to GitHub.com**을 선택합니다. 브라우저에서 로그인하고 권한을 승인한 뒤 Desktop으로 돌아옵니다.
4. **File → Clone repository… → URL**을 선택합니다.
5. 프로젝트 관리자가 제공한 저장소 주소를 입력합니다. **Local path**에는 프로젝트를 보관할 폴더를 지정하세요. 나중에 찾기 쉬운 `Documents\GitHub\프로젝트폴더` 같은 위치를 권장합니다.
6. **Clone**을 눌러 프로젝트를 내려받습니다.
7. 복제가 끝나면 **Show in Explorer**(Windows) 또는 **Show in Finder**(macOS)로 프로젝트 폴더를 열 수 있습니다.

Windows에서는 설치 파일을 실행한 뒤 화면의 안내를 따르면 됩니다. macOS에서는 내려받은 `.zip` 파일을 열고 **GitHub Desktop** 앱을 **Applications(응용 프로그램)** 폴더로 옮긴 다음 실행합니다.

#### 명령줄 Git 사용

[Git for Windows](https://git-scm.com/install/windows)를 설치하거나 macOS의 터미널에서 Command Line Tools를 준비한 뒤, 저장할 위치에서 다음 명령을 실행합니다.

```sh
git clone 저장소_URL
```

Windows에서 명령줄 Git을 사용한다면 설치 프로그램의 기본 옵션을 사용해도 됩니다. 설치 후 **Git Bash** 또는 **PowerShell**에서 다음 명령으로 설치 여부를 확인합니다.

```sh
git --version
```

macOS에서는 터미널에서 다음 명령을 실행해 Command Line Tools를 설치할 수 있습니다. 설치 후 `git --version`으로 확인합니다.

```sh
xcode-select --install
```

이미 내려받은 프로젝트를 최신 상태로 갱신할 때는 다음 명령을 사용합니다.

```sh
git pull
```

저장소가 비공개이거나 권한이 없는 경우에는 관리자에게 GitHub 사용자 이름을 전달해 초대를 요청하세요. 비밀번호나 인증 정보는 다른 사람에게 전달하지 마세요.

#### 복제가 안 될 때

- 브라우저에서 저장소 주소를 열어 주소가 올바르고 저장소에 접근할 수 있는지 확인합니다.
- 비공개 저장소라면 관리자가 초대했는지 확인합니다. 초대를 받은 뒤 GitHub에서 수락하고 Desktop에서 다시 복제합니다.
- 로그인 또는 인증 창이 나타나면 GitHub 계정으로 로그인합니다.
- `Local path`에는 이미 다른 프로젝트가 들어 있는 폴더보다 새 폴더를 지정하는 편이 안전합니다.
- 이미 복제한 프로젝트를 최신 상태로 가져올 때는 GitHub Desktop에서 저장소를 선택하고 **Fetch origin**을 누릅니다. 업데이트가 있으면 **Pull origin**을 누릅니다.
- 충돌이 발생하면 작업 중인 파일을 별도로 저장한 뒤 저장소 관리자에게 해결 방법을 문의하세요.

### 2. Godot 설치

[Godot 다운로드 페이지](https://godotengine.org/download/)에서 운영체제에 맞는 최신 안정판 **Standard** 버전을 선택합니다. 프로젝트에서 특정 버전을 요구한다면 그 버전을 사용하세요.

#### Windows

- [Godot 다운로드 페이지](https://godotengine.org/download/)에서 Windows용 Standard 버전을 내려받아 압축을 풉니다.
- 또는 [Scoop](https://scoop.sh/)을 사용한다면 다음 방법으로 설치할 수 있습니다.
  - 장점: 명령어로 설치하고 업데이트할 수 있습니다.
  - 단점: PowerShell 사용이 익숙하지 않다면 불편할 수 있으며, Scoop이 먼저 설치되어 있어야 합니다.

  <details>
  <summary>Scoop으로 Godot 설치하기</summary>

  1. 시작 메뉴에서 **PowerShell**을 검색해 실행합니다. Scoop은 일반 사용자 권한으로 설치하므로 관리자 권한으로 실행하지 마세요.
  2. Scoop이 설치되어 있지 않다면 다음 명령을 한 줄씩 실행합니다. 확인 메시지가 나오면 `Y`를 입력합니다.

  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
  ```

  3. PowerShell을 닫았다가 다시 열고 설치를 확인합니다.

  ```powershell
  scoop --version
  ```

  4. Godot이 있는 `extras` 저장소를 추가하고 설치합니다.

```powershell
scoop bucket add extras
scoop install extras/godot
```

  5. 업데이트할 때는 다음 명령을 사용합니다.

  ```powershell
  scoop update
  scoop update extras/godot
  ```

  </details>

  웹사이트에서 직접 내려받는 방법은 설치가 가장 단순합니다. 반면 Godot이 업데이트될 때마다 새 버전을 직접 내려받아 교체해야 합니다.

#### macOS

- [Godot 다운로드 페이지](https://godotengine.org/download/)에서 macOS용 Standard 버전을 내려받아 응용 프로그램 폴더로 옮깁니다.
- 또는 [Homebrew](https://brew.sh/)를 사용한다면 다음 방법으로 설치할 수 있습니다.
  - 장점: 터미널에서 설치와 업데이트를 간단히 할 수 있습니다.
  - 단점: Homebrew가 먼저 설치되어 있어야 하고 터미널 명령어를 사용해야 합니다.

  <details>
  <summary>Homebrew로 Godot 설치하기</summary>

  1. **Spotlight**(`Command + Space`)에서 **Terminal**을 검색해 실행합니다.
  2. Homebrew가 없다면 [Homebrew 공식 사이트](https://brew.sh/)의 설치 명령을 실행합니다. 설치 중 Mac 로그인 비밀번호를 물을 수 있으며, 입력하는 동안 글자가 표시되지 않는 것은 정상입니다.
  3. 설치 마지막에 표시되는 **Next steps**를 그대로 실행합니다. Apple Silicon Mac에서는 보통 다음 명령이 필요하지만, 설치 화면의 안내를 우선하세요.

  ```sh
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
  ```

  4. Homebrew 설치를 확인합니다.

  ```sh
  brew --version
  ```

  5. Godot을 설치합니다.

```sh
brew install --cask godot
```

  6. 업데이트할 때는 다음 명령을 사용합니다.

  ```sh
  brew update
  brew upgrade --cask godot
  ```

  </details>

  웹사이트에서 직접 내려받는 방법은 앱을 응용 프로그램 폴더로 옮겨 실행하면 됩니다. 업데이트할 때는 새 버전으로 앱을 교체해야 합니다.

Godot을 처음 실행하면 운영체제의 보안 경고가 나타날 수 있습니다. 공식 다운로드 페이지에서 받은 파일인지 확인한 뒤 실행을 허용하세요.

### 3. Godot에서 프로젝트 열기

1. Godot을 실행하고 **Import**를 누릅니다.
2. 프로젝트 폴더 안의 `project.godot` 파일을 선택합니다.
3. **Import & Edit**를 눌러 프로젝트를 엽니다.
4. 에디터가 프로젝트를 불러오면 오른쪽 위의 **Run Project** 또는 `F6`/`F5`를 사용해 실행합니다. 어떤 단축키를 사용할지는 프로젝트의 실행 대상에 따라 다를 수 있습니다.

프로젝트를 처음 열 때는 이미지, 글꼴 등의 리소스를 가져오고 캐시를 만들기 때문에 시간이 오래 걸릴 수 있습니다. 창 아래쪽의 진행 표시가 끝날 때까지 Godot을 종료하지 마세요. 이후에는 더 빠르게 열립니다.

> 프로젝트를 실행할 때 오류가 발생하면 먼저 Godot 하단의 **Output**과 **Debugger** 패널을 확인하세요. 오류 메시지를 복사할 때는 첫 번째 오류와 그 앞뒤의 호출 스택을 함께 기록하면 원인을 찾기 쉽습니다.

## VS Code와 Godot 확장

Godot 에디터만으로도 프로젝트를 실행하고 장면을 편집할 수 있습니다. 코드를 직접 수정하거나 중단점 디버깅을 하려면 VS Code와 Godot 확장을 사용할 수 있습니다.

### 먼저 알아둘 개념

- **Godot 에디터:** 장면(`.tscn`), 리소스, 프로젝트 설정을 편집하고 프로젝트를 실행하는 프로그램입니다.
- **GDScript:** Godot에서 사용하는 스크립트 언어입니다. 문법이 Python과 비슷하지만 완전히 같은 언어는 아닙니다.
- **Godot 실행 파일:** 에디터뿐 아니라 터미널에서 프로젝트 실행, 리소스 가져오기, 내보내기에도 사용할 수 있습니다.
- **Language Server(LSP):** VS Code에 GDScript 자동 완성과 오류 표시를 제공합니다. Godot 에디터가 서버를 제공하고 VS Code가 접속합니다.
- **Debug Adapter(DAP):** VS Code에서 중단점을 설정하고 게임을 실행하거나 디버깅하게 해 줍니다.
- **PATH:** 터미널에서 실행 파일의 전체 경로를 쓰지 않고 프로그램 이름만 입력할 수 있게 하는 운영체제 설정입니다.

### 1. VS Code 설치

[VS Code 공식 사이트](https://code.visualstudio.com/)에서 운영체제에 맞는 설치 파일을 받아 설치합니다.

- Windows(Scoop): `scoop bucket add extras` 후 `scoop install extras/vscode`
- macOS(Homebrew): `brew install --cask visual-studio-code`

### 2. 확장 설치

VS Code의 **Extensions**(`Ctrl+Shift+X` / macOS `Cmd+Shift+X`)에서 다음 확장을 설치합니다.

| 확장 | 용도 |
| --- | --- |
| **godot-tools** (게시자 `geequlim`) | GDScript 문법 강조, 자동 완성, 오류 표시, 디버깅 |
| **GitHub Copilot** / **GitHub Copilot Chat** | AI 코드 제안, 설명, 수정 요청 |

터미널에서 설치하려면 다음 명령을 사용합니다.

```sh
code --install-extension geequlim.godot-tools
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
```

### 3. 프로젝트 열기와 Godot 경로 설정

1. 먼저 Godot 에디터에서 프로젝트를 한 번 열어 리소스 가져오기를 완료합니다.
2. VS Code에서 **File → Open Folder…**를 선택하고 `project.godot` 파일이 있는 프로젝트 폴더를 엽니다.
3. **Settings**(`Ctrl+,` / `Cmd+,`)에서 `godotTools`를 검색하고 Godot 실행 파일 경로를 지정합니다. `settings.json`에 직접 입력할 수도 있습니다.

Windows 예시:

```json
{
  "godotTools.editorPath.godot4": "C:\\Tools\\Godot\\godot.exe"
}
```

macOS 예시:

```json
{
  "godotTools.editorPath.godot4": "/Applications/Godot.app/Contents/MacOS/Godot"
}
```

Godot이 PATH에 등록되어 있다면 다음처럼 실행 파일 이름만 적을 수도 있습니다.

```json
{
  "godotTools.editorPath.godot4": "godot"
}
```

설정 후 하단 상태 표시줄에 GDScript Language Server 연결 상태가 표시됩니다. 연결되지 않으면 Godot 에디터를 함께 실행하세요. 기본적으로 언어 서버는 포트 `6005`, 디버거는 포트 `6006`을 사용합니다.

Godot 에디터를 직접 열지 않고 언어 서버를 사용하려면 `settings.json`에 다음 설정을 추가할 수 있습니다.

```json
{
  "godotTools.lsp.headless": true
}
```

이 경우에도 프로젝트를 처음 열어 리소스 가져오기를 완료하는 과정은 필요합니다. 포트 `6005` 또는 `6006`을 다른 프로그램이 사용하고 있다면 Godot 확장의 포트 설정을 바꾸거나 해당 프로그램을 종료하세요.

### 4. VS Code에서 실행하고 디버깅하기

1. **Run and Debug**(`Ctrl+Shift+D` / `Cmd+Shift+D`) 패널을 엽니다.
2. **Create a launch.json file**을 누르고 **Godot**을 선택합니다.
3. 생성된 실행 설정에서 프로젝트 경로와 실행 대상 장면을 확인합니다.
4. `.gd` 파일에서 줄 번호 왼쪽을 눌러 중단점을 설정합니다.
5. `F5`로 실행하면 해당 코드가 실행될 때 변수와 호출 스택을 확인할 수 있습니다.

디버깅 중에는 다음 단축키를 사용할 수 있습니다.

- `F5`: 계속 실행하거나 디버깅 시작
- `F10`: 다음 줄 실행
- `F11`: 함수 내부로 들어가기
- `Shift+F5`: 디버깅 중지

중단점이 동작하지 않으면 실행 구성이 올바른 프로젝트를 가리키는지, Godot 실행 파일 경로가 유효한지, 해당 코드가 실제로 실행되는지 확인하세요.

장면 파일(`.tscn`)과 노드 구성은 Godot 에디터에서 수정하고, GDScript 파일은 VS Code에서 수정하는 방식이 안전합니다. 같은 파일을 두 프로그램에서 동시에 열어 수정하면 변경 내용이 서로 덮어써질 수 있습니다.

## Godot 실행 파일과 CLI

Godot 실행 파일의 위치를 모를 때는 다음 명령으로 확인할 수 있습니다.

```powershell
# Windows PowerShell
Get-Command godot
scoop which godot
```

```sh
# macOS 터미널
which godot
ls /Applications/Godot.app/Contents/MacOS/
```

터미널에서 `godot` 명령을 사용하려면 Godot 실행 파일이 PATH에 등록되어 있어야 합니다. 설정 후 새 터미널과 VS Code 창을 다시 열고 다음 명령으로 확인합니다.

```sh
godot --version
```

실행 파일 경로를 모를 때는 설치 방법에 따라 다음 위치를 확인합니다.

| 설치 방법 | 실행 파일 위치 예시 |
| --- | --- |
| Windows, Scoop | `C:\Users\사용자이름\scoop\apps\godot\current\` 아래의 Godot 실행 파일 |
| Windows, 직접 다운로드 | 압축을 푼 폴더의 `Godot_v4.x-stable_win64.exe` |
| macOS, Homebrew 또는 직접 다운로드 | `/Applications/Godot.app/Contents/MacOS/Godot` |

**Windows에서 직접 다운로드한 경우**

1. Godot 실행 파일을 `C:\Tools\Godot\`처럼 고정된 폴더에 둡니다.
2. 필요하다면 파일 이름을 `godot.exe`로 바꿉니다.
3. 시작 메뉴에서 **시스템 환경 변수 편집**을 열고 **환경 변수… → 사용자 변수 → Path → 편집 → 새로 만들기**를 선택합니다.
4. 실행 파일이 있는 폴더를 추가하고 터미널과 VS Code를 모두 다시 엽니다.

PowerShell에서 사용자 PATH에 폴더를 추가할 수도 있습니다.

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Tools\Godot", "User")
```

**macOS에서 직접 다운로드한 경우**

`~/.zshrc` 파일에 별칭을 추가하고 새 터미널을 엽니다.

```sh
echo 'alias godot="/Applications/Godot.app/Contents/MacOS/Godot"' >> ~/.zshrc
source ~/.zshrc
```

자주 사용하는 명령은 모두 `project.godot` 파일이 있는 프로젝트 폴더에서 실행합니다.

| 명령 | 설명 |
| --- | --- |
| `godot --path . --editor` | Godot 에디터로 프로젝트 열기 |
| `godot --path .` | 에디터 없이 프로젝트 실행 |
| `godot --path . --import --headless` | 창 없이 리소스 가져오기 |
| `godot --path . --check-only --script res://스크립트경로.gd` | 지정한 GDScript의 문법 검사 |
| `godot --version` | 설치된 Godot 버전 확인 |
| `godot --help` | 사용 가능한 옵션 확인 |

프로젝트에 따라 스크립트 검사나 내보내기에 필요한 명령과 옵션이 다를 수 있으므로, 해당 프로젝트의 문서를 우선 확인하세요.

## GitHub Copilot을 사용할 때의 팁

Godot 코드를 Copilot에게 요청할 때는 일반적인 기능 설명보다 프로젝트의 구조와 실행 조건을 함께 알려 주는 것이 좋습니다.

- 수정하려는 파일의 경로와 연결된 씬 또는 노드의 종류를 함께 적습니다.
- Godot 버전과 GDScript인지 C#인지 명시합니다.
- 입력 방식, 예상되는 신호(signal), 저장 형식처럼 이미 정해진 규칙을 설명합니다.
- 한 번에 전체 프로젝트를 바꾸기보다 함수 하나 또는 기능 하나를 요청합니다.
- 코드를 적용한 뒤 Godot의 **Output**, **Debugger**, 원격 씬 트리에서 실제 동작을 확인합니다.
- 자동 생성된 코드는 그대로 신뢰하지 말고, `null` 가능성·노드 경로·씬 수명 주기를 직접 확인합니다.

예를 들어 다음과 같이 요청할 수 있습니다.

> Godot 4 GDScript에서 `CharacterBody2D`가 방향키 입력으로 이동하도록 작성해 줘. 이동 속도는 `@export` 변수로 노출하고, `_physics_process`에서 `Input.get_vector`를 사용해 `move_and_slide()`를 호출해 줘. 기존 변수 이름은 바꾸지 마.

## 프로젝트 내보내기

개발 중에는 Godot 에디터에서 프로젝트를 실행하는 것만으로 충분합니다. 다른 사람에게 전달할 실행 파일을 만들거나 실제 기기에서 시험할 때 **Project → Export…**를 사용합니다.

### 공통 준비

1. **Editor → Manage Export Templates…**를 엽니다.
2. **Download and Install**을 눌러 현재 Godot 버전에 맞는 Export Templates를 설치합니다.
3. **Project → Export…**에서 대상 플랫폼을 추가하고 설정합니다.
4. **Export Project…**를 눌러 결과 파일을 생성합니다.

Export Templates는 Godot 버전별로 다릅니다. Godot을 업데이트한 뒤 내보내기가 실패하면 현재 버전에 맞는 템플릿을 다시 설치하세요. 프로젝트 설정과 Export Preset은 저장소마다 다르므로, 이미 설정된 값을 함부로 덮어쓰지 않는 것이 좋습니다.

### Windows용 내보내기

1. **Project → Export…**를 엽니다.
2. **Add… → Windows Desktop**을 선택합니다.
3. **Export Path**에 결과 파일의 위치와 이름을 지정합니다.
4. 실행 파일과 데이터를 하나로 묶으려면 **Embed PCK**를 사용합니다. 사용하지 않으면 생성된 `.exe`와 `.pck` 파일을 같은 폴더에 함께 두어야 합니다.
5. 개발 로그가 필요하지 않은 배포본은 **Export With Debug**를 끈 뒤 **Export Project…**를 누릅니다.
6. 결과 폴더에서 `.exe`를 실행해 확인합니다.

서명하지 않은 실행 파일은 다른 Windows 컴퓨터에서 SmartScreen 경고를 표시할 수 있습니다. 배포용 파일이라면 코드 서명을 검토하고, 테스트용이라면 파일 출처를 확인한 뒤 경고 화면에서 실행 여부를 판단하세요.

### macOS용 내보내기

1. **Project → Export…**에서 **Add… → macOS**를 선택합니다.
2. **Bundle Identifier**에 `com.회사또는이름.제품이름`처럼 고유한 값을 입력합니다. 비어 있으면 내보내기가 실패할 수 있습니다.
3. **Architecture**에서 `universal` 또는 대상에 맞는 아키텍처를 선택합니다.
4. 결과 경로를 지정하고 `.zip` 또는 `.dmg`로 내보냅니다.
5. 압축을 푼 뒤 `.app`을 실행해 확인합니다.

서명하지 않은 앱을 개인 테스트용으로 열 때 macOS가 차단하면 앱을 **Control + 클릭 → 열기 → 열기** 순서로 실행할 수 있습니다. 다른 사람에게 배포하려면 Apple Developer Program, 코드 서명과 공증이 필요합니다. 자세한 내용은 [Godot macOS 내보내기 안내](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_macos.html)를 확인하세요.

### Android용 내보내기

Android 내보내기에는 보통 JDK, Android Studio, Android SDK가 필요합니다.

1. JDK 17을 설치합니다. [Adoptium Temurin](https://adoptium.net/) 같은 배포판을 사용할 수 있습니다.
2. [Android Studio](https://developer.android.com/studio)를 설치하고 Android SDK를 준비합니다.
3. **SDK Manager → SDK Tools**에서 Android SDK Platform-Tools, Build-Tools, Command-line Tools, CMake, NDK를 설치합니다. 정확한 버전은 현재 Godot 버전의 [Android 내보내기 문서](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html)를 따릅니다.
4. Godot에서 **Editor → Editor Settings → Export → Android**를 열고 Java SDK Path와 Android SDK Path를 지정합니다.
5. **Project → Export… → Add… → Android**를 선택합니다.
6. **Package → Unique Name**에 `com.회사또는이름.제품이름`처럼 고유한 패키지 이름을 입력합니다.
7. Export Path를 지정하고 APK를 내보냅니다.

개발용 APK에 서명할 키스토어가 필요하다면 다음과 같이 만들 수 있습니다. 키스토어 파일과 비밀번호는 저장소에 커밋하지 마세요.

```sh
keytool -keyalg RSA -genkeypair -alias androiddebugkey -keypass android -keystore debug.keystore -storepass android -dname "CN=Android Debug,O=Android,C=US" -validity 9999 -deststoretype pkcs12
```

### Android 기기에서 USB 디버깅

APK를 매번 옮기지 않고 Godot에서 연결된 기기로 바로 실행하려면 다음을 설정합니다.

1. Android 기기에서 **설정 → 휴대전화 정보 → 소프트웨어 정보**로 이동합니다.
2. **빌드 번호**를 7번 눌러 개발자 옵션을 활성화합니다.
3. **설정 → 개발자 옵션 → USB 디버깅**을 켭니다.
4. 데이터 전송이 가능한 USB 케이블로 PC와 기기를 연결합니다.
5. 기기에 표시되는 **USB 디버깅을 허용하시겠습니까?** 창에서 허용을 누릅니다.
6. 필요하면 USB 연결 방식을 **파일 전송**으로 바꿉니다.
7. Godot 에디터의 기기 목록에서 연결된 기기를 확인하고 실행합니다.

터미널에서 연결 상태를 확인하려면 Android SDK의 `platform-tools` 폴더에서 다음 명령을 실행합니다.

```sh
adb devices
```

목록에 `device`가 표시되면 정상입니다. `unauthorized`라면 기기 화면에서 USB 디버깅 허용 창을 승인해야 합니다. 기기가 보이지 않으면 케이블, USB 포트, 드라이버, 개발자 옵션을 차례로 확인하세요.

Android 11 이상에서는 **개발자 옵션 → 무선 디버깅**을 사용할 수도 있습니다. 처음 연결할 때는 USB 연결이 더 안정적이며, 무선 연결은 [Android 공식 ADB 안내](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)를 참고하세요.

### Web용 내보내기

1. **Project → Export…**에서 **Add… → Web**을 선택합니다.
2. 필요하면 화면 크기, 스레드, 파일 접근 관련 옵션을 프로젝트 요구 사항에 맞게 설정합니다.
3. **Export Project…**를 눌러 Web 파일을 생성합니다.
4. 생성된 파일을 정적 웹 서버에 올려 테스트합니다. 브라우저에서 `file://`로 직접 열면 보안 정책 때문에 정상적으로 동작하지 않을 수 있습니다.

Web 내보내기는 서버가 올바른 MIME 타입으로 파일을 제공해야 하며, 프로젝트 설정에 따라 HTTPS와 추가 헤더가 필요할 수 있습니다. 자세한 내용은 [Godot Web 내보내기 안내](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)를 확인하세요.

플랫폼에 따라 추가 개발 도구가 필요합니다.

- Windows: 일반적으로 별도의 SDK 없이 Windows Desktop으로 내보낼 수 있습니다.
- macOS: macOS용 설정, 앱 서명과 공증에는 Apple 개발자 계정과 Mac이 필요합니다.
- Android: JDK, Android Studio, Android SDK와 Godot의 Android 경로 설정이 필요합니다.
- Web: 브라우저에서 실행할 수 있는 파일을 생성하며, 배포 서버의 설정이 필요할 수 있습니다.

자세한 설정은 [Godot 공식 내보내기 문서](https://docs.godotengine.org/en/stable/tutorials/export/index.html)를 참고하세요.

## 문제 해결

- **프로젝트를 가져올 수 없음:** 선택한 폴더에 `project.godot` 파일이 있는지 확인합니다.
- **Godot 버전 오류:** 프로젝트가 요구하는 버전과 설치된 버전이 일치하는지 확인합니다.
- **처음 실행이 오래 걸림:** 리소스 가져오기가 끝날 때까지 기다립니다.
- **VS Code 자동 완성이 동작하지 않음:** Godot 에디터를 실행한 상태인지, `godotTools.editorPath.godot4` 경로가 올바른지 확인합니다.
- **내보내기 실패:** Export Templates가 설치되어 있는지와 플랫폼별 필수 SDK가 설정되어 있는지 확인합니다.
- **`godot` 명령을 찾을 수 없음:** Godot 실행 파일이 PATH에 등록되어 있는지 확인하고, PATH를 수정했다면 터미널과 VS Code를 다시 엽니다.
- **Godot 확장이 연결되지 않음:** `godotTools.editorPath.godot4`에 디렉터리가 아니라 실제 실행 파일 경로를 입력했는지 확인합니다.
- **GDScript 오류 표시가 늦음:** Godot의 리소스 가져오기가 끝났는지, 프로젝트 폴더 전체를 VS Code로 열었는지 확인합니다. 개별 `.gd` 파일만 열면 언어 서버가 프로젝트를 인식하지 못할 수 있습니다.
- **장면을 찾을 수 없음:** 파일 경로와 대소문자를 확인합니다. Godot 리소스 경로는 일반적으로 `res://`로 시작하며, 운영체제에 따라 대소문자가 다르게 처리되지 않는다고 가정해야 합니다.
- **노드가 `null`임:** 노드 경로가 현재 씬의 실제 트리와 일치하는지 확인하고, 필요한 노드가 준비된 뒤 코드를 실행하도록 `_ready()` 또는 적절한 신호를 사용합니다.
- **Android 기기가 보이지 않음:** 데이터 전송이 가능한 케이블과 다른 USB 포트를 사용하고, 기기에서 USB 디버깅 허용을 승인했는지 확인합니다. `adb devices` 결과가 `unauthorized`이면 기기의 승인 창을 다시 확인합니다.
- **macOS 앱이 실행되지 않음:** 앱을 Control-click으로 열어 보고, 배포 목적이라면 코드 서명과 공증 설정을 확인합니다.
- **Windows 실행 파일이 차단됨:** 파일을 신뢰할 수 있는 출처에서 받았는지 확인한 뒤 SmartScreen 경고 내용을 검토합니다. 배포용 파일에는 코드 서명을 사용하는 것이 좋습니다.

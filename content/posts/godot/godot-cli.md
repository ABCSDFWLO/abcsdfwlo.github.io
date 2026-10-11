+++
date = '2026-10-11T18:59:27+09:00'
title = 'Godot Cli'
+++

https://docs.godotengine.org/ko/4.x/tutorials/editor/command_line_tutorial.html

```Shell
# Install Scoop
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Add "Extras" bucket
scoop bucket add extras

# Standard editor:
scoop install godot

# Editor with C# support (will be available as `godot-mono` in `PATH`):
scoop install godot-mono
```

자꾸 AI가 정적 검증할 때 CLI 찾아서 함 설치해봤다.

설치되는 경로는 

`C:\Users\USERNAME\scoop\apps\godot\current\godot.exe`

버전 관리도 겸사겸사 편해질 듯

## 260929

에이전트로 바이브 코딩하기 겁나 편해진 듯

### scoop install for admin

Installation under the administrator console has been disabled by default for security considerations.

If you know what you are doing and want to install Scoop as administrator.

Please download the installer and manually execute it with the -RunAsAdmin parameter in an elevated console.

Here is the example: 

```shell
irm get.scoop.sh -outfile 'install.ps1'
.\install.ps1 -RunAsAdmin [-OtherParameters ...]
```

What if I don't care and just want a one-line command: 

```shell
iex "& {$(irm get.scoop.sh)} -RunAsAdmin"
```
@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

if exist "create-desktop-shortcut.ps1" goto runInstaller
call :msg 6ZSZ6K+v77ya5pyq5om+5YiwIGNyZWF0ZS1kZXNrdG9wLXNob3J0Y3V0LnBzMeOAgg==
pause
exit /b 1

:runInstaller
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-desktop-shortcut.ps1"
if errorlevel 1 goto installerFailed

call :msg 5b+r5o235pa55byP5Yib5bu65a6M5oiQ44CC546w5Zyo5Y+v5Lul5Y+M5Ye75qGM6Z2i55qE4oCc5bCP55m95Liq5Lq65YaF5a6556m66Ze04oCd5ZCv5Yqo572R56uZ44CC
pause
exit /b 0

:installerFailed
call :msg 6ZSZ6K+v77ya5Yib5bu65qGM6Z2i5b+r5o235pa55byP5aSx6LSl44CC6K+35p+l55yL5LiK5pa56ZSZ6K+v5L+h5oGv5ZCO6YeN6K+V44CC
pause
exit /b 1

:msg
powershell -NoProfile -Command "$value = '%~1'.TrimEnd('='); $value = $value.PadRight([math]::Ceiling($value.Length / 4) * 4, '='); $bytes = [Convert]::FromBase64String($value); [Console]::OutputEncoding = [Text.Encoding]::UTF8; Write-Host ([Text.Encoding]::UTF8.GetString($bytes))"
exit /b 0

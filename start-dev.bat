@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Xiaobai Personal Content Space - Local Development Server

cd /d "%~dp0"
set "XIAOBAI_PROJECT_DIR=%CD%"
set "SITE_URL=http://localhost:3000/studio/new"
set "XIAOBAI_EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%XIAOBAI_EDGE%" goto checkPackage
set "XIAOBAI_EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

:checkPackage
if exist "package.json" goto checkNode
call :msg 6ZSZ6K+v77ya5pyq5om+5YiwIHBhY2thZ2UuanNvbuOAguivt+ehruiupCBzdGFydC1kZXYuYmF0IOS9jeS6jumhueebruagueebruW9leOAgg==
pause
exit /b 1

:checkNode
where node >nul 2>nul
if not errorlevel 1 goto checkNpm
call :msg 6ZSZ6K+v77ya5pyq5om+5YiwIE5vZGUuanPjgILor7flhYjlronoo4UgTm9kZS5qcyBMVFPjgII=
pause
exit /b 1

:checkNpm
where npm >nul 2>nul
if not errorlevel 1 goto checkPort
call :msg 6ZSZ6K+v77ya5pyq5om+5YiwIG5wbeOAguivt+ajgOafpSBOb2RlLmpzIOWuieijheOAgg==
pause
exit /b 1

:checkPort
powershell -NoProfile -ExecutionPolicy Bypass -Command "$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue ^| Select-Object -First 1; if (-not $connection) { exit 2 }; $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $connection.OwningProcess) -ErrorAction SilentlyContinue; if ($process -and $process.CommandLine -and $process.CommandLine.IndexOf($env:XIAOBAI_PROJECT_DIR, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { exit 0 }; exit 1"
set "PORT_STATE=%ERRORLEVEL%"
if "%PORT_STATE%"=="0" goto alreadyRunning
if "%PORT_STATE%"=="1" goto portInUse

if exist "node_modules\" goto startServer
call :msg 5q2j5Zyo5a6J6KOF6aG555uu5L6d6LWW77yM6K+356iN5YCZLi4u
call npm install
if not errorlevel 1 goto startServer
call :msg 6ZSZ6K+v77yabnBtIGluc3RhbGwg5aSx6LSl44CC6K+35qOA5p+l572R57uc44CB5p2D6ZmQ5ZKMIG5wbSDphY3nva7jgII=
pause
exit /b 1

:startServer
call :msg 5q2j5Zyo5ZCv5Yqo5pys5Zyw572R56uZ44CC
call :msg 5rWP6KeI5Zmo5bCG5Zyo572R56uZ5Y+v6K6/6Zeu5ZCO6Ieq5Yqo5omT5byA44CC
echo %SITE_URL%
start "" /b powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(90); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -UseBasicParsing '%SITE_URL%' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { if (Test-Path -LiteralPath $env:XIAOBAI_EDGE) { Start-Process -FilePath $env:XIAOBAI_EDGE -ArgumentList '%SITE_URL%' } else { Start-Process '%SITE_URL%' }; exit 0 } } catch {}; Start-Sleep -Seconds 1 }"
call npm run dev
set "DEV_EXIT=%ERRORLEVEL%"
if "%DEV_EXIT%"=="0" goto stopped
call :msg 6ZSZ6K+v77ya5byA5Y+R5pyN5Yqh5Zmo5ZCv5Yqo5aSx6LSl44CC
echo Exit code: %DEV_EXIT%
pause
exit /b %DEV_EXIT%

:stopped
call :msg 5byA5Y+R5pyN5Yqh5Zmo5bey5YGc5q2i44CC
pause
exit /b 0

:alreadyRunning
call :msg 5qOA5rWL5Yiw5b2T5YmN6aG555uu5bey5ZyoIDMwMDAg56uv5Y+j6L+Q6KGM77yM5q2j5Zyo5omT5byA5rWP6KeI5Zmo44CC
call :openBrowser
call :msg 5byA5Y+R5pyN5Yqh5Zmo5LuN5Zyo5Y6f5pyJ57uI56uv5Lit6L+Q6KGM77yb5YWz6Zet5Y6f57uI56uv5Lya5YGc5q2i572R56uZ44CC
pause
exit /b 0

:portInUse
call :msg 6ZSZ6K+v77yaMzAwMCDnq6/lj6Plt7Looqvlhbbku5bnqIvluo/ljaDnlKjvvIzkuJTkuI3mmK/lvZPliY3pobnnm67jgII=
pause
exit /b 1

:msg
powershell -NoProfile -Command "$value = '%~1'.TrimEnd('='); $value = $value.PadRight([math]::Ceiling($value.Length / 4) * 4, '='); $bytes = [Convert]::FromBase64String($value); [Console]::OutputEncoding = [Text.Encoding]::UTF8; Write-Host ([Text.Encoding]::UTF8.GetString($bytes))"
exit /b 0

:openBrowser
if exist "%XIAOBAI_EDGE%" start "" "%XIAOBAI_EDGE%" "%SITE_URL%"
if exist "%XIAOBAI_EDGE%" exit /b 0
start "" "%SITE_URL%"
exit /b 0

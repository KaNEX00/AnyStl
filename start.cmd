@echo off
rem AnyStl launcher (Windows) — installs deps if needed, builds, and starts the production server.

setlocal enabledelayedexpansion
cd /d "%~dp0"

if "%PORT%"=="" set PORT=3000
set URL=http://localhost:%PORT%

set REBUILD=0
set NO_OPEN=0

:argloop
if "%~1"=="" goto args_done
if /I "%~1"=="--rebuild" set REBUILD=1
if /I "%~1"=="--no-open" set NO_OPEN=1
if /I "%~1"=="-h"        goto show_help
if /I "%~1"=="--help"    goto show_help
shift
goto argloop

:show_help
echo Usage: start.cmd [--rebuild] [--no-open]
echo.
echo   --rebuild   Force a fresh production build before starting.
echo   --no-open   Don't auto-open the browser.
echo.
echo Environment:
echo   PORT        Port to listen on (default: 3000).
exit /b 0

:args_done

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node 20+ from https://nodejs.org
  exit /b 1
)

if not exist node_modules\.bin\next.cmd (
  echo Installing dependencies ^(first run, ~1 min^)...
  call npm install || exit /b 1
)

if not exist node_modules\.bin\playwright.cmd (
  echo Playwright missing from node_modules, reinstalling deps...
  call npm install || exit /b 1
)

echo Ensuring Playwright Chromium is installed...
call "node_modules\.bin\playwright.cmd" install chromium || exit /b 1

if "%REBUILD%"=="1"           goto do_build
if not exist .next\BUILD_ID   goto do_build
goto skip_build

:do_build
echo Building for production...
call npm run build || exit /b 1

:skip_build
echo.
echo AnyStl is starting at %URL%
echo The app will open in your default browser.
echo Close the tab or press Ctrl+C to stop.
echo.

if "%NO_OPEN%"=="1" set ANYSTL_NO_OPEN=1

call node scripts\launch.mjs
\r
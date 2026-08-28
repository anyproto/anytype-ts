@echo off
chcp 65001 >nul
title Anytype-ts Windows Installation Wizard

echo ================================================================
echo  🚀 ANYTYPE-TS WINDOWS INSTALLATION WIZARD (Next-Next-Finish)
echo ================================================================
echo.

:: 1. Check if Go is installed or exists in standard directories
where go >nul 2>&1
if %errorlevel% equ 0 goto start_go_wizard

if exist "C:\Program Files\Go\bin\go.exe" (
    set "PATH=C:\Program Files\Go\bin;%PATH%"
    goto start_go_wizard
)

if exist "%ProgramFiles%\Go\bin\go.exe" (
    set "PATH=%ProgramFiles%\Go\bin;%PATH%"
    goto start_go_wizard
)

:: 2. Go not found — Offer automatic download and installation
echo [!] Go (Golang) is not installed on your system.
set /p INSTALL_GO="Automatically download and install Go? (Y/n) [Enter = Yes]: "
if /i "%INSTALL_GO%"=="n" goto skip_go_install

echo.
echo ▶ Downloading and installing Go (Golang)...

:: Try winget first
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo ▶ Installing Go via winget...
    winget install GoLang.Go --accept-source-agreements --accept-package-agreements --silent
)

:: Add standard directory to PATH and check again
if exist "C:\Program Files\Go\bin\go.exe" (
    set "PATH=C:\Program Files\Go\bin;%PATH%"
    echo [✓] Go successfully installed!
    echo.
    goto start_go_wizard
)

:: If winget is not available or failed, download official MSI from go.dev
echo ▶ Downloading official Go installer from go.dev...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $msi = Join-Path $env:TEMP 'go_setup.msi'; Invoke-WebRequest -Uri 'https://go.dev/dl/go1.22.6.windows-amd64.msi' -OutFile $msi; Start-Process msiexec.exe -ArgumentList '/i', $msi, '/quiet', '/norestart' -Wait; Remove-Item $msi -Force -ErrorAction SilentlyContinue"

if exist "C:\Program Files\Go\bin\go.exe" (
    set "PATH=C:\Program Files\Go\bin;%PATH%"
    echo [✓] Go successfully installed!
    echo.
    goto start_go_wizard
)

:skip_go_install
:: 3. Run native Windows batch installation mode without Go
echo.
echo [INFO] Running native Windows batch installation mode...
echo.

:: Check if Anytype is running and ask to close
tasklist /FI "IMAGENAME eq Anytype.exe" 2>NUL | find /I /N "Anytype.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [!] Anytype is currently running.
    set /p CLOSE_ANY="Automatically close Anytype? (Y/n) [Enter = Yes]: "
    if /i not "%CLOSE_ANY%"=="n" (
        taskkill /F /IM Anytype.exe >nul 2>&1
        echo [✓] Anytype closed.
    )
)

:: Check if Bun is installed
where bun >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\.bun\bin\bun.exe" (
        set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
    ) else (
        echo.
        echo [!] 'bun' package manager was not found.
        set /p INSTALL_BUN="Automatically download and install Bun? (Y/n) [Enter = Yes]: "
        if /i not "%INSTALL_BUN%"=="n" (
            echo ▶ Downloading and installing Bun...
            powershell -NoProfile -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
            set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
        ) else (
            echo [ERROR] Cannot build without Bun.
            goto error
        )
    )
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo.
    echo ▶ Installing dependencies (bun install)...
    call bun install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        goto error
    )
)

:: Build UI
echo.
echo ▶ Building UI (bun run build)...
call bun run build
if %errorlevel% neq 0 (
    echo [ERROR] UI build failed!
    goto error
)

:: Detect Anytype resources directory
set "RESOURCES_DIR="
if exist "%LOCALAPPDATA%\Programs\Anytype\resources\app.asar" (
    set "RESOURCES_DIR=%LOCALAPPDATA%\Programs\Anytype\resources"
) else if exist "%ProgramFiles%\Anytype\resources\app.asar" (
    set "RESOURCES_DIR=%ProgramFiles%\Anytype\resources"
) else if exist "%ProgramFiles(x86)%\Anytype\resources\app.asar" (
    set "RESOURCES_DIR=%ProgramFiles(x86)%\Anytype\resources"
)

if "%RESOURCES_DIR%"=="" (
    echo.
    echo [!] Installed Anytype directory was not found automatically.
    set /p RESOURCES_DIR="Please enter the Anytype 'resources' directory path: "
)

if not exist "%RESOURCES_DIR%\app.asar" (
    echo [ERROR] %RESOURCES_DIR%\app.asar was not found!
    goto error
)

echo.
echo ▶ Updating Anytype: %RESOURCES_DIR%

:: Create backup
copy /y "%RESOURCES_DIR%\app.asar" "%RESOURCES_DIR%\app.asar.bak" >nul
echo [✓] Backed up original app.asar to app.asar.bak

:: Extract ASAR
set "TEMP_EXTRACT=%TEMP%\anytype-extract-%RANDOM%"
mkdir "%TEMP_EXTRACT%" >nul 2>&1
call npx -y asar extract "%RESOURCES_DIR%\app.asar" "%TEMP_EXTRACT%"

:: Copy updated files
echo ▶ Copying updated files...
xcopy /E /I /Y "dist" "%TEMP_EXTRACT%\dist" >nul
copy /Y "electron.js" "%TEMP_EXTRACT%\electron.js" >nul
xcopy /E /I /Y "electron" "%TEMP_EXTRACT%\electron" >nul

:: Repack ASAR
echo ▶ Repacking ASAR archive...
set "TEMP_ASAR=%TEMP%\app-%RANDOM%.asar"
call npx -y asar pack "%TEMP_EXTRACT%" "%TEMP_ASAR%"

:: Replace active ASAR
copy /Y "%TEMP_ASAR%" "%RESOURCES_DIR%\app.asar" >nul
del /F /Q "%TEMP_ASAR%" >nul 2>&1
rd /S /Q "%TEMP_EXTRACT%" >nul 2>&1

echo.
echo ================================================================
echo  🎉 CONGRATULATIONS! ANYTYPE SUCCESSFULLY UPDATED!
echo ================================================================
echo.
set /p LAUNCH="Launch Anytype now? (Y/n) [Enter = Yes]: "
if /i not "%LAUNCH%"=="n" (
    start "" "%LOCALAPPDATA%\Programs\Anytype\Anytype.exe" 2>nul
    echo [✓] Anytype launched.
)
goto end

:start_go_wizard
echo [OK] Go detected, launching interactive installation wizard...
echo.
go run scripts\install.go
goto end

:end
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error
echo.
echo [ERROR] An error occurred during installation.
echo Press any key to exit...
pause >nul
exit /b 1

@echo off
chcp 65001 >nul
title Anytype-ts Windows Kurulum Sihirbazı

echo ================================================================
echo  🚀 ANYTYPE-TS WINDOWS KURULUM SIHIRBAZI (Next-Next-Finish)
echo ================================================================
echo.

:: 1. Go kurulu mu kontrol et
where go >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Go tespit edildi, gelismis sihirbaz baslatiliyor...
    echo.
    go run scripts\install.go
    goto end
)

:: 2. Go yoksa yerel Batch / PowerShell tabanlı akıllı kurulumu calistir
echo [BILGI] Go bulunamadi, dogrudan Windows kurulum modu calistiriliyor...
echo.

:: Anytype calisiyor mu kontrol et ve kapat
tasklist /FI "IMAGENAME eq Anytype.exe" 2>NUL | find /I /N "Anytype.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [!] Anytype su anda acik durumda.
    set /p CLOSE_ANY="Anytype otomatik kapatilsin mi? (E/h): "
    if /i not "%CLOSE_ANY%"=="h" (
        taskkill /F /IM Anytype.exe >nul 2>&1
        echo [✓] Anytype kapatildi.
    )
)

:: Bun kurulu mu kontrol et
where bun >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\.bun\bin\bun.exe" (
        set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
    ) else (
        echo.
        echo [!] 'bun' paketi bulunamadi.
        set /p INSTALL_BUN="Bun otomatik indirilip kurulsun mu? (E/h): "
        if /i not "%INSTALL_BUN%"=="h" (
            echo ▶ Bun indiriliyor ve kuruluyor...
            powershell -NoProfile -ExecutionPolicy Bypass -Command "irm bun.sh/install.ps1 | iex"
            set "PATH=%USERPROFILE%\.bun\bin;%PATH%"
        ) else (
            echo [HATA] Bun olmadan derleme yapilamaz.
            goto error
        )
    )
)

:: Bağımlılıkları yükle
if not exist "node_modules" (
    echo.
    echo ▶ Bagimliliklar yukleniyor (bun install)...
    call bun install
    if %errorlevel% neq 0 (
        echo [HATA] Bagimliliklar yuklenemedi!
        goto error
    )
)

:: UI derle
echo.
echo ▶ UI derleniyor (bun run build)...
call bun run build
if %errorlevel% neq 0 (
    echo [HATA] UI derleme basarisiz oldu!
    goto error
)

:: Anytype resources dizinini bul
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
    echo [!] Kurulu Anytype dizini otomatik bulunamadi.
    set /p RESOURCES_DIR="Lutfen Anytype 'resources' klasor yolunu girin: "
)

if not exist "%RESOURCES_DIR%\app.asar" (
    echo [HATA] %RESOURCES_DIR%\app.asar bulunamadi!
    goto error
)

echo.
echo ▶ Anytype guncelleniyor: %RESOURCES_DIR%

:: Yedek al
copy /y "%RESOURCES_DIR%\app.asar" "%RESOURCES_DIR%\app.asar.bak" >nul
echo [✓] app.asar.bak yedegi alindi.

:: ASAR ac
set "TEMP_EXTRACT=%TEMP%\anytype-extract-%RANDOM%"
mkdir "%TEMP_EXTRACT%" >nul 2>&1
call npx -y asar extract "%RESOURCES_DIR%\app.asar" "%TEMP_EXTRACT%"

:: Dosyaları aktar
echo ▶ Guncel dosyalar aktariliyor...
xcopy /E /I /Y "dist" "%TEMP_EXTRACT%\dist" >nul
copy /Y "electron.js" "%TEMP_EXTRACT%\electron.js" >nul
xcopy /E /I /Y "electron" "%TEMP_EXTRACT%\electron" >nul

:: ASAR paketle
echo ▶ ASAR yeniden paketleniyor...
set "TEMP_ASAR=%TEMP%\app-%RANDOM%.asar"
call npx -y asar pack "%TEMP_EXTRACT%" "%TEMP_ASAR%"

:: Yeni ASAR'ı yerine koy
copy /Y "%TEMP_ASAR%" "%RESOURCES_DIR%\app.asar" >nul
del /F /Q "%TEMP_ASAR%" >nul 2>&1
rd /S /Q "%TEMP_EXTRACT%" >nul 2>&1

echo.
echo ================================================================
echo  🎉 TEBRIKLER! ANYTYPE BASARIYLA GUNCELLENDI!
echo ================================================================
echo.
set /p LAUNCH="Anytype simdi baslatilsin mi? (E/h): "
if /i not "%LAUNCH%"=="h" (
    start "" "%LOCALAPPDATA%\Programs\Anytype\Anytype.exe" 2>nul
    echo [✓] Anytype baslatildi.
)

:end
echo.
echo Cikmak icin bir tusa basin...
pause >nul
exit /b 0

:error
echo.
echo [HATA] Kurulum sirasinda bir hata olustu.
echo Cikmak icin bir tusa basin...
pause >nul
exit /b 1

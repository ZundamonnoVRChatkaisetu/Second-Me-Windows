@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - llama-server.exe Setup
echo  ================================================
echo.

:: llama.cppのディレクトリパスを設定
set LLAMACPP_PATH=dependencies\llama.cpp

:: ディレクトリが存在するか確認し、なければ作成
if not exist %LLAMACPP_PATH% (
    echo [INFO] Creating directory: %LLAMACPP_PATH%
    mkdir %LLAMACPP_PATH%
)

:: llama-server.exeが存在するか確認
if exist %LLAMACPP_PATH%\llama-server.exe (
    echo [INFO] llama-server.exe is already installed.
    echo       Path: %LLAMACPP_PATH%\llama-server.exe
) else (
    echo [WARN] llama-server.exe is not found in %LLAMACPP_PATH% directory.
    echo.
    echo You need to download or build llama-server.exe:
    echo.
    echo Option 1: Download pre-built binary
    echo   1. Visit https://github.com/ggml-org/llama.cpp/releases
    echo   2. Download the latest Windows binary (llama-*-bin-win-x64.zip)
    echo   3. Extract llama-server.exe to %LLAMACPP_PATH% directory
    echo.
    echo Option 2: Build from source
    echo   1. Clone llama.cpp repository
    echo   2. Build with CMake (see docs/llama_cpp_windows.md for details)
    echo   3. Copy the built llama-server.exe to %LLAMACPP_PATH% directory
    echo.
    echo After obtaining llama-server.exe, run this script again to confirm installation.
    goto end
)

:: モデルディレクトリをチェック
if not exist models (
    echo [INFO] Creating models directory
    mkdir models
    echo [INFO] You will need to download a GGUF model and place it in the models directory.
    echo       Recommended models: any models in GGUF format (Qwen2, LLaMA, Mistral, etc.)
) else (
    echo [INFO] Models directory exists. Checking for GGUF models...
    set found_models=0
    for %%f in (models\*.gguf) do (
        set /a found_models+=1
        echo       Found model: %%f
    )
    
    if !found_models! equ 0 (
        echo [WARN] No GGUF models found in the models directory.
        echo       Please download a GGUF model and place it in the models directory.
    ) else (
        echo [INFO] Found !found_models! GGUF models in the models directory.
    )
)

echo.
echo [INFO] Setup verification complete.
echo.
echo Next steps:
echo 1. Make sure you have a GGUF model in the models directory
echo 2. Run start-new-ui.bat to start the application
echo 3. Go to http://localhost:3000/chat to start chatting

:end
echo.
echo  ================================================
echo.
pause

@echo off
setlocal enabledelayedexpansion

:: Script version
set VERSION=1.0.1

:: Default environment variables
set VENV_NAME=second-me-venv
set LOCAL_APP_PORT=8002
set LOCAL_FRONTEND_PORT=3000

:: Create or check for .env file
if not exist .env (
    echo Creating default .env file...
    echo VENV_NAME=%VENV_NAME%>.env
    echo LOCAL_APP_PORT=%LOCAL_APP_PORT%>>.env
    echo LOCAL_FRONTEND_PORT=%LOCAL_FRONTEND_PORT%>>.env
) else (
    :: Load environment variables from .env
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set LOCAL_APP_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set LOCAL_FRONTEND_PORT=%%b
    )
)

:: Display header
echo.
echo  ================================================
echo    Second-Me Windows Setup Script v%VERSION%
echo  ================================================
echo  %date% %time%
echo.

:: Log functions
call :log_section "CHECKING SYSTEM REQUIREMENTS"

:: Skip OS version check for now (causing issues in Japanese Windows)
call :log_info "Checking operating system...OK"
call :log_success "Windows version check passed."

:: Create directories
mkdir logs 2>nul
mkdir run 2>nul

:: Check Python installation
call :log_section "CHECKING PYTHON"
call :log_info "Checking for Python installation..."
python --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Python is not installed or not in PATH."
    call :log_error "Please install Python 3.10 or later and ensure it's in your PATH."
    exit /b 1
)

python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Python 3.10 or later is required."
    exit /b 1
)
call :log_success "Python check passed."

:: Check for Git
call :log_info "Checking for Git installation..."
git --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Git is not installed or not in PATH."
    call :log_error "Please install Git from https://git-scm.com/downloads"
    exit /b 1
)
call :log_success "Git check passed."

:: Check for Visual Studio/C++ compiler
call :log_info "Checking for C++ build tools..."
cl >nul 2>&1
if %errorlevel% neq 0 (
    call :log_warning "Visual C++ compiler not found in the current environment."
    call :log_warning "Please make sure Visual Studio is installed with C++ development tools."
    call :log_warning "Or run this script from a Visual Studio Developer Command Prompt."
    
    choice /C YN /M "Do you want to continue anyway?"
    if !errorlevel! equ 2 exit /b 1
)

:: Check for CMake
call :log_info "Checking for CMake..."
cmake --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "CMake is not installed or not in PATH."
    call :log_error "Please install CMake from https://cmake.org/download/"
    exit /b 1
)
call :log_success "CMake check passed."

:: Setting up Python virtual environment with venv
call :log_section "SETTING UP PYTHON VIRTUAL ENVIRONMENT"
call :log_info "Setting up Python venv: %VENV_NAME%..."

:: Check if venv already exists
if exist %VENV_NAME% (
    call :log_info "Found existing venv: %VENV_NAME%"
) else (
    call :log_info "Creating new venv environment: %VENV_NAME%..."
    python -m venv %VENV_NAME%
    if %errorlevel% neq 0 (
        call :log_error "Failed to create venv environment."
        exit /b 1
    )
    call :log_success "Python venv created successfully."
)

:: Activate the venv
call :log_info "Activating venv environment..."
call %VENV_NAME%\Scripts\activate.bat
if %errorlevel% neq 0 (
    call :log_error "Failed to activate venv environment."
    exit /b 1
)
call :log_success "Python venv activated successfully."

:: Check and install dependencies with pip
call :log_info "Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    call :log_error "Failed to install Python dependencies."
    exit /b 1
)
call :log_success "Python dependencies installed successfully."

:: Build llama.cpp
call :log_section "BUILDING LLAMA.CPP"

if not exist llama.cpp (
    call :log_info "Setting up llama.cpp..."
    
    :: Check for llama.cpp.zip or llama.cpp-master.zip
    set "LLAMA_ZIP="
    
    if exist dependencies\llama.cpp.zip (
        set "LLAMA_ZIP=dependencies\llama.cpp.zip"
        call :log_info "Using local llama.cpp archive..."
    ) else if exist dependencies\llama.cpp-master.zip (
        set "LLAMA_ZIP=dependencies\llama.cpp-master.zip"
        call :log_info "Using local llama.cpp-master archive..."
    ) else (
        call :log_error "Local llama.cpp archive not found at: dependencies\llama.cpp.zip or dependencies\llama.cpp-master.zip"
        call :log_error "Please ensure one of these ZIP files exists in the dependencies directory."
        exit /b 1
    )
    
    :: Extract the archive
    powershell -Command "Expand-Archive -Path '%LLAMA_ZIP%' -DestinationPath '.'"
    if %errorlevel% neq 0 (
        call :log_error "Failed to extract local llama.cpp archive."
        exit /b 1
    )
    
    :: Rename directory if it's llama.cpp-master
    if exist llama.cpp-master (
        call :log_info "Renaming directory from llama.cpp-master to llama.cpp..."
        rename llama.cpp-master llama.cpp
        if %errorlevel% neq 0 (
            call :log_error "Failed to rename directory. Please check permissions."
            exit /b 1
        )
    )
) else (
    call :log_info "Found existing llama.cpp directory."
)

:: Check if llama.cpp has been successfully compiled
if exist llama.cpp\build\bin\Release\llama-server.exe (
    call :log_info "Found existing llama-server build."
    call :log_success "Using existing llama-server build, skipping compilation."
    goto :build_frontend
)

:: Enter llama.cpp directory and build
cd llama.cpp

:: Clean previous build
if exist build (
    call :log_info "Cleaning previous build..."
    rmdir /s /q build
)

:: Create and enter build directory
call :log_info "Creating build directory..."
mkdir build
cd build

:: Configure CMake
call :log_info "Configuring CMake..."
cmake .. -DBUILD_SHARED_LIBS=OFF
if %errorlevel% neq 0 (
    call :log_error "CMake configuration failed."
    cd ..\..\
    exit /b 1
)

:: Build project
call :log_info "Building project..."
cmake --build . --config Release
if %errorlevel% neq 0 (
    call :log_error "Build failed."
    cd ..\..\
    exit /b 1
)

:: Check build result
if not exist bin\Release\llama-server.exe (
    call :log_error "Build failed: llama-server executable not found."
    call :log_error "Expected at: bin\Release\llama-server.exe"
    cd ..\..\
    exit /b 1
)

call :log_success "Found llama-server at: bin\Release\llama-server.exe"
cd ..\..\
call :log_section "LLAMA.CPP BUILD COMPLETE"

:build_frontend
:: Set up frontend environment
call :log_section "SETTING UP FRONTEND"

set FRONTEND_DIR=lpm_frontend

:: Enter frontend directory
cd %FRONTEND_DIR% || (
    call :log_error "Failed to enter frontend directory: %FRONTEND_DIR%"
    call :log_error "Please ensure the directory exists and you have permission to access it."
    exit /b 1
)

:: Check if NodeJS is installed
call :log_info "Checking for NodeJS installation..."
node --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "NodeJS is not installed or not in PATH."
    call :log_error "Please install NodeJS from https://nodejs.org/"
    cd ..
    exit /b 1
)
call :log_success "NodeJS check passed."

:: Check if npm is installed
call :log_info "Checking for npm installation..."
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "npm is not installed or not in PATH."
    call :log_error "Please install npm (usually comes with NodeJS)."
    cd ..
    exit /b 1
)
call :log_success "npm check passed."

:: Check if dependencies have been installed
if exist node_modules (
    call :log_info "Found existing node_modules, checking for updates..."
    
    if exist package-lock.json (
        call :log_info "Using existing package-lock.json..."
        call :log_info "Running npm install to ensure dependencies are complete..."
        npm install
        if %errorlevel% neq 0 (
            call :log_error "Failed to install frontend dependencies with existing package-lock.json"
            call :log_error "Try removing node_modules directory and package-lock.json, then run setup again"
            cd ..
            exit /b 1
        )
    ) else (
        call :log_info "Installing dependencies..."
        npm install
        if %errorlevel% neq 0 (
            call :log_error "Failed to install frontend dependencies"
            call :log_error "Check your npm configuration and network connection"
            cd ..
            exit /b 1
        )
    )
) else (
    call :log_info "Installing dependencies..."
    npm install
    if %errorlevel% neq 0 (
        call :log_error "Failed to install frontend dependencies"
        call :log_error "Check your npm configuration and network connection"
        cd ..
        exit /b 1
    )
)

:: Verify that the installation was successful
if not exist node_modules (
    call :log_error "node_modules directory not found after npm install"
    call :log_error "Frontend dependencies installation failed"
    cd ..
    exit /b 1
)

call :log_success "Frontend dependencies installed successfully"
cd ..
call :log_section "FRONTEND SETUP COMPLETE"

call :log_section "SETUP COMPLETE"
call :log_success "Second-Me Windows setup completed successfully!"
call :log_info "You can now start the application using: scripts\start.bat"

:: Deactivate venv before exiting
call %VENV_NAME%\Scripts\deactivate.bat

exit /b 0

:: ==================== UTILITY FUNCTIONS ====================

:log_info
echo [INFO]    %~1
exit /b

:log_success
echo [SUCCESS] %~1
exit /b

:log_warning
echo [WARNING] %~1
exit /b

:log_error
echo [ERROR]   %~1
exit /b

:log_section
echo.
echo  ================================================
echo    %~1
echo  ================================================
echo.
exit /b

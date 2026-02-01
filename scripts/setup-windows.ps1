# ====================================
# InspireWallet Gateway - Windows Setup
# ====================================
# Supports: Windows 10 (20H2+), Windows 11
# Requirements: PowerShell 5.1+, Administrator rights
#
# Usage (PowerShell as Admin):
#   Set-ExecutionPolicy Bypass -Scope Process
#   .\setup-windows.ps1

#Requires -Version 5.1
#Requires -RunAsAdministrator

param(
    [switch]$SkipDocker,
    [switch]$SkipNode,
    [switch]$Quiet
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors and formatting
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "  $Message" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }

# Check if command exists
function Test-Command {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Windows version
function Test-WindowsVersion {
    $osVersion = [System.Environment]::OSVersion.Version
    $build = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion").CurrentBuildNumber
    
    if ($osVersion.Major -lt 10 -or ($osVersion.Major -eq 10 -and [int]$build -lt 19041)) {
        Write-Error "Windows 10 version 2004 (Build 19041) or higher is required."
        Write-Error "Current build: $build"
        exit 1
    }
    
    return $build
}

# Install Chocolatey
function Install-Chocolatey {
    Write-Header "Installing Chocolatey Package Manager"
    
    if (Test-Command "choco") {
        Write-Info "Chocolatey is already installed: $(choco --version)"
        choco upgrade chocolatey -y --no-progress | Out-Null
        return
    }
    
    Write-Info "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Success "Chocolatey installed successfully"
}

# Install Docker Desktop
function Install-Docker {
    Write-Header "Installing Docker Desktop"
    
    if (Test-Command "docker") {
        Write-Info "Docker is already installed: $(docker --version)"
        
        # Check if Docker is running
        try {
            docker info 2>&1 | Out-Null
            Write-Info "Docker is running"
        }
        catch {
            Write-Warning "Docker is installed but not running."
            Write-Info "Starting Docker Desktop..."
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            
            Write-Info "Waiting for Docker to start (this may take a minute)..."
            $maxAttempts = 30
            $attempt = 0
            while ($attempt -lt $maxAttempts) {
                Start-Sleep -Seconds 2
                try {
                    docker info 2>&1 | Out-Null
                    break
                }
                catch {
                    $attempt++
                }
            }
            
            if ($attempt -ge $maxAttempts) {
                Write-Error "Docker failed to start. Please start Docker Desktop manually."
                exit 1
            }
            Write-Success "Docker is now running"
        }
        return
    }
    
    # Check for WSL2
    Write-Info "Checking WSL2 status..."
    $wslOutput = wsl --status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Installing WSL2..."
        wsl --install --no-distribution
        Write-Warning "WSL2 has been installed. A restart may be required."
    }
    
    Write-Info "Installing Docker Desktop via Chocolatey..."
    choco install docker-desktop -y --no-progress
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Warning "Docker Desktop has been installed. Please:"
    Write-Warning "  1. Restart your computer if prompted"
    Write-Warning "  2. Open Docker Desktop and complete the setup wizard"
    Write-Warning "  3. Re-run this script after Docker is running"
    
    Write-Success "Docker Desktop installed"
}

# Install Node.js
function Install-Node {
    Write-Header "Installing Node.js and pnpm"
    
    if (Test-Command "node") {
        $currentVersion = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
        if ([int]$currentVersion -ge 22) {
            Write-Info "Node.js is already installed: $(node --version)"
        }
        else {
            Write-Info "Upgrading Node.js to v22..."
            choco upgrade nodejs-lts -y --no-progress
        }
    }
    else {
        Write-Info "Installing Node.js v22..."
        choco install nodejs-lts -y --no-progress
    }
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Install pnpm
    Write-Info "Installing pnpm..."
    npm install -g pnpm
    
    Write-Success "Node.js $(node --version) and pnpm $(pnpm --version) installed"
}

# Install development tools
function Install-DevTools {
    Write-Header "Installing Development Tools"
    
    $tools = @("git", "curl", "wget", "jq")
    
    foreach ($tool in $tools) {
        if (-not (Test-Command $tool)) {
            Write-Info "Installing $tool..."
            choco install $tool -y --no-progress
        }
        else {
            Write-Info "$tool is already installed"
        }
    }
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Success "Development tools installed"
}

# Setup project
function Setup-Project {
    Write-Header "Setting Up Project"
    
    # Check if we're in the project directory
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Please run this script from the project root."
        exit 1
    }
    
    # Copy example env file if .env doesn't exist
    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env from .env.example"
    }
    
    # Install project dependencies
    Write-Info "Installing project dependencies..."
    pnpm install
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    pnpm prisma generate
    
    Write-Success "Project setup complete"
}

# Start Docker services
function Start-Services {
    Write-Header "Starting Docker Services"
    
    # Ensure Docker is running
    try {
        docker info 2>&1 | Out-Null
    }
    catch {
        Write-Warning "Docker is not running. Please start Docker Desktop and re-run this script."
        exit 1
    }
    
    docker compose up -d
    
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 15
    
    # Run database migrations
    Write-Info "Running database migrations..."
    pnpm prisma db push
    
    Write-Success "All services started successfully"
}

# Print final instructions
function Show-FinalInstructions {
    Write-Header "Setup Complete! 🚀"
    
    Write-Host "Your InspireWallet Gateway development environment is ready!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Available Services:" -ForegroundColor Cyan
    Write-Host "  • Application:      http://localhost:3000" -ForegroundColor White
    Write-Host "  • PostgreSQL:       localhost:5432" -ForegroundColor White
    Write-Host "  • Redis:            localhost:6379" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Development Tools (optional, run with --profile tools):" -ForegroundColor Cyan
    Write-Host "  • pgAdmin:          http://localhost:8082" -ForegroundColor White
    Write-Host "  • Redis Commander:  http://localhost:8081" -ForegroundColor White
    Write-Host "  • Prisma Studio:    http://localhost:5555" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  docker compose up -d                    # Start services" -ForegroundColor Yellow
    Write-Host "  docker compose down                     # Stop services" -ForegroundColor Yellow
    Write-Host "  docker compose logs -f app              # View app logs" -ForegroundColor Yellow
    Write-Host "  docker compose --profile tools up -d    # Start with dev tools" -ForegroundColor Yellow
    Write-Host "  pnpm start:dev                          # Start app locally" -ForegroundColor Yellow
    Write-Host "  pnpm prisma studio                      # Open Prisma Studio" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
function Main {
    Write-Header "InspireWallet Gateway - Windows Setup"
    
    # Check Windows version
    Write-Info "Checking Windows version..."
    $build = Test-WindowsVersion
    Write-Success "Windows Build: $build"
    
    # Install components
    Install-Chocolatey
    
    if (-not $SkipDocker) {
        Install-Docker
    }
    
    if (-not $SkipNode) {
        Install-Node
    }
    
    Install-DevTools
    Setup-Project
    Start-Services
    Show-FinalInstructions
}

# Run main function
Main

#!/bin/bash

# ====================================
# InspireWallet Gateway - macOS Setup
# ====================================
# Supports: macOS 11+ (Big Sur and later)
# Architecture: Intel (x64) and Apple Silicon (arm64)
#
# Usage: chmod +x setup-macos.sh && ./setup-macos.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored messages
print_header() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect CPU architecture
detect_arch() {
    local arch=$(uname -m)
    if [ "$arch" = "arm64" ]; then
        echo "Apple Silicon (arm64)"
        HOMEBREW_PREFIX="/opt/homebrew"
    else
        echo "Intel (x86_64)"
        HOMEBREW_PREFIX="/usr/local"
    fi
}

# Install Homebrew
install_homebrew() {
    print_header "Installing Homebrew"
    
    if command_exists brew; then
        print_info "Homebrew is already installed: $(brew --version | head -n 1)"
        brew update
        return
    fi
    
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to path for Apple Silicon
    if [ "$(uname -m)" = "arm64" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    print_success "Homebrew installed successfully"
}

# Install Docker Desktop
install_docker() {
    print_header "Installing Docker Desktop"
    
    if command_exists docker; then
        print_info "Docker is already installed: $(docker --version)"
        
        # Check if Docker is running
        if ! docker info >/dev/null 2>&1; then
            print_warning "Docker is installed but not running. Please start Docker Desktop."
            open -a Docker
            print_info "Waiting for Docker to start (this may take a minute)..."
            
            # Wait for Docker to be ready
            local max_attempts=30
            local attempt=0
            while ! docker info >/dev/null 2>&1; do
                attempt=$((attempt + 1))
                if [ $attempt -ge $max_attempts ]; then
                    print_error "Docker failed to start. Please start Docker Desktop manually."
                    exit 1
                fi
                sleep 2
            done
            print_success "Docker is now running"
        fi
        return
    fi
    
    print_info "Installing Docker Desktop via Homebrew..."
    brew install --cask docker
    
    print_info "Opening Docker Desktop..."
    open -a Docker
    
    print_warning "Please complete the Docker Desktop setup wizard."
    print_info "Waiting for Docker to start (this may take a minute)..."
    
    # Wait for Docker to be ready
    local max_attempts=60
    local attempt=0
    while ! docker info >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            print_error "Docker failed to start. Please start Docker Desktop manually and re-run this script."
            exit 1
        fi
        sleep 2
    done
    
    print_success "Docker Desktop installed and running"
}

# Install Node.js using nvm
install_node() {
    print_header "Installing Node.js and pnpm"
    
    # Install nvm if not present
    if ! command_exists nvm && [ ! -d "$HOME/.nvm" ]; then
        print_info "Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install Node.js 22
    if command_exists node; then
        local current_version=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$current_version" -ge 22 ]; then
            print_info "Node.js is already installed: $(node --version)"
        else
            print_info "Upgrading Node.js to v22..."
            nvm install 22
            nvm use 22
            nvm alias default 22
        fi
    else
        print_info "Installing Node.js v22..."
        nvm install 22
        nvm use 22
        nvm alias default 22
    fi
    
    # Install pnpm
    print_info "Installing/updating pnpm..."
    if command_exists corepack; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        npm install -g pnpm
    fi
    
    print_success "Node.js $(node --version) and pnpm $(pnpm --version) installed"
}

# Install additional tools
install_tools() {
    print_header "Installing Development Tools"
    
    local tools=("git" "curl" "wget" "jq")
    
    for tool in "${tools[@]}"; do
        if ! command_exists $tool; then
            print_info "Installing $tool..."
            brew install $tool
        else
            print_info "$tool is already installed"
        fi
    done
    
    print_success "Development tools installed"
}

# Setup project
setup_project() {
    print_header "Setting Up Project"
    
    # Check if we're in the project directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Copy example env file if .env doesn't exist
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    fi
    
    # Install project dependencies
    print_info "Installing project dependencies..."
    pnpm install
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    pnpm prisma generate
    
    print_success "Project setup complete"
}

# Start Docker services
start_services() {
    print_header "Starting Docker Services"
    
    # Ensure Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker is not running. Starting Docker Desktop..."
        open -a Docker
        sleep 10
        
        local max_attempts=30
        local attempt=0
        while ! docker info >/dev/null 2>&1; do
            attempt=$((attempt + 1))
            if [ $attempt -ge $max_attempts ]; then
                print_error "Docker failed to start. Please start Docker Desktop manually."
                exit 1
            fi
            sleep 2
        done
    fi
    
    docker compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 15
    
    # Run database migrations
    print_info "Running database migrations..."
    pnpm prisma db push
    
    print_success "All services started successfully"
}

# Print final instructions
print_final_instructions() {
    print_header "Setup Complete! 🚀"
    
    echo -e "${GREEN}Your InspireWallet Gateway development environment is ready!${NC}\n"
    
    echo -e "${CYAN}Available Services:${NC}"
    echo -e "  • ${BLUE}Application:${NC}      http://localhost:3000"
    echo -e "  • ${BLUE}PostgreSQL:${NC}       localhost:5432"
    echo -e "  • ${BLUE}Redis:${NC}            localhost:6379"
    echo ""
    echo -e "${CYAN}Development Tools (optional, run with --profile tools):${NC}"
    echo -e "  • ${BLUE}pgAdmin:${NC}          http://localhost:8082"
    echo -e "  • ${BLUE}Redis Commander:${NC}  http://localhost:8081"
    echo -e "  • ${BLUE}Prisma Studio:${NC}    http://localhost:5555"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  ${YELLOW}docker compose up -d${NC}                    # Start services"
    echo -e "  ${YELLOW}docker compose down${NC}                     # Stop services"
    echo -e "  ${YELLOW}docker compose logs -f app${NC}              # View app logs"
    echo -e "  ${YELLOW}docker compose --profile tools up -d${NC}    # Start with dev tools"
    echo -e "  ${YELLOW}pnpm start:dev${NC}                          # Start app locally"
    echo -e "  ${YELLOW}pnpm prisma studio${NC}                      # Open Prisma Studio"
    echo ""
    
    print_info "Add this to your shell profile for nvm:"
    echo -e '  export NVM_DIR="$HOME/.nvm"'
    echo -e '  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
}

# Main execution
main() {
    print_header "InspireWallet Gateway - macOS Setup"
    
    # Detect architecture
    print_info "Detecting system architecture..."
    ARCH=$(detect_arch)
    print_success "Architecture: $ARCH"
    
    # Check macOS version
    macos_version=$(sw_vers -productVersion)
    print_info "macOS Version: $macos_version"
    
    # Install components
    install_homebrew
    install_docker
    install_node
    install_tools
    setup_project
    start_services
    print_final_instructions
}

# Run main function
main "$@"

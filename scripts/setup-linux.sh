#!/bin/bash

# ====================================
# InspireWallet Gateway - Linux Setup
# ====================================
# Supports: Ubuntu, Debian, Fedora, CentOS, RHEL, Arch Linux, Manjaro
#
# Usage: chmod +x setup-linux.sh && ./setup-linux.sh

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

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        DISTRO_LIKE=$ID_LIKE
        VERSION=$VERSION_ID
    elif [ -f /etc/arch-release ]; then
        DISTRO="arch"
    elif [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/fedora-release ]; then
        DISTRO="fedora"
    elif [ -f /etc/centos-release ]; then
        DISTRO="centos"
    else
        DISTRO="unknown"
    fi
    
    echo "$DISTRO"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Docker based on distribution
install_docker() {
    local distro=$1
    
    print_header "Installing Docker"
    
    case $distro in
        ubuntu|debian|linuxmint|pop)
            print_info "Installing Docker using apt (Debian/Ubuntu)..."
            sudo apt-get update
            sudo apt-get install -y \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$distro/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$distro \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
            ;;
            
        fedora)
            print_info "Installing Docker using dnf (Fedora)..."
            sudo dnf -y install dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
            ;;
            
        centos|rhel|rocky|almalinux)
            print_info "Installing Docker using yum (CentOS/RHEL)..."
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
            ;;
            
        arch|manjaro|endeavouros|garuda)
            print_info "Installing Docker using pacman (Arch Linux)..."
            sudo pacman -Sy --needed --noconfirm docker docker-compose docker-buildx
            ;;
            
        opensuse*|suse)
            print_info "Installing Docker using zypper (openSUSE)..."
            sudo zypper install -y docker docker-compose docker-buildx
            ;;
            
        *)
            print_warning "Unknown distribution. Attempting generic installation..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            rm get-docker.sh
            ;;
    esac
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add user to docker group
    if ! groups $USER | grep -q docker; then
        sudo usermod -aG docker $USER
        print_warning "You've been added to the docker group. Please log out and back in for changes to take effect."
    fi
    
    print_success "Docker installed successfully"
}

# Install Node.js and pnpm
install_node() {
    local distro=$1
    
    print_header "Installing Node.js and pnpm"
    
    case $distro in
        arch|manjaro|endeavouros|garuda)
            print_info "Installing Node.js using pacman (Arch Linux)..."
            sudo pacman -Sy --needed --noconfirm nodejs npm
            ;;
            
        *)
            print_info "Installing Node.js using nvm..."
            if ! command_exists nvm; then
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            fi
            nvm install 22
            nvm use 22
            nvm alias default 22
            ;;
    esac
    
    # Install pnpm
    print_info "Installing pnpm..."
    if command_exists corepack; then
        corepack enable
        corepack prepare pnpm@latest --activate
    else
        npm install -g pnpm
    fi
    
    print_success "Node.js and pnpm installed successfully"
}

# Install additional dependencies
install_dependencies() {
    local distro=$1
    
    print_header "Installing Additional Dependencies"
    
    case $distro in
        ubuntu|debian|linuxmint|pop)
            sudo apt-get install -y git curl wget make gcc g++ python3
            ;;
            
        fedora)
            sudo dnf install -y git curl wget make gcc gcc-c++ python3
            ;;
            
        centos|rhel|rocky|almalinux)
            sudo yum install -y git curl wget make gcc gcc-c++ python3
            ;;
            
        arch|manjaro|endeavouros|garuda)
            sudo pacman -Sy --needed --noconfirm git curl wget make gcc python
            ;;
            
        opensuse*|suse)
            sudo zypper install -y git curl wget make gcc gcc-c++ python3
            ;;
    esac
    
    print_success "Additional dependencies installed"
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
    
    docker compose up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
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
    
    if ! groups $USER | grep -q docker; then
        print_warning "Remember to log out and back in for Docker group changes to take effect!"
    fi
}

# Main execution
main() {
    print_header "InspireWallet Gateway - Linux Setup"
    print_info "Detecting Linux distribution..."
    
    DISTRO=$(detect_distro)
    print_success "Detected distribution: $DISTRO"
    
    # Check for existing installations
    if ! command_exists docker; then
        install_docker $DISTRO
    else
        print_info "Docker is already installed: $(docker --version)"
    fi
    
    if ! command_exists node; then
        install_node $DISTRO
    else
        print_info "Node.js is already installed: $(node --version)"
    fi
    
    if ! command_exists pnpm; then
        print_info "Installing pnpm..."
        npm install -g pnpm
    else
        print_info "pnpm is already installed: $(pnpm --version)"
    fi
    
    install_dependencies $DISTRO
    setup_project
    start_services
    print_final_instructions
}

# Run main function
main "$@"

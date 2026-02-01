#!/bin/bash

# ====================================
# InspireWallet Gateway - Arch Linux Setup
# ====================================
# Optimized for: Arch Linux, Manjaro, EndeavourOS, Garuda Linux
#
# This script uses Arch-specific tools and AUR helpers
#
# Usage: chmod +x setup-arch.sh && ./setup-arch.sh

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

# Detect Arch-based distribution
detect_arch_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    else
        echo "unknown"
    fi
}

# Install paru (AUR helper) if not present
install_aur_helper() {
    print_header "Setting Up AUR Helper"
    
    if command_exists paru; then
        print_info "paru is already installed"
        return
    elif command_exists yay; then
        print_info "yay is already installed (will use as AUR helper)"
        alias paru="yay"
        return
    fi
    
    print_info "Installing paru (AUR helper)..."
    
    # Install base-devel if not present
    sudo pacman -S --needed --noconfirm base-devel git
    
    # Clone and build paru
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    git clone https://aur.archlinux.org/paru.git
    cd paru
    makepkg -si --noconfirm
    cd ~
    rm -rf "$temp_dir"
    
    print_success "paru installed successfully"
}

# Update system
update_system() {
    print_header "Updating System"
    
    print_info "Synchronizing package databases..."
    sudo pacman -Sy
    
    print_info "Upgrading installed packages..."
    sudo pacman -Syu --noconfirm
    
    print_success "System updated"
}

# Install Docker
install_docker() {
    print_header "Installing Docker"
    
    if command_exists docker; then
        print_info "Docker is already installed: $(docker --version)"
    else
        print_info "Installing Docker and related packages..."
        sudo pacman -S --needed --noconfirm docker docker-compose docker-buildx
    fi
    
    # Enable and start Docker service
    print_info "Enabling Docker service..."
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add user to docker group
    if ! groups $USER | grep -q docker; then
        sudo usermod -aG docker $USER
        print_warning "You've been added to the docker group."
        print_warning "Please log out and back in, or run: newgrp docker"
    fi
    
    print_success "Docker installed and configured"
}

# Install Node.js
install_node() {
    print_header "Installing Node.js and pnpm"
    
    # Install Node.js from official repos
    if command_exists node; then
        local current_version=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$current_version" -ge 22 ]; then
            print_info "Node.js is already installed: $(node --version)"
        else
            print_info "Installing newer Node.js version..."
            sudo pacman -S --needed --noconfirm nodejs npm
        fi
    else
        print_info "Installing Node.js..."
        sudo pacman -S --needed --noconfirm nodejs npm
    fi
    
    # Install pnpm
    print_info "Installing pnpm..."
    if command_exists corepack; then
        sudo corepack enable
        corepack prepare pnpm@latest --activate
    else
        sudo npm install -g pnpm
    fi
    
    print_success "Node.js $(node --version) and pnpm installed"
}

# Install development dependencies
install_dependencies() {
    print_header "Installing Development Dependencies"
    
    local packages=(
        "git"
        "curl"
        "wget"
        "make"
        "gcc"
        "python"
        "jq"
        "openssl"
        "libffi"
    )
    
    print_info "Installing required packages..."
    sudo pacman -S --needed --noconfirm "${packages[@]}"
    
    print_success "Development dependencies installed"
}

# Install optional GUI tools
install_gui_tools() {
    print_header "Installing Optional GUI Tools"
    
    read -p "Would you like to install optional GUI tools (DBeaver, Insomnia)? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists paru; then
            print_info "Installing DBeaver (database tool)..."
            paru -S --needed --noconfirm dbeaver
            
            print_info "Installing Insomnia (API client)..."
            paru -S --needed --noconfirm insomnia-bin
        else
            print_warning "AUR helper not available. Skipping GUI tools."
        fi
    else
        print_info "Skipping GUI tools installation"
    fi
}

# Setup project
setup_project() {
    print_header "Setting Up Project"
    
    # Navigate to script directory's parent (project root)
    cd "$(dirname "$0")/.." || {
        print_error "Cannot navigate to project root"
        exit 1
    }
    
    # Check if we're in the project directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    print_info "Project root: $(pwd)"
    
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
    
    # Check if user can run docker without sudo
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker may not be accessible. Trying with newgrp..."
        sg docker -c "docker compose up -d"
    else
        docker compose up -d
    fi
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Run database migrations
    print_info "Running database migrations..."
    pnpm prisma db push
    
    print_success "All services started successfully"
}

# Configure systemd for podman/docker
configure_rootless() {
    print_header "Configuring Rootless Container Support"
    
    read -p "Would you like to configure rootless Docker/Podman? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing and configuring rootless support..."
        
        # Enable lingering for user
        sudo loginctl enable-linger $USER
        
        # Create systemd user directory
        mkdir -p ~/.config/systemd/user
        
        # Install podman as alternative
        sudo pacman -S --needed --noconfirm podman podman-compose podman-docker
        
        print_success "Rootless container support configured"
        print_info "You can now use 'podman' as a drop-in replacement for 'docker'"
    fi
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
    echo -e "${CYAN}Arch Linux Specific:${NC}"
    echo -e "  • ${BLUE}AUR Helper:${NC}       paru (or yay)"
    echo -e "  • ${BLUE}Service Manager:${NC}  systemctl"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  ${YELLOW}docker compose up -d${NC}                    # Start services"
    echo -e "  ${YELLOW}docker compose down${NC}                     # Stop services"
    echo -e "  ${YELLOW}docker compose logs -f app${NC}              # View app logs"
    echo -e "  ${YELLOW}docker compose --profile tools up -d${NC}    # Start with dev tools"
    echo -e "  ${YELLOW}pnpm start:dev${NC}                          # Start app locally"
    echo -e "  ${YELLOW}pnpm prisma studio${NC}                      # Open Prisma Studio"
    echo ""
    echo -e "  ${YELLOW}sudo systemctl status docker${NC}            # Check Docker status"
    echo -e "  ${YELLOW}journalctl -u docker -f${NC}                 # View Docker logs"
    echo ""
    
    if ! groups $USER | grep -q docker; then
        print_warning "Remember to log out and back in for Docker group changes!"
        print_warning "Or run: newgrp docker"
    fi
}

# Main execution
main() {
    print_header "InspireWallet Gateway - Arch Linux Setup"
    
    # Detect distribution
    DISTRO=$(detect_arch_distro)
    print_info "Detected distribution: $DISTRO"
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root."
        print_error "The script will use sudo when needed."
        exit 1
    fi
    
    # Main installation flow
    update_system
    install_aur_helper
    install_docker
    install_node
    install_dependencies
    install_gui_tools
    configure_rootless
    setup_project
    start_services
    print_final_instructions
}

# Run main function
main "$@"

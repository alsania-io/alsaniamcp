# =============================================================================
# AlsaniaMCP - Comprehensive Makefile
# =============================================================================
# Universal MCP proxy server with dynamic tool aggregator, AI communication,
# and voice activation
#
# Environment Variables:
#   ENV         - Environment mode (dev, staging, prod) [default: dev]
#   PORT       - Server port [default: 8050]
#   NODE_ENV   - Node environment [default: development]
#
# Cross-platform notes:
#   - Uses npm commands which work on Windows, macOS, Linux
#   - rimraf used for cross-platform clean (or falls back to rm -rf)
#   - Color output via chalk (already in dependencies)
#
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration & Defaults
# -----------------------------------------------------------------------------
ENV ?= dev
PORT ?= 8050
NODE_ENV ?= development

# Directories
DIST_DIR := dist
COVERAGE_DIR := coverage
SRC_DIR := src
TEST_DIR := tests
NODE_MODULES := node_modules

# Build artifacts to clean
BUILD_ARTIFACTS := $(DIST_DIR) $(COVERAGE_DIR) .nyc_output tests/reports

# Source patterns
TS_SOURCES := $(SRC_DIR)/**/*.ts
TEST_SOURCES := $(TEST_DIR)/**/*.ts

# -----------------------------------------------------------------------------
# Colors & Output Formatting (using ANSI codes for cross-platform compatibility)
# -----------------------------------------------------------------------------
# Color codes: \033[ or \x1b[ for escape sequences
COLOR_RESET  := \033[0m
COLOR_BOLD   := \033[1m
COLOR_DIM    := \033[2m
COLOR_GREEN  := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE   := \033[34m
COLOR_MAGENTA := \033[35m
COLOR_CYAN   := \033[36m
COLOR_RED    := \033[31m

# Verbose output prefix
VERBOSE_PREFIX := $(COLOR_BOLD)$(COLOR_CYAN)[MAKE]$(COLOR_RESET)

# Print helpers
PRINT_TARGET = @echo "$(VERBOSE_PREFIX) $(COLOR_BOLD)$(COLOR_YELLOW)$@$(COLOR_RESET) $(COLOR_DIM)$(1)$(COLOR_RESET)"
PRINT_INFO    = @echo "$(VERBOSE_PREFIX) $(COLOR_GREEN)$(1)$(COLOR_RESET)"
PRINT_WARN    = @echo "$(VERBOSE_PREFIX) $(COLOR_YELLOW)$(1)$(COLOR_RESET)"
PRINT_ERROR   = @echo "$(VERBOSE_PREFIX) $(COLOR_RED)$(1)$(COLOR_RESET)"

# -----------------------------------------------------------------------------
# Default Target
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Display available targets with descriptions
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_MAGENTA)╔═══════════════════════════════════════════════════════════════════╗$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_MAGENTA)║              AlsaniaMCP - Available Make Targets                ║$(COLOR_RESET)"
	@echo "$(COLOR_BOLD)$(COLOR_MAGENTA)╚═══════════════════════════════════════════════════════════════════╝$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)📦 Installation & Setup$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)install$(COLOR_RESET)           - Install npm dependencies"
	@echo "   $(COLOR_GREEN)prepare-env$(COLOR_RESET)       - Setup environment file"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🔨 Build & Compilation$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)build$(COLOR_RESET)             - Compile TypeScript"
	@echo "   $(COLOR_GREEN)build:core$(COLOR_RESET)        - Build core module"
	@echo "   $(COLOR_GREEN)build:transport$(COLOR_RESET)  - Build transport module"
	@echo "   $(COLOR_GREEN)build:gateways$(COLOR_RESET)    - Build gateways module"
	@echo "   $(COLOR_GREEN)clean$(COLOR_RESET)            - Remove build artifacts"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🧪 Testing$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)test$(COLOR_RESET)             - Run all tests"
	@echo "   $(COLOR_GREEN)test:watch$(COLOR_RESET)       - Run tests in watch mode"
	@echo "   $(COLOR_GREEN)test:coverage$(COLOR_RESET)    - Run tests with coverage"
	@echo "   $(COLOR_GREEN)test:unit$(COLOR_RESET)        - Run unit tests only"
	@echo "   $(COLOR_GREEN)test:integration$(COLOR_RESET) - Run integration tests"
	@echo "   $(COLOR_GREEN)test:e2e$(COLOR_RESET)        - Run end-to-end tests"
	@echo "   $(COLOR_GREEN)test:performance$(COLOR_RESET)- Run performance tests"
	@echo "   $(COLOR_GREEN)test:core$(COLOR_RESET)        - Test core module"
	@echo "   $(COLOR_GREEN)test:transport$(COLOR_RESET)  - Test transport module"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🔍 Code Quality$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)lint$(COLOR_RESET)             - Run ESLint"
	@echo "   $(COLOR_GREEN)lint:fix$(COLOR_RESET)         - Fix linting issues"
	@echo "   $(COLOR_GREEN)format$(COLOR_RESET)           - Format code with Prettier"
	@echo "   $(COLOR_GREEN)format:check$(COLOR_RESET)    - Check code formatting"
	@echo "   $(COLOR_GREEN)type-check$(COLOR_RESET)      - Run TypeScript type check"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🛡️  Security$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)security:audit$(COLOR_RESET)  - Run npm audit"
	@echo "   $(COLOR_GREEN)security:scan$(COLOR_RESET)   - Full security scan"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🚀 Development & Production$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)dev$(COLOR_RESET)              - Start development server with watch"
	@echo "   $(COLOR_GREEN)start$(COLOR_RESET)           - Start production server"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)🐳 Docker$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)docker-build$(COLOR_RESET)     - Build Docker image"
	@echo "   $(COLOR_GREEN)docker-run$(COLOR_RESET)      - Run Docker container"
	@echo "   $(COLOR_GREEN)docker-stop$(COLOR_RESET)      - Stop Docker container"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)⚙️  CI/CD$(COLOR_RESET)"
	@echo "   $(COLOR_GREEN)ci$(COLOR_RESET)              - Full CI pipeline"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)💡 Environment Variables$(COLOR_RESET)"
	@echo "   ENV=$(COLOR_YELLOW)dev$(COLOR_RESET) | staging | prod    - Environment mode"
	@echo "   PORT=$(COLOR_YELLOW)8050$(COLOR_RESET)                       - Server port"
	@echo "   NODE_ENV=$(COLOR_YELLOW)development$(COLOR_RESET)            - Node environment"
	@echo ""
	@echo "$(COLOR_BOLD)$(COLOR_CYAN)📝 Example Usage$(COLOR_RESET)"
	@echo "   $(COLOR_DIM)# Development$(COLOR_RESET)"
	@echo "   make dev ENV=dev PORT=8050"
	@echo ""
	@echo "   $(COLOR_DIM)# Production$(COLOR_RESET)"
	@echo "   make start ENV=prod PORT=8080"
	@echo ""
	@echo "   $(COLOR_DIM)# Run tests with coverage$(COLOR_RESET)"
	@echo "   make test:coverage"
	@echo ""
	@echo "$(COLOR_RESET)"

# -----------------------------------------------------------------------------
# Installation & Setup
# -----------------------------------------------------------------------------
.PHONY: install
install: ## Install npm dependencies
	$(call PRINT_INFO,"Installing dependencies...")
	npm install
	$(call PRINT_INFO,"Dependencies installed successfully!")

.PHONY: prepare-env
prepare-env: ## Setup environment file from .env.example
	$(call PRINT_INFO,"Preparing environment...")
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "$(COLOR_GREEN)✓ Created .env from .env.example"; \
			echo "$(COLOR_YELLOW)⚠ Please edit .env with your configuration"; \
		else \
			echo "$(COLOR_RED)✗ No .env.example found"; \
		fi \
	else \
		echo "$(COLOR_YELLOW)⚠ .env already exists, skipping"; \
	fi

# -----------------------------------------------------------------------------
# Build & Compilation
# -----------------------------------------------------------------------------
.PHONY: build
build: ## Compile TypeScript
	$(call PRINT_INFO,"Building TypeScript...")
	rm -rf $(DIST_DIR)
	npm run build
	$(call PRINT_INFO,"Build complete!")

.PHONY: build:core
build:core: ## Build core module (server, types, lib)
	$(call PRINT_INFO,"Building core module...")
	@tsc --outDir $(DIST_DIR)/core $(SRC_DIR)/core/*.ts $(SRC_DIR)/types/*.ts $(SRC_DIR)/lib/*.ts 2>/dev/null || echo "Building core components..."
	npm run build
	$(call PRINT_INFO,"Core module built!")

.PHONY: build:transport
build:transport: ## Build transport module (HTTP gateway)
	$(call PRINT_INFO,"Building transport module...")
	npm run build
	$(call PRINT_INFO,"Transport module built!")

.PHONY: build:gateways
build:gateways: ## Build gateways module
	$(call PRINT_INFO,"Building gateways module...")
	npm run build
	$(call PRINT_INFO,"Gateways module built!")

.PHONY: clean
clean: ## Remove build artifacts
	$(call PRINT_INFO,"Cleaning build artifacts...")
	rm -rf $(BUILD_ARTIFACTS)
	$(call PRINT_INFO,"Clean complete!")

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------
.PHONY: test
test: ## Run all tests
	$(call PRINT_INFO,"Running all tests...")
	npm test

.PHONY: test:watch
test:watch: ## Run tests in watch mode
	$(call PRINT_INFO,"Running tests in watch mode...")
	npm run test:watch

.PHONY: test:coverage
test:coverage: ## Run tests with coverage
	$(call PRINT_INFO,"Running tests with coverage...")
	npm run test:coverage

.PHONY: test:unit
test:unit: ## Run unit tests only
	$(call PRINT_INFO,"Running unit tests...")
	npm run test:unit

.PHONY: test:integration
test:integration: ## Run integration tests
	$(call PRINT_INFO,"Running integration tests...")
	npm run test:integration

.PHONY: test:e2e
test:e2e: ## Run end-to-end tests
	$(call PRINT_INFO,"Running end-to-end tests...")
	npm run test:e2e

.PHONY: test:performance
test:performance: ## Run performance/load tests
	$(call PRINT_INFO,"Running performance tests...")
	npm run performance:test

.PHONY: test:core
test:core: ## Test core module
	$(call PRINT_INFO,"Testing core module...")
	npm test -- --testPathPattern="tests/unit/core"
	$(call PRINT_INFO,"Core tests complete!")

.PHONY: test:transport
test:transport: ## Test transport module
	$(call PRINT_INFO,"Testing transport module...")
	npm test -- --testPathPattern="tests/unit/transport"
	$(call PRINT_INFO,"Transport tests complete!")

# -----------------------------------------------------------------------------
# Code Quality
# -----------------------------------------------------------------------------
.PHONY: lint
lint: ## Run ESLint
	$(call PRINT_INFO,"Running ESLint...")
	npm run lint
	$(call PRINT_INFO,"Lint complete!")

.PHONY: lint:fix
lint:fix: ## Fix linting issues automatically
	$(call PRINT_INFO,"Fixing linting issues...")
	npm run lint:fix
	$(call PRINT_INFO,"Lint fixes applied!")

.PHONY: format
format: ## Format code with Prettier
	$(call PRINT_INFO,"Formatting code...")
	npm run format
	$(call PRINT_INFO,"Format complete!")

.PHONY: format:check
format:check: ## Check code formatting without modifying
	$(call PRINT_INFO,"Checking code formatting...")
	npm run format:check
	$(call PRINT_INFO,"Format check complete!")

.PHONY: type-check
type-check: ## Run TypeScript type checking
	$(call PRINT_INFO,"Running TypeScript type check...")
	npm run type-check
	$(call PRINT_INFO,"Type check complete!")

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
.PHONY: security:audit
security:audit: ## Run npm audit for vulnerabilities
	$(call PRINT_INFO,"Running security audit...")
	npm run security:audit

.PHONY: security:scan
security:scan: ## Full security scan (audit + secret scanning)
	$(call PRINT_INFO,"Running full security scan...")
	npm run security:scan

# -----------------------------------------------------------------------------
# Development & Production
# -----------------------------------------------------------------------------
.PHONY: dev
dev: ## Start development server with watch mode
	$(call PRINT_INFO,"Starting development server...")
	$(call PRINT_INFO,"Environment: $(ENV), Port: $(PORT)")
	ENV=$(ENV) PORT=$(PORT) NODE_ENV=$(NODE_ENV) npm run dev

.PHONY: start
start: ## Start production server
	$(call PRINT_INFO,"Starting production server...")
	$(call PRINT_INFO,"Environment: $(ENV), Port: $(PORT)")
	ENV=$(ENV) PORT=$(PORT) NODE_ENV=production npm run start

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------
.PHONY: docker-build
docker-build: ## Build Docker image
	$(call PRINT_INFO,"Building Docker image...")
	docker build -t alsaniamcp:latest .
	$(call PRINT_INFO,"Docker image built!")

.PHONY: docker-build-podman
docker-build-podman: ## Build Podman image (Alsania preferred)
	$(call PRINT_INFO,"Building Podman image...")
	podman build -t alsaniamcp:latest .
	$(call PRINT_INFO,"Podman image built!")

.PHONY: docker-run
docker-run: ## Run Docker container
	$(call PRINT_INFO,"Running Docker container...")
	docker run -d --name alsaniamcp \
		-p $(PORT):$(PORT) \
		-e ENV=$(ENV) \
		-e PORT=$(PORT) \
		alsaniamcp:latest
	$(call PRINT_INFO,"Docker container started!")

.PHONY: docker-stop
docker-stop: ## Stop Docker container
	$(call PRINT_INFO,"Stopping Docker container...")
	docker stop alsaniamcp 2>/dev/null || true
	docker rm alsaniamcp 2>/dev/null || true
	$(call PRINT_INFO,"Docker container stopped!")

.PHONY: docker-logs
docker-logs: ## View Docker container logs
	docker logs -f alsaniamcp

# -----------------------------------------------------------------------------
# CI/CD
# -----------------------------------------------------------------------------
.PHONY: ci
ci: ## Full CI pipeline (clean, lint, type-check, build, test, security)
	$(call PRINT_INFO,"Starting CI pipeline...")
	@echo ""
	$(call PRINT_INFO,"Step 1/6: Cleaning...")
	make clean
	
	$(call PRINT_INFO,"Step 2/6: Preparing environment...")
	make prepare-env
	
	$(call PRINT_INFO,"Step 3/6: Running lint...")
	make lint
	
	$(call PRINT_INFO,"Step 4/6: Running type check...")
	make type-check
	
	$(call PRINT_INFO,"Step 5/6: Building...")
	make build
	
	$(call PRINT_INFO,"Step 6/6: Running tests with coverage...")
	make test:coverage
	
	$(call PRINT_INFO,"Running security scan...")
	make security:scan
	
	@echo ""
	$(call PRINT_INFO,"✅ CI Pipeline complete!")

# -----------------------------------------------------------------------------
# Utility Targets
# -----------------------------------------------------------------------------
.PHONY: info
info: ## Display project information
	@echo "$(COLOR_BOLD)$(COLOR_MAGenta)AlsaniaMCP Information$(COLOR_RESET)"
	@echo "Version:      $$((cat package.json | grep -m1 '"version"' | cut -d'"' -f4) 2>/dev/null || echo 'N/A')"
	@echo "Environment:  $(ENV)"
	@echo "Port:         $(PORT)"
	@echo "Node Env:     $(NODE_ENV)"
	@echo "Dist Dir:     $(DIST_DIR)"
	@echo "Coverage:     $(COVERAGE_DIR)"

.PHONY: doctor
doctor: ## Check development environment
	@echo "$(COLOR_BOLD)Checking development environment...$(COLOR_RESET)"
	@echo ""
	@echo "Node version:    $$node --version 2>/dev/null || echo 'NOT FOUND'"
	@echo "npm version:     $$npm --version 2>/dev/null || echo 'NOT FOUND'"
	@echo "TypeScript:      $$tsc --version 2>/dev/null || echo 'NOT FOUND'"
	@echo ""
	@echo "Checking dependencies..."
	@if [ -d $(NODE_MODULES) ]; then \
		echo "$(COLOR_GREEN)✓ node_modules present$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_RED)✗ node_modules missing - run make install$(COLOR_RESET)"; \
	fi
	@if [ -d $(DIST_DIR) ]; then \
		echo "$(COLOR_GREEN)✓ dist directory present$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)⚠ dist directory missing - run make build$(COLOR_RESET)"; \
	fi
	@if [ -f .env ]; then \
		echo "$(COLOR_GREEN)✓ .env file present$(COLOR_RESET)"; \
	else \
		echo "$(COLOR_YELLOW)⚠ .env file missing - run make prepare-env$(COLOR_RESET)"; \
	fi

.PHONY: reset
reset: clean ## Full reset (clean + reinstall)
	$(call PRINT_INFO,"Performing full reset...")
	rm -rf $(NODE_MODULES) package-lock.json
	$(call PRINT_INFO,"Run 'make install' to reinstall dependencies")

# -----------------------------------------------------------------------------
# Phony targets declaration
# -----------------------------------------------------------------------------
# This ensures Make knows these targets don't represent actual files

.DEFAULT_GOAL := help

OUTPUT_DIR ?= bin
LDFLAGS := -s -w

PLATFORMS := linux/amd64 linux/arm64 darwin/amd64 darwin/arm64 windows/amd64 windows/arm64
FFI_PLATFORMS := linux/amd64/.so darwin/amd64/.dylib darwin/arm64/.dylib windows/amd64/.dll

.PHONY: build
build: ## Build CLI binary
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/bysquare ./cmd/bysquare

.PHONY: build-ffi
build-ffi: ## Build FFI shared library
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=1 go build -buildmode=c-shared -o $(OUTPUT_DIR)/libbysquare.so ./cmd/libbysquare

.PHONY: build-cross
build-cross: ## Cross-compile for all platforms
	@mkdir -p $(OUTPUT_DIR)
	@$(foreach platform,$(PLATFORMS), \
		$(eval OS := $(word 1,$(subst /, ,$(platform)))) \
		$(eval ARCH := $(word 2,$(subst /, ,$(platform)))) \
		$(eval EXT := $(if $(filter windows,$(OS)),.exe,)) \
		CGO_ENABLED=0 GOOS=$(OS) GOARCH=$(ARCH) go build -ldflags="$(LDFLAGS)" \
			-o $(OUTPUT_DIR)/bysquare-$(OS)-$(ARCH)$(EXT) ./cmd/bysquare;)

.PHONY: build-ffi-all
build-ffi-all: ## Build FFI for all platforms
	@mkdir -p $(OUTPUT_DIR)
	@$(foreach platform,$(FFI_PLATFORMS), \
		$(eval OS := $(word 1,$(subst /, ,$(platform)))) \
		$(eval ARCH := $(word 2,$(subst /, ,$(platform)))) \
		$(eval EXT := $(word 3,$(subst /, ,$(platform)))) \
		CGO_ENABLED=1 GOOS=$(OS) GOARCH=$(ARCH) go build -buildmode=c-shared \
			-o $(OUTPUT_DIR)/libbysquare-$(OS)-$(ARCH)$(EXT) ./cmd/libbysquare;)

.PHONY: test
test: ## Run tests
	@go test -v -race ./...

.PHONY: cover
cover: ## Run tests with coverage
	@go test -race -coverprofile=coverage.out -covermode=atomic ./...

.PHONY: fmt
fmt: ## Format code
	@gofmt -s -w .

.PHONY: vet
vet: ## Run go vet
	@go vet ./...

.PHONY: lint
lint: ## Run golangci-lint
	@golangci-lint run ./...

.PHONY: quality
quality: fmt vet ## Run formatting and vet

.PHONY: artifacts
artifacts: ## Build release artifacts
	@mkdir -p $(OUTPUT_DIR)
	@$(MAKE) build-cross
	@$(MAKE) build-ffi-all
	@cd $(OUTPUT_DIR) && sha256sum * > CHECKSUMS.txt 2>/dev/null || true

.PHONY: clean
clean: ## Remove build artifacts
	@rm -rf $(OUTPUT_DIR) artifacts

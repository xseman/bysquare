OUTPUT_DIR ?= bin
VERSION ?= $(shell jq -r '.go' ../.github/.release-manifest.json 2>/dev/null || echo "dev")

.PHONY: build
build: ## Build CLI binary
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=0 go build -ldflags="-s -w -X main.version=$(VERSION)" -o $(OUTPUT_DIR)/bysquare ./cmd/bysquare

.PHONY: build-ffi
build-ffi: ## Build FFI shared library
	@mkdir -p $(OUTPUT_DIR)
	@if [ "$$(uname)" = "Darwin" ]; then \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.dylib ./cmd/libbysquare; \
	elif [ "$$OS" = "Windows_NT" ]; then \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.dll ./cmd/libbysquare; \
	else \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.so ./cmd/libbysquare; \
	fi

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

.PHONY: clean
clean: ## Remove build artifacts
	@rm -rf $(OUTPUT_DIR) artifacts

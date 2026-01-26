.DEFAULT_GOAL := help

OUTPUT_DIR ?= bin
LDFLAGS := -s -w

.PHONY: build
build: ## Build CLI binary
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/bysquare ./cmd/bysquare

.PHONY: build-ffi
build-ffi: ## Build FFI shared library
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=1 go build -buildmode=c-shared -o $(OUTPUT_DIR)/libbysquare.so ./cmd/libbysquare

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

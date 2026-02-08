.PHONY: help build build-ffi test cover fmt vet lint quality clean

OUTPUT_DIR ?= bin
VERSION ?= $(shell jq -r '.go' ../.github/.release-manifest.json 2>/dev/null || echo "dev")

.DEFAULT_GOAL := help

## help: Display this help message
help:
	@echo "Available targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'

## build: Build CLI binary
build:
	@mkdir -p $(OUTPUT_DIR)
	@CGO_ENABLED=0 go build -ldflags="-s -w -X main.version=$(VERSION)" -o $(OUTPUT_DIR)/bysquare ./cmd/bysquare

## build-ffi: Build FFI shared library
build-ffi:
	@mkdir -p $(OUTPUT_DIR)
	@if [ "$$(uname)" = "Darwin" ]; then \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.dylib ./cmd/libbysquare; \
	elif [ "$$OS" = "Windows_NT" ]; then \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.dll ./cmd/libbysquare; \
	else \
		CGO_ENABLED=1 go build -buildmode=c-shared -ldflags="-X main.version=$(VERSION)" -o $(OUTPUT_DIR)/libbysquare.so ./cmd/libbysquare; \
	fi

## test: Run tests
test:
	@go test -v -race ./...

## cover: Run tests with coverage
cover:
	@go test -race -coverprofile=coverage.out -covermode=atomic ./...

## fmt: Format code
fmt:
	@gofmt -s -w .

## vet: Run go vet
vet:
	@go vet ./...

## lint: Run golangci-lint
lint:
	@golangci-lint run ./...

## quality: Run formatting and vet
quality: fmt vet

## clean: Remove build artifacts
clean:
	@rm -rf $(OUTPUT_DIR) artifacts

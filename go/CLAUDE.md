# bysquare (Go)

A library, a CLI and a C shared library. Read `README.md` for the API; the
map below says where things live.

## Commands

```sh
make build              # bin/bysquare, version from the release manifest
make build-ffi          # bin/libbysquare.{so,dylib,dll}, needs cgo
make test               # go vet + go test -race ./...
make lint               # golangci-lint, config in .golangci.yml — must be clean
make fmt                # gofumpt -w .
make cover              # coverage.out
go test ./pkg/bysquare/pay -run TestName
```

CI runs `make cover`, `make lint` and both builds
(`.github/workflows/go-quality.yml`).

Go 1.26, stdlib plus `ulikunitz/xz` for LZMA. The CLI and the library are
pure Go; only the FFI target needs cgo.

## Layout

| Path                      | Contents                                                                |
| ------------------------- | ----------------------------------------------------------------------- |
| `pkg/bysquare`            | the shared codec: base32hex, CRC32, the header, deburr, the error types |
| `pkg/bysquare/internal/*` | `field` (sanitize, numbers, format checks) and `lzma`, shared by both   |
| `pkg/bysquare/pay`        | PAY by square (`bysquareType=0`): encode, decode, types, validation     |
| `pkg/bysquare/invoice`    | Invoice by square (`bysquareType=1`), same shape                        |
| `cmd/bysquare`            | the CLI: `pay`, `invoice`, `decode`, `version`                          |
| `cmd/libbysquare`         | the C shared library, one extern per operation                          |

## Conventions

- `pkg/` is the published API: people import
  `github.com/xseman/bysquare/go`. Renaming an export is a breaking change,
  so the specification's own names stay as they are
  (`InvoiceDocumentType`, `IBAN`) — `.golangci.yml` excludes `pkg/` from
  revive's stutter rule for that reason and no other.
- `cmd/libbysquare` is a C boundary: results are on the C heap for the
  caller to free, errors come back as an `ERROR:`-prefixed string, and a
  panic must never cross the boundary.
- `make lint` must stay clean. Never silence a linter to get there: fix the
  code, or write `//nolint:<linter> // <reason>` — `nolintlint` rejects a
  directive without both. A deliberately dropped error reads `_ = f()`.
- Doc comments start with the identifier and end with a period. Exported API
  gets one; so does anything whose behaviour the name does not give away.
- Format with `make fmt` (gofumpt). Tabs in Go and the Makefile; Markdown
  tables aligned with spaces.
- Code reads in paragraphs: a step and its check sit together, a blank line
  separates it from the next step, from a `case` longer than two lines, and
  from a closing `return`. A block (`if`, `for`, `switch`) cuddles only with
  the one line it uses. `wsl_v5` and `nlreturn` enforce it;
  `golangci-lint run --fix` inserts the lines.
- Helpers that are not public API (field helpers, LZMA framing) live under
  `pkg/bysquare/internal`.
- `pay/wire_test.go` pins golden QR strings. Never regenerate them to make a
  test pass.
- Table tests state the case, not the mechanics.

## Gotchas

- `releases/latest` is not necessarily a Go release; Go releases carry the
  `go/v` tag. Release asset names are API: `bysquare-<os>-<arch>[.exe]`
  plus `CHECKSUMS.txt`. Add platforms, never rename.
- Both binaries take their version from `main.version`, linked in with `-X`
  without the `go/v` prefix; a plain `go build` reports `dev`.
- Windows ARM64 has no FFI build: the cross-compilation toolchain is not on
  the runners.

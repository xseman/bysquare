# bysquare

Monorepo for the Slovak PAY by square and Invoice by square QR payloads: two
implementations of one specification, released independently.

Read the `CLAUDE.md` of the part you are working on before changing it:

| Working in    | Read                   | What it is                                  |
| ------------- | ---------------------- | ------------------------------------------- |
| `typescript/` | `typescript/CLAUDE.md` | npm package and CLI, Bun tests              |
| `go/`         | `go/CLAUDE.md`         | Go library, CLI and C shared library        |
| `examples/`   | `examples/README.md`   | usage samples per runtime                   |
| `docs/`       | -                      | the specification (PDF and text), read-only |

## Shared between the implementations

- The wire format is one: the same model produces the same tab-separated
  payload in both, and each side decodes the other's QR strings. Only the
  LZMA bytes differ, the two encoders make different match choices. A change
  to serialization is a change to both implementations, or to neither.
- The public APIs mirror each other name for name (`decodeHeader` is
  `bysquare.DecodeHeader`), and `EncodeError`, `DecodeError` and
  `ValidationError` carry the same messages and paths. Check the other
  implementation before adding or renaming an export.
- Comments are in English. Domain terms come from the Slovak specification:
  cite the section (`@see 3.10.`, `@see Appendix A, Table 12`) instead of
  writing Slovak.
- Tests use the AAA shape (arrange, act, assert) with blank lines between the
  parts and no comments marking them.
- A logical change needs its tests added or adjusted, and every affected
  `README.md` brought up to date.
- Do not edit `CHANGELOG.md`: release-please writes it from the commit types.
  Tags are `typescript/vX.Y.Z` and `go/vX.Y.Z`.

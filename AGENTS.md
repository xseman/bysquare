# bysquare

Monorepo for the Slovak PAY by square and Invoice by square QR payloads: two
implementations of one specification, released independently.

Read the `AGENTS.md` of the part you are working on before changing it:

| Working in    | Read                   | What it is                                  |
| ------------- | ---------------------- | ------------------------------------------- |
| `typescript/` | `typescript/AGENTS.md` | npm package and CLI, Bun tests              |
| `go/`         | `go/AGENTS.md`         | Go library, CLI and C shared library        |
| `examples/`   | `examples/README.md`   | usage samples per runtime                   |
| `docs/`       | -                      | the specification (PDF and text), read-only |

## Specification

The Slovak Banking Association (SBA) publishes the specification on its
[project page](https://www.sbaonline.sk/projekt/projekty-z-oblasti-platobnych-sluzieb/).
`docs/` holds local copies, which are not tracked in git. If they are missing,
download them from these links:

| Version | Valid                    | Specification                                                                                     | XSD                                                                                    |
| ------- | ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1.2.0   | since 2025-10-09         | [PDF](https://www.sbaonline.sk/wp-content/uploads/2020/03/bysquare-PAYspecifications-1.2.0.pdf)   | [ZIP](https://www.sbaonline.sk/wp-content/uploads/2020/03/bysquare-pay-1_2_0.zip)      |
| 1.1.0   | 2015-06-24 to 2025-10-08 | [PDF](https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf) | [ZIP](https://www.sbaonline.sk/wp-content/uploads/2020/03/bysquare-pay-1_1_0.xsd_.zip) |

- The XSD is documented as HTML at <https://bsqr.co/schema/>.
- The [terms of use](https://www.sbaonline.sk/wp-content/uploads/2020/03/podmienky-pouzitia-pay-by-square.pdf)
  (§ 2.2.2) allow unchanged copies to be shared in any form. The PDF
  disclaimer forbids changing the content.
- Invoice by square has no public specification.

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

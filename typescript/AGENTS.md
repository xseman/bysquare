# bysquare (TypeScript)

The npm package and CLI. Read `README.md` for the API.

## Commands

```sh
bun run test            # bun test src/ with coverage
bun run typecheck       # tsc --noEmit
bun run fmt             # dprint fmt
bun run build           # tsc --build into lib/
bun test src/pay/encode_test.ts
```

## Tests

- Use only `describe`, `test` and `expect` from `bun:test`
- Tests sit next to the code as `*_test.ts`; fixtures live in the `testdata/`
  directory of the module they belong to
- Import the modules directly in the test, to make it clear what's being tested
- Do not create tests for files with side effects
- Use `test.each()` for uniform cases with identical logic, a `for` loop with
  `test()` when a case needs conditional logic or its own setup
- Nest `describe` blocks at most 2-3 levels: functionality, scenario type,
  specific cases
- Name tests by what they check: "encodes/decodes ...", "preserves ...",
  "validates ...", "throws ...", "handles ..."
- Property-based tests for encode/decode: at least 50 iterations of valid
  random data, assert invariants rather than specific outputs

## Code style

### Formatting

- For long numbers use underscores as thousand separators, e.g., `1_000_000`

### Naming convention

When the names are in camelCase or PascalCase, always follow the rules of them
even when the parts of them are acronyms.

```ts
function generateKey() {}

let currentValue = 0;

class KeyObject {}

type SharedKey = {};

enum KeyType {
	PublicKey,
	PrivateKey,
}

const KEY_VERSION = "1.0.0";

const KEY_MAX_LENGTH = 4294967295;

const KEY_PATTERN = /^[0-9a-f]+$/;
```

- Function parameters

```ts
// BAD: more than 3 arguments (#1), multiple optional parameters (#2).
export function renameSync(
	oldname: string,
	newname: string,
	replaceExisting?: boolean,
	followLinks?: boolean,
) {}

// GOOD.
interface RenameOptions {
	replaceExisting?: boolean;
	followLinks?: boolean;
}
export function renameSync(
	oldname: string,
	newname: string,
	options: RenameOptions = {},
) {}
```

- Top-level functions should not use arrow syntax

```ts
// BAD
export const foo = (): string => {
	return "bar";
};

// GOOD
export function foo(): string {
	return "bar";
}
```

Don't use shorthand property assignment in objects

```ts
// BAD
const foo = {
	bar,
	baz,
};

// GOOD
const foo = {
	bar: bar,
	baz: baz,
};
```

Related resources:

- <https://docs.deno.com/runtime/contributing/style_guide/>
- <https://google.github.io/styleguide/tsguide.html>

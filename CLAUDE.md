# Test Creation and Maintenance Guidelines

- After each change make sure all README.md files are up to date
- Makre sure all tests pass after significant changes
- If there is logical change analyze if there should be new tests added or existing modified

# Testing Pattern Instructions

- Use `describe` blocks to group related tests
- Use `test` blocks for individual test cases
- Use only `test` and `expect` from `bun:test`
- Import the modules directly in the test, to make it clear what's being tested
- Do not create tests for files with side effects such as database operations
- Do not edit CHANGELOG, it's auto-generated

# Code style

## Comment Language

All comments must be written in **English** for consistency and international
accessibility. This includes:

- JSDoc comments and docstrings
- Inline comments
- Module-level documentation in test files

For domain-specific terms from the Slovak PAY by Square specification,
reference the specification section number (e.g., `@see 3.10.`) rather than
including Slovak terminology.

## Formatting

- For long numbers use underscores as thousand separators, e.g., `1_000_000`

## Naming convention

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

## AAA Pattern (Arrange, Act, Assert)

- Always structure test cases using the AAA pattern for clarity:
- Don't add explicit comments for AAA, as the structure should be self-explanatory
- Don't add comments for each step, as the code should be clear enough

```typescript
it("should calculate total price with tax correctly", () => {
	// Arrange
	const basePrice = 100;
	const taxRate = 0.08;
	const expected = 108;

	// Act
	const result = calculateTotal(basePrice, taxRate);

	// Assert
	expect(result).toBe(expected);
});
```

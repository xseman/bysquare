# Development Guidelines for bysquare

This document provides specific information for developers working on the bysquare project.

## Build/Configuration Instructions

### Prerequisites

- Node.js v16 or later (v18+ recommended)
- npm v7 or later

### Setup

1. Clone the repository and install dependencies:

```sh
git clone https://github.com/xseman/bysquare.git
cd bysquare
npm install
```

2. Build the project:

```sh
npm run build
```

This will compile TypeScript files to JavaScript in the `dist` directory.

### Development Commands

- `npm run typecheck`: Run TypeScript type checking without emitting files
- `npm run fmt`: Format code using dprint
- `npm run fmt:check`: Check code formatting without making changes

## Testing Information

### Running Tests

The project uses Node.js built-in test runner with TypeScript support:

```sh
# Run all tests with coverage report
npm test

# Run tests in watch mode during development
npm run test:watch
```

### Test Structure

Tests are located alongside the source files with a `.test.ts` extension. For example:
- `src/encode.ts` → `src/encode.test.ts`
- `src/decode.ts` → `src/decode.test.ts`

### Writing Tests

Tests follow this pattern:

1. Import the necessary modules:
```typescript
import assert from "node:assert/strict";
import { describe, test } from "node:test";
```

2. Structure tests using `describe` and `test` blocks:
```typescript
describe("feature name", () => {
  test("specific behavior", () => {
    // Test code
  });
});
```

3. Follow the Arrange-Act-Assert pattern:
```typescript
// Arrange: Set up test data
const input = {
  amount: 250.75,
  variableSymbol: "987654",
  currencyCode: CurrencyCode.EUR,
  iban: "SK9611000000002918599669",
};

// Act: Call the function being tested
const result = simplePayment(input);

// Assert: Verify the result
assert.ok(result, "Result should not be empty");
```

### Example Test

Here's a complete example test for the `simplePayment` function:

```typescript
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { simplePayment } from "./helpers.js";
import { CurrencyCode } from "./types.js";

describe("example test", () => {
  test("simplePayment with different parameters", () => {
    // Arrange: Set up test data
    const input = {
      amount: 250.75,
      variableSymbol: "987654",
      currencyCode: CurrencyCode.EUR,
      iban: "SK9611000000002918599669",
    };

    // Act: Call the function being tested
    const qrstring = simplePayment(input);

    // Assert: Verify the result
    assert.ok(qrstring, "QR string should not be empty");
    assert.ok(qrstring.length > 0, "QR string should have content");
  });
});
```

## Additional Development Information

### Code Style

- The project uses [dprint](https://dprint.dev/) for code formatting
- ESM modules are used throughout the project (no CommonJS)
- TypeScript is configured with strict type checking

### Project Structure

- `src/`: Source code
  - `*.ts`: Implementation files
  - `*.test.ts`: Test files
- `dist/`: Compiled JavaScript (generated)
- `docs/examples/`: Usage examples for different environments

### Key Concepts

1. **Data Model**: The core data structure for payments, defined in `types.ts`
2. **Encoding/Decoding**: The main functionality for converting between data models and QR strings
3. **Validation**: Input validation for payment data

### Error Handling

The project uses custom error classes for specific error scenarios. When implementing new features, follow the existing pattern of throwing specific error types with descriptive messages.

### Performance Considerations

The library is designed to be lightweight and efficient. When making changes:
- Avoid adding unnecessary dependencies
- Be mindful of bundle size for browser usage
- Consider the performance impact of changes, especially in encoding/decoding operations

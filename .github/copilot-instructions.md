# @targetd Development Guide

## Project Overview

This is a **Deno-first monorepo** for a type-safe targeting and feature flag
system. The architecture enables dynamic content delivery based on query
conditions, with packages distributed via JSR (JavaScript Registry).

**Core concept**: Store flat key-value rules with targeting conditions, query at
runtime to get the matching payload. Think feature flags meets content
management.

## Architecture

### Package Structure

- **@targetd/api** - Core in-memory data store with targeting engine. All other
  packages depend on this.
- **@targetd/server** - Express-based HTTP server exposing api via REST
  endpoints
- **@targetd/client** - Type-safe HTTP client for querying server instances
- **@targetd/fs** - File-based rule loading (JSON/YAML) with hot-reloading
- **@targetd/explode** - Utility to transform flat keys (`app.title`) into
  nested objects
- **@targetd/date-range** - Built-in targeting descriptor for date range
  matching
- **@targetd/json-schema** - JSON Schema generation from Zod schemas

### Key Patterns

**Targeting Descriptors**: Objects with `predicate`, `queryParser`, and
`targetingParser` that define how to match query values against targeting rules.
See
[createTargetingDescriptor.ts](packages/api/src/createTargetingDescriptor.ts)
and built-in predicates in
[packages/api/src/predicates/](packages/api/src/predicates/).

**PromisedData Pattern**: The `Data.create()` builder uses
[PromisedData](packages/api/src/PromisedData.ts) to enable fluent async
configuration before resolving to a `Data` instance.

**Type Inference**: Heavy use of TypeScript's type system with Zod schemas. The
`Data` class uses complex type inference (`DT.Meta`) to ensure payloads,
targeting, and queries are type-safe across the API.

### Creating Custom Targeting Descriptors

Targeting descriptors define how query parameters match against targeting rules.
Create custom ones for domain-specific logic:

```typescript
import { createTargetingDescriptor } from '@targetd/api'
import { array, string } from 'zod/mini'

// Simple equality check with optional query
const customEquals = createTargetingDescriptor({
  predicate: (query) => (target) => !query || query === target,
  queryParser: string(),
  targetingParser: string(),
  requiresQuery: false, // Evaluates even without query parameter
})

// Complex async predicate (e.g., database lookup)
const userSegment = createTargetingDescriptor({
  predicate: (userId) => async (segment) => {
    if (!userId) return false
    const user = await fetchUser(userId)
    return user.segments.includes(segment)
  },
  queryParser: string(),
  targetingParser: string(),
})

// Multiple value matching with negation
const platformMatch = {
  predicate: (query) => (targets) => {
    if (!query) return true
    return targets.some((t) =>
      t.startsWith('!') ? t.slice(1) !== query : t === query
    )
  },
  queryParser: string(),
  targetingParser: array(string()),
}
```

See [@targetd/date-range](packages/date-range/src/index.ts) for a real-world
example that evaluates against current time when no query is provided.

## Development Workflow

### Commands

```bash
# Run all tests (from root)
deno task test

# Run tests in watch mode
deno task test:dev

# Type check all packages
deno task check

# Format code
deno fmt

# Lint code
deno lint

# Run package-specific tests
cd packages/api && deno task test
```

### Testing

- Uses **Deno's built-in test runner** (`Deno.test`)
- Snapshot testing with `@std/testing/snapshot`
- Tests live in `test/` directories alongside `src/`
- Async predicates are common - see
  [Data.test.ts](packages/api/test/Data.test.ts#L16-L20) for examples

### Adding New Packages

1. Create `packages/[name]/` directory
2. Add `deno.json` with package metadata, exports, and workspace imports
3. Add to workspace array in root `deno.json`
4. Add to `release-please-config.json` for automated releases
5. Add to `.release-please-manifest.json` with initial version (e.g.,
   `"packages/[name]": "0.0.0"`)
6. Structure: `src/index.ts` (exports), `test/*.test.ts`, `README.md`,
   `LICENSE`, `CHANGELOG.md`

## Important Conventions

**Import Paths**: Use `.ts` extensions in imports, even though it's Deno. Use
workspace references like `@targetd/api` in package dependencies.

**Zod Schemas**: For new code and public examples, prefer `import { z } from 'zod'`
for consistency with the root README and package READMEs. Some internal,
performance-sensitive modules may instead use `zod/mini` for schemas and
`zod/v4/core` for types; when editing those files (e.g.
[packages/api/src/Data.ts](packages/api/src/Data.ts#L22-L25)), follow the
existing local style.

**Exports**: Each package has `src/index.ts` as the main export in `deno.json`.
Re-export types with `export type *` and utilities appropriately.

**Formatting**: Single quotes, no semicolons (enforced by `deno fmt` config).

**Commits**: Conventional commits enforced via commitlint. Use `fix:`, `feat:`,
`chore:`, etc.

## Release Process

- **Automated via Release Please** on pushes to `master`
- Each package has independent versioning
- Tags follow pattern: `@targetd/[package]-v[version]`
- Published to **JSR** (not npm), accessible via `jsr:@targetd/[package]`
- GitHub Actions workflow: test → release-please → publish to JSR

## Common Pitfalls

1. **Targeting predicates may receive undefined queries**: Predicates can see
   `undefined` when `requiresQuery: false` or when a query key is present but
   parsed/cast to `undefined` (for example, an empty string). Return an
   appropriate default (often `true` or `false`) in these cases.

2. **Rules order matters**: First matching rule wins. Always add fallback rules
   (no targeting) last.

3. **Type inference can be tricky**: The `Data<$>` generic carries
   payload/targeting/query types. Use helper types in `types/` directories when
   extending.

4. **File-based rules structure**: Files must export objects where keys are
   payload names containing `rules` arrays. See
   [packages/fs/test/fixtures/rules/](packages/fs/test/fixtures/rules/).

5. **Express middleware order**: In `@targetd/server`, query casting happens
   before error handling. Custom middleware should follow this pattern.

## Debugging Type Inference Issues

The `Data<$>` generic uses complex type inference that can sometimes be
challenging:

**Strategy 1: Extract intermediate types**

```typescript
// Instead of chaining everything
const data = await Data.create()
  .usePayload({ foo: z.string() })
  .useTargeting({ bar: targetIncludes(z.string()) })
  .addRules('foo', rules)

// Break it down to inspect types
const step1 = Data.create()
const step2 = step1.usePayload({ foo: z.string() })
const step3 = step2.useTargeting({ bar: targetIncludes(z.string()) })
type Step3Type = Awaited<typeof step3> // Inspect in IDE
```

**Strategy 2: Use helper types from `types/` directories**

```typescript
import type { DT, PT, QT, TT } from '@targetd/api'

// Access inferred types explicitly
type MyPayloads = PT.InferPayloads<typeof data>
type MyQuery = QT.InferQuery<typeof data>
type MyTargeting = TT.InferTargeting<typeof data>
```

**Strategy 3: Check Zod import paths**

- Use `zod/mini` for schemas: `import { z } from 'zod/mini'`
- Use `zod/v4/core` for types: `import type { output } from 'zod/v4/core'`
- Mixing imports can break type inference

**Common error: "Type instantiation is excessively deep"**

- Usually means Zod schema is too complex or circular
- Break complex schemas into smaller named schemas
- Check for accidental circular references in targeting descriptors

## External Dependencies

- **Zod v4** - Schema validation and type inference (core dependency)
- **Express** - HTTP server (server package only)
- **@johngw/fs** - Author's file system utilities (fs package)
- **fast-deep-equal** - Deep equality checks in targeting
- **YAML** - File format support in fs loader

## Quick Reference

**Add a new targeting predicate**: Create in `packages/api/src/predicates/`,
follow pattern from
[targetIncludes.ts](packages/api/src/predicates/targetIncludes.ts).

**Add middleware to server**: See
[packages/server/src/middleware/](packages/server/src/middleware/) for examples.

**Test async predicates**: Wrap predicates that return promises in `await` or
use `setTimeout` helper - see
[Data.test.ts](packages/api/test/Data.test.ts#L16-L20).

**Transform flat keys to nested**: Use `@targetd/explode` with `.` separator to
convert `app.title` → `{ app: { title: ... } }`.

**Type-safe client queries**: Pass your `Data` instance to `Client` constructor
for full type inference on queries and responses.

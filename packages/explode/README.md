# @targetd/explode

Transform flat key-value payloads with delimited keys into nested object
structures.

## Installation

| JS Runtime | Command                                          |
| ---------- | ------------------------------------------------ |
| Node.js    | `npx jsr add @targetd/api @targetd/explode`      |
| Bun        | `bunx jsr add @targetd/api @targetd/explode`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/explode` |

## Overview

`@targetd/explode` provides a utility to convert flat key-value structures into
nested objects. Since [@targetd/api](https://jsr.io/@targetd/api) stores data as
flat key-value pairs, this package helps you organize related payloads using
namespaced keys (e.g., `'feature.mobile.enabled'`) and then transform them into
a hierarchical structure.

This is useful for:

- **Organizing related configuration**: Group settings by namespace
- **API responses**: Return nested JSON structures from flat targeting data
- **Type-safe nested structures**: Maintain TypeScript types through the
  transformation

## Basic Usage

```typescript
import { Data } from '@targetd/api'
import { explode } from '@targetd/explode'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    'app.title': z.string(),
    'app.version': z.string(),
    'feature.darkMode': z.boolean(),
  })
  .addRules('app.title', [{ payload: 'My App' }])
  .addRules('app.version', [{ payload: '1.0.0' }])
  .addRules('feature.darkMode', [{ payload: true }])

const flat = await data.getPayloadForEachName()
// { 'app.title': 'My App', 'app.version': '1.0.0', 'feature.darkMode': true }

const nested = explode(flat, '.')
// {
//   app: {
//     title: 'My App',
//     version: '1.0.0'
//   },
//   feature: {
//     darkMode: true
//   }
// }
```

## API

### `explode(object, separator)`

Transforms a flat object with delimited keys into a nested structure.

**Parameters:**

- `object`: The flat object with delimited keys
- `separator`: The delimiter used in the keys (e.g., `'.'`, `'/'`, `':'`)

**Returns:** A nested object structure

```typescript
const nested = explode(flatObject, '.')
```

## Examples

### Configuration Management

Organize application settings by namespace:

```typescript
import { Data } from '@targetd/api'
import { explode } from '@targetd/explode'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    'api.endpoint': z.string(),
    'api.timeout': z.number(),
    'ui.theme': z.string(),
    'ui.language': z.string(),
  })
  .addRules('api.endpoint', [{ payload: 'https://api.example.com' }])
  .addRules('api.timeout', [{ payload: 5000 }])
  .addRules('ui.theme', [{ payload: 'dark' }])
  .addRules('ui.language', [{ payload: 'en' }])

const config = explode(await data.getPayloadForEachName(), '.')
// {
//   api: {
//     endpoint: 'https://api.example.com',
//     timeout: 5000
//   },
//   ui: {
//     theme: 'dark',
//     language: 'en'
//   }
// }
```

### Feature Flags by Platform

Structure feature flags with platform-specific configurations:

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { explode } from '@targetd/explode'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    'feature.mobile.enabled': z.boolean(),
    'feature.mobile.maxItems': z.number(),
    'feature.desktop.enabled': z.boolean(),
    'feature.desktop.maxItems': z.number(),
  })
  .useTargeting({
    platform: targetIncludes(z.string()),
  })
  .addRules('feature.mobile.enabled', [
    {
      targeting: { platform: ['ios', 'android'] },
      payload: true,
    },
    { payload: false },
  ])
  .addRules('feature.mobile.maxItems', [{ payload: 10 }])
  .addRules('feature.desktop.enabled', [{ payload: true }])
  .addRules('feature.desktop.maxItems', [{ payload: 50 }])

const features = explode(
  await data.getPayloadForEachName({ platform: 'ios' }),
  '.',
)
// {
//   feature: {
//     mobile: {
//       enabled: true,
//       maxItems: 10
//     },
//     desktop: {
//       enabled: true,
//       maxItems: 50
//     }
//   }
// }
```

### Multi-level Nesting

Create deeply nested structures:

```typescript
const flat = {
  'a.b.c.d.e.f': 'value1',
  'a.b.c.d.e.g': 'value2',
  'a.b.x.y': 'value3',
}

const nested = explode(flat, '.')
// {
//   a: {
//     b: {
//       c: {
//         d: {
//           e: {
//             f: 'value1',
//             g: 'value2'
//           }
//         }
//       },
//       x: {
//         y: 'value3'
//       }
//     }
//   }
// }
```

### Custom Separators

Use any separator that suits your naming convention:

```typescript
// Using forward slash
const nested1 = explode({ 'path/to/value': 42 }, '/')
// { path: { to: { value: 42 } } }

// Using colon
const nested2 = explode({ 'namespace:key:subkey': 'data' }, ':')
// { namespace: { key: { subkey: 'data' } } }

// Using underscore
const nested3 = explode({ 'section_subsection_field': true }, '_')
// { section: { subsection: { field: true } } }
```

## Type Safety

The `explode` function maintains TypeScript type safety and infers the correct
nested structure:

```typescript
import type { Explode } from '@targetd/explode'

// Type-level transformation
type Flat = {
  'foo.bar': string
  'foo.baz': number
  'qux': boolean
}

type Nested = Explode<Flat, '.'>
// {
//   foo: {
//     bar: string
//     baz: number
//   }
//   qux: boolean
// }

// Runtime transformation with type inference
const flat: Flat = {
  'foo.bar': 'hello',
  'foo.baz': 42,
  'qux': true,
}

const nested = explode(flat, '.')
// Type is automatically inferred as Nested
// nested.foo.bar is string
// nested.foo.baz is number
// nested.qux is boolean
```

## Use Cases

### API Endpoints

Transform flat targeted data into nested JSON responses:

```typescript
// In an API route handler
const flat = await data.getPayloadForEachName({ userId: req.user.id })
const response = explode(flat, '.')

res.json(response)
// Client receives nested structure instead of flat keys
```

### Configuration Files

Generate nested configuration objects from flat targeting rules:

```typescript
const flat = await data.getPayloadForEachName({ environment: 'production' })
const config = explode(flat, '.')

// Use nested config throughout application
app.configure(config.database)
app.setTheme(config.ui.theme)
```

### Namespace Organization

Organize large sets of related data:

```typescript
// Instead of managing many flat keys:
// 'theme.colors.primary', 'theme.colors.secondary', 'theme.fonts.heading', etc.

// Get organized structure:
const theme = explode(await data.getPayloadForEachName(), '.')
// {
//   theme: {
//     colors: { primary: '...', secondary: '...' },
//     fonts: { heading: '...', body: '...' },
//     spacing: { small: '...', large: '...' }
//   }
// }
```

## Related Packages

- [@targetd/api](https://jsr.io/@targetd/api) - Core targeting and data querying
  API
- [@targetd/client](https://jsr.io/@targetd/client) - Type-safe HTTP client for
  querying servers
- [@targetd/server](https://jsr.io/@targetd/server) - HTTP server for serving
  targeted data

## License

See [LICENSE](./LICENSE) file for details.

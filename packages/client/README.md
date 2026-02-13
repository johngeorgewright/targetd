# @targetd/client

A type-safe HTTP client for querying
[@targetd/server](https://jsr.io/@targetd/server) instances with full TypeScript
inference.

## Installation

| JS Runtime | Command                                         |
| ---------- | ----------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/client`      |
| Bun        | `bunx jsr add @targetd/api @targetd/client`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/client` |

## Overview

`@targetd/client` provides a strongly-typed HTTP client that mirrors the
[@targetd/api](https://jsr.io/@targetd/api) Data interface. It allows you to
query remote targeting servers while maintaining full type safety and IDE
autocomplete.

Key features:

- **Type-safe queries**: Share type definitions between client and server
- **Same API as Data**: Uses identical methods to `@targetd/api` Data class
- **Automatic serialization**: Handles query parameter encoding/decoding
- **Network-transparent**: Query remote data as if it were local

## Basic Usage

### 1. Define Shared Types

Create shared type definitions that both client and server will use:

```typescript
// shared/types.ts
import { Data, targetIncludes } from '@targetd/api'
import { z } from 'zod'

export const data = await Data.create()
  .usePayload({
    greeting: z.string(),
    config: z.object({
      enabled: z.boolean(),
    }),
  })
  .useTargeting({
    country: targetIncludes(z.string()),
  })
```

### 2. Set Up the Server

Use [@targetd/server](https://jsr.io/@targetd/server) to create an HTTP
endpoint:

```typescript
// server.ts
import { createServer } from '@targetd/server'
import { data } from './shared/types.ts'

const serverData = await data
  .addRules('greeting', [
    {
      targeting: { country: ['US'] },
      payload: 'Hello!',
    },
    {
      targeting: { country: ['ES'] },
      payload: '¡Hola!',
    },
    {
      payload: 'Hi!',
    },
  ])
  .addRules('config', [
    {
      payload: { enabled: true },
    },
  ])

createServer(serverData).listen(3000)
```

### 3. Query from the Client

Use the Client class with the same type definition:

```typescript
// client.ts
import { Client } from '@targetd/client'
import { data } from './shared/types.ts'

const client = new Client('http://localhost:3000', data)

// Type-safe queries with full autocomplete
const greeting = await client.getPayload('greeting', { country: 'US' })
// Returns: 'Hello!'

const config = await client.getPayload('config')
// Returns: { enabled: true }
```

## Client API

The Client class provides the same query methods as the Data class:

### `getPayload(name, query?)`

Get the first matching payload for a given name:

```typescript
const payload = await client.getPayload('greeting', { country: 'ES' })
// Returns: '¡Hola!'
```

### `getPayloads(name, query?)`

Get all matching payloads:

```typescript
const allMatches = await client.getPayloads('greeting', { country: 'US' })
// Returns array of all matching payloads
```

### `getPayloadForEachName(query?)`

Get payloads for all registered names at once:

```typescript
const allPayloads = await client.getPayloadForEachName({ country: 'US' })
// Returns: { greeting: 'Hello!', config: { enabled: true } }
```

## Complete Example

Here's a full example showing custom targeting descriptors, multiple payloads,
and type safety:

```typescript
// device.ts - Shared targeting descriptor
import { createTargetingDescriptor } from '@targetd/api'
import { z } from 'zod'

export const Device = z.enum(['desktop', 'mobile'])

export const deviceTargeting = createTargetingDescriptor({
  predicate: (query) => (target) => target.includes(query),
  queryParser: Device,
  targetingParser: z.array(Device),
})
```

```typescript
// data.ts - Shared data structure
import { Data } from '@targetd/api'
import { z } from 'zod'
import { deviceTargeting } from './device.ts'

export const data = await Data.create()
  .usePayload({
    content: z.string(),
    maxItems: z.number(),
  })
  .useTargeting({
    device: deviceTargeting,
  })
```

```typescript
// server.ts - Server implementation
import { createServer } from '@targetd/server'
import { data } from './data.ts'

const serverData = await data
  .addRules('content', [
    {
      targeting: { device: ['mobile'] },
      payload: '📱 Mobile Content',
    },
    {
      targeting: { device: ['desktop'] },
      payload: '🖥 Desktop Content',
    },
  ])
  .addRules('maxItems', [
    {
      targeting: { device: ['mobile'] },
      payload: 10,
    },
    {
      targeting: { device: ['desktop'] },
      payload: 50,
    },
  ])

createServer(serverData).listen(3000)
```

```typescript
// client.ts - Client usage
import { Client } from '@targetd/client'
import { data } from './data.ts'

const client = new Client('http://localhost:3000', data)

// Query for mobile
const mobileData = await client.getPayloadForEachName({ device: 'mobile' })
// Returns: { content: '📱 Mobile Content', maxItems: 10 }

// Query for desktop
const desktopData = await client.getPayloadForEachName({ device: 'desktop' })
// Returns: { content: '🖥 Desktop Content', maxItems: 50 }

// Type-safe: TypeScript knows 'device' must be 'mobile' or 'desktop'
// ✅ await client.getPayload('content', { device: 'mobile' })
// ❌ await client.getPayload('content', { device: 'tablet' }) // Type error
```

## Type Safety

The client inherits all type safety from the shared Data definition:

```typescript
const client = new Client('http://localhost:3000', data)

// ✅ Type-safe payload names
await client.getPayload('content', { device: 'mobile' })

// ❌ Type error: 'unknown' is not a valid payload name
await client.getPayload('unknown')

// ❌ Type error: 'invalidParam' is not a valid query parameter
await client.getPayload('content', { invalidParam: 'value' })

// ✅ Return types are inferred correctly
const content: string = await client.getPayload('content', { device: 'mobile' })
const maxItems: number = await client.getPayload('maxItems', {
  device: 'mobile',
})
```

## Error Handling

The client throws errors for network issues or server errors:

```typescript
try {
  const payload = await client.getPayload('content', { device: 'mobile' })
} catch (error) {
  if (error instanceof Error) {
    console.error('Request failed:', error.message)
  }
}
```

## Related Packages

- [@targetd/api](https://jsr.io/@targetd/api) - Core targeting and data querying
  API
- [@targetd/server](https://jsr.io/@targetd/server) - HTTP server for serving
  targeted data

## License

See [LICENSE](./LICENSE) file for details.

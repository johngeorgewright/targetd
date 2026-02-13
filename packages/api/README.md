# @targetd/api

A powerful, type-safe targeting and feature flag system for dynamically serving
different content based on query conditions.

## Installation

| JS Runtime | Command                     |
| ---------- | --------------------------- |
| Node.js    | `npx jsr add @targetd/api`  |
| Bun        | `bunx jsr add @targetd/api` |
| Deno       | `deno add jsr:@targetd/api` |

## Overview

`@targetd/api` provides an in-memory data store that allows you to define rules
for serving different payloads based on targeting conditions. It's ideal for:

- Feature flags and A/B testing
- Content personalization based on user attributes
- Dynamic configuration management
- Context-aware API responses

## Basic Usage

### Creating a Data Store

Start by creating a data store with `Data.create()`:

```typescript
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    greeting: z.string(),
  })
  .useTargeting({
    country: targetIncludes(z.string()),
  })
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
      payload: 'Hi!', // default fallback
    },
  ])

// Query the data
const greeting = await data.getPayload('greeting', { country: 'US' })
// Returns: 'Hello!'

const defaultGreeting = await data.getPayload('greeting')
// Returns: 'Hi!'
```

## Core Concepts

### 1. Payloads

Define the types of data your store will manage using [Zod](https://zod.dev/)
schemas:

```typescript
const data = await Data.create()
  .usePayload({
    message: z.string(),
    config: z.object({
      enabled: z.boolean(),
      maxRetries: z.number(),
    }),
  })
```

### 2. Targeting

Targeting rules determine which payload to serve based on query parameters. Use
built-in predicates or create custom ones:

#### Built-in Predicates

- **`targetIncludes`**: Check if a value is in an array
  ```typescript
  .useTargeting({
    channels: targetIncludes(z.string())
  })
  .addRules('content', [
    {
      targeting: { channels: ['mobile', 'web'] },
      payload: 'Multi-platform content'
    }
  ])
  ```

- **`targetEquals`**: Check for exact equality
  ```typescript
  .useTargeting({
    isPremium: targetEquals(z.boolean())
  })
  .addRules('feature', [
    {
      targeting: { isPremium: true },
      payload: 'Premium feature'
    }
  ])
  ```

#### Custom Targeting Descriptors

Create custom targeting logic with predicates:

```typescript
const data = await Data.create()
  .usePayload({ message: z.string() })
  .useTargeting({
    timeOfDay: {
      predicate: (queryTime) => (targetTime) => {
        return queryTime === targetTime
      },
      queryParser: z.enum(['morning', 'afternoon', 'evening']),
      targetingParser: z.enum(['morning', 'afternoon', 'evening']),
    },
  })
  .addRules('message', [
    {
      targeting: { timeOfDay: 'morning' },
      payload: 'Good morning!',
    },
  ])
```

#### Async Predicates

Predicates can be asynchronous:

```typescript
.useTargeting({
  hasAccess: {
    predicate: (userId) => async (requiredRole) => {
      const user = await fetchUser(userId)
      return user.role === requiredRole
    },
    queryParser: z.string(),
    targetingParser: z.string()
  }
})
```

#### Targeting Without Query Requirements

Set `requiresQuery: false` for predicates that don't need query parameters:

```typescript
import { createTargetingDescriptor } from '@targetd/api'

.useTargeting({
  currentTime: createTargetingDescriptor({
    predicate: () => (targetTime) => {
      return new Date().getHours() === targetTime
    },
    queryParser: z.undefined(),
    targetingParser: z.number(),
    requiresQuery: false
  })
})
```

### 3. Rules

Rules map targeting conditions to payloads. Rules are evaluated in order, and
the first matching rule wins:

```typescript
.addRules('feature', [
  {
    // Most specific rule first
    targeting: { 
      country: ['US'],
      isPremium: true 
    },
    payload: 'Premium US feature'
  },
  {
    // Less specific
    targeting: { country: ['US'] },
    payload: 'US feature'
  },
  {
    // Default (no targeting)
    payload: 'Default feature'
  }
])
```

#### Multiple Targeting Conditions (OR logic)

Use an array of targeting objects for OR conditions:

```typescript
.addRules('content', [
  {
    targeting: [
      { weather: ['sunny'] },
      { highTide: true }
    ],
    payload: 'Beach content'
  }
])
// Matches if weather is sunny OR highTide is true
```

### 4. Variables

Variables allow you to define reusable payload values with their own targeting
rules. A variable can be referenced in a payload using `{{variableName}}`
syntax, and the variable itself resolves to a payload based on the query:

> **Note:** Variables are replaced with their payload values directly—they
> cannot be interpolated into strings. For example, `'{{featureEnabled}}'` will
> be replaced with the variable's value (e.g., `true`), not interpolated as part
> of a string like `'Feature is {{featureEnabled}}'`.

```typescript
.addRules('config', {
  variables: {
    featureEnabled: [
      {
        targeting: { country: ['US'] },
        payload: true
      },
      {
        payload: false
      }
    ],
    maxRetries: [
      {
        payload: 5
      }
    ]
  },
  rules: [
    {
      payload: {
        enabled: '{{featureEnabled}}',
        retries: '{{maxRetries}}'
      }
    }
  ]
})

// Query the data
const config = await data.getPayload('config', { country: 'US' })
// Returns: { enabled: true, retries: 5 }

const defaultConfig = await data.getPayload('config')
// Returns: { enabled: false, retries: 5 }
```

Variables are particularly useful when you need the same targeting logic across
multiple payloads or when combining static and dynamic values in complex data
structures.

### 5. Fall-through Targeting

Fall-through targeting is used when one service cannot fully evaluate all
targeting conditions. In these cases, payloads with unresolved fall-through
targeting are returned in a special format (`__rules__` structure) that can be
passed to another service for final evaluation.

This is useful in distributed systems where different services have access to
different context:

```typescript
const data = await Data.create()
  .usePayload({ message: z.string() })
  .useTargeting({
    channel: targetIncludes(z.string()),
  })
  .useFallThroughTargeting({
    region: z.array(z.string()),
  })
  .addRules('message', [
    {
      targeting: {
        channel: ['mobile'],
        region: ['EU'], // fall-through
      },
      payload: 'EU mobile message',
    },
    {
      targeting: {
        channel: ['mobile'],
      },
      payload: 'Mobile message',
    },
  ])

// Query with only the regular targeting field
const result = await data.getPayload('message', { channel: 'mobile' })
// Returns: { __rules__: [...], __variables__: {...} }
// This can be passed to another service that has region context
```

The service receiving the `__rules__` structure can use the
[`insert()`](#insertdata) method to add this data and then evaluate the
fall-through targeting conditions with its own context:

```typescript
// In the receiving service with region context
const receivingServiceData = await Data.create()
  .usePayload({ message: z.string() })
  .useTargeting({
    region: targetIncludes(z.string()),
  })
  .insert({
    message: result, // The __rules__ structure from the first service
  })

// Now evaluate with region context
const finalPayload = await receivingServiceData.getPayload('message', {
  region: 'EU',
})
// Returns: 'EU mobile message'
```

## API Methods

### `getPayload(name, query?)`

Get the first matching payload for a given name:

```typescript
const payload = await data.getPayload('feature', { country: 'US' })
```

### `getPayloads(name, query?)`

Get all matching payloads (useful for testing/debugging):

```typescript
const allMatches = await data.getPayloads('feature', { country: 'US' })
// Returns array of all matching payloads
```

### `getPayloadForEachName(query?)`

Get payloads for all registered names at once:

```typescript
const allPayloads = await data.getPayloadForEachName({ country: 'US' })
// Returns: { feature: '...', message: '...', ... }
```

### `insert(data)`

Insert data from one Data object to another. This is commonly used with
fall-through targeting to pass unresolved rules between services:

```typescript
const updated = await data.insert({
  feature: result, // Can be a simple value or __rules__ structure from another Data object
})
```

### `removeAllRules()`

Remove all rules while keeping parsers:

```typescript
const empty = data.removeAllRules()
```

## Advanced Examples

### Negation Support

Use `withNegate` option to support negative targeting:

```typescript
const data = await Data.create()
  .usePayload({ content: z.string() })
  .useTargeting({
    platform: targetIncludes(z.string(), { withNegate: true }),
  })
  .addRules('content', [
    {
      targeting: { platform: ['!mobile'] },
      payload: 'Desktop-only content',
    },
  ])

// Matches everything except mobile
await data.getPayload('content', { platform: 'desktop' })
```

### Complex Multi-condition Rules

```typescript
const data = await Data.create()
  .usePayload({ experience: z.string() })
  .useTargeting({
    weather: targetIncludes(z.string()),
    tide: targetEquals(z.boolean()),
    wind: targetEquals(z.string()),
  })
  .addRules('experience', [
    {
      // All conditions must match (AND)
      targeting: {
        weather: ['sunny'],
        tide: true,
        wind: 'strong',
      },
      payload: 'Perfect surfing conditions! 🏄‍♂️',
    },
    {
      targeting: {
        weather: ['sunny'],
      },
      payload: 'Nice day! 😎',
    },
    {
      payload: 'Regular day',
    },
  ])
```

## Type Safety

The library provides full TypeScript type inference:

```typescript
const data = await Data.create()
  .usePayload({ message: z.string() })
  .useTargeting({ country: targetIncludes(z.string()) })

// ✅ Type-safe
await data.getPayload('message', { country: 'US' })

// ❌ Type error: 'unknown' is not a valid payload name
await data.getPayload('unknown')

// ❌ Type error: 'invalidField' is not a valid query parameter
await data.getPayload('message', { invalidField: 'value' })
```

## License

See [LICENSE](./LICENSE) file for details.

# @targetd/client

> A HTTP typed client to query a @targetd/server

## Installation

| JS Runtime | Command                                     |
| ---------- | ------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/client`  |
| Bun        | `bunx jsr add @targetd/api @targetd/client` |
| Deno       | `deno add @targetd/api @targetd/client`     |

## Example

```typescript
// ./device.ts
import { createTargetingDescriptor } from '@targetd/api'
import { z } from 'zod'

export const Device = z.literal('desktop').or(z.literal('mobile'))

export const deviceTargeting = createTargetingDescriptor({
  predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
  queryParser: Device,
  targetingParser: z.array(Device),
})
```

```typescript
// ./data.ts
import { Data } from '@targetd/api'
import z from 'zod'
import { deviceTargeting } from './device'

export const data = Data.create({
  data: {
    bar: z.number(),
    foo: z.string(),
  },
  targeting: {
    device: deviceTargeting,
  },
})
```

```typescript
// ./server.ts
import { createServer } from '@targetd/server'
import { data } from './data'

createServer(
  data
    .addRules('bar', [
      {
        payload: 123,
      },
    ])
    .addRules('foo', [
      {
        targeting: {
          device: ['mobile'],
        },
        payload: '‍📱',
      },
      {
        targeting: {
          device: ['desktop'],
        },
        payload: '🖥',
      },
    ]),
).listen(3_000)
```

```typescript
// ./client.ts
import { Client } from '@targetd/client'
import z from 'zod'
import { data } from './data'

const client = new Client('http://localhost:3000', data)

expect(await clientData.getPayloadForEachName({ device: 'mobile' })).toEqual({
  bar: 123,
  foo: '‍📱',
})

expect(await clientData.getPayloadForEachName({ device: 'desktop' })).toEqual({
  bar: 123,
  foo: '🖥',
})
```

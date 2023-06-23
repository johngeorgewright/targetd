# @targetd/client

> A HTTP typed client to query a @targetd/server

## Example

```typescript
// ./device.ts
import { createTargetingDescriptor } from '@targetd/api'
import { z } from 'zod'

export const Device = z.literal('desktop').or(z.literal('mobile'))

export const deviceTargeting = createTargetingDescriptor({
  predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
  queryValidator: Device,
  targetingValidator: z.array(Device),
})
```

```typescript
// ./data.ts
import { Data } from '@targetd/api'
import z from 'zod'
import { deviceTargeting } from './device'

export const data = Data.create()
  .useDataValidator('bar', z.number())
  .useDataValidator('foo', z.string())
  .useTargeting('device', deviceTargeting)
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
    ])
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

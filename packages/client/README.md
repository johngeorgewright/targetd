# @targetd/client

## DEPRECATED

All this package was made for can now be done with `Data.insert()`.

> Using results from @targetd/server.

Sometimes you can't rely on one data service to fulfil all the target filtering. For example, a server providing data might not be able to target by device. Therefore @targetd provides the option to pass targeting to the next phase (or the "client").

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
import { Device } from './device'

export const data = Data.create()
  .useDataValidator('bar', z.number())
  .useDataValidator('foo', z.string())
```

```typescript
// ./serverData.ts
import { data } from './data'

export const serverData = data
  .useClientTargeting('device', deviceTargeting)
  .addRules('bar', [
    {
      payload: 123,
    },
  ])
  .addRules('foo', [
    {
      client: [
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
      ],
    },
  ])
```

```typescript
// ./clientData.ts
import { ClientData } from '@targetd/client'
import z from 'zod'
import { data } from './data'
import { deviceTargeting } from './device'
import { serverData } from './serverData'

const clientData = new ClientData(
  data.useTargeting('device', deviceTargeting)
).add(await serverData.getPayloadForEachName())

expect(await clientData.getPayloadForEachName({ device: 'mobile' })).toEqual({
  bar: 123,
  foo: '‍📱',
})

expect(await clientData.getPayloadForEachName({ device: 'desktop' })).toEqual({
  bar: 123,
  foo: '🖥',
})
```

# @targetd/client

> Using results from @targetd/server.

Sometimes you can't rely on one data service to fulfil all the target filtering. For example, a server providing data might not be able to target by device. Therefore @targetd provides the option to pass targeting to the next phase (or the "client").

## Example

```typescript
import { Data } from '@targetd/api'
import { ClientData } from '@targetd/client'
import z from 'zod'

const Device = z.literal('desktop').or(z.literal('mobile'))

const data = Data.create()
  .useDataValidator('bar', z.number())
  .useDataValidator('foo', z.string())
  .useTargeting('device', {
    predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
    queryValidator: Device,
    targetingValidator: z.array(Device),
  })

const serverData = data
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

const clientData = new ClientData(data).add(
  await serverData.getPayloadForEachName({})
)

expect(await clientData.getPayloadForEachName({ device: 'mobile' })).toEqual({
  bar: 123,
  foo: '‍📱',
})

expect(await clientData.getPayloadForEachName({ device: 'desktop' })).toEqual({
  bar: 123,
  foo: '🖥',
})
```

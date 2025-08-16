# @targetd/explode

## Installation

| JS Runtime | Command                                          |
| ---------- | ------------------------------------------------ |
| Node.js    | `npx jsr add @targetd/api @targetd/explode`      |
| Bun        | `bunx jsr add @targetd/api @targetd/explode`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/explode` |

Use this package if you wish to explode your payloads in to a nested object.

Targetd is a key/value store. You may want to use a dot, for exmaple, to
represent nested/namespaced properties in the name.

```typescript
import { explode } from '@targetd/explode'

await data.addRules([
  {
    name: 'foo.bar',
    payload: 'something',
  },
  {
    name: 'foo.otherthing',
    payload: 'something else',
  },
])

console.info(explode(await data.getPayloadForEachName(), '.'))
/*
{
  foo: {
    bar: 'something',
    otherthing: 'something else'
  }
}
*/
```

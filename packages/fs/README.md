# @targetd/fs

> Load rules from JSON and YAML files

## Installation

| JS Runtime | Command                                     |
| ---------- | ------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/fs`      |
| Bun        | `bunx jsr add @targetd/api @targetd/fs`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/fs` |

## Example

```json
/* rules/foo.json */
{
  "foo": [
    {
      "payload": "bar"
    }
  ]
}
```

```yaml
# rules/b.yaml
b:
  - payload: b is a letter
```

```typescript
import { Data } from '@targetd/api'
import { watch } from '@targetd/fs'
import * as path from 'node:path'
import z from 'zod'

watch(
  await Data
    .create()
    .usePayload({
      foo: z.string(),
      b: z.string(),
    }),
  path.join(__dirname, 'rules'),
  async (data) => {
    expect(await data.getPayload('foo', {})).toBe('bar')
    expect(await data.getPayload('b', {})).toBe('b is a letter')
  },
)
```

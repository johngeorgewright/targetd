# @targetd/fs

> Load rules from JSON and YAML files

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
# rules/d.yaml
b:
  - payload: b is a letter
```

```typescript
import { Data, zod as z } from '@targetd/api'
import { load } from '@targetd/fs'
import * as path from 'node:path'

const data = await load(
  Data.create()
    .useDataValidator('foo', z.string())
    .useDataValidator('b', z.string()),
  path.join(__dirname, 'data')
)

expect(await data.getPayload('foo', {})).toBe('bar')
expect(await data.getPayload('b', {})).toBe('b is a letter')
```

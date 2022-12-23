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
import { Data } from '@targetd/api'
import { load } from '@targetd/fs'
import * as path from 'node:path'

const data = await load(
  Data.create()
    .useDataValidator('foo', rt.String)
    .useDataValidator('b', rt.String),
  path.join(__dirname, 'data')
)

expect(await data.getPayload('foo', {})).toBe('bar')
expect(await data.getPayload('b', {})).toBe('b is a letter')
```

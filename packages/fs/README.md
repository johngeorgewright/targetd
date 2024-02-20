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
import { watch } from '@targetd/fs'
import * as path from 'node:path'
import z from 'zod'

watch(
  Data.create().useData('foo', z.string()).useData('b', z.string()),

  path.join(__dirname, 'rules'),

  async (data) => {
    expect(await data.getPayload('foo', {})).toBe('bar')
    expect(await data.getPayload('b', {})).toBe('b is a letter')
  },
)
```

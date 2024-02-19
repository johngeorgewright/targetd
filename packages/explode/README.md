# @targetd/explode

Use this package if you wish to explode your payloads in to a nest object.

Targetd is a key/value store. You may want to use a dot, for exmaple, to represent nested/namespaced properties in the name.

```typescript
import { explode } from '@targetd/explode'

data.addRules([
  {
    name: 'foo.bar',
    payload: 'something',
  },
  {
    name: 'foo.otherthing',
    payload: 'something else',
  },
])

console.info(explode(data.getPayloadForEachName(), '.'))
/*
{
  foo: {
    bar: 'something',
    otherthing: 'something else'
  }
}
*/
```

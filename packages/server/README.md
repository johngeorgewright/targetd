# @targetd/server

> HTTP server for targetd data

## Exammple

```typescript
import { Data } from '@targetd/api'
import { createServer } from '@targetd/server'

const data = Data.create()
  .useDataValidator('foo', rt.String)
  .useDataValidator('b', rt.String)

createServer(data).listen(8080)
```

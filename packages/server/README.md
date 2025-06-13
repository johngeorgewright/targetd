# @targetd/server

> HTTP server for targetd data

## Installation

| JS Runtime | Command                                     |
| ---------- | ------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/server`  |
| Bun        | `bunx jsr add @targetd/api @targetd/server` |
| Deno       | `deno add @targetd/api @targetd/server`     |

## Exammple

```typescript
import { Data } from '@targetd/api',
import { createServer } from '@targetd/server'
import z from 'zod'

const data = Data.create({
  data: {
    foo: z.string(),
    b: z.string()
  }
})

createServer(data).listen(8080)
```

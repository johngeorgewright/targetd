# @targetd/server

HTTP server for serving [@targetd/api](https://jsr.io/@targetd/api) targeting
data over REST endpoints.

## Installation

| JS Runtime | Command                                         |
| ---------- | ----------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/server`      |
| Bun        | `bunx jsr add @targetd/api @targetd/server`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/server` |

## Overview

`@targetd/server` creates an Express-based HTTP server that exposes your
[@targetd/api](https://jsr.io/@targetd/api) Data instance via REST endpoints.
Clients can query targeted payloads using query parameters.

Key features:

- **REST API**: Standard HTTP endpoints for querying data
- **Query parameters**: Pass targeting queries via URL parameters
- **CORS enabled**: Ready for cross-origin requests
- **Type-safe**: Works seamlessly with
  [@targetd/client](https://jsr.io/@targetd/client)
- **Express-based**: Built on Express for easy integration and middleware
  support

## Basic Usage

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { createServer } from '@targetd/server'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    greeting: z.string(),
    config: z.object({
      enabled: z.boolean(),
    }),
  })
  .useTargeting({
    country: targetIncludes(z.string()),
  })
  .addRules('greeting', [
    {
      targeting: { country: ['US'] },
      payload: 'Hello!',
    },
    {
      targeting: { country: ['ES'] },
      payload: '¡Hola!',
    },
    {
      payload: 'Hi!',
    },
  ])
  .addRules('config', [
    {
      payload: { enabled: true },
    },
  ])

const server = createServer(data)
server.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

## API Endpoints

The server exposes three main endpoints:

### `GET /:name`

Get a single payload by name with optional query parameters.

**Example requests:**

```bash
# Get default payload
curl http://localhost:3000/greeting

# Get targeted payload
curl http://localhost:3000/greeting?country=US
```

**Responses:**

- `200 OK`: Returns the matched payload as JSON
- `204 No Content`: Payload exists but no rule matched
- `404 Not Found`: Payload name doesn't exist

### `GET /`

Get all payloads at once with optional query parameters.

**Example requests:**

```bash
# Get all default payloads
curl http://localhost:3000/

# Get all payloads with targeting
curl http://localhost:3000/?country=US
```

**Response:**

```json
{
  "greeting": "Hello!",
  "config": {
    "enabled": true
  }
}
```

### `GET /:param1/:param2/...` (with pathStructure)

Create custom routes using path parameters instead of query parameters.

**Example:**

```typescript
const server = createServer(data, {
  pathStructure: ['country', 'device'],
})

server.listen(3000)
```

**Request:**

```bash
curl http://localhost:3000/US/mobile
```

This is equivalent to: `/?country=US&device=mobile`

## API Reference

### `createServer(data, options?)`

Creates an Express server with targeting endpoints.

**Parameters:**

- `data`: Data instance or function returning Data (for dynamic data)
- `options` (optional):
  - `app`: Existing Express app to extend (creates new one if not provided)
  - `pathStructure`: Array of query parameter names to use as path segments

**Returns:** Express application instance

## Complete Examples

### Basic Server

```typescript
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import { createServer } from '@targetd/server'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    banner: z.string(),
    feature: z.object({
      enabled: z.boolean(),
      maxUsers: z.number(),
    }),
  })
  .useTargeting({
    platform: targetIncludes(z.string()),
    isPremium: targetEquals(z.boolean()),
  })
  .addRules('banner', [
    {
      targeting: { platform: ['mobile'] },
      payload: '📱 Mobile Banner',
    },
    {
      targeting: { platform: ['desktop'] },
      payload: '🖥 Desktop Banner',
    },
    {
      payload: 'Default Banner',
    },
  ])
  .addRules('feature', [
    {
      targeting: { isPremium: true },
      payload: { enabled: true, maxUsers: 1000 },
    },
    {
      payload: { enabled: true, maxUsers: 10 },
    },
  ])

createServer(data).listen(3000)
```

**Usage:**

```bash
# Get mobile banner
curl http://localhost:3000/banner?platform=mobile
# Returns: "📱 Mobile Banner"

# Get feature config for premium users
curl http://localhost:3000/feature?isPremium=true
# Returns: {"enabled": true, "maxUsers": 1000}

# Get all payloads for mobile platform
curl http://localhost:3000/?platform=mobile
# Returns: {"banner": "📱 Mobile Banner", "feature": {"enabled": true, "maxUsers": 10}}
```

### Dynamic Data with Hot Reloading

Use a function to provide data for dynamic updates:

```typescript
import { Data } from '@targetd/api'
import { watch } from '@targetd/fs'
import { createServer } from '@targetd/server'

let currentData = await Data.create()
  .usePayload({
    content: z.string(),
  })

// Watch for file changes
watch(baseData, './rules', (error, updatedData) => {
  if (!error) {
    currentData = updatedData
    console.log('Rules updated')
  }
})

// Server always uses latest data
const server = createServer(() => currentData)
server.listen(3000)
```

### Custom Path Structure

Create REST-friendly URLs using path parameters:

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { createServer } from '@targetd/server'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    content: z.string(),
  })
  .useTargeting({
    region: targetIncludes(z.string()),
    language: targetIncludes(z.string()),
  })
  .addRules('content', [
    {
      targeting: {
        region: ['US'],
        language: ['en'],
      },
      payload: 'US English content',
    },
    {
      targeting: {
        region: ['US'],
        language: ['es'],
      },
      payload: 'US Spanish content',
    },
    {
      payload: 'Default content',
    },
  ])

const server = createServer(data, {
  pathStructure: ['region', 'language'],
})

server.listen(3000)
```

**Usage:**

```bash
# RESTful URLs
curl http://localhost:3000/US/en
# Returns: {"content": "US English content"}

curl http://localhost:3000/US/es
# Returns: {"content": "US Spanish content"}
```

### With Existing Express App

Integrate into an existing Express application:

```typescript
import express from 'express'
import { Data } from '@targetd/api'
import { createServer } from '@targetd/server'

const app = express()

// Your existing routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Add targetd endpoints
const data = await Data.create()
  .usePayload({ config: z.object({ version: z.string() }) })
  .addRules('config', [{ payload: { version: '1.0.0' } }])

createServer(data, { app })

app.listen(3000)
```

Now you have both your custom routes and targetd endpoints on the same server.

### Date Range Targeting

Combine with [@targetd/date-range](https://jsr.io/@targetd/date-range) for
time-based content:

```typescript
import { Data } from '@targetd/api'
import { createServer } from '@targetd/server'
import dateRangeTargeting from '@targetd/date-range'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    campaign: z.string(),
  })
  .useTargeting({
    date: dateRangeTargeting,
  })
  .addRules('campaign', [
    {
      targeting: {
        date: {
          start: '2024-12-01',
          end: '2024-12-31',
        },
      },
      payload: '🎄 Holiday Campaign',
    },
    {
      payload: 'Regular Campaign',
    },
  ])

createServer(data).listen(3000)
```

**Usage:**

```bash
# Automatic current date evaluation
curl http://localhost:3000/campaign

# Historical query
curl 'http://localhost:3000/campaign?date[start]=2024-12-15'
```

### Complex Query Parameters

Handle nested and array query parameters:

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { createServer } from '@targetd/server'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    recommendations: z.array(z.string()),
  })
  .useTargeting({
    interests: targetIncludes(z.string()),
  })
  .addRules('recommendations', [
    {
      targeting: { interests: ['sports'] },
      payload: ['Football News', 'Basketball Scores'],
    },
    {
      targeting: { interests: ['tech'] },
      payload: ['Latest Gadgets', 'Programming Tips'],
    },
    {
      payload: ['General News'],
    },
  ])

createServer(data).listen(3000)
```

**Usage:**

```bash
# Query with interests
curl 'http://localhost:3000/recommendations?interests=sports'
# Returns: ["Football News", "Basketball Scores"]

# Get all with interests
curl 'http://localhost:3000/?interests=tech'
# Returns: {"recommendations": ["Latest Gadgets", "Programming Tips"]}
```

## Error Handling

The server includes built-in error handling:

### 400 Bad Request

Returned when query parameters fail validation:

```bash
curl 'http://localhost:3000/content?invalidParam=value'
```

Response:

```json
{
  "name": "$ZodError",
  "message": "[{\"code\":\"unrecognized_keys\",\"path\":[],\"message\":\"Unrecognized key(s) in object: 'invalidParam'\"}]"
}
```

### 404 Not Found

Returned when payload name doesn't exist:

```bash
curl http://localhost:3000/nonexistent
```

Response:

```json
{
  "name": "StatusError",
  "message": "Unknown data property nonexistent"
}
```

### 204 No Content

Returned when payload exists but no rule matched:

```typescript
// If no rule matches and no default rule exists
curl http://localhost:3000/content?neverMatchingCondition=true
// Returns: 204 No Content (empty response)
```

## CORS Configuration

CORS is enabled by default. For custom CORS configuration, use an existing
Express app:

```typescript
import express from 'express'
import cors from 'cors'
import { createServer } from '@targetd/server'

const app = express()

// Custom CORS
app.use(cors({
  origin: 'https://example.com',
  credentials: true,
}))

createServer(data, { app })
```

## Working with @targetd/client

The server is designed to work seamlessly with
[@targetd/client](https://jsr.io/@targetd/client):

**Server:**

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { createServer } from '@targetd/server'

export const data = await Data.create()
  .usePayload({ greeting: z.string() })
  .useTargeting({ country: targetIncludes(z.string()) })
  .addRules('greeting', [
    { targeting: { country: ['US'] }, payload: 'Hello!' },
    { payload: 'Hi!' },
  ])

createServer(data).listen(3000)
```

**Client:**

```typescript
import { Client } from '@targetd/client'
import { data } from './server.ts' // Share type definition

const client = new Client('http://localhost:3000', data)

const greeting = await client.getPayload('greeting', { country: 'US' })
// Fully type-safe!
```

## Deployment

### Production Setup

```typescript
import { Data } from '@targetd/api'
import { load } from '@targetd/fs'
import { createServer } from '@targetd/server'

const data = await load(
  baseData,
  process.env.RULES_DIR || './rules',
)

const port = process.env.PORT || 3000

createServer(data).listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
```

### Docker

```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Best Practices

1. **Use functions for dynamic data**: Pass a function to `createServer()` when
   data changes
2. **Share type definitions**: Export and reuse Data definitions between server
   and client
3. **Error handling**: Server includes comprehensive error handling by default
4. **Path structure**: Use `pathStructure` for REST-friendly URLs
5. **CORS**: Default CORS works for most cases, customize if needed
6. **Environment variables**: Configure port and paths via environment variables

## Related Packages

- [@targetd/api](https://jsr.io/@targetd/api) - Core targeting and data querying
  API
- [@targetd/client](https://jsr.io/@targetd/client) - Type-safe HTTP client for
  querying servers
- [@targetd/fs](https://jsr.io/@targetd/fs) - Load rules from JSON/YAML files
- [@targetd/date-range](https://jsr.io/@targetd/date-range) - Date range
  targeting descriptor

## License

See [LICENSE](./LICENSE) file for details.

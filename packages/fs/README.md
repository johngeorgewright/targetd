# @targetd/fs

Load and watch [@targetd/api](https://jsr.io/@targetd/api) rules from JSON and
YAML files.

## Installation

| JS Runtime | Command                                     |
| ---------- | ------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/fs`      |
| Bun        | `bunx jsr add @targetd/api @targetd/fs`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/fs` |

## Overview

`@targetd/fs` provides utilities to load targeting rules from the filesystem,
enabling:

- **External configuration**: Store rules in separate JSON/YAML files
- **Hot reloading**: Automatically reload rules when files change
- **Version control**: Track rule changes in your repository
- **Team collaboration**: Non-developers can edit rules in familiar formats
- **Recursive loading**: Organize rules in nested directory structures

## Basic Usage

### File Structure

Organize your rules in a directory structure:

```
rules/
├── features.json
├── content.yaml
└── regional/
    ├── us.json
    └── eu.yaml
```

### File Format

Each file should export an object where keys are payload names and values are
rule definitions:

**JSON format:**

```json
{
  "greeting": {
    "rules": [
      {
        "targeting": {
          "country": ["US"]
        },
        "payload": "Hello!"
      },
      {
        "payload": "Hi!"
      }
    ]
  }
}
```

**YAML format:**

```yaml
greeting:
  rules:
    - targeting:
        country: [US]
      payload: Hello!
    - payload: Hi!
```

### Loading Rules Once

Use `load()` to read rules from a directory once:

```typescript
import { Data } from '@targetd/api'
import { load } from '@targetd/fs'
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

// Load rules from directory
const dataWithRules = await load(data, './rules')

const greeting = await dataWithRules.getPayload('greeting', { country: 'US' })
// Returns: 'Hello!'
```

### Watching for Changes

Use `watch()` to automatically reload rules when files change:

```typescript
import { Data } from '@targetd/api'
import { watch } from '@targetd/fs'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    greeting: z.string(),
  })
  .useTargeting({
    country: targetIncludes(z.string()),
  })

// Watch directory and reload on changes
const stopWatching = watch(
  data,
  './rules',
  (error, updatedData) => {
    if (error) {
      console.error('Failed to load rules:', error)
      return
    }

    console.log('Rules reloaded!')
    // Use updatedData which contains the latest rules
  },
)

// Later: stop watching
stopWatching()
```

## API

### `load(data, directory)`

Loads rules from all `.json`, `.yaml`, and `.yml` files in a directory
(recursively).

**Parameters:**

- `data`: A Data instance to add rules to
- `directory`: Path to the directory containing rule files

**Returns:** Promise of Data instance with loaded rules

```typescript
const dataWithRules = await load(data, './rules')
```

### `watch(data, directory, [options], onLoad)`

Watches a directory for changes and reloads rules automatically.

**Parameters:**

- `data`: A Data instance to add rules to
- `directory`: Path to the directory to watch
- `options` (optional): Node.js `fs.WatchOptions`
- `onLoad`: Callback function called when rules are loaded or changed

**Returns:** Function to stop watching

```typescript
const stopWatching = watch(data, './rules', (error, data) => {
  // Handle loaded data
})
```

The `onLoad` callback receives:

- `error`: Error object if loading failed, null otherwise
- `data`: Updated Data instance with the latest rules

## Complete Examples

### Basic Application Setup

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { load } from '@targetd/fs'
import { z } from 'zod'
import * as path from 'node:path'

// Define data structure
const data = await Data.create()
  .usePayload({
    'app.title': z.string(),
    'app.version': z.string(),
    'feature.enabled': z.boolean(),
  })
  .useTargeting({
    environment: targetIncludes(z.string()),
  })

// Load rules from filesystem
const appData = await load(
  data,
  path.join(import.meta.dirname, 'config'),
)

// Query data
const config = await appData.getPayloadForEachName({
  environment: 'production',
})
console.log(config)
```

**config/app.json:**

```json
{
  "app.title": {
    "rules": [
      { "payload": "My Application" }
    ]
  },
  "app.version": {
    "rules": [
      { "payload": "1.0.0" }
    ]
  }
}
```

**config/features.yaml:**

```yaml
feature.enabled:
  rules:
    - targeting:
        environment: [production]
      payload: true
    - payload: false
```

### Hot Reloading in Development

```typescript
import { Data, targetIncludes } from '@targetd/api'
import { watch } from '@targetd/fs'
import { z } from 'zod'

let currentData: Data<any>

const data = await Data.create()
  .usePayload({
    feature: z.object({
      name: z.string(),
      enabled: z.boolean(),
    }),
  })
  .useTargeting({
    environment: targetIncludes(z.string()),
  })

// Watch for changes during development
const stopWatching = watch(
  data,
  './rules',
  (error, updatedData) => {
    if (error) {
      console.error('Error loading rules:', error)
      return
    }

    currentData = updatedData
    console.log('✓ Rules reloaded')
  },
)

// Your application uses currentData
async function getFeature(environment: string) {
  return await currentData.getPayload('feature', { environment })
}

// Clean up when shutting down
process.on('SIGINT', () => {
  stopWatching()
  process.exit()
})
```

### With Variables

Variables are supported in rule files:

> **Note:** Variables are replaced with their payload values directly—they
> cannot be interpolated into strings.

```yaml
greeting:
  variables:
    userType:
      - targeting:
          tier: [premium]
        payload: premium-greeting
      - payload: standard-greeting
  rules:
    - targeting:
        country: [US]
      payload: '{{userType}}'
```

```typescript
const data = await Data.create()
  .usePayload({
    greeting: z.string(),
  })
  .useTargeting({
    country: targetIncludes(z.string()),
    tier: targetIncludes(z.string()),
  })

const dataWithRules = await load(data, './rules')

await dataWithRules.getPayload('greeting', {
  country: 'US',
  tier: 'premium',
})
// Returns: "premium-greeting"

await dataWithRules.getPayload('greeting', {
  country: 'US',
})
// Returns: "standard-greeting"
```

## Watch Options

The `watch` function accepts Node.js `fs.WatchOptions`:

```typescript
watch(
  data,
  './rules',
  {
    persistent: true,
    recursive: true,
    encoding: 'utf8',
  },
  (error, data) => {
    // Handle updates
  },
)
```

## File Discovery

The loader automatically finds and processes:

- `.json` files (parsed as JSON)
- `.yaml` files (parsed as YAML)
- `.yml` files (parsed as YAML)

All files are loaded recursively from subdirectories.

## Error Handling

### Load Errors

```typescript
try {
  const dataWithRules = await load(data, './rules')
} catch (error) {
  console.error('Failed to load rules:', error)
  // Handle: file not found, invalid JSON/YAML, schema validation errors
}
```

### Watch Errors

```typescript
watch(data, './rules', (error, data) => {
  if (error) {
    // Handle: file read errors, parse errors, validation errors
    console.error('Error:', error.message)
    return
  }

  // Successful load
})
```

## Best Practices

1. **Version Control**: Commit rule files to track changes over time
2. **Validation**: Ensure your Data schema validates loaded rules
3. **Organization**: Use subdirectories to group related rules
4. **Hot Reloading**: Use `watch()` in development, `load()` in production
5. **Error Handling**: Always handle errors in the `watch` callback
6. **Cleanup**: Stop watchers when your application shuts down

## Related Packages

- [@targetd/api](https://jsr.io/@targetd/api) - Core targeting and data querying
  API
- [@targetd/server](https://jsr.io/@targetd/server) - HTTP server for serving
  targeted data
- [@targetd/client](https://jsr.io/@targetd/client) - Type-safe HTTP client for
  querying servers

## License

See [LICENSE](./LICENSE) file for details.

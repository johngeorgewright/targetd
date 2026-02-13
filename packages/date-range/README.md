# @targetd/date-range

A time-based targeting descriptor for
[@targetd/api](https://jsr.io/@targetd/api) that enables content delivery based
on date ranges.

## Installation

| JS Runtime | Command                                             |
| ---------- | --------------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/date-range`      |
| Bun        | `bunx jsr add @targetd/api @targetd/date-range`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/date-range` |

## Overview

`@targetd/date-range` provides a ready-to-use targeting descriptor that
evaluates date ranges. It's useful for:

- **Time-limited campaigns**: Launch features or content within specific date
  ranges
- **Event-based content**: Show content during events or time periods
- **Scheduled releases**: Automatically enable/disable features based on dates
- **Historical queries**: Query what content would have been shown at any point
  in time

The descriptor automatically uses the current system time when no query is
provided, making it perfect for real-time targeting.

## Basic Usage

```typescript
import { Data } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    banner: z.string(),
  })
  .useTargeting({
    dateRange: dateRangeTargeting,
  })
  .addRules('banner', [
    {
      targeting: {
        dateRange: {
          start: '2024-12-01',
          end: '2024-12-31',
        },
      },
      payload: '🎄 Holiday Sale!',
    },
    {
      targeting: {
        dateRange: {
          start: '2025-01-01',
        },
      },
      payload: '🎉 New Year Special!',
    },
    {
      payload: 'Regular banner',
    },
  ])

// Query with current system time
const currentBanner = await data.getPayload('banner')
// Returns the banner matching the current date/time
```

## Date Range Format

Date ranges use ISO 8601 format and support both dates and date-times:

```typescript
// Date only (YYYY-MM-DD)
{ start: '2024-12-01', end: '2024-12-31' }

// Date with time (YYYY-MM-DDTHH:mm:ss)
{ start: '2024-12-01T00:00:00', end: '2024-12-31T23:59:59' }

// With timezone offset
{ start: '2024-12-01T00:00:00Z', end: '2024-12-31T23:59:59-05:00' }

// Open-ended ranges
{ start: '2024-12-01' }  // From date onwards
{ end: '2024-12-31' }    // Up to date
```

## Usage Patterns

### 1. Automatic Current Time Evaluation

By default, queries without a `dateRange` parameter use the current system time:

```typescript
.addRules('content', [
  {
    targeting: {
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    },
    payload: '2024 content'
  },
  {
    payload: 'Default content'
  }
])

// Uses current system time automatically
const content = await data.getPayload('content')
```

### 2. Historical Queries

Query what content would have been shown at any point in time:

```typescript
// What was shown in 1940?
const wwiiContent = await data.getPayload('content', {
  dateRange: { start: '1940-01-01', end: '1940-12-31' },
})
```

### 3. Time-Limited Features

Enable features only during specific periods:

```typescript
.addRules('feature', [
  {
    targeting: {
      dateRange: {
        start: '2024-11-25T00:00:00',
        end: '2024-11-29T23:59:59'
      }
    },
    payload: { enabled: true, discount: 0.5 }
  },
  {
    payload: { enabled: false }
  }
])
```

### 4. Open-Ended Ranges

Create rules that start or end at a specific time:

```typescript
.addRules('pricing', [
  {
    // Pricing effective from this date forward
    targeting: {
      dateRange: {
        start: '2025-01-01'
      }
    },
    payload: { price: 99.99 }
  },
  {
    // Legacy pricing (before 2025)
    payload: { price: 79.99 }
  }
])
```

### 5. Multiple Date Ranges

Target multiple date ranges with an array:

```typescript
.addRules('seasonalContent', [
  {
    targeting: {
      dateRange: [
        { start: '2024-06-01', end: '2024-08-31' },  // Summer
        { start: '2024-12-01', end: '2024-12-31' }   // Holiday
      ]
    },
    payload: 'Seasonal special content'
  },
  {
    payload: 'Regular content'
  }
])
```

## Complete Example

Here's a comprehensive example showing event-based content delivery:

```typescript
import { Data } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { z } from 'zod'

const data = await Data.create()
  .usePayload({
    event: z.object({
      name: z.string(),
      message: z.string(),
      active: z.boolean(),
    }),
  })
  .useTargeting({
    dateRange: dateRangeTargeting,
  })
  .addRules('event', [
    {
      targeting: {
        dateRange: {
          start: '1939-09-01',
          end: '1945-09-02',
        },
      },
      payload: {
        name: 'World War II',
        message: 'Historical period: 1939-1945',
        active: true,
      },
    },
    {
      targeting: {
        dateRange: {
          start: '2020-01-01T00:00:00',
        },
      },
      payload: {
        name: 'Modern Era',
        message: 'Welcome to the 2020s',
        active: true,
      },
    },
    {
      payload: {
        name: 'No Active Event',
        message: 'No special event during this period',
        active: false,
      },
    },
  ])

// Query with current time
const currentEvent = await data.getPayload('event')
// Returns event matching current date/time

// Query historical period
const historicalEvent = await data.getPayload('event', {
  dateRange: { start: '1942-01-01', end: '1942-12-31' },
})
// Returns: { name: 'World War II', message: '...', active: true }

// Query future period
const futureEvent = await data.getPayload('event', {
  dateRange: { start: '2025-06-01' },
})
// Returns: { name: 'Modern Era', message: '...', active: true }
```

## How It Works

The date range predicate evaluates whether query and target ranges overlap:

- **No query provided**: Uses current system time
- **Query with range**: Checks if query range overlaps with target range
- **Multiple target ranges**: Returns true if query overlaps with any target
  range

### Range Overlap Logic

Two ranges overlap if:

- Query start is before target end (or target has no end)
- Query end is after target start (or target has no start)

```typescript
// These ranges overlap:
query:  { start: '2024-06-01', end: '2024-06-30' }
target: { start: '2024-06-15', end: '2024-07-15' }

// These do NOT overlap:
query:  { start: '2024-06-01', end: '2024-06-30' }
target: { start: '2024-07-01', end: '2024-07-31' }
```

## Related Packages

- [@targetd/api](https://jsr.io/@targetd/api) - Core targeting and data querying
  API
- [@targetd/server](https://jsr.io/@targetd/server) - HTTP server for serving
  targeted data
- [@targetd/client](https://jsr.io/@targetd/client) - Type-safe HTTP client for
  querying servers

## License

See [LICENSE](./LICENSE) file for details.

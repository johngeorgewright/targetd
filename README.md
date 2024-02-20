[zod]: https://github.com/colinhacks/zod

# @targetd

A speedy, highly extensible, typed, in-memory data store built in Node.js & Typescript.

It's perfect for storing any shape of data that can be "targeted" with key/values.

## When to use @targetd

- Configuration
- Small blogs/websites

## When _not_ to use @targetd

- With big data
- For tokenising/searching data

## How it works

All data is stored in a list of "rules". Each rule contains a "name", "payload" and an optional "targeting" property that can be "queried".

All payloads, targeting & queries are typed & validated at runtime & compile time.

An example rule:

```json
{
  "name": "blog",
  "payload": {
    "title": "A news thing",
    "body": "Here's the body"
  },
  "targeting": {
    "category": ["news", "weather"]
  }
}
```

The above example shows a payload which will **only** be found when a query will match it's targeting structure.

**BEFORE GOING FURTHER** please note that the `Data` class is entirely immutable meaning that you must use the returned value of every function. For exampe:

```typescript
import { Data } from '@targetd/api'

// THE BELOW IS INCORRECT!!! the data object has not had any targeting or rules added
const data = Data.create()
data.useTargeting(...)
data.addRules(...)

// ✅ This is better.
const data = Data.create()
  .useTargeting(...)
  .addRules(...)

// ... or you can do this
let data = Data.create()
data = data.useTargeting(...)
data = data.addRules(...)
```

### Typing Data (payloads)

All typing and validation is done using the awesome [zod][] project and is exported from the `@targetd/api` package. [Zod][zod] is an easy project to understand and you'll need to know some of the basics.

```typescript
import { Data } from '@targetd/api'
import z from 'zod'

let data = Data.create().useData(
  'blog',
  z.strictObject({
    title: z.string(),
    body: z.string(),
  }),
)
```

Now I can safely add some rules. Without the above, however, you'll receive an error that you cannot add to the 'blog' data type.

```typescript
data = data.addRules([
  {
    name: 'blog',
    payload: {
      title: 'A news thing',
      body: "Here's the body",
    },
  },
])
```

### Typing Targeting

As mentioned above, all typing and validation is done using the [zod][] project.

```typescript
data = data.useTargeting('category', {
  // Restrict queries to be string
  queryParser: z.string(),

  // Restrict stored targeting values as an array of "news" or "weather"
  targetingParser: z.array(z.enum(['news', 'weather'])),

  // The targeting logic
  predicate: (query) => (targeting) => targeting.includes(query),
})
```

Now one can safely target by `category` without receiving an error.

```typescript
data = data.addRules([
  {
    name: 'blog',
    payload: {
      title: 'A news thing',
      body: "Here's the body",
    },
    targeting: {
      category: ['news', 'weather'],
    },
  },
])
```

### Querying Data

```typescript
console.info(
  data.getPayload('blog', { category: 'news' }),
  // This will find the **first** rule that matches the query
)
// { title: 'A new thing', body: "Here's the body" }
```

### Fall through payloads

Sometimes you may not be able to successfully target certain payloads in one service. When this happens you'll need to allow targeted payloads to "fall through" to the next service. To allow this to happen, you can add "fall through" targeting.

```typescript
// data.ts
import { Data } from '@targetd/api'

export const data = Data.create().useData('foo', z.string())
```

```typescript
// service-1.ts
import { targetIncludes } from '@targeted/api'
import { z } from 'zod'
import { data } from './data'

export const service1Data = data
  .useTargeting('weather', targetIncludes(z.string()))
  .useFallthroughTargeting('browser', targetIncludes(z.string()))
  .addRules('foo', [
    {
      targeting: {
        // Targeting "browser" cannot be targeted by this server
        // and therefore will be passed to service-2
        browser: ['chrome'],
        weather: ['sunny'],
      },
      payload: 'Chrome and sunny',
    },
  ])
```

```typescript
// service-2.ts
import { targetIncludes } from '@targeted/api'
import { z } from 'zod'
import { data } from './data'

export const service2Data = data
  .useTargeting('browser', targetIncludes(z.string()))
  .insert(data.getPayloadForEachName({ weather: 'sunny' }))
```

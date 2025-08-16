import { assertEquals } from 'jsr:@std/assert'
import { type Explode, explode } from '@targetd/explode'

Deno.test('Explode', () => {
  function check(
    x: Explode<
      {
        'foo.bar': 'something'
        'a.b.c.d.e.f': 'g'
        'a.b.c.d.e.g': 'h'
      },
      '.'
    >,
  ) {
    return x
  }

  check({
    foo: {
      bar: 'something',
    },
    a: {
      b: {
        c: {
          d: {
            e: {
              f: 'g',
              g: 'h',
            },
          },
        },
      },
    },
  })

  check({
    foo: {
      bar: 'something',
    },
    a: {
      b: {
        c: {
          d: {
            e: {
              // @ts-expect-error Type '"h"' is not assignable to type '"f"'.
              f: 'h',
              // @ts-expect-error Type '"g"' is not assignable to type '"g"'.
              g: 'g',
            },
          },
        },
      },
    },
  })
})

Deno.test('explode()', () => {
  assertEquals(
    explode(
      {
        'foo.bar': 'something',
        'a.b.c.d.e.f': 'g',
        'a.b.c.d.e.g': 'h',
      },
      '.',
    ),
    {
      foo: {
        bar: 'something',
      },
      a: {
        b: {
          c: {
            d: {
              e: {
                f: 'g',
                g: 'h',
              },
            },
          },
        },
      },
    },
  )
})

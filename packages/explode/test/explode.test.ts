import { Explode, explode } from '../src'

test('Explode', () => {
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
              // @ts-expect-error Type '"h"' is not assignable to type '"g"'.
              f: 'h',
              // @ts-expect-error Type '"g"' is not assignable to type '"h"'.
              g: 'g',
            },
          },
        },
      },
    },
  })
})

test('explode()', () => {
  expect(
    explode(
      {
        'foo.bar': 'something',
        'a.b.c.d.e.f': 'g',
        'a.b.c.d.e.g': 'h',
      },
      '.',
    ),
  ).toEqual({
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
})

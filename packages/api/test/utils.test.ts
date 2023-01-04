import { arrayInit, arrayLast, objectEveryAsync, objectMap } from '../src/util'

test('objectMap', () => {
  expect(
    objectMap(
      {
        foo: 123,
        bar: 321,
      },
      (v) => v + 1
    )
  ).toEqual({
    foo: 124,
    bar: 322,
  })
})

test('objectEveryAsync', async () => {
  expect(
    await objectEveryAsync(
      {
        foo: 1,
        bar: 2,
        goo: 3,
        car: 4,
      },
      (_key, value) => Promise.resolve(value).then((v) => v > 2)
    )
  ).toBe(false)
  expect(
    await objectEveryAsync(
      {
        foo: 1,
        bar: 2,
        goo: 3,
        car: 4,
      },
      (_key, value) => Promise.resolve(value).then((v) => v > 0)
    )
  ).toBe(true)
})

test('arrayInit', () => {
  expect(arrayInit([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4])
})

test('arrayLast', () => {
  expect(arrayLast([1, 2, 3, 4, 5])).toBe(5)
})

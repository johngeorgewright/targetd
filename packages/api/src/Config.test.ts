import Config from './Config'

let config: Config

beforeEach(() => {
  config = new Config([
    {
      name: 'foo',
      rules: [
        {
          payload: 'bar',
        },
      ],
    },
  ])
})

test('getPayload', () => {
  expect(config.getPayload('foo', {})).toBe('bar')
})

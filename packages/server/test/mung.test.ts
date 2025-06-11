// @ts-types='npm:@types/express@^5.0.3'
import express from 'npm:express'
// @ts-types='npm:@types/supertest@^6.0.3'
import request from 'npm:supertest'
import type { Server } from 'node:http'

Deno.test('supertest', async () => {
  await using app = await startApp()

  await request(app.server)
    .get('/user')
    .expect('Content-Type', /json/)
    .expect(200)
})

async function startApp(): Promise<AsyncDisposable & { server: Server }> {
  const app = express()

  app.get('/user', (_req, res) => {
    res.status(200).json({ name: 'john' })
  })

  const { promise, resolve, reject } = Promise.withResolvers<void>()
  const server = app.listen(0, (err) => err ? reject(err) : resolve())
  await promise

  return {
    server,
    async [Symbol.asyncDispose]() {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve())
      })
    },
  }
}

export class ResponseError extends Error {
  constructor(public readonly response: Response) {
    super(`The server responded with an error.`)
  }
}

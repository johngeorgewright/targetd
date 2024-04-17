import {
  ParseInput,
  ZodRawShape,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  input,
  output,
} from 'zod'

class ZodResolver<
  Parser extends ZodTypeAny,
  Args extends unknown[],
  Resolvers extends ZodRawShape,
> extends ZodType<
  (...args: Args) => output<Parser>,
  ZodResolverDef<
    Parser,
    Args,
    Resolvers
  >,
  input<Parser>
> {
  #create: ZodResolverDef<Parser, Args, Resolvers>['create']

  constructor(
    def: ZodResolverDef<
      Parser,
      Args,
      Resolvers
    >,
  ) {
    super(def)
    this.#create = def.create
  }

  _parse(input: ParseInput) {
    return (...args: Args) => {
      const iterator = this.#create(...args)

      const resolvers = {} as {
        [Name in keyof Resolvers]: (...args: Args) => output<Resolvers[Name]>
      }

      let parser: Parser

      do {
        let result = iterator.next()
        if (!result.done) resolvers[result.value[0]] = result.value[1]
      }
    }
  }
}

interface ZodResolverDef<Parser extends ZodTypeAny, Args extends unknown[],Resolvers extends ZodRawShape >
  extends ZodTypeDef {
  typeName: 'resolver'
  create(...args: Args): Generator<[keyof Resolvers, (...args: Args) => output<Resolvers[keyof Resolvers]>], Parser>
}

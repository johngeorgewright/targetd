import Generator from 'yeoman-generator'
import { paramCase } from 'change-case'
import { validateGenerationFromRoot } from '../validation'
import * as path from 'path'
import prettier from 'prettier'
import { writeFile } from 'fs/promises'

export = class PackageGenerator extends Generator {
  #namespace = '@johngeorgewright'
  #vsCodeWS = 'ts-mono-repo.code-workspace'
  #answers: { description?: string; name?: string; public?: boolean } = {}

  constructor(args: string | string[], opts: Record<string, unknown>) {
    super(args, opts)
  }

  initializing() {
    validateGenerationFromRoot(this)
  }

  get #relativeDestinationRoot() {
    return `packages/${paramCase(this.#answers.name!)}`
  }

  async prompting() {
    this.#answers = await this.prompt([
      {
        message: `What is the packages's name? (Minus the ${
          this.#namespace
        } namespace)`,
        name: 'name',
        type: 'input',
        validate: (x) => !!x || 'You must supply a name',
      },
      {
        message: "What's this package about?",
        name: 'description',
        type: 'input',
      },
      {
        message: 'Will this package be published publically?',
        name: 'public',
        type: 'confirm',
      },
    ])
  }

  configuring() {
    this.destinationRoot(this.#relativeDestinationRoot)
    this.sourceRoot(path.resolve(__dirname, '..', '..', 'templates'))
  }

  async writing() {
    const context = {
      description: this.#answers.description || '',
      name: paramCase(this.#answers.name!),
      public: this.#answers.public,
      year: new Date().getFullYear(),
    }

    this.packageJson.set('name', `${this.#namespace}/${this.#answers.name}`)
    this.packageJson.set('version', '0.0.0')
    this.packageJson.set('description', this.#answers.description)
    this.packageJson.set('main', 'dist/index.js')

    if (!this.#answers.public) {
      this.packageJson.set('private', true)
    }

    this.packageJson.set('scripts', {
      build:
        "yarn clean && yarn tsc && yarn rimraf 'dist/**/?(__tests__|__mocks__|__setup__|*.test.*)'",
      clean: 'yarn rimraf dist',
      start: 'yarn tsc --watch --preserveWatchOutput',
      release: 'yarn semantic-release -e semantic-release-monorepo',
      test: 'yarn jest',
    })

    this.packageJson.set('license', 'MIT')

    this.packageJson.set('bugs', {
      url: 'https://github.com/johngeorgewright/ts-mono-repo/issues',
    })

    this.packageJson.set(
      'homepage',
      'https://github.com/johngeorgewright/ts-mono-repo#readme'
    )

    const devDependencies = [
      '@types/jest',
      'jest',
      'rimraf',
      'ts-jest',
      'typescript',
    ]

    if (this.#answers.public) {
      devDependencies.push(
        '@semantic-release/commit-analyzer',
        '@semantic-release/git',
        '@semantic-release/github',
        '@semantic-release/npm',
        '@semantic-release/release-notes-generator',
        'semantic-release',
        'semantic-release-monorepo'
      )
    }

    await this.addDevDependencies(devDependencies)
    await this.addDependencies(['tslib'])

    this.fs.copy(
      this.templatePath('tsconfig.json'),
      this.destinationPath('tsconfig.json')
    )

    this.fs.copy(
      this.templatePath('jest.config.json'),
      this.destinationPath('jest.config.json')
    )

    this.fs.copyTpl(
      this.templatePath('LICENSE'),
      this.destinationPath('LICENSE'),
      context
    )

    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('README.md'),
      context
    )

    this.fs.copyTpl(
      this.templatePath('package-src/index.ts.template'),
      this.destinationPath('src/index.ts'),
      context
    )

    this.fs.copyTpl(
      this.templatePath('package-src/index.test.ts.template'),
      this.destinationPath('src/index.test.ts'),
      context
    )

    await this.#updateVSCodeWS(this.#vsCodeWS)
  }

  async #updateVSCodeWS(file: string) {
    const vsCodeWS = JSON.parse(this.fs.read(file))

    vsCodeWS.folders.push({
      name: `📦 ${this.#namespace}/${this.#answers.name}`,
      path: this.#relativeDestinationRoot,
    })

    vsCodeWS.folders.sort((a: any, b: any) =>
      a.name === b.name ? 0 : a.name < b.name ? -1 : 0
    )

    const prettierOptions = (await prettier.resolveConfig(file)) || {}
    prettierOptions.parser = 'json'

    writeFile(file, prettier.format(JSON.stringify(vsCodeWS), prettierOptions))
  }

  async install() {
    this.spawnCommandSync('yarn', [])

    if (this.#answers.public) {
      this.spawnCommandSync('yarn', [
        'workspace',
        `${this.#namespace}/${paramCase(this.#answers.name!)}`,
        'npm',
        'publish',
        '--access',
        'public',
      ])
    }
  }
}

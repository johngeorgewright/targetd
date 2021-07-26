# @johngeorgewright/ts-mono-repo

This is a template repository for creating a TypeScript mono repo.

## Setting up

1. Change all references of `@johngeorgewright` to your mono-repo namespace
1. Change all references of `ts-mono-repo` to your new mono-repo name
1. Install Node.js & Yarn
1. Install dependencies `yarn`
1. Use the [generator package](https://github.com/johngeorgewright/ts-mono-repo/tree/master/packages/generator) to create new packages
1. If using VSCode, open the workspace and install recommended extensions
1. Commit changes with `yarn commit`

## Known issues

### Dependabot doesn't support Yarn2

If you need to use dependabot, you'll noticed that it doesn't update the "zero-install" cache. You'll have to make sure to do that yourself.

We recommend using Renovate instead.

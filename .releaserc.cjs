// @ts-check

const bumpVersion =
  'cat deno.json | jq \'.version |= "${nextRelease.version}"\' > deno.tmp.json && mv deno.tmp.json deno.json'
const isPublicPackage = '[ $(cat deno.json | jq -r .private) != "true" ]'
const publish = 'deno publish'

/**
 * @type {import('npm:semantic-release').Options}
 */
const config = {
  branches: ['master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/exec',
      {
        prepareCmd: `${isPublicPackage} && ${bumpVersion}`,
        verifyReleaseCmd:
          `${isPublicPackage} && ${publish} --set-version "\${nextRelease.version}" --dry-run`,
        publishCmd: `${isPublicPackage} && ${publish}`,
      },
    ],
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      },
    ],
    '@semantic-release/github',
  ],
}

module.exports = config

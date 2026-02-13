import fs from '@johngw/fs'
import type { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import type { DT } from '@targetd/api'
import { object } from 'zod'
import { any, type output } from 'zod/mini'

const FileData = object().catchall(any())
type FileData = output<typeof FileData>

/**
 * Load targeting rules from JSON/YAML files in a directory.
 * Files are parsed and rules are added to the provided Data instance.
 *
 * @param data - Base Data instance with payloads and targeting configured.
 * @param dir - Directory path containing rule files (.json, .yaml, .yml).
 * @returns Updated Data instance with rules from all files.
 *
 * @example
 * ```ts
 * import { Data, targetIncludes } from '@targetd/api'
 * import { load } from '@targetd/fs'
 * import { z } from 'zod'
 *
 * const baseData = await Data.create()
 *   .usePayload({ greeting: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 *
 * const data = await load(baseData, './rules')
 * // Loads rules from ./rules/*.{json,yaml,yml}
 * ```
 *
 * @example Rule file format (rules/greeting.yaml):
 * ```yaml
 * greeting:
 *   rules:
 *     - targeting:
 *         country: [US]
 *       payload: Hello!
 *     - payload: Hi!
 * ```
 */
export async function load<D extends DT.Any>(data: D, dir: string): Promise<D> {
  for await (
    const contents of fs.readFiles(dir, {
      encoding: 'utf8',
      filter: pathIsLoadable,
      withFileNames: true,
    })
  ) {
    data = await addRules(data, await parseFileContents(contents))
  }

  return data
}

export function pathIsLoadable(path: string) {
  return (
    path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.json')
  )
}

async function parseFileContents({
  fileName,
  contents,
}: WithFileNamesResult<string>) {
  return FileData.parse(
    fileName.endsWith('.json')
      ? JSON.parse(contents)
      : (await import('yaml')).parse(contents),
  )
}

async function addRules<D extends DT.Any>(
  data: D,
  fileData: FileData,
): Promise<D> {
  let result = data

  for (const [key, value] of Object.entries(fileData)) {
    if (typeof value === 'object') {
      result = (await result.addRules(key, value)) as D
    }
  }

  return result
}

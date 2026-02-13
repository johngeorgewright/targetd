import fs from '@johngw/fs'
import type { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import type { DT } from '@targetd/api'
import { object } from 'zod'
import { any, type output } from 'zod/mini'

/**
 * Zod schema for validating file data structure.
 * Accepts any object with catchall validation for dynamic keys.
 */
const FileData = object().catchall(any())
/**
 * Type representing the output of the FileData schema.
 * A record with string keys and any values.
 */
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

/**
 * Checks if a file path has a loadable extension.
 * Accepts JSON and YAML file formats.
 *
 * @param path - File path to check
 * @returns True if the file has a .json, .yaml, or .yml extension
 */
export function pathIsLoadable(path: string) {
  return (
    path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.json')
  )
}

/**
 * Parses file contents based on file extension.
 * Uses JSON.parse for .json files and yaml.parse for .yaml/.yml files.
 *
 * @param contents - Object containing fileName and file contents
 * @returns Parsed and validated file data
 */
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

/**
 * Adds rules from parsed file data to a Data instance.
 * Iterates through each key-value pair in the file data and adds them as rules.
 *
 * @template D - Data instance type
 * @param data - The Data instance to add rules to
 * @param fileData - Parsed file data containing rules
 * @returns Updated Data instance with added rules
 */
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

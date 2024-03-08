import { readFiles } from '@johngw/fs'
import type { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import type { DT } from '@targetd/api'
import YAML from 'yaml'
import {
  type infer as zInfer,
  array,
  object,
  strictObject,
  string,
  unknown,
} from 'zod'

const FileData = object({ $schema: string().optional() }).catchall(
  strictObject({ rules: array(unknown()) }),
)

type FileData = zInfer<typeof FileData>

export async function load<D extends DT.Any>(data: D, dir: string): Promise<D> {
  for await (const contents of readFiles(dir, {
    encoding: 'utf8',
    filter: pathIsLoadable,
    withFileNames: true,
  }))
    data = await addRules(data, parseFileContents(contents))

  return data
}

export function pathIsLoadable(path: string) {
  return (
    path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.json')
  )
}

function parseFileContents({
  fileName,
  contents,
}: WithFileNamesResult<string>) {
  return FileData.parse(
    fileName.endsWith('.json') ? JSON.parse(contents) : YAML.parse(contents),
  )
}

async function addRules<D extends DT.Any>(
  data: D,
  fileData: FileData,
): Promise<D> {
  let result = data

  for (const [key, value] of objectIterator(fileData))
    if (typeof value === 'object')
      result = (await result.addRules(key, value.rules as any[])) as D

  return result
}

export function* objectIterator<T extends Record<string, unknown>>(
  obj: T,
): Generator<Entry<T>> {
  for (const key in obj)
    if (Object.prototype.hasOwnProperty.call(obj, key)) yield [key, obj[key]]
}

type Entry<T extends Record<string | symbol, unknown>> = {
  [K in keyof T]: [K, T[K]]
}[keyof T]

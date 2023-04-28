import { readFiles } from '@johngw/fs'
import { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import { Data } from '@targetd/api'
import YAML from 'yaml'
import { z } from 'zod'
import { Keys } from 'ts-toolbelt/out/Any/Keys'

const FileData = z
  .object({ $schema: z.string().optional() })
  .catchall(z.strictObject({ rules: z.array(z.unknown()) }))

type FileData = z.infer<typeof FileData>

export async function load<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(
  data: Data<DataValidators, TargetingValidators, QueryValidators>,
  dir: string
) {
  for await (const contents of readFiles(dir, {
    encoding: 'utf8',
    filter: pathIsLoadable,
    withFileNames: true,
  })) {
    data = addRules(data, parseFileContents(contents))
  }

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
    fileName.endsWith('.json') ? JSON.parse(contents) : YAML.parse(contents)
  )
}

function addRules<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(
  data: Data<DataValidators, TargetingValidators, QueryValidators>,
  fileData: FileData
) {
  return Object.entries(fileData).reduce(
    (data, [name, value]) =>
      typeof value === 'object'
        ? data.addRules(name as Keys<DataValidators>, value.rules as any[])
        : data,
    data
  )
}

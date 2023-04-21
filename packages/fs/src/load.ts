import { readFiles } from '@johngw/fs'
import { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import YAML from 'yaml'
import { Data, zod as z } from '@targetd/api'
import { Keys } from 'ts-toolbelt/out/Any/Keys'

const FileData = z.record(z.string(), z.array(z.unknown()))
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
    (data, [name, rules]) =>
      data.addRules(name as Keys<DataValidators>, rules as any[]),
    data
  )
}

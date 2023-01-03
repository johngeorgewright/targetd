import { readFiles } from '@johngw/fs'
import { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import YAML from 'yaml'
import { Data, zod as z } from '@targetd/api'

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
    filter: (fileName) =>
      fileName.endsWith('.yaml') ||
      fileName.endsWith('.yml') ||
      fileName.endsWith('.json'),
    withFileNames: true,
  })) {
    data = addRules(data, parseFileContents(contents))
  }

  return data
}

function parseFileContents({
  fileName,
  contents,
}: WithFileNamesResult<string>) {
  return FileData.parse(
    fileName.endsWith('.json') ? JSON.parse(contents) : YAML.parse(contents)
  )
}

function addRules(data: Data<any, any, any>, fileData: FileData) {
  return Object.entries(fileData).reduce(
    (data, [name, dataItem]) =>
      data.addRules(name as keyof any, dataItem as any[]),
    data
  )
}

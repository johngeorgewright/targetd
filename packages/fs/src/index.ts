import { readFiles } from '@johngw/fs'
import YAML from 'yaml'
import { Data, runtypes as rt } from '@targetd/api'
import { Keys } from 'ts-toolbelt/out/Any/Keys'

const FileData = rt.Dictionary(rt.Array(rt.Unknown), rt.String)

export async function load<
  DataValidators extends Record<string, rt.Runtype>,
  TargetingValidators extends Record<string, rt.Runtype>,
  QueryValidators extends Record<string, rt.Runtype>
>(
  data: Data<DataValidators, TargetingValidators, QueryValidators>,
  dir: string
) {
  for await (const { contents, fileName } of readFiles(dir, {
    filter: (fileName) =>
      fileName.endsWith('.yaml') ||
      fileName.endsWith('.yml') ||
      fileName.endsWith('.json'),
    withFileNames: true,
  })) {
    const fileData = FileData.check(
      fileName.endsWith('.json')
        ? JSON.parse(contents.toString())
        : YAML.parse(contents.toString())
    )

    data = Object.entries(fileData).reduce(
      (data, [name, dataItem]) =>
        data.addRules(name as Keys<DataValidators>, dataItem as any[]),
      data
    )
  }

  return data
}

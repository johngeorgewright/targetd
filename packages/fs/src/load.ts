import fs from '@johngw/fs'
import type { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import type { DT } from '@targetd/api'
import { object } from 'zod'
import { any, type output } from 'zod/mini'

const FileData = object().catchall(any())
type FileData = output<typeof FileData>

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

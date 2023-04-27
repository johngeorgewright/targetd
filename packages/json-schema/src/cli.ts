import { Data } from '@targetd/api'
import yargs from 'yargs'
import * as path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { dataJSONSchemas } from '.'
;(async () => {
  const { dataExport, inputModule, outputFile } = await yargs
    .usage('$0 <cmd> [args]')
    .options({
      dataExport: {
        alias: 'e',
        default: 'data',
        describe: 'The name of the data export from the `inputModule`',
        string: true,
      },
      inputModule: {
        alias: 'i',
        demandOption: true,
        describe: 'The input module, relative to the root of the project',
        string: true,
      },
      outputFile: {
        alias: 'o',
        describe:
          'When specified, the JSONSchema will be written to this file (relative to the root of the project).',
        string: true,
      },
    })
    .help().argv

  const input = require(path.resolve(inputModule))
  const data = input[dataExport]
  if (!(data instanceof Data))
    throw new Error(
      `Export "${dataExport}" from "${inputModule}" is not of a \`Data\` type.`
    )
  const jsonSchema = JSON.stringify(dataJSONSchemas(data), null, 2)
  if (outputFile) await writeFile(outputFile, jsonSchema)
  else console.info(jsonSchema)
})()

import type { DT } from '@targetd/api'
import { watch } from './watch.ts'

export function createDisposableWatcher<D extends DT.Any>(
  data: D,
  dirTo: string,
  cb: (error: Error | null, data: D) => any,
): Disposable {
  return {
    [Symbol.dispose]: watch(data, dirTo, cb),
  }
}

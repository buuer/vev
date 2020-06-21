import { VevConf } from './index.ts'
import { tap, pReject, pResolve, isFn } from './utils.ts'
import { vevError } from './errorCode.ts'

export type middleware = <T>(c: VevConf, next: next) => Promise<T>
export type middlewareConf = Partial<VevConf> | ((c: VevConf) => VevConf | Promise<VevConf>)
export type middlewareRes = (c: any) => Promise<any>

type next = (...c: any[]) => Promise<any>

type composeVev = <T>(...mid: middleware[]) => (config?: VevConf, next?: next) => Promise<T>

type dispatch = (idx: number, arg: any) => Promise<any>

export const composeVev: composeVev = (...mid) => {
  if (!mid.length || !mid.every(isFn)) throw vevError(0)

  return (config, finalCall) => {
    let callIndex = 0

    const dispatch: dispatch = (idx, arg) => {
      if (arg === undefined) throw vevError(1)

      const fn = idx === mid.length ? finalCall : mid[idx]

      if (!fn) return pResolve(arg)

      if (callIndex !== idx) throw vevError(2)
      callIndex += 1

      try {
        return pResolve(fn(arg, dispatch.bind(null, idx + 1)))
      } catch (err) {
        return pReject(err)
      }
    }

    return dispatch(0, config || null).then(
      tap(() => {
        if (callIndex !== mid.length + 1) {
          throw vevError(2)
        }
      })
    )
  }
}

import { VevConf } from './index.ts'
import { tap, pReject, pResolve, isFn } from './utils.ts'
import { vevError } from './errorCode.ts'

export type middleware = <T>(c: VevConf | undefined, next: next) => Promise<T>
export type middlewareConf = Partial<VevConf> | ((c: VevConf) => VevConf | Promise<VevConf>)
export type middlewareRes = (c: any) => Promise<any>

type next = (...c: any[]) => Promise<any>

export type composeVev = (mid: middleware[]) => <T>(c?: VevConf, next?: next) => Promise<T>

type dispatch = <T>(idx: number, arg: any) => Promise<T>

export const middlewareCheck = (midList: middleware[]) => {
  if (midList.length && !midList.every(isFn)) throw vevError(0)
}

export const composeVev: composeVev = (mid) => {
  middlewareCheck(mid)

  return (config, finalCall) => {
    let callIndex = -1

    const dispatch: dispatch = (idx, arg) => {
      if (arg === undefined) throw vevError(1)

      const fn = idx === mid.length ? finalCall : mid[idx]

      if (!fn) return pResolve(arg)

      callIndex += 1
      if (callIndex !== idx) throw vevError(2)

      try {
        return pResolve(fn(arg, dispatch.bind(null, idx + 1)))
      } catch (err) {
        return pReject(err)
      }
    }

    return dispatch(0, config || null).then(
      tap(() => {
        if (callIndex !== mid.length) {
          throw vevError(2)
        }
      })
    )
  }
}

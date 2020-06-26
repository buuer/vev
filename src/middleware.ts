import { VevConf } from './index.ts'
import { tap, pReject, pResolve, isFn, isUndefined } from './utils.ts'
import { vevAssert } from './errorCode.ts'

export type middleware = <T>(c: VevConf | undefined, next: next) => Promise<T>
export type middlewareConf = Partial<VevConf> | ((c: VevConf) => VevConf | Promise<VevConf>)
export type middlewareRes = (c: any) => Promise<any>

type next = (...c: any[]) => Promise<any>

export type composeVev = (mid: middleware[]) => (c?: VevConf, next?: next) => Promise<any>

type dispatch = (idx: number, arg: any) => Promise<any>

export const middlewareCheck = (midList: middleware[]) =>
  vevAssert(!midList.length || midList.every(isFn), 0)

export const composeVev: composeVev = (mid) => {
  middlewareCheck(mid)

  return (config, finalCall) => {
    let callIndex = -1

    const dispatch: dispatch = (idx, arg) => {
      vevAssert(!isUndefined(arg), 1)

      const fn = idx === mid.length ? finalCall : mid[idx]

      if (!fn) return pResolve(arg)

      callIndex += 1
      vevAssert(callIndex === idx, 2)

      try {
        return pResolve(fn(arg, dispatch.bind(null, idx + 1)))
      } catch (err) {
        return pReject(err)
      }
    }

    return dispatch(0, config || null).then(tap(() => vevAssert(callIndex === mid.length, 2)))
  }
}

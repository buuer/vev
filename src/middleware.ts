import { VevConf } from './Vev'
import { isFn, callFn } from './utils'

export type middlewareIn = (c: VevConf) => VevConf | Promise<VevConf>
export type middlewareOut = <T, R>(c: R) => T | Promise<T>
export type middlewareAll = <T>(c: VevConf, next: next) => Promise<T>

export type middleware =
  | [middlewareIn]
  | [middlewareIn | null, middlewareOut | null]
  | middlewareAll

export type next = (c: VevConf) => Promise<any>

const transformer = (mid: middleware): middlewareAll => {
  if (typeof mid === 'function') {
    return mid
  }

  if (Array.isArray(mid) && (isFn(mid[0]) || isFn(mid[1]))) {
    return (conf: VevConf, next: next) => {
      return Promise.resolve(callFn(mid[0], conf))
        .then(next)
        .then((resp) => callFn(mid[1], resp))
    }
  }

  throw 'middleware must be function'
}

type composeVev = <T>(
  ...mid: middleware[]
) => (config: VevConf | undefined, next: next) => Promise<T>

export const composeVev: composeVev = (...mid) => (config, next) => {
  const dispatch = (idx: number, arg: VevConf): Promise<any> => {
    if (arg === undefined) {
      throw 'middleware must return config or pass to next'
    }

    const fn = idx === mid.length ? next : transformer(mid[idx])

    if (!fn) {
      return Promise.resolve(arg)
    }

    try {
      return Promise.resolve(fn(arg, dispatch.bind(null, idx + 1)))
    } catch (err) {
      return Promise.reject(err)
    }
  }

  return dispatch(0, config || ({} as VevConf))
}

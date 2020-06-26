//prettier-ignore
import { isFn, memoryCall, deepMerge, merge, pResolve, objectCreate, concat } from './utils.ts'

import { middleware, composeVev, middlewareCheck } from './middleware.ts'

import { request, resWithBody } from './request.ts'
import { vevAssert } from './errorCode.ts'

//prettier-ignore
type httpMethod = | 'get' | 'delete' | 'options' | 'connect' | 'head' | 'post' | 'put' | 'patch'

// prettier-ignore
type vevRequestWithBody<R = resWithBody, B = VevConf['body']> = ( this: Vev, url: string, body?: B, config?: VevConf) => Promise<R>
//prettier-ignore
type vevRequestWithoutBody<R = resWithBody> = (this: Vev, url: string, config?: VevConf) => Promise<R>
type vevRequest<R = resWithBody> = (this: Vev<R>, config?: VevConf) => Promise<R>

type middlewareConf = (c: VevConf) => VevConf | Promise<VevConf>
type middlewareRes = (err: any, res?: any) => Promise<any>

type vevMap<R> = <K = R>(this: Vev<R>, ...mid: middleware[]) => Vev<K>
type vevMapConfig<R> = <K = R>(this: Vev<R>, mid: VevConf | middlewareConf) => Vev<K>
type vevMapRes<R> = <K = R>(this: Vev<R>, mid: middlewareRes) => Vev<K>

export type Vev<R = resWithBody> = {
  middleware: () => middleware[]

  version: () => string

  // configuration
  map: vevMap<R>
  mapConfig: vevMapConfig<R>
  mapResponse: vevMapRes<R>

  // request
  request: vevRequest<R>

  get: vevRequestWithoutBody<R>
  head: vevRequestWithoutBody<R>

  delete: vevRequestWithBody<R>
  options: vevRequestWithBody<R>
  post: vevRequestWithBody<R>
  put: vevRequestWithBody<R>
  patch: vevRequestWithBody<R>
}

export interface VevConf extends Omit<RequestInit, 'body'> {
  body?: RequestInit['body'] | any
  method?: httpMethod

  url?: string
  // @ts-ignore
  fetch?: Window['fetch']
  params?: string | Record<string, any> | URLSearchParams
  baseUrl?: string
  responseType?: Exclude<keyof Body, 'bodyUsed' | 'body'> | 'row'
  requestType?: 'json' | 'formData'
  timeout?: number
}

const proto = (function createProto() {
  const createMethod = (method: httpMethod): vevRequestWithoutBody =>
    function (url, config) {
      return this.request(merge({}, config, { url, method }))
    }

  const createMethodWithBody = (method: httpMethod): Record<string, vevRequestWithBody> => ({
    [method]: function (url, body, config) {
      return this.request(merge({}, config, { url, body, method }))
    },
  })

  return merge(
    objectCreate(null),
    {
      version: () => '0.0.1',

      // configuration
      map: function (...mid) {
        return CreateVev(concat(this.middleware(), mid))
      },

      mapConfig: function (config) {
        const midList = this.middleware()
        const configIsFn = isFn(config)

        const configMid: middleware = (conf, next) =>
          pResolve(configIsFn ? (config as any)(conf) : deepMerge(config, conf)).then(next)

        const newList = configIsFn ? concat(midList, configMid) : concat(configMid, midList)

        return CreateVev(newList)
      },

      mapResponse: function (resFormat) {
        vevAssert(isFn(resFormat), 4)

        const resMid: middleware = (conf, next) =>
          next(conf).then(resFormat.bind(null, null), resFormat)

        return this.map(resMid)
      },

      // request
      request: function (config = {}) {
        const composetMid = () => composeVev(this.middleware())
        const memoryMid = memoryCall(this, composetMid)

        return memoryMid(config, request)
      },

      get: createMethod('get'),
      head: createMethod('head'),
    } as Vev,

    ...(['delete', 'options', 'post', 'put', 'patch'] as httpMethod[]).map(createMethodWithBody)
  ) as Vev
})()

const CreateVev = (midList = [] as middleware[]) => {
  middlewareCheck(midList)

  const vev: Vev = objectCreate(proto)
  vev.middleware = () => midList.slice()

  return Object.freeze(vev)
}

export const vev = CreateVev()

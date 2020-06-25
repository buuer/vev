import { isFn, memoryCall, callFn, deepMerge, merge, pResolve, objectCreate } from './utils.ts'
import {
  middleware,
  composeVev,
  middlewareConf,
  middlewareRes,
  middlewareCheck,
} from './middleware.ts'
import { request } from './request.ts'
import { vevError } from './errorCode.ts'

//prettier-ignore
type httpMethod = | 'get' | 'delete' | 'options' | 'connect' | 'head' | 'post' | 'put' | 'patch'

//prettier-ignore
type vevRequestWithBody = <T,B>(this:Vev, url: string, body?: B | VevConf['body'], config?: VevConf) => Promise<T>
type vevRequestWithoutBody = <T>(this: Vev, url: string, config?: VevConf) => Promise<T>
type vevRequest = <T>(this: Vev, config?: VevConf) => Promise<T>

type vevMap = (this: Vev, ...mid: middleware[]) => Vev
type vevMapConfig = (this: Vev, mid: middlewareConf) => Vev
type vevMapRes = (this: Vev, mid: middlewareRes) => Vev

export type Vev = {
  middleware: () => middleware[]

  version: () => string

  // configuration
  map: vevMap
  mapConfig: vevMapConfig
  mapRes: vevMapRes

  // request
  request: vevRequest

  get: vevRequestWithoutBody
  head: vevRequestWithoutBody

  delete: vevRequestWithBody
  options: vevRequestWithBody
  post: vevRequestWithBody
  put: vevRequestWithBody
  patch: vevRequestWithBody
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
  type configToMid = (config: middlewareConf) => middleware
  type resToMid = (rf: middlewareRes) => middleware

  const configToMid: configToMid = (config) => (conf, next) =>
    pResolve(isFn(config) ? callFn(config, conf) : deepMerge(conf, config)).then(next)

  const resToMid: resToMid = (resFormat) => {
    if (!isFn(resFormat)) throw 'resFormat is not a function'
    return (conf, next) => next(conf).then(resFormat)
  }

  const createMethod = (method: httpMethod): vevRequestWithoutBody =>
    function (url, config) {
      return this.request({ ...config, url, method })
    }

  const createMethodWithBody = (method: httpMethod): Record<string, vevRequestWithBody> => ({
    [method]: function (url, body, config) {
      return this.request({ ...config, url, body, method })
    },
  })

  return merge(
    objectCreate(null),
    {
      version: () => '0.0.1',

      // configuration
      map: function (...mid) {
        return CreateVev([...this.middleware(), ...mid])
      },

      mapConfig: function (config) {
        return this.map(configToMid(config))
      },

      mapRes: function (resFormat) {
        return this.map(resToMid(resFormat))
      },

      // request
      request: function (config) {
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

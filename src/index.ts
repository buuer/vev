import { isFn, memoryCall, callFn, deepMerge, merge, pResolve, objectCreate } from './utils.ts'
import { middleware, composeVev, middlewareConf, middlewareRes } from './middleware.ts'
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

type vevPatch<K extends keyof VevConf> = (
  this: Vev,
  s: VevConf[K] | ((vck: VevConf[K]) => VevConf[K])
) => Vev

export type Vev = {
  middleware: () => middleware[]

  version: () => string

  // configuration
  map: vevMap
  mapConfig: vevMapConfig
  mapRes: vevMapRes

  headers: vevPatch<'headers'>
  params: vevPatch<'params'>
  body: vevPatch<'body'>

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
  body?: RequestInit['body'] | Record<string, any>
  method?: httpMethod

  url: string
  // @ts-ignore
  fetch?: Window['fetch']
  params?: Record<string, any>
  baseUrl?: string
  responseType?: Exclude<keyof Body, 'bodyUsed' | 'body'> | 'row'
  requsetType?: 'json' | 'formData'
  timeout?: number
}

const proto = (function createProto() {
  type configToMid = (config: middlewareConf) => middleware
  const configToMid: configToMid = (config) => (conf, next) =>
    pResolve(isFn(config) ? callFn(config, conf) : deepMerge(config, conf)).then(next)

  type resToMid = (rf: middlewareRes) => middleware
  const resToMid: resToMid = (resFormat) => {
    if (!isFn(resFormat)) throw 'resFormat is not a function'
    return (conf, next) => pResolve(conf).then(next).then(resFormat)
  }

  type patchFn = <K extends keyof VevConf>(s: K) => vevPatch<K>
  const patchFn: patchFn = (key) =>
    function (patch) {
      return this.mapConfig((config: VevConf) => {
        const val = isFn(patch) ? callFn(patch, config[key]) : deepMerge(config[key], patch)
        return merge({}, config, val && { [key]: val })
      })
    }

  const createMethod = (method: httpMethod): vevRequestWithoutBody =>
    function (url, config) {
      return this.request({ ...config, url, method })
    }

  const createMethodWithBody = (method: httpMethod): vevRequestWithBody =>
    function (url, body, config) {
      return this.request({ ...config, url, body, method })
    }

  return merge(objectCreate(null), {
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

    headers: patchFn('headers'),
    params: patchFn('params'),
    body: patchFn('body'),

    // request
    request: function (config) {
      const vFetch = config?.fetch || fetch || window.fetch
      if (!vFetch) throw vevError(3)

      const composetMid = memoryCall(this, () => composeVev(...this.middleware(), request))

      return composetMid(config, ([url, init]: Parameters<VevConf['fetch']>) => vFetch(url, init))
    },

    get: createMethod('get'),
    head: createMethod('head'),

    delete: createMethodWithBody('delete'),
    options: createMethodWithBody('options'),
    post: createMethodWithBody('post'),
    put: createMethodWithBody('put'),
    patch: createMethodWithBody('patch'),
  } as Omit<Vev, 'middleware'>)
})()

const CreateVev = (midList = [] as middleware[]) => {
  if (!midList.every(isFn)) {
    throw vevError(1)
  }

  const vev: Vev = objectCreate(proto)
  vev.middleware = () => midList.slice()

  return Object.freeze(vev)
}

export const vev = CreateVev()

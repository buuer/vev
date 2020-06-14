import { callFn, mergeConf } from './utils'
import {
  middleware,
  middlewareAll,
  middlewareIn,
  middlewareOut,
} from './middleware'
import { request } from './request'

//prettier-ignore
type httpMethd = | 'get' | 'delete' | 'options' | 'connect' | 'head' | 'post' | 'put' | 'patch'

type vevRequest = <T>(config?: VevConf) => Promise<T>
//prettier-ignore
type vevRequestWithBody = <T>(this:Vev, url: string, body?: Vev['body'], config?: VevConf) => Promise<T>
//prettier-ignore
type vevRequestWithoutBody = <T>( this: Vev, url: string, config?: VevConf) => Promise<T>

//prettier-ignore
type vevPatch<K extends keyof VevConf> = ( this: Vev, s: VevConf[K]) => Vev

type vevMap = (
  min?: middlewareIn | null,
  mout?: middlewareOut | null,
  mid?: middlewareAll
) => Vev

export interface Vev {
  middleware: () => middleware[]

  map: vevMap
  request: vevRequest

  get: vevRequest
  head: vevRequest

  delete: vevRequest
  options: vevRequest
  post: vevRequestWithBody
  put: vevRequestWithBody
  patch: vevRequestWithBody

  headers: vevPatch<'headers'>
  params: vevPatch<'params'>
  body: vevPatch<'body'>
}

export interface VevConf extends RequestInit {
  body?: RequestInit['body'] | any
  method?: httpMethd

  url: string
  fetch?: Window['fetch']
  params?: Record<string, any>
  baseUrl?: string
  resType?: Exclude<keyof Body, 'bodyUsed' | 'body'>
}

const proto = (function createProto(): Omit<Vev, 'middleware'> {
  const patch: <K extends keyof VevConf>(s: K) => vevPatch<K> = (key) =>
    function (patch) {
      return this.map((config: VevConf) => ({
        ...config,
        [key]: isFn(patch)
          ? callFn(patch, config[key])
          : mergeConf(patch)(config[key]),
      }))
    }

  const createMethod = (method: httpMethd): vevRequestWithoutBody =>
    function (url, config) {
      return this.map(mergeConf(config, { url, method })).request()
    }

  const createMethodWithBody = (method: httpMethd): vevRequestWithBody =>
    function (url, body, config) {
      return this.map(mergeConf(config, { url, body, method })).request()
    }

  return Object.assign(Object.create(null), {
    // core
    request,
    map(
      this: Vev,
      mIn?: middlewareIn | null,
      mOut?: middlewareOut | null,
      mid?: middlewareAll
    ) {
      const newMid = mid
        ? [mid]
        : mIn || mOut
        ? [[mIn || null, mOut || null] as middleware]
        : []

      return Create([...this.middleware(), ...newMid])
    },

    // configuration
    headers: patch('headers'),
    params: patch('params'),
    body: patch('body'),

    config(
      this: typeof Vev,
      customConfig: VevConf | ((c: VevConf) => VevConf)
    ) {
      return this.map((config: VevConf) =>
        isFn(customConfig)
          ? callFn(customConfig, config)
          : mergeConf(customConfig)(config)
      )
    },

    // fire fetch
    get: createMethod('get'),
    delete: createMethod('delete'),
    options: createMethod('options'),
    head: createMethod('head'),

    post: createMethodWithBody('post'),
    put: createMethodWithBody('put'),
    patch: createMethodWithBody('patch'),
  })
})()

const Create = (midList = [] as middleware[]) => {
  const Vev: Vev = Object.create(proto)
  Vev.middleware = () => midList.slice()
  return Vev
}

export const Vev = Create()

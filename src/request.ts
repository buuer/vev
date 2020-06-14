import { composeVev, next } from './middleware'
import { callFn, isFn, pick } from './utils'
import { VevConf, Vev } from './Vev'

const getParams = (params?: any) => {
  return new URLSearchParams(params).toString()
}
const getUrl = (config: VevConf) => {
  if (/^\w+\:\/\//.test(config.url)) {
    return config.url
  }
  const fetchUrl = (config.baseUrl || '') + (config.url || '')
  const sp = /\?/.test(fetchUrl) ? '&' : '?'
  const params = getParams(config.params)

  return fetchUrl + params ? sp + params : ''
}

const getConfig = (config: VevConf) => {
  // prettier-ignore
  const fetchConf = pick<VevConf, keyof RequestInit>(config, ['cache', 'credentials', 'headers', 'integrity', 'keepalive', 'method', 'mode', 'redirect', 'referrer', 'referrerPolicy', 'signal', 'window'])

  fetchConf.method = fetchConf.method || 'get'

  if (!['head', 'get'].includes(fetchConf.method)) {
    fetchConf.body = config.body
  }

  return fetchConf
}

export function request(this: Vev, config?: VevConf) {
  return composeVev(...this.middleware())(config, vevRequest)
}

const uploadProgress = () => {}

const vevRequest = (config: VevConf) => {
  const vFetch = config.fetch || self.fetch || fetch

  if (!fetch) throw 'fetch is unavailable'

  return vFetch(config.url, config).then((fetchRes) => {
    const resType = config.resType || 'json'
    // prettier-ignore
    const validType = ['arrayBuffer', 'blob', 'formData', 'json', 'text'].includes(resType)

    const withFormat = !validType ? fetchRes : fetchRes[resType]()

    return fetchRes.ok ? withFormat : Promise.reject(withFormat)
  })
}

import { pick, isPlainObject, pReject, isFn, pResolve, merge } from './utils.ts'
import { VevConf } from './index.ts'
import { composeVev } from './middleware.ts'
import { vevError } from './errorCode.ts'

const getParams = (params?: any) => {
  return new URLSearchParams(params).toString()
}

const getUrl = (config: VevConf) => {
  const { url, baseUrl, params: configParams } = config

  const base = /^\w+\:\/\//.test(url as string) ? '' : baseUrl

  const params = getParams(configParams)
  const sp = !params ? '' : /\?/.test(url as string) ? '&' : '?'

  return [base, url, sp, params].join('')
}

const getBody = (config: VevConf, [isPlainObject, isFormData]: boolean[]): VevConf['body'] => {
  const { body, method } = config

  return ['head', 'get'].includes(method || 'get')
    ? null
    : !isPlainObject
    ? body
    : isFormData
    ? getParams(body)
    : JSON.stringify(body)
}

const getHeaders = (
  config: VevConf,
  [isPlainObject, isFormData]: boolean[]
): VevConf['headers'] => {
  const { headers } = config

  const jsonType = 'application/json;charset=utf-8'
  const formType = 'application/x-www-form-urlencoded;charset=utf-8'

  return !isPlainObject
    ? headers
    : merge({ 'Content-Type': isFormData ? formType : jsonType }, headers)
}

const getSignal = (config: VevConf): AbortSignal | void => {
  const { timeout, signal } = config
  if (!timeout || timeout <= 0) return
  if (signal && signal.aborted) return signal

  const timeoutCtrl = new AbortController()

  const abort = () => {
    timeoutCtrl.abort()
    clearTimeout(timerIdx)
    signal && signal.removeEventListener('abort', abort)
  }

  const timerIdx = setTimeout(abort, timeout)

  signal && signal.addEventListener('abort', abort)

  return timeoutCtrl.signal
}

const getConfig = (config: VevConf): RequestInit => {
  const computed = [isPlainObject(config.body), config.requestType === 'formData']

  const body = getBody(config, computed)
  const headers = getHeaders(config, computed)
  const signal = getSignal(config)

  // without body, header, signal
  // prettier-ignore
  const fetchConf: RequestInit = pick(config, ['cache', 'credentials', 'integrity', 'keepalive', 'method', 'mode', 'redirect', 'referrer', 'referrerPolicy'])

  return merge(fetchConf, signal && { signal }, body && { body }, headers && { headers })
}

export const request: ReturnType<composeVev> = (config = {} as VevConf) => {
  const fetchUrl = getUrl(config)
  const fetchInit = getConfig(config)
  const vFetch: typeof fetch = config.fetch || fetch || window.fetch

  if (!vFetch) throw vevError(3)

  return vFetch(fetchUrl, fetchInit).then((fetchRes: Response) => {
    const resType = (config.responseType as Exclude<VevConf['responseType'], 'row'>) || 'json'

    const withFormat = isFn(fetchRes[resType]) ? fetchRes[resType]() : fetchRes

    return fetchRes.ok ? withFormat : pResolve(withFormat).then(pReject)
  })
}

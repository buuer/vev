# vev

\<e>

inspired by [koa](https://github.com/koajs/koa) [axios](https://github.com/axios/axios) [redaxios](https://github.com/developit/redaxios)

## start

```html
<html>
  <head>
    <script scr="./vev.min.js" type="module" />
  </head>
  <body>
    <script type="module">
      import { vev } from './vev.min.js
      vev.get('/')
    </script>
  </body>
</html>
```

## usage

```js
// import { vev } form './lib/vev.js'
vev.get('/user')
vev.get('/user?id=3')
vev.get('/user', { params: { id: 3 } })

vev.post('/user', { id: 3, name: 'foo' })

vev.put(
  '/user',
  { name: 'foo' },
  {
    headers: { token: 'token' },
    params: { origin: '1' },
  }
)

vevUser = vev.mapConfig({ baseUrl: '/user' })
vevUser.get('/post', { params: { id: 1 } }) // GET /user/post?id=1

// import fetch as fetchpolyfill from 'node-fetch'
import { fetch as fetchPolyfill } from 'whatwg-fetch'

const vevPolyfill = vev.mapConfig({ fetch: fetchPolyfill })
vevPolufill.get('/post')
```

---

## api

### vevConfig

```ts
interface VevConf extends RequestInit {
  // RequestInit
  method?: httpMethod
  headers?: RequestInit['headers']
  body?: RequestInit['body'] | any // add any
  mode?: 'cors' | 'no-cors' | 'same-origin' | 'navigate'
  credentials?: 'omit' | 'same-origin' | 'include'
  cache?: boolean
  redirect?: 'error' | 'follow' | 'manual'
  referrer?: string
  integrity?: string
  keepalive?: boolean
  signal?: AbortSignal
  referrerPolicy?: ReferrerPolicy

  // vevConfig
  url: string
  baseUrl?: string
  params?: any

  fetch?: Window['fetch']
  responseType?: 'json' | 'arrayBuffer' | 'blob' | 'formData' | 'text' | 'row' //default json
  requsetType?: 'json' | 'formData' // default json
  timeout?: number
}
```

### vev

```ts
type transType<T> = (t: T) => T | Promise<T>
type withBody = (url: string, body: any, conf: vevConfig) => Promise<Response | any>
type withoutBody = (url: string, conf: vevConfig) => Promise<Response | any>

type vev = {
  middleware: () => middleware[]

  version: () => string | '0.1.0'

  // configuration
  map: (...mid: middleware[]) => vev
  mapConfig: (fn: (conf: vevConfig) => vevConfig) => vev
  mapRes: (fn: (res: Response) => any) => vev

  headers: (h: headers | transType<headers>) => vev
  params: (p: params | transType<params>) => vev
  body: (b: body | transType<body>) => vev

  // request
  request: (conf: vevConfig) => Promise<Response | any>

  get: withoutBody
  head: withoutBody

  delete: withBody
  options: withBody
  post: withBody
  put: withBody
  patch: withBody
}
```

---

## middleware

- withLoding

```js
const withLoding = (config, next) => {
  const cancel = startLoading()
  return next(config).finally(cancel)
}

const vevWithLoding = vev.map(withLoding)
```

- withToken

```js
const vevWithToken = vev.headers({ authToken: getToken() })

//  async
const vevWithToken = vev.headers(async (headers) => {
  const token = await getToken()
  return Object.assgin({ token }, headers)
})
```

- withAuth

```js
const withAuth = (config, next) => {
  return next(config).catch((errResponse) => {
    return errResponse?.status === 401 ? gotoLogin() : Promise.reject(errPesPonse)
  })
}

const vevWithAuth = vev.map(withAuth)
```

- withLogin

```js
// compose
const vevWithLogin = vev.map(withLoading, withAuth, ...vevWithToken.middleware())
const vevWithLogin = vevWithToken.map(withLoading).map(withAuth)
const vevWithLogin = vevWithAuth.map(withLoading).map(...vevWithToken.middleware())
```

---

## build

```bash
npx exbuild --bundle ./src/index.ts --target=es6 --sourcemap --minify --outfile=./dist/index.js
```

### about vev

Fetch just like a shuttle, switch between client and server.
vev in Norwegian mean loom and it's sort and cute :p \<e>

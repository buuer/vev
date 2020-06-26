# vev

\<e> | inspired by [koa](https://github.com/koajs/koa) [axios](https://github.com/axios/axios) [redaxios](https://github.com/developit/redaxios)

---

## start

```html
<html>
  <head>
    <script scr="./vev.js" type="module" />
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
// import { vev } form 'vev'
// const { vev } = require('vev/dist/index.common.js')

vev.get('/user')
vev.get('/user?id=3')
vev.get('/user', { params: { id: 3 } })

// POST /user body: {"id":3,"name":foo }
vev.post('/user', { id: 3, name: 'foo' })

//  POST /user body: id=3&name=foo
vev.post('/user', { id: 3, name: 'foo' }, { requestType: 'formData' })

vev.put(
  '/user',
  { name: 'foo' },
  {
    headers: { token: 'token' },
    params: { origin: '1' },
  }
)

vev.requset({
  method: 'post',
  body: { name: 'name', id: '1' },
})

const vevUser = vev.mapConfig({ baseUrl: '/user', params: { pageNum: 1 } })
vevUser.get('/post', { params: { id: 1 } }) // GET /user/post?id=1&pageNum=1

const vevNewUser = vevUser.mapConfig({ baseUrl: '/newUser', params: { pageNum: 0 } })
vevNewUser.requset({ parmas: { id: 2 } }) // GET /newUser?id=2&params=0

// import fetch as fetchpolyfill from 'node-fetch'
import { fetch as fetchPolyfill } from 'whatwg-fetch'

const vevPolyfill = vev.mapConfig({ fetch: fetchPolyfill })
vevPolufill.get('/post')

const vevPolyfillNewUSer = vevPolyfill.map(...vevNewUser.middleware())
```

---

## api

### vevConfig

```ts
interface VevConf extends RequestInit {
  // RequestInit
  method?: httpMethod
  headers?: RequestInit['headers']
  body?: RequestInit['body'] | plainObject // add plainObject
  mode?: 'cors' | 'no-cors' | 'same-origin' | 'navigate'
  credentials?: 'omit' | 'same-origin' | 'include'
  cache?: boolean
  redirect?: 'error' | 'follow' | 'manual'
  referrer?: string
  integrity?: string
  keepalive?: boolean
  signal?: AbortSignal
  referrerPolicy?: ReferrerPolicy

  // config
  url?: string
  baseUrl?: string
  params?: string | Record<string, any> | URLSearchParams

  fetch?: Window['fetch']
  responseType?: 'json' | 'arrayBuffer' | 'blob' | 'formData' | 'text' | 'row' // add row, default json
  requestType?: 'json' | 'formData' // default json, autoset headers['Conent-Type']
  timeout?: number
}
```

### vev

```ts
type middleware = (conf: VevConf | undefined, next) => Promise<any>
type middlewareConf = (conf: VevConf) => VevConf | Promise<VevConf>
type middlewareRes = (err: null | any, res?: any) => Promise<any>

type resWithBody = {
  response: Response
  status: Response['status']
  headers: Response['headers']
  body: Response['body'] | any
}

export type Vev<R = resWithBody> = {
  middleware: () => middleware[]

  version: () => string

  // configuration
  map: <T = R>(...mid: middleware[]) => Vev<T>
  mapConfig: <T = R>(mid: VevConf | middlewareConf) => Vev<T>
  mapResponse: <T = R>(mid: middlewareRes) => Vev<T>

  // request
  request: (config?: VevConf) => Promise<R>

  get: <T = R>(url: string, config?: VevConf) => Promise<T>
  // head: ...

  post: <T = R, B>(url: string, body?: B, config?: VevConf) => Promise<T>
  // options: ...
  // delete: ...
  // put: ...
  // patch: ...
}
```

---

## middleware

- withLoding

```js
const withLoding = (config, next) => {
  const cancel = startLoading()
  return next(config).finally(() => cancel())
}

const vevWithLoding = vev.map(withLoding)
```

- withToken

```js
const vevWithToken = vev.mapConfig({ headers: { authToken: getToken() } })

//  async
const withToken = async (config) => {
  const token = await getToken()
  config.headers = Object.assgin({}, config.headers, { token })
  return config
}

const vevWithToken = vev.mapConfig(withToken)
```

- gotoLogin

```js
const gotoLogin = (err, res) => {
  if (!err) return res
  return err?.status === 401 ? gotoLogin() : Promise.reject(err)
}

const vevToLogin = vev.mapResponse(gotoLogin)
```

- withAuth

```js
// compose
const vevWithAuth = vev.map(withLoading).mapConfig(withToken).mapResponse(gotoLogin)

const vevWithAuth = vevWithToken.map(withLoading).mapResponse(gotoLogin)
```

---

## build

```bash
esbuild --bundle ./src/index.ts --target=es6 --minify --format=esm --outfile=./dist/index.js
esbuild --bundle ./src/index.ts --target=es6 --minify --format=cjs --outfile=./dist/index.common.js

# test
Deno test ./test.ts

```

### about vev

Fetch just like a shuttle, switch between client and server.  
vev in Norwegian means loom, it's sort and cute :p

import { request } from '../src/request.ts'
import { assertEquals, assertStrictEquals, assert, createFetch } from './_test.dep.ts'

Deno.test('request | url', () => {
  return request({
    url: 'fetch.data',
    fetch: createFetch((url, init) => assertStrictEquals(url, 'fetch.data')),
  })
})

Deno.test('request | baseUrl', () => {
  return request({
    url: 'fetch.data',
    baseUrl: '/basePath/',
    fetch: createFetch((url, init) => assertStrictEquals(url, '/basePath/fetch.data')),
  })
})

Deno.test('request | baseUrl and absolute url', () => {
  return request({
    url: 'http://fetch.data',
    baseUrl: '/basePath/',
    fetch: createFetch((url, init) => assertStrictEquals(url, 'http://fetch.data')),
  })
})

Deno.test('request | bodyFormat', () => {
  return request({
    url: '/',
    method: 'post',
    body: 'a=1&b=2',
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, 'a=1&b=2')
    }),
  })
})

Deno.test('request | bodyFormat method GET without body', () => {
  return request({
    url: '/',
    body: 'a=1&b=2',
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, undefined)
    }),
  })
})

Deno.test('request | bodyFormat json', () => {
  return request({
    url: '/',
    method: 'post',
    body: { a: 1, b: 2 },
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, JSON.stringify({ a: 1, b: 2 }))
      assertEquals(init?.headers, { 'Content-Type': 'application/json;charset=utf-8' })
    }),
  })
})

Deno.test('request | bodyFormat custom headers', () => {
  return request({
    url: '/',
    method: 'post',
    body: { a: 1, b: 2 },
    headers: { 'Content-Type': 'json' },
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, JSON.stringify({ a: 1, b: 2 }))
      assertEquals(init?.headers, { 'Content-Type': 'json' })
    }),
  })
})

Deno.test('request | bodyFormat formData', () => {
  return request({
    url: '/',
    body: { a: 1, b: 2 },
    method: 'post',
    requestType: 'formData',
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, 'a=1&b=2')
      assertEquals(init?.headers, {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      })
    }),
  })
})

Deno.test('request | bodyFormat custom headers', () => {
  return request({
    url: '/',
    body: 'a=1&b=2',
    method: 'post',
    headers: { 'Content-Type': 'application/hahah' },
    fetch: createFetch((url, init) => {
      assertStrictEquals(init?.body, 'a=1&b=2')
      assertEquals(init?.headers, { 'Content-Type': 'application/hahah' })
    }),
  })
})

Deno.test('request | response body', () => {
  return request({ url: '.', fetch: createFetch((url, init) => ({ body: 'a' })) }).then((res) =>
    assertStrictEquals(res.body, 'a')
  )
})

Deno.test('request | response row', () => {
  return request({
    url: '.',
    responseType: 'row',
    fetch: createFetch(() => ({ body: 'error' })),
  })
    .then((err: any) => err.response.json())
    .then((err) => assertEquals(err, 'error'))
})

Deno.test('request | response error status: response.ok === false', () => {
  return request({ url: '.', fetch: createFetch(() => ({ ok: false, body: 'error' })) })
    .then(() => assert(false))
    .catch((err) => assertEquals(err.body, 'error'))
})

const signalAbout = (signal: AbortSignal) =>
  new Promise((resolve) => signal.addEventListener('abort', resolve))

Deno.test('request | timeout', () => {
  return request({
    url: '',
    timeout: 100,
    fetch: createFetch((url, init) => {
      if (!init?.signal) return assert(false)
      const startTime = Date.now()

      return signalAbout(init.signal).then(
        () => {
          const time = Date.now() - startTime
          assert(time <= 120, 'timeout > 120, time: ' + time)
          assert(time >= 100, 'timeout < 100, time: ' + time)
        },
        (err) => assert(false, err)
      )
    }),
  })
})

Deno.test('request | signal abouted', () => {
  const ctrl = new AbortController()
  const signal = ctrl.signal
  ctrl.abort()

  return request({
    url: '',
    signal,
    fetch: createFetch((url, init) => assertStrictEquals(init?.signal, signal)),
  })
})

Deno.test('request | time with signal ', () => {
  const ctrl = new AbortController()
  const signal = ctrl.signal
  setTimeout(() => ctrl.abort(), 50)
  const startTime = Date.now()

  return request({
    url: '',
    signal,
    timeout: 100,
    fetch: createFetch((url, init) => {
      assert(init?.signal, 'without signal')
      return signalAbout(init?.signal).then(() => {
        const time = Date.now() - startTime
        assert(time <= 60, ' time > 60, time: ' + time)
        assert(time >= 50, ' time < 50, time: ' + time)
      })
    }),
  })
})

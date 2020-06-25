import { request } from '../src/request.ts'
import { assertEquals, assertStrictEquals, assert } from 'https://deno.land/std/testing/asserts.ts'

const createFetch: (
  fn: (u: string, init?: RequestInit) => any
) => (url: string, init?: RequestInit) => Promise<any> = (fn) => ([url, init]: any) => {
  return Promise.resolve(fn(url, init)).then((res = null) => ({
    ok: res?.ok ?? true,
    json: () => Promise.resolve(res?.data ?? 'json'),
  }))
}

Deno.test('request |  baseUrl', () => {
  request(
    { url: 'http://fetch.data', baseUrl: '/basePath/' },
    createFetch((url, init) => assertStrictEquals(url, 'http://fetch.data'))
  )

  request(
    { url: 'fetch.data' },
    createFetch((url, init) => assertStrictEquals(url, 'fetch.data'))
  )

  return request(
    { url: 'fetch.data', baseUrl: '/basePath/' },
    createFetch((url, init) => assertStrictEquals(url, '/basePath/fetch.data'))
  )
})

Deno.test('request | bodyFormat', () => {
  request(
    { url: '/', body: 'a=1&b=2' },
    createFetch((url, init) => assertStrictEquals(init?.body, 'a=1&b=2'))
  )

  request(
    { url: '/', body: { a: 1, b: 2 } },
    createFetch((url, init) => {
      assertStrictEquals(init?.body, JSON.stringify({ a: 1, b: 2 }))
      assertEquals(init?.headers, { 'Content-Type': 'application/json;charset=utf-8' })
    })
  )

  request(
    { url: '/', body: { a: 1, b: 2 }, headers: { 'Content-Type': 'json' } },
    createFetch((url, init) => {
      assertStrictEquals(init?.body, JSON.stringify({ a: 1, b: 2 }))
      assertEquals(init?.headers, { 'Content-Type': 'json' })
    })
  )

  request(
    { url: '/', body: { a: 1, b: 2 }, requsetType: 'formData' },
    createFetch((url, init) => {
      assertStrictEquals(init?.body, 'a=1&b=2')
      assertEquals(init?.headers, {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      })
    })
  )

  return request(
    { url: '/', body: 'a=1&b=2', headers: { 'Content-Type': 'application/hahah' } },
    createFetch((url, init) => {
      assertStrictEquals(init?.body, 'a=1&b=2')
      assertEquals(init?.headers, { 'Content-Type': 'application/hahah' })
    })
  )
})

Deno.test('request | response', () => {
  request(
    { url: '.' },
    createFetch((url, init) => ({ data: 'a' }))
  ).then((res) => assertStrictEquals(res, 'a'))

  request(
    { url: '.', responseType: 'row' },
    createFetch(() => ({ ok: true, data: 'error' }))
  )
    .then((err: any) => err.json())
    .then((err) => assertEquals(err, 'error'))

  return request(
    { url: '.' },
    createFetch(() => ({ ok: false, data: 'error' }))
  )
    .then(() => assert(''))
    .catch((err) => assertEquals(err, 'error'))
})

Deno.test('request | timeout', () => {
  const signalAbout = (signal: AbortSignal) =>
    new Promise((resolve) => signal.addEventListener('abort', resolve))

  return request(
    { url: '', timeout: 300 },
    createFetch((url, init) => {
      if (!init?.signal) return assert(false)
      const dateStart = Date.now()

      return signalAbout(init.signal).then(
        () => {
          const time = Date.now() - dateStart
          assert(time < 330, 'timeout > 330')
          assert(time > 270, 'timeout < 270')
          assert('about')
        },
        (err) => assert(false, err)
      )
    })
  )
})

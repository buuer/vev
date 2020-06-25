import './request.ts'
import './utils.ts'

import { assertEquals, assertStrictEquals, assert } from 'https://deno.land/std/testing/asserts.ts'
import { vev } from '../src/index.ts'

type mid = (conf: any, next: any) => Promise<any>
type fnAny = (...a: any[]) => any

Deno.test('vev map', () => {
  const mid: mid = (c, n) => n(c)
  const v1 = vev.map(mid)
  const v2 = vev.map(mid, mid)

  assertEquals(v1.middleware(), [mid])
  assertEquals(v2.middleware(), [mid, mid])
})

const createFetch = (fn?: any) =>
  ({
    headers: { a: 1, b: 2 },
    fetch: (url: any, conf: any) => {
      fn && fn({ url, ...conf })
      return { ok: true, json: () => Promise.resolve(conf) }
    },
  } as any)

const mapConfig = (expected: any) => createFetch((actual: any) => assertEquals(actual, expected))

Deno.test('vev mapConfig', () => {
  const v1 = vev.headers({ a: 3 } as any)

  const v2 = v1.headers((h: any) => {
    h.b = h.b + ''
    return h
  })

  const v3 = v1.mapConfig({ url: '123', headers: { d: '4' } })

  const v4 = v3.mapConfig(((a) => {
    a.url += '/a'
    a.params = { name: 'name' }
    return a
  }) as fnAny)

  const v5 = v4.params({ id: 'id' })

  v1.request(mapConfig({ headers: { a: 3, b: 2 }, url: '' }))
  v2.request(mapConfig({ headers: { a: 3, b: '2' }, url: '' }))
  v3.request(mapConfig({ url: '123', headers: { a: 3, b: 2, d: '4' } }))
  v4.request(mapConfig({ url: '123/a?name=name', headers: { a: 3, b: 2, d: '4' } }))
  return v4
    .params({ name: 'newName' })
    .request(mapConfig({ url: '123/a?name=newName', headers: { a: 3, b: 2, d: '4' } }))
})

Deno.test('vev mapResponse', () => {
  const v1 = vev.mapRes((res) => {
    res.a = 3
    return res
  })

  v1.request(createFetch()).then((res) => {
    assertEquals(res, { headers: { a: 1, b: 2 }, a: 3 })
  })

  return v1
    .mapConfig({ responseType: 'row' })
    .request(createFetch())
    .then((res: any) => assert(res.a === 3 && res.ok))
})

Deno.test('vev request method', () => {
  const v1 = vev.map()
  v1.get('/dsa', {
    body: 'body',
    ...createFetch((conf: any) => {
      assertStrictEquals(conf.method, 'get')
      assert(!conf.body)
    }),
  })

  return v1.post(
    '/dsa',
    { body: true },
    createFetch((conf: any) => {
      assertStrictEquals(conf.body, JSON.stringify({ body: true }))
      assertStrictEquals(conf.method, 'post')
      assertStrictEquals(conf.headers?.['Content-Type'], 'application/json;charset=utf-8')
    })
  )
})

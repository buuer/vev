import { vev, VevConf } from '../src/index.ts'
import {
  assertEquals,
  assertStrictEquals,
  assert,
  createFetch,
  assertThrowsAsync,
} from './_test.dep.ts'

type mid = (conf: any, next: any) => Promise<any>
type fnAny = (...a: any[]) => any

const vFetch = createFetch()

Deno.test('vev map', () => {
  const mid: mid = (c, n) => n(c)
  const v1 = vev.map(mid)
  const v2 = vev.map(mid, mid)

  assertEquals(v1.middleware(), [mid])
  assertEquals(v2.middleware(), [mid, mid])
})

Deno.test('vev mapConfig', () => {
  const v1 = vev.mapConfig({ headers: { a: 'a' }, fetch: createFetch() })

  const v2 = v1.mapConfig((conf: VevConf) => {
    conf.headers = Object.assign({}, conf.headers, {
      b: (conf.headers as any)?.b + 'b',
    })
    return conf
  })

  const v3 = v1.mapConfig({ url: 'v3/', headers: { d: '4', a: 'v3' } })

  const v4 = v3.mapConfig(((conf) => {
    conf.url += 'a'
    conf.params = { name: 'name' }
    return conf
  }) as fnAny)

  return (
    v1
      .request({ headers: { a: 'v1', b: 'b' }, url: '' })
      .then((res) => {
        assertEquals(res.headers, { a: 'v1', b: 'b' })
      })

      // v2
      .then(() => v2.request({ headers: { b: 'v2' }, url: '' }))
      .then((res) => assertEquals(res.headers, { a: 'a', b: 'v2b' }))

      // v3
      .then(() => v3.request({ headers: { c: 'c' } }))
      .then((res) => {
        assertEquals(res.headers, { a: 'v3', c: 'c', d: '4' })
        assertEquals(res.body.url, 'v3/')
      })

      // v4
      .then(() => v4.request({ url: 'v4/123/' }))
      .then((res) => {
        assertStrictEquals(res.body.url, 'v4/123/a?name=name')
        assertEquals(res.headers, { d: '4', a: 'v3' })
      })

      // v4 mapConfig
      .then(() => v4.request({ params: { newName: 'newName' } }))
      .then((res) => assertEquals(res.body.url, 'v3/a?name=name'))

      // v3 mapConfig
      .then(() => v3.mapConfig({ headers: { d: 'v3-d' } }).request())
      .then((res) => assertEquals(res.headers, { d: 'v3-d', a: 'v3' }))

      // test return
      .then(
        () => {},
        (err) => assert(false, 'catch err ' + err)
      )
  )
})

Deno.test('vev mapResponse', () => {
  const v1 = vev.mapConfig({ fetch: createFetch((url) => ({ ok: !!url })) })

  const v2 = v1.mapResponse((err, res) => {
    return err !== null ? Promise.reject('err') : Promise.resolve('success')
  })

  return v2
    .request({ url: 'true' })
    .then(
      (res) => assertStrictEquals(res, 'success'),
      (err) => assert(false, 'not here - success: ' + err)
    )

    .then(() => v2.request({ url: '' }))

    .then(
      (res) => assert(false, 'not here - error: ' + res),
      (err) => assertStrictEquals(err, 'err')
    )

    .then(
      () => {},
      (err) => assert(false, 'catch err' + err)
    )
})

Deno.test('vev request method', () => {
  const v1 = vev.mapConfig({ fetch: createFetch(() => {}) })

  return (
    v1
      .get('/dsa', { body: 'body' })
      .then((res) => {
        assertStrictEquals(res.body.method, 'get')
        assert(!res.body.body, 'get canot has body')
      })

      // POST
      .then(() => v1.post('/dsa', { name: 'name' }))
      .then((res) => {
        assertStrictEquals(res.body.body, JSON.stringify({ name: 'name' }))
        assertStrictEquals(res.body.method, 'post')
        assertStrictEquals(res.body.headers?.['Content-Type'], 'application/json;charset=utf-8')
      })

      .then(
        () => {},
        (err) => assert(false, 'catch err' + err)
      )
  )
})

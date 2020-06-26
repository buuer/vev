import { assertThrowsAsync, assertEquals, assertStrictEquals, assert } from './_test.dep.ts'

import { callFn, pick, memoryCall, deepMerge } from '../src/utils.ts'
import { composeVev, middleware } from '../src/middleware.ts'
import { VevConf } from '../src/index.ts'
import { vevErrorText } from '../src/errorCode.ts'

Deno.test('utils | callFn', () => {
  const add = (n: number) => n + 1
  assertStrictEquals(callFn(add, 1), 2)

  const fn = (...arg: string[]) => assertEquals(arg, ['1', '2', '3'])
  callFn(fn, '1', '2', '3')

  assertStrictEquals(callFn('fn', '1', '2', '3'), '1')
})

Deno.test('utils | pick', () => {
  const pickAB = pick({ a: 1, b: 2, c: { d: '3' } }, ['a', 'b', 'z'])
  assertEquals(pickAB, { a: 1, b: 2 })
})

Deno.test('utils | deepMerge', () => {
  const objectA = {
    a: 1,
    d: { c: 3, e: 4, a: 'a' },
    n: null,
    u: undefined,
    s: 's',
    arr: [1],
  } as any

  const objectB = {
    c: '3',
    d: { c: 1, b: 2, a: objectA },
    u: 'undefined',
    s: { s: 's' },
    arr: [2],
  } as any

  const mergeAB = deepMerge(objectA, objectB)
  const mergeBA = deepMerge(objectB, objectA)

  assertEquals(mergeAB.d.a, objectA)
  assert(mergeAB.d.a !== objectA)

  assertEquals(mergeAB, {
    a: 1,
    c: '3',
    d: { c: 1, e: 4, b: 2, a: objectA },
    n: null,
    u: 'undefined',
    s: { s: 's' },
    arr: [1, 2],
  })

  assertEquals(mergeBA, {
    a: 1,
    c: '3',
    d: { c: 3, e: 4, b: 2, a: 'a' },
    n: null,
    u: undefined,
    s: 's',
    arr: [2, 1],
  })
})

Deno.test('utils | memoryCall', () => {
  let a = 0
  const fn = () => ({ a: a += 1 })
  const firstCall = memoryCall(fn, fn)
  const secondCall = memoryCall(fn, fn)
  const thirdCall = memoryCall({}, fn)

  assertEquals(firstCall, { a: 1 })
  assertStrictEquals(firstCall, secondCall)
  assertEquals(thirdCall, { a: 2 })
})

type mid = (conf: any, next: any) => Promise<any>

Deno.test('compose | missing nextCall', () => {
  const mid: mid = (conf, next) => conf
  assertThrowsAsync(() => composeVev([mid])(), Error, vevErrorText(2))
})

Deno.test('compose | duplicate nextCall', () => {
  const mid: mid = (conf, next) => {
    next(conf)
    return next(conf)
  }

  assertThrowsAsync(() => composeVev([mid])(), Error, vevErrorText(2))
})

Deno.test('compose | missing & duplicate nextCall', () => {
  const mid: mid = (conf, next) => {
    next(conf)
    return next(conf)
  }

  const mid02: mid = (conf, next) => conf

  assertThrowsAsync(() => composeVev([mid, mid02])(), Error, vevErrorText(2))
})

Deno.test('compose | not pass config', () => {
  const mid: mid = (conf, next) => next()
  assertThrowsAsync(() => composeVev([mid])(), Error, vevErrorText(1))
})

Deno.test('compose | middlwear is not a function', () => {
  assertThrowsAsync(() => composeVev([(null as any) as middleware])(), Error, vevErrorText(0))
})

Deno.test('compose | check reslut', () => {
  const mid: mid = (conf, next) => next(conf + 'b').then((res: any) => res + 'f')
  const mid2: mid = (conf, next) => next(conf + 'c').then((res: any) => res + 'e')

  return composeVev([mid, mid2])(('a' as any) as VevConf, (c: string) =>
    Promise.resolve((c += 'd'))
  ).then(
    (a) => assertStrictEquals(a, 'abcdef'),
    (err) => assert(false, err)
  )
})

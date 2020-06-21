import {
  assertThrowsAsync,
  assertEquals,
  assertStrictEquals,
  assert,
} from 'https://deno.land/std/testing/asserts.ts'

import { callFn, pick, memoryCall } from '../src/utils.ts'
import { composeVev, middleware } from '../src/middleware.ts'
import { vev, VevConf } from '../src/index.ts'
import { vevError } from '../src/errorCode.ts'

const id = (a: any) => a

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

Deno.test('utils | memoryCall', () => {
  let a = 0
  const fn = () => ({ a: a += 1 })
  const firstCall = memoryCall(fn, fn)
  const secondCall = memoryCall(fn, fn)
  const thirdCall = memoryCall({}, fn)

  assertEquals(firstCall, { a: 1 })
  assertEquals(secondCall, { a: 1 })
  assertEquals(thirdCall, { a: 2 })
  assertStrictEquals(firstCall, secondCall)
})

type mid = (conf: any, next: any) => Promise<any>

Deno.test('compose | missing nextCall', () => {
  const mid: mid = (conf, next) => conf
  assertThrowsAsync(() => composeVev(mid)())
})

Deno.test('compose | duplicate nextCall', () => {
  const mid: mid = (conf, next) => {
    next(conf)
    return next(conf)
  }

  assertThrowsAsync(() => composeVev(mid)(), Error, vevError(2).message)
})

Deno.test('compose | missing & duplicate nextCall', () => {
  const mid: mid = (conf, next) => {
    next(conf)
    return next(conf)
  }

  const mid02: mid = (conf, next) => conf

  assertThrowsAsync(() => composeVev(mid, mid02)(), Error, vevError(2).message)
})

Deno.test('compose | not pass config', () => {
  const mid: mid = (conf, next) => next()
  assertThrowsAsync(() => composeVev(mid)(), Error, vevError(1).message)
})

Deno.test('compose | middlwear is not a function', () => {
  assertThrowsAsync(() => composeVev((null as any) as middleware)(), Error, vevError(0).message)
})

Deno.test('compose | not pass configss', () => {
  const mid: mid = (conf, next) => next(conf + 'b').then((res: any) => res + 'd')

  composeVev(mid)(('a' as any) as VevConf, (c: string) => Promise.resolve((c += 'c'))).then(
    (a) => assertStrictEquals(a, 'abcd'),
    (err) => assert(false, err)
  )
})


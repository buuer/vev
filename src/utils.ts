const toString = Object.prototype.toString
const isArr = Array.isArray
export const merge = Object.assign
export const pResolve = Promise.resolve.bind(Promise)
export const pReject = Promise.reject.bind(Promise)
export const objectCreate = Object.create

export const isPlainObject = (obj: any) => toString.call(obj) === '[object Object]'
export const isFn = (fn: any) => typeof fn === 'function'

export const callFn = (fn: any, ...arg: any[]) => {
  try {
    return isFn(fn) ? fn.call(null, ...arg) : arg[0]
  } catch (error) {
    return arg
  }
}

export const pick = (obj: any, arr: string[]) => {
  return arr.reduce((o, k) => {
    obj[k] && (o[k] = obj[k])
    return o
  }, {} as any)
}

export const tap = (fn: any) => (arg: any) => (fn(arg), arg)

export const deepMerge = (origin: any, overrides: any) => {
  const deepKey = Object.keys(origin).reduce((pre, cur) => {
    const curVal = origin?.[cur]
    const overVal = overrides?.[cur]

    if (isPlainObject(curVal) && isPlainObject(overVal)) {
      pre[cur] = deepMerge(curVal, overVal)
    }

    if (isArr(curVal) && isArr(overVal)) {
      pre[cur] = curVal.concat(overVal)
    }

    return pre
  }, {} as any)

  return merge({}, origin, overrides, deepKey)
}

export const memoryCall = (() => {
  const memoryMap = new WeakMap()

  return (key: any, fn: any) => {
    if (!memoryMap.has(key)) {
      memoryMap.set(key, callFn(fn))
    }

    return memoryMap.get(key)
  }
})()

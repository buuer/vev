export const merge = Object.assign
export const objectCreate = Object.create
const objectKeys = Object.keys
const objectProto = Object.prototype
const objectHop = objectProto.hasOwnProperty

const isArr = Array.isArray
export const concat = (...arr: any[]) => [].concat(...arr)
export const pResolve = Promise.resolve.bind(Promise)
export const pReject = Promise.reject.bind(Promise)

export const isPlainObject = (obj: any) => objectProto.toString.call(obj) === '[object Object]'
export const isFn = (fn: any) => typeof fn === 'function'
export const isUndefined = (u: any) => u === undefined

export const pick = (obj: any, arr: string[]) => {
  return arr.reduce((o, k) => {
    !isUndefined(obj[k]) && (o[k] = obj[k])
    return o
  }, {} as any)
}

export const tap = (fn: any) => (arg: any) => (fn(arg), arg)

const getVal = (obj: any, isObj: boolean) => (isObj ? deepMerge({}, obj) : obj)

export const deepMerge = (origin: any, overrides: any): any =>
  concat(objectKeys(overrides), objectKeys(origin)).reduce((o, key) => {
    const overridesVal = overrides[key]
    const originVal = origin[key]
    const isOverridesObj = isPlainObject(overridesVal)
    const isOriginObj = isPlainObject(originVal)

    o[key] = !objectHop.call(overrides, key)
      ? getVal(originVal, isOriginObj)
      : isOriginObj && isOverridesObj
      ? deepMerge(originVal, overridesVal)
      : isArr(originVal) && isArr(overridesVal)
      ? concat(originVal, overridesVal)
      : getVal(overridesVal, isOverridesObj)

    return o
  }, {} as any)

export const memoryCall = (() => {
  const memoryMap = new WeakMap()

  return <T>(key: any, fn: () => T) => {
    !memoryMap.has(key) && memoryMap.set(key, fn())
    return memoryMap.get(key) as T
  }
})()

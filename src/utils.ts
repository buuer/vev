export const isFn = (fn: any) => typeof fn === 'function'

export const callFn = (fn: any, arg: any) =>
  isFn(fn) ? fn.call(null, arg) : arg

export const pick = <T, L extends keyof T>(
  obj: T | any,
  arr: L[]
): Pick<T, L> => arr.reduce((o, k) => ((o[k] = obj[k]), o), obj)

export const mergeConf = (...overrides: any[]) => (origin: any) => {
  return Object.assign(origin, ...overrides)
}

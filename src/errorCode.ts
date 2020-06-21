const err = [
  'middleware must be a function',
  'middleware must return config or pass to next',
  'next must call once and onle once',
  'fetch is unavailable',
]

export const vevError = (code: number) => {
  return new Error(err[code] + '(vev: ' + code + ')')
}

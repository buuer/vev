export const vevErrorText = (code: number) =>
  [
    'middleware must be a function',
    'middleware must return config or pass to next',
    'next must call once and onle once',
    'fetch is unavailable',
    'resFormat is not a function',
  ][code] || ''

export const vevAssert = (cond: boolean, code: number, text?: string) => {
  if (!cond) throw new Error(vevErrorText(code) + text)
}

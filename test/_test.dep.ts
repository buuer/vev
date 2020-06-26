export * from 'https://deno.land/std/testing/asserts.ts'

type createFetch = (
  fn?: (u: string, init?: RequestInit) => any
) => (url: string, init?: RequestInit) => Promise<any>

export const createFetch: createFetch = (fn = (u, a) => ({ ...a, url: u })) => (url, init) => {
  return Promise.resolve(fn(url, init)).then((res) => {
    return {
      ok: res?.ok ?? true,
      json: () => Promise.resolve(res?.body ?? res ?? init),
      headers: init?.headers,
      status: res?.status,
    }
  })
}

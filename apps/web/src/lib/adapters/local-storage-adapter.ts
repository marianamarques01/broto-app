import type { IStorage } from '@broto/shared'

export const localStorageAdapter: IStorage = {
  getItem: async (key) => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  },
  setItem: async (key, value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  },
  removeItem: async (key) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
  },
}

/**
 * Minimal async key-value storage — implemented per platform (AsyncStorage, localStorage, tests).
 */

export interface IStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

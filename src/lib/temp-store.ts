export default class TempStore<T> {
  private store: Map<string, T>;
  constructor() {
    this.store = new Map();
  }

  get(key: string) {
    return this.store.get(key);
  }

  set(key: string, value: T) {
    this.store.set(key, value);
    return true;
  }

  has(key: string) {
    return this.store.has(key);
  }

  remove(key: string) {
    this.store.delete(key);
    return true;
  }

  clear() {
    this.store.clear();
  }
}

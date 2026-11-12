// Ti wrapper IndexedDB (san depandans). Du magazen: "cache" (repons GET) ak "queue" (operasyon offline).
const DB_NAME = "platfomnou-offline";
const DB_VERSION = 1;
export type Store = "cache" | "queue";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache", { keyPath: "key" });
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export const idbGet = <T>(store: Store, key: string) => run<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
export const idbPut = (store: Store, value: unknown) => run(store, "readwrite", (s) => s.put(value));
export const idbDelete = (store: Store, key: string) => run(store, "readwrite", (s) => s.delete(key));
export const idbAll = <T>(store: Store) => run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
export const idbClear = (store: Store) => run(store, "readwrite", (s) => s.clear());

// import { set, get, clear, createStore, UseStore, keys, del, entries } from 'idb-keyval';
import { DBSchema, openDB } from "idb";
import { spfxExtensionsCoreDB } from "../../core/services/coreIdbService";
import { DEBUG_KEYS } from "../../utilities/debug";




export class IDBStorage<T = any> {
    private _idbStore: UseStore | undefined;
    private isIndexedDBError: boolean = false;

    constructor(customStoreparams?: ICustomStoreParams) {
        if (!window.indexedDB) {
            this.isIndexedDBError = true;
        }
        if (customStoreparams && customStoreparams.dbName && customStoreparams.storeName) {
            this._idbStore = createStore(customStoreparams.dbName, customStoreparams.storeName);
        } else {
            this._idbStore = createStore(DEFAULT_DB_NAME, DEFAULT_STORE_NAME);
        }
    }

    public get indexedDBError(): boolean {
        return this.isIndexedDBError;
    }

    public get length(): Promise<number> {
        return (async () => {
            let keyList = await keys(this._idbStore);
            return keyList.length;
        })();
    }

    public clear(): Promise<void> {
        return clear(this._idbStore);
    }

    public getItem(key: string): Promise<T | undefined> {
        return get(key, this._idbStore);
    }

    public removeItem(key: string): Promise<void> {
        return del(key, this._idbStore);
    }

    public setItem(key: string, data: any): Promise<void> {
        return set(key, data, this._idbStore);
    }

    public getEntries(): Promise<[IDBValidKey, any][]> {
        return entries(this._idbStore);
    }

    public test(): boolean {
        return !!window.indexedDB;
    }
}

export class IDBStorageWrapper {
    private idbStorage: IDBStorage;

    constructor(private customStoreparams?: ICustomStoreParams) {
        if (!customStoreparams || !customStoreparams.dbName || !customStoreparams.storeName) {
            this.customStoreparams = defaultIDBStoreParams;
        }
        this.idbStorage = new IDBStorage(this.customStoreparams);
    }

    /**
     * Get value from underlying storage by key
     *
     * @param key
     * @returns
     */
    public async get<T = any>(key: string): Promise<T | undefined> {
        const idbData = await spfxExtensionsCoreDB.get("PNP_CACHE", key);
        if (idbData && idbData.indexedDBCache) {
            const isExpired = new Date(idbData.expires) <= new Date();
            if (isExpired) {
                await this.delete(key);
                return;
            } else {
                return idbData.data as T;
            }
        }
    }

    /**
     * Adds a value to the underlying storage
     *
     * @param key The key to use when storing the provided value
     * @param o The value to store
     * @param expires adds expiry date
     */
    public async put(key: string, o: any, expires: Date): Promise<void> {
        if (this.idbStorage.indexedDBError) {
            return Promise.resolve();
        }
        spfxExtensionsCoreDB.put("PNP_CACHE", {
            data: o,
            expires: expires.toString(),
            indexedDBCache: 1,
        }, key);  

    }

    /**
     * Deletes a value from the underlying storage
     *
     * @param key The key of the pair we want to remove from storage
     */
    public delete(key: string): Promise<void> {
        if (this.idbStorage.indexedDBError) {
            return Promise.resolve();
        }
        return this.idbStorage.removeItem(key);
    }

    /**
     * Deletes any expired items
     */
    public async deleteExpired() {
        if (this.idbStorage.indexedDBError) {
            return;
        }
        try {
            await this.idbStorage.clear();
        } catch (e) {
            console.error('Error clearing IDB storage:', e);
        }
    }
}
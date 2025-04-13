import { dateAdd, getHashCode, type TimelinePipe } from '@pnp/core';
import { type IQueryableInternal, Queryable, type QueryablePreObserver } from '@pnp/queryable';
import { defaultIDBStoreParams, type ICustomStoreParams, IDBStorageWrapper } from './idbStorage';

const DEFAULT_CACHE_TIME = 60 * 24; // 24 hours

export type CacheKeyFactory = (url: string) => string;
export type CacheExpireFunc = (url: string) => Date;

export interface ICachingProps {
    keyFactory?: CacheKeyFactory;
    expireFunc?: CacheExpireFunc;
}

export function IDBCaching(props?: ICachingProps): TimelinePipe<Queryable> {
    const { keyFactory, expireFunc } = {
        keyFactory: (url: string) => getHashCode(url.toLowerCase()).toString(),
        expireFunc: () => dateAdd(new Date(), 'minute', DEFAULT_CACHE_TIME),
        ...props,
    };



    const idbCacheObserver: QueryablePreObserver = async function (
        this: IQueryableInternal,
        url: string,
        init: RequestInit,
        result: any,
    ) {
        const method = init.method || '';
        const initHeaders = (init.headers as Record<string, string>) || {};
        const cacheHeader = initHeaders["X-PnP-CacheAlways"] ? initHeaders["X-PnP-CacheAlways"] : "";

        // only cache get requested data or where the CacheAlways header is present (allows caching of POST requests)
        if (/get/i.test(method) || cacheHeader) {
            const key = initHeaders["X-PnP-CacheKey"] ? initHeaders["X-PnP-CacheKey"] : keyFactory(url.toString());
            const idbStorageWrapper = new IDBStorageWrapper(idbParams);
            let indexdbData;

            try {
                indexdbData = await idbStorageWrapper.get(key);
            } catch (err) {
                console.log(`IDBCaching(idbCacheObserver): ${err}.`);
            }

            if (indexdbData == null) {
                //  falling back to network to update cache
                this.on.post(async function (url: URL, result1: any) {
                    const expiryDate = expireFunc(url.toString()) || new Date();
                    await idbStorageWrapper.put(key, result1, expiryDate);
                    return [url, result1];
                });
            } else {
                result = indexdbData;
            }
        }

        return Promise.resolve([url, init, result]);
    };

    return (instance: Queryable) => {
        instance.on.pre(idbCacheObserver);
        return instance;
    };
}
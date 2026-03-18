// import { dateAdd, getHashCode, type TimelinePipe } from '@pnp/core';
// import { type IQueryableInternal, Queryable, type QueryablePreObserver } from '@pnp/queryable';
// import { addOrUpdatePNPCacheItem, evictPNPDataCache, getPNPCacheItem } from '../../core/services/coreIdbService';
// import { logGenericCoreError } from '../../core/services/loggingService';

// const DEFAULT_CACHE_TIME = 60 * 24; // 24 hours

// export type CacheKeyFactory = (url: string) => string;
// export type CacheExpireFunc = (url: string) => Date;

// export interface ICachingProps {
//     keyFactory?: CacheKeyFactory;
//     expireFunc?: CacheExpireFunc;
// }

// function defaultKeyFactory(url: string) {
//     return getHashCode(url.toLowerCase()).toString();
// }

// function defaultExpireFunc(_url: string) {
//     return dateAdd(new Date(), 'minute', DEFAULT_CACHE_TIME);
// }


// export function IDBCaching(props?: ICachingProps): TimelinePipe<Queryable> {
//     const { keyFactory, expireFunc } = {
//         keyFactory: defaultKeyFactory,
//         expireFunc: defaultExpireFunc,
//         ...props,
//     };
//     const idbCacheObserver: QueryablePreObserver = async function (
//         this: IQueryableInternal,
//         url: string,
//         init: RequestInit,
//         result: any,
//     ) {
//         const method = init.method || '';
//         const initHeaders = (init.headers as Record<string, string>) || {};
//         const cacheHeader = initHeaders["X-PnP-CacheAlways"] ?? "";
//         // await evictPNPDataCache();
//         // only cache get requested data or where the CacheAlways header is present (allows caching of POST requests)
//         if (/get/i.test(method) || cacheHeader) {
//             const key = initHeaders["X-PnP-CacheKey"] ?? (keyFactory?.(url.toString()) || defaultKeyFactory(url.toString()));
//             let indexdbData;

//             try {
//                 indexdbData = await getPNPCacheItem(key);
//             } catch (err) {
//                 logGenericCoreError(`PNP IDBCaching(idbCacheObserver): ${err}.`);
//             }

//             if (indexdbData == null) {
//                 //  falling back to network to update cache
//                 this.on.post(async function (url: URL, result1: any) {
//                     const expiryDate = expireFunc(url.toString()) || new Date();
//                     await addOrUpdatePNPCacheItem({
//                         keyHash: key,
//                         url: url.toString(),
//                         data: result1,
//                     }, expiryDate);
//                     return [url, result1];
//                 });

//             } else {
//                 result = indexdbData;
//             }
//         }

//         return Promise.resolve([url, init, result]);
//     };

//     return (instance: Queryable) => {
//         instance.on.pre(idbCacheObserver);
//         return instance;
//     };
// }
// Global test setup for DOM and required globals
import "fake-indexeddb/auto";
// import { Window, } from "happy-dom";
import { JSDOM } from "jsdom";
import { webcrypto } from "node:crypto";
import { vi } from "vitest";

// Create a DOM environment
// const happyDom = new Window({ url: "https://example.com" });
const jsdom = new JSDOM("", { url: "https://example.com", pretendToBeVisual: true });
Object.defineProperty(jsdom.window, "crypto", {
  value: webcrypto,
});
const windowInstance = jsdom.window;
// const windowInstance = new Window({ url: "https://example.com" });
const { document } = windowInstance;
// Expose globals expected by the code under test
// DEBUG is referenced at module top-level; set to false to avoid importing preact/debug during tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.stubGlobal("DEBUG", false);
vi.stubGlobal("asd", () => {});
// Mirror browser-like globals
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = windowInstance;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).document = document;
// Some libs might check for navigator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).navigator = { userAgent: "happy-dom" };
(globalThis as any).alert = () => {};
// fake-indexeddb/auto has populated globalThis with IDB* constructors and indexedDB

// Provide minimal structure used by App component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window.__globalSettings__ = {
  customizations: {
    settings: {
      theme: {
        palette: {},
        isInverted: false,
      },
    },
  },
};

(globalThis as any).window.moduleLoaderPromise = Promise.resolve({
  context: {
    pageContext: {
      web: {
        absoluteUrl: "https://example.com",
      },
    },
  },
});

// Create #spCommandBar with an Edit button so App's querySelector doesn't crash
const cmdBar = document.createElement("div");
cmdBar.id = "spCommandBar";
const editBtn = document.createElement("button");
editBtn.setAttribute("name", "Edit");
cmdBar.appendChild(editBtn);
document.body.appendChild(cmdBar);

// // --- PnP JS: Global Mocks -------------------------------------------------
// // We mock the whole @pnp stack so tests don't perform any network calls and can
// // assume SP interactions "just work" with safe, empty defaults.

// // Side-effect modules that patch queryables – keep them as no-ops in tests
// vi.mock("@pnp/sp/hubsites", () => ({}));
// vi.mock("@pnp/sp/files", () => ({}));
// vi.mock("@pnp/sp/folders", () => ({}));
// vi.mock("@pnp/sp/lists", () => ({}));
// vi.mock("@pnp/sp/sites", () => ({}));
// vi.mock("@pnp/sp/webs", () => ({}));
// vi.mock("@pnp/sp/batching", () => ({}));

// // Core queryable helpers
// vi.mock("@pnp/queryable", () => {
//   class HttpRequestError extends Error {
//     status?: number;
//     constructor(message: string, status?: number) {
//       super(message);
//       this.name = "HttpRequestError";
//       this.status = status;
//     }
//   }
//   const Caching = () => ({
//     /* noop plugin */
//   });
//   return { HttpRequestError, Caching };
// });

// // SPCollection used for custom endpoints (e.g., hub sites API)
// vi.mock("@pnp/sp/spqueryable", () => {
//   const SPCollection = (baseUrl: string, path: string) => {
//     // Callable + chainable object
//     const fn: any = async () => ({
//       "@odata.context": "",
//       value: [],
//       "@odata.nextLink": "",
//     });
//     fn.filter = (_: unknown) => fn;
//     fn.top = (_: number) => fn;
//     fn.using = (_: unknown) => fn;
//     fn.on = {
//       parse: {
//         replace: (_: unknown) => {
//           /* ignore custom parser */
//         },
//       },
//     };
//     fn.toUrl = () => `${baseUrl}/${path}`;
//     return fn;
//   };
//   return { SPCollection };
// });

// // Main @pnp/sp surface with a lightweight SPFI stub
// vi.mock("@pnp/sp", () => {
//   // Minimal folder shape used by delete recursion and file upload helpers
//   const makeFolder = () => {
//     const folder: any = {};
//     const getByUrl = (_name: string) => makeFolder();
//     const foldersFn: any = async () => [] as any[]; // no subfolders
//     foldersFn.getByUrl = getByUrl;
//     folder.folders = foldersFn;
//     folder.delete = async () => {};
//     folder.files = {
//       addUsingPath: async (_name: string, _blob: Blob, _opts?: unknown) => ({}),
//     };
//     return folder;
//   };

//   const makeItemsFn = () => {
//     // Callable chain returning arrays (used both as iterator and as direct call)
//     const itemsFn: any = async () => [] as any[];
//     itemsFn.select = (_: string, __?: string) => itemsFn;
//     itemsFn.filter = (_: string) => itemsFn;
//     itemsFn.top = (_: number) => ({
//       [Symbol.asyncIterator]() {
//         let done = false;
//         return {
//           async next() {
//             if (done) return { done: true, value: undefined };
//             done = true;
//             return { done: false, value: [] as any[] };
//           },
//         } as AsyncIterator<any[]>;
//       },
//     });
//     itemsFn.getById = (_id: number) => ({ delete: async () => {} });
//     return itemsFn;
//   };

//   const createSP = (baseUrl: string) => {
//     const webFn: any = async () => ({
//       ServerRelativeUrl: "/sites/mock",
//       Id: "web-id",
//       Url: baseUrl,
//       Title: "Mock Web",
//     });
//     webFn.toUrl = () => `${baseUrl}/_api/web`;
//     webFn.using = (_: unknown) => webFn; // passthrough
//     webFn.getFolderByServerRelativePath = (_: string) => makeFolder();
//     webFn.lists = {
//       ensure: async (
//         _title: string,
//         _desc?: string,
//         _template?: number,
//         _enableContentTypes?: boolean,
//         _props?: unknown
//       ) => ({ Created: true }),
//       getByTitle: (_title: string) => ({
//         items: makeItemsFn(),
//         rootFolder: {
//           folders: { getByUrl: (_name: string) => makeFolder() },
//         },
//       }),
//     };
//     webFn.batched = () => {
//       const batch = {
//         lists: {
//           getByTitle: (_title: string) => ({
//             items: {
//               getById: (_id: number) => ({ delete: async () => {} }),
//             },
//           }),
//         },
//       };
//       const execute = async () => {};
//       return [batch, execute] as const;
//     };

//     const siteFn: any = async () => ({ Id: "site-id", HubSiteId: "hub-id", IsHubSite: false });
//     const rootWebFn: any = async () => ({ Id: "rootweb-id", Url: baseUrl, Title: "Mock Root Web" });
//     rootWebFn.webs = async () => [] as any[];
//     siteFn.rootWeb = rootWebFn;
//     const using = () => {};

//     return { web: webFn, site: siteFn, using } as any;
//   };

//   const spfi = (base?: unknown) =>
//     createSP(typeof base === "string" ? base : "https://example.com");
//   const SPBrowser = () => ({
//     /* noop */
//   });
//   const SPFx = (_ctx?: unknown) => ({
//     /* noop */
//   });
//   class SPFI {}
//   return { spfi, SPBrowser, SPFx, SPFI };
// });

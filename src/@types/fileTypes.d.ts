declare module "*.txt" {
    const content: string;
    export default content;
}

declare module "__spfxCore.js" {
    const content: string;
    export default content;
}

declare const BUILD_DATE: string;

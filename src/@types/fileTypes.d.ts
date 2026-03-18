declare module "*.txt" {
  const content: string;
  export default content;
}

declare interface File {
  path: string;
  relativePath: string;
}

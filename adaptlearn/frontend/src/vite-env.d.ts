/// <reference types="vite/client" />

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.svg" {
  const content: string;
  export default content;
}

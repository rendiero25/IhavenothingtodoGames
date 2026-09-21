/// <reference types="vite/client" />

declare module '*.mjs' {
  const module: (...args: any[]) => any;
  export default module;
}

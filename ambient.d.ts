declare module "electron-next" {
  const value: (
    directories: string | { development: string; production: string },
    port?: number
  ) => void;
  export default value;
}

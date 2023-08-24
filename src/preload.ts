/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IpcRenderer } from "electron";

declare global {
  namespace NodeJS {
    interface Global {
      ipcRenderer: IpcRenderer;
    }
  }
}

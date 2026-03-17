import type { LoadedFileInfo, ShareMessage } from './types'

export class ShareBridge {
  private port: MessagePort | null = null
  private pendingRequests = new Map<string, (response: unknown) => void>()
  private connectionPromise: Promise<void>
  private resolveConnection!: () => void

  constructor() {
    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve
    })
    window.addEventListener('message', this.onInit.bind(this))
  }

  waitForConnection(timeoutMs = 2000): Promise<boolean> {
    return Promise.race([
      this.connectionPromise.then(() => true),
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), timeoutMs),
      ),
    ])
  }

  get isConnected(): boolean {
    return this.port !== null
  }

  async getLoadedFile(): Promise<LoadedFileInfo | null> {
    if (!this.port) return null
    return this.request('getLoadedFile') as Promise<LoadedFileInfo | null>
  }

  async getFileData(): Promise<ArrayBuffer | null> {
    if (!this.port) return null
    const result = await this.request('getFileData')
    return (result as ArrayBuffer) ?? null
  }

  async getSelectedElements(): Promise<number[]> {
    if (!this.port) return []
    const result = await this.request('getSelectedElements')
    return (result as number[]) ?? []
  }

  private request(action: string): Promise<unknown> {
    return new Promise((resolve) => {
      this.pendingRequests.set(action, resolve)
      this.port!.postMessage(action)
    })
  }

  private onInit(event: MessageEvent): void {
    if (event.data === 'init') {
      this.port = event.ports[0]
      this.port.onmessage = this.onMessage.bind(this)
      this.resolveConnection()
    }
  }

  private onMessage(event: MessageEvent): void {
    const msg = event.data as ShareMessage
    if (msg?.action && this.pendingRequests.has(msg.action)) {
      const resolve = this.pendingRequests.get(msg.action)!
      this.pendingRequests.delete(msg.action)
      resolve(msg.response)
    }
  }
}

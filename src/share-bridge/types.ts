export interface LoadedFileInfo {
  source: 'local' | 'github' | 'share'
  info: {
    url?: string
    [0]?: File
  }
}

export interface ShareMessage {
  action: string
  response: unknown
}

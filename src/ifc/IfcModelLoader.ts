import IfcStepParser from '@bldrs-ai/conway/src/ifc/ifc_step_parser'
import ParsingBuffer from '@bldrs-ai/conway/src/parsing/parsing_buffer'
import { ParseResult } from '@bldrs-ai/conway'
import type IfcStepModel from '@bldrs-ai/conway/src/ifc/ifc_step_model'
import type { LoadedFileInfo } from '../share-bridge/types'

export interface LoadResult {
  model: IfcStepModel
  parseTimeMs: number
  fileSizeBytes: number
}

export class IfcModelLoader {
  async load(fileInfo: LoadedFileInfo): Promise<LoadResult> {
    let buffer: ArrayBuffer

    if (fileInfo.source === 'local') {
      const file = fileInfo.info[0]
      if (!file) throw new Error('No local file provided')
      buffer = await this.readLocalFile(file)
    } else {
      const url = fileInfo.info.url
      if (!url) throw new Error('No URL provided')
      buffer = await this.fetchFile(url)
    }

    return this.parse(new Uint8Array(buffer))
  }

  async loadFromFile(file: File): Promise<LoadResult> {
    const buffer = await this.readLocalFile(file)
    return this.parse(new Uint8Array(buffer))
  }

  async loadFromUrl(url: string): Promise<LoadResult> {
    const buffer = await this.fetchFile(url)
    return this.parse(new Uint8Array(buffer))
  }

  parse(buffer: Uint8Array): LoadResult {
    const start = performance.now()
    const parser = IfcStepParser.Instance
    const parsingBuffer = new ParsingBuffer(buffer)
    const [, headerParseResult] = parser.parseHeader(parsingBuffer)

    if (headerParseResult !== ParseResult.COMPLETE) {
      throw new Error(`IFC header parse failed: ${ParseResult[headerParseResult]}`)
    }

    const [parseResult, model] = parser.parseDataToModel(parsingBuffer)

    if (!model) {
      throw new Error(`IFC parse returned no model: ${ParseResult[parseResult]}`)
    }

    if (parseResult === ParseResult.SYNTAX_ERROR) {
      throw new Error('IFC file has syntax errors')
    }

    return {
      model,
      parseTimeMs: performance.now() - start,
      fileSizeBytes: buffer.byteLength,
    }
  }

  private async fetchFile(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch IFC file: ${response.status} ${response.statusText}`)
    }
    return response.arrayBuffer()
  }

  private readLocalFile(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer()
  }
}

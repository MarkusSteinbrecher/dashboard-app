export function formatNumber(n: number, decimals = 1): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + 'K'
  return n.toFixed(decimals)
}

export function formatArea(m2: number): string {
  return formatNumber(m2) + ' m\u00B2'
}

export function formatVolume(m3: number): string {
  return formatNumber(m3) + ' m\u00B3'
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return Math.round(ms) + 'ms'
  return (ms / 1000).toFixed(1) + 's'
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB'
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' KB'
  return bytes + ' B'
}

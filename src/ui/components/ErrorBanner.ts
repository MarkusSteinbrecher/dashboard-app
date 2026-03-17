export function createErrorBanner(
  message: string,
  onRetry?: () => void,
): HTMLElement {
  const container = document.createElement('div')
  container.className = 'state-container'
  container.innerHTML = `
    <h2 style="color: var(--error)">Error</h2>
    <p>${escapeHtml(message)}</p>
  `
  if (onRetry) {
    const btn = document.createElement('button')
    btn.textContent = 'Retry'
    btn.style.cssText = `
      margin-top: 16px; padding: 8px 24px; border: none;
      background: var(--accent); color: #000; border-radius: var(--radius);
      cursor: pointer; font-weight: 500; font-size: 14px;
    `
    btn.onclick = onRetry
    container.appendChild(btn)
  }
  return container
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

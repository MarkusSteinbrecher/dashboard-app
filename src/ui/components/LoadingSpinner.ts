export function createLoadingSpinner(message: string): HTMLElement {
  const container = document.createElement('div')
  container.className = 'state-container'
  container.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40" style="animation: spin 1s linear infinite">
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" stroke-width="3"/>
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" stroke-width="3"
              stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"/>
    </svg>
    <style>@keyframes spin { to { transform: rotate(360deg) } }</style>
    <h2 style="margin-top: 16px">${message}</h2>
  `
  return container
}

export function updateLoadingMessage(container: HTMLElement, message: string): void {
  const h2 = container.querySelector('h2')
  if (h2) h2.textContent = message
}

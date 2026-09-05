export function parseApiDocHtml(html) {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const rawStyles = Array.from(parsed.head.querySelectorAll('style'))
    .map((node) => node.textContent ?? '')
    .join('\n')

  const scopedStyles = rawStyles
    .replace(/:root\s*\{/g, '.api-doc-html {')
    .replace(/(^|})\s*body\s*\{/g, '$1 .api-doc-html {')

  return {
    styles: scopedStyles,
    bodyHtml: parsed.body.innerHTML,
  }
}

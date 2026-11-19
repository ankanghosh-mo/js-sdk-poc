// S31: <customer-badge pan="..."> with an open shadow root (a plain custom element, not React).

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STYLE =
  ':host{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #c7d2fe;' +
  'border-radius:999px;background:#eef2ff;font:14px system-ui,sans-serif;color:#1e1b4b}' +
  '.label{font-weight:600;color:#4338ca}.pan{font-family:ui-monospace,Consolas,monospace}';

class CustomerBadge extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    const pan = escapeHtml(this.getAttribute('pan') || '');
    root.innerHTML = `<style>${STYLE}</style><span class="label">PAN</span> <span class="pan">${pan}</span>`;
  }
}

if (!customElements.get('customer-badge')) {
  customElements.define('customer-badge', CustomerBadge);
}

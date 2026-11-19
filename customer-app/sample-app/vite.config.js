import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SDK_TAG = '<script src="/ddm/ddm-sdk.js"></script>';

// The dev server prepends its own module scripts (/@vite/client, the React refresh preamble) to <head>.
// Those are deferred, so the SDK would still run first, but this keeps the served page in the documented
// order: <meta charset> then the SDK script as the first elements of <head>. The production build already
// keeps index.html's order, so this runs in dev only.
function ddmSdkFirst() {
  return {
    name: 'ddm-sdk-first',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const charset = html.match(/<meta charset="[^"]*"\s*\/?>/i);
        if (!charset || !html.includes(SDK_TAG)) return html;
        const rest = html.replace(charset[0], '').replace(SDK_TAG, '');
        return rest.replace(/<head>/i, `<head>\n    ${charset[0]}\n    ${SDK_TAG}`);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), ddmSdkFirst()],
  server: {
    port: 5182,
    strictPort: true,
  },
  preview: {
    port: 5182,
    strictPort: true,
  },
});

// Loads the SDK team's kit (src/vendor/ddm-sdk, copied unchanged). The kit files are plain scripts that define
// functions; they are read as text and evaluated the same way the kit's own ddm-compile.mjs does it.
import coreJs from '../vendor/ddm-sdk/ddm-compiler-core.js?raw';
import checkJs from '../vendor/ddm-sdk/ddm-check.js?raw';
import engineJs from '../vendor/ddm-sdk/ddm-engine.js?raw';

export const ddmCompile = new Function(coreJs + '\nreturn ddmCompile;')();
export const { ddmCheckV12, ddmCanonicalJson } = new Function(checkJs + '\nreturn { ddmCheckV12, ddmCanonicalJson };')();
export { engineJs };

export const ENGINE_VERSION = (engineJs.match(/masking engine v([0-9.]+)/) || [])[1] || '?';

// Entry. The scene (and its 6.6 MB of textures) loads only when a WebGL2 context exists; otherwise #gl-fail shows.
import './tokens.css';
import './styles/base.css';
import './styles/top.css';
import './styles/stage.css';
import './styles/hud.css';
import './styles/sysinfo.css';
import './styles/beyond.css';
import './styles/panel.css';
import './styles/grid.css';
import './styles/intro.css';
import './styles/title.css';
import './styles/responsive.css';
import './brand/brand';
import { markReady } from './motion';
import { initRenderer, loadManifest } from './scene/renderer';

// No WebGL, a start that fails (texture manifest, shader compile) or a lost context: the plain fallback page instead of a
// black stage.
async function fallback(msg?: string, lost = false) {
  document.getElementById('poster')?.remove();
  await (await import('./ui/fallback')).showFallback(msg, lost);
  await document.fonts.ready; await markReady();
}
if (!initRenderer()) await fallback();
else try {
  // A GPU reset or crash takes the scene with it, for good (no restore is waited on): the page, whose links reload. A
  // campaign plan being filled survives the reload (data/booking.ts keeps it for the tab's session): said so there.
  document.getElementById('gl')!.addEventListener('webglcontextlost', () => fallback(`The 3D view stopped: the browser lost its graphics context. ${/\/book\/(plan|review)\b/.test(location.hash)
    ? 'Your campaign plan is kept: reload the page to go back to it.' : 'Reload the page, or open a site below, to start it again.'}`, true), { once: true });
  await loadManifest(); await (await import('./app')).start();
}
catch (e) { console.error(e); await fallback('Eidolon could not start. Reload the page to try again.'); }

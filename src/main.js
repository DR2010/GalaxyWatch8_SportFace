// Galaxy Watch 8 Watch Face Studio - Main Application Bootstrapper

import { state } from './watchface/state.js';
import { WatchFaceRenderer } from './watchface/renderer.js';
import { setupStudioControls } from './components/studioControls.js';
import { setupCodeModal } from './components/codeModal.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('watchface-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // 1. Initialize High-Performance 60FPS Watch Face Renderer
  const renderer = new WatchFaceRenderer(canvas);

  // 2. Initialize Studio Controls & Biometrics Sliders
  setupStudioControls();

  // 3. Initialize Code & Android Studio Project Exporter Modal
  setupCodeModal();

  // 4. Listen for OPR (On-Pixel Ratio) updates from the renderer
  window.addEventListener('opr-updated', (e) => {
    const oprBadge = document.getElementById('opr-metric-badge');
    if (oprBadge) {
      const opr = parseFloat(e.detail.opr);
      oprBadge.textContent = `AOD OPR: ${opr.toFixed(1)}% (${opr <= 15 ? 'Wear OS Compliant ✓' : 'Exceeds 15% limit ⚠'})`;
      oprBadge.style.display = state.isAOD ? 'inline-flex' : 'none';
      if (opr <= 15) {
        oprBadge.style.color = '#38BDF8';
        oprBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      } else {
        oprBadge.style.color = '#EF4444';
        oprBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      }
    }
  });

  // 5. Hardware Tactile Button Handlers on the Galaxy Watch 8 Case
  const homeBtn = document.querySelector('.btn-home');
  const backBtn = document.querySelector('.btn-back');

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      // Home button toggles AOD mode or returns to center
      const newAOD = !state.isAOD;
      state.update({ isAOD: newAOD });
      const aodBtn = document.getElementById('aod-toggle-btn');
      if (aodBtn) {
        aodBtn.classList.toggle('active', newAOD);
        aodBtn.innerHTML = newAOD 
          ? `<span class="icon">🌙</span> AOD Active (OLED Stealth)`
          : `<span class="icon">☀️</span> Normal Active Mode`;
      }
      const badge = document.getElementById('aod-status-badge');
      if (badge) {
        badge.textContent = newAOD ? 'AOD (ALWAYS-ON)' : 'ACTIVE AMOLED';
        badge.className = `status-pill ${newAOD ? 'pill-aod' : 'pill-active'}`;
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Back button cycles through themes
      const themes = ['volt', 'solar', 'cyan', 'violet', 'stealth', 'gold'];
      const currentIndex = themes.indexOf(state.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      state.update({ theme: nextTheme });
      document.querySelectorAll('.theme-card').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === nextTheme);
      });
    });
  }

  console.log('Galaxy Watch 8 Watch Face Studio successfully initialized.');
});

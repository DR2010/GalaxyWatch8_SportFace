// Code Modal & Exporter Component for Watch Face Format (WFF)

import { state } from '../watchface/state.js';
import { generateWFFXml } from '../watchface/wffGenerator.js';
import { createAndroidProjectZip } from '../watchface/projectBundler.js';

export function setupCodeModal() {
  const openBtn = document.getElementById('open-export-modal-btn');
  const modal = document.getElementById('export-modal');
  const closeBtn = document.getElementById('close-export-modal-btn');
  const copyBtn = document.getElementById('copy-xml-btn');
  const downloadXmlBtn = document.getElementById('download-xml-btn');
  const downloadZipBtn = document.getElementById('download-zip-btn');
  const xmlPre = document.getElementById('wff-xml-content');

  const updateXmlPreview = () => {
    if (!xmlPre) return;
    const xml = generateWFFXml(state);
    xmlPre.textContent = xml;
  };

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      updateXmlPreview();
      modal.classList.add('visible');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('visible');
    });
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('visible');
      }
    });
  }

  // Copy XML to clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const xml = generateWFFXml(state);
      try {
        await navigator.clipboard.writeText(xml);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `✓ Copied to Clipboard!`;
        copyBtn.classList.add('success');
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('success');
        }, 2200);
      } catch (err) {
        alert('Failed to copy to clipboard.');
      }
    });
  }

  // Download watchface.xml file
  if (downloadXmlBtn) {
    downloadXmlBtn.addEventListener('click', () => {
      const xml = generateWFFXml(state);
      const blob = new Blob([xml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'watchface.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Download complete Android Studio project ZIP
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener('click', async () => {
      const originalText = downloadZipBtn.innerHTML;
      downloadZipBtn.innerHTML = `⏳ Building Android Project ZIP...`;
      downloadZipBtn.disabled = true;

      try {
        const zipBlob = await createAndroidProjectZip(state);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GalaxyWatch8_SportFace_Project.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        downloadZipBtn.innerHTML = `✓ Downloaded ZIP!`;
        setTimeout(() => {
          downloadZipBtn.innerHTML = originalText;
          downloadZipBtn.disabled = false;
        }, 2500);
      } catch (err) {
        console.error(err);
        alert('Error generating project ZIP');
        downloadZipBtn.innerHTML = originalText;
        downloadZipBtn.disabled = false;
      }
    });
  }

  // Tab switching in modal
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.target);
      if (pane) pane.classList.add('active');
    });
  });

  // Keep XML preview updated if state changes while open
  state.subscribe(() => {
    if (modal && modal.classList.contains('visible')) {
      updateXmlPreview();
    }
  });
}

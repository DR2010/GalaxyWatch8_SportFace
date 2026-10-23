// Studio Controls & Interactive Simulation Panels

import { state, THEMES, LAYOUTS } from '../watchface/state.js';

export function setupStudioControls(container) {
  renderThemePicker();
  renderLayoutPicker();
  renderSensorsControls();
  renderHardwareControls();
  setupComplicationClickHandlers();

  // Listen to state changes to sync controls
  state.subscribe((s) => {
    syncControlValues(s);
  });
}

function renderThemePicker() {
  const container = document.getElementById('theme-options');
  if (!container) return;

  container.innerHTML = Object.values(THEMES).map(t => `
    <button class="theme-card ${state.theme === t.id ? 'active' : ''}" data-theme="${t.id}" title="${t.name} (${t.category})">
      <div class="theme-swatch-group">
        <span class="swatch" style="background: ${t.primary};"></span>
        <span class="swatch" style="background: ${t.secondary};"></span>
        <span class="swatch" style="background: ${t.accent};"></span>
      </div>
      <div class="theme-info">
        <span class="theme-name">${t.name}</span>
        <span class="theme-cat">${t.category}</span>
      </div>
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-card');
    if (!btn) return;
    const themeId = btn.dataset.theme;
    state.update({ theme: themeId });
    document.querySelectorAll('.theme-card').forEach(b => b.classList.toggle('active', b.dataset.theme === themeId));
  });
}

function renderLayoutPicker() {
  const container = document.getElementById('layout-options');
  if (!container) return;

  container.innerHTML = Object.values(LAYOUTS).map(l => `
    <button class="layout-btn ${state.layout === l.id ? 'active' : ''}" data-layout="${l.id}">
      <span class="layout-title">${l.name}</span>
      <span class="layout-desc">${l.description}</span>
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.layout-btn');
    if (!btn) return;
    const layoutId = btn.dataset.layout;
    state.update({ layout: layoutId });
    document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.layout === layoutId));
  });
}

function renderSensorsControls() {
  // Heart Rate Slider & Quick Zones
  const hrSlider = document.getElementById('hr-slider');
  const hrValue = document.getElementById('hr-val');
  if (hrSlider) {
    hrSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      hrValue.textContent = `${val} BPM`;
      state.update({ heartRate: val });
    });
  }

  // Quick HR Zone Buttons
  document.querySelectorAll('[data-hr-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetHr = parseInt(btn.dataset.hrTarget, 10);
      if (hrSlider) hrSlider.value = targetHr;
      if (hrValue) hrValue.textContent = `${targetHr} BPM`;
      state.update({ heartRate: targetHr });
    });
  });

  // Steps Slider
  const stepSlider = document.getElementById('step-slider');
  const stepValue = document.getElementById('step-val');
  if (stepSlider) {
    stepSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      stepValue.textContent = `${val.toLocaleString()} steps`;
      state.update({ steps: val });
    });
  }

  // Calories Slider
  const calSlider = document.getElementById('cal-slider');
  const calValue = document.getElementById('cal-val');
  if (calSlider) {
    calSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      calValue.textContent = `${val} kcal`;
      state.update({ calories: val });
    });
  }

  // Battery Slider & Fast Charging
  const battSlider = document.getElementById('batt-slider');
  const battValue = document.getElementById('batt-val');
  if (battSlider) {
    battSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      battValue.textContent = `${val}%`;
      state.update({ battery: val });
    });
  }

  const chgToggle = document.getElementById('chg-toggle');
  if (chgToggle) {
    chgToggle.addEventListener('change', (e) => {
      state.update({ isCharging: e.target.checked });
    });
  }

  // Weather Controls
  const weatherSelect = document.getElementById('weather-cond');
  if (weatherSelect) {
    weatherSelect.addEventListener('change', (e) => {
      state.update({
        weather: { ...state.weather, condition: e.target.value }
      });
    });
  }

  const tempSlider = document.getElementById('temp-slider');
  const tempValue = document.getElementById('temp-val');
  if (tempSlider) {
    tempSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      tempValue.textContent = `${val}°C`;
      state.update({
        weather: { ...state.weather, temp: val }
      });
    });
  }

  // 12/24H Format Toggle
  const formatToggle = document.getElementById('time-format-toggle');
  if (formatToggle) {
    formatToggle.addEventListener('change', (e) => {
      state.update({ is24Hour: e.target.checked });
    });
  }

  // Sweeping Seconds Ring Toggle
  const secToggle = document.getElementById('sec-toggle');
  if (secToggle) {
    secToggle.addEventListener('change', (e) => {
      state.update({ showSecondsRing: e.target.checked });
    });
  }
}

function renderHardwareControls() {
  // AOD Mode Toggle Button
  const aodBtn = document.getElementById('aod-toggle-btn');
  if (aodBtn) {
    aodBtn.addEventListener('click', () => {
      const newAOD = !state.isAOD;
      state.update({ isAOD: newAOD });
      aodBtn.classList.toggle('active', newAOD);
      aodBtn.innerHTML = newAOD 
        ? `<span class="icon">🌙</span> AOD Active (OLED Stealth)`
        : `<span class="icon">☀️</span> Normal Active Mode`;

      const badge = document.getElementById('aod-status-badge');
      if (badge) {
        badge.textContent = newAOD ? 'AOD (ALWAYS-ON)' : 'ACTIVE AMOLED';
        badge.className = `status-pill ${newAOD ? 'pill-aod' : 'pill-active'}`;
      }
    });
  }

  // Case Finish
  document.querySelectorAll('[data-case-finish]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-case-finish]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const finish = btn.dataset.caseFinish;
      const watchChassis = document.getElementById('watch-bezel-frame');
      if (watchChassis) {
        watchChassis.setAttribute('data-finish', finish);
      }
    });
  });

  // Strap Color
  document.querySelectorAll('[data-strap-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-strap-color]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const color = btn.dataset.strapColor;
      const topStrap = document.getElementById('watch-strap-top');
      const botStrap = document.getElementById('watch-strap-bottom');
      if (topStrap) topStrap.style.background = color;
      if (botStrap) botStrap.style.background = color;
    });
  });

  // Glass reflection toggle
  const glassToggle = document.getElementById('glass-toggle');
  if (glassToggle) {
    glassToggle.addEventListener('change', (e) => {
      const glass = document.getElementById('watch-glass-reflection');
      if (glass) glass.style.opacity = e.target.checked ? '1' : '0';
    });
  }
}

function setupComplicationClickHandlers() {
  const canvas = document.getElementById('watchface-canvas');
  if (!canvas) return;

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 450;
    const y = ((e.clientY - rect.top) / rect.height) * 450;

    // Detect click zones
    // Top Left: Weather
    if (x >= 60 && x <= 160 && y >= 20 && y <= 80) {
      showHealthModal('weather');
    }
    // Top Right: Battery
    else if (x >= 280 && x <= 390 && y >= 20 && y <= 80) {
      showHealthModal('battery');
    }
    // Center Activity Rings
    else if (x >= 140 && x <= 310 && y >= 190 && y <= 330) {
      showHealthModal('activity');
    }
    // Lower Left: Heart Rate
    else if (x >= 50 && x <= 180 && y >= 330 && y <= 430) {
      showHealthModal('heartrate');
    }
    // Lower Right: Steps
    else if (x >= 270 && x <= 400 && y >= 330 && y <= 430) {
      showHealthModal('steps');
    }
  });
}

export function showHealthModal(type) {
  const modal = document.getElementById('health-modal');
  const body = document.getElementById('health-modal-body');
  const title = document.getElementById('health-modal-title');
  if (!modal || !body) return;

  const s = state;
  const theme = s.getTheme();

  if (type === 'heartrate') {
    title.textContent = 'Samsung Health - Heart Rate Monitor';
    const zone = s.getHeartRateZone();
    body.innerHTML = `
      <div class="health-app-content">
        <div class="health-stat-hero" style="color: ${zone.color};">
          <span class="hero-val">${s.heartRate}</span>
          <span class="hero-unit">BPM</span>
        </div>
        <div class="health-zone-pill" style="background: ${zone.color}22; border: 1px solid ${zone.color}; color: ${zone.color};">
          ${zone.name.toUpperCase()} ZONE (${zone.range})
        </div>
        <div class="health-chart-mock">
          <div class="chart-label">Real-time ECG Sensor telemetry active</div>
          <div class="chart-bars">
            <span style="height: 45%;"></span>
            <span style="height: 60%;"></span>
            <span style="height: 75%;"></span>
            <span style="height: 90%; background: ${zone.color};"></span>
            <span style="height: 70%;"></span>
            <span style="height: 55%;"></span>
          </div>
        </div>
        <div class="health-detail-rows">
          <div class="detail-row"><span>Resting Heart Rate</span><b>62 BPM</b></div>
          <div class="detail-row"><span>Max Recorded Today</span><b>178 BPM</b></div>
          <div class="detail-row"><span>Sensor Source</span><b>BioActive Sensor 2.0</b></div>
        </div>
      </div>
    `;
  } else if (type === 'steps') {
    title.textContent = 'Samsung Health - Step Tracker';
    body.innerHTML = `
      <div class="health-app-content">
        <div class="health-stat-hero" style="color: ${theme.stepColor};">
          <span class="hero-val">${s.steps.toLocaleString()}</span>
          <span class="hero-unit">STEPS</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${Math.min(100, (s.steps / s.stepGoal) * 100)}%; background: ${theme.stepColor};"></div>
        </div>
        <div class="health-detail-rows">
          <div class="detail-row"><span>Target Goal</span><b>${s.stepGoal.toLocaleString()} steps</b></div>
          <div class="detail-row"><span>Estimated Distance</span><b>${s.getDistanceKm()} km</b></div>
          <div class="detail-row"><span>Floors Climbed</span><b>14 floors</b></div>
        </div>
      </div>
    `;
  } else if (type === 'activity') {
    title.textContent = 'Samsung Health - Daily Activity Rings';
    body.innerHTML = `
      <div class="health-app-content">
        <div class="rings-summary-grid">
          <div class="ring-stat-card" style="border-top: 3px solid ${theme.calorieColor};">
            <span class="lbl">Calories</span>
            <b>${s.calories} / ${s.calorieGoal}</b>
            <span class="unit">kcal</span>
          </div>
          <div class="ring-stat-card" style="border-top: 3px solid ${theme.activeColor};">
            <span class="lbl">Active Time</span>
            <b>${s.activeMinutes} / ${s.activeGoal}</b>
            <span class="unit">min</span>
          </div>
          <div class="ring-stat-card" style="border-top: 3px solid ${theme.stepColor};">
            <span class="lbl">Steps</span>
            <b>${s.steps} / ${s.stepGoal}</b>
            <span class="unit">steps</span>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'battery') {
    title.textContent = 'Device Care - Galaxy Watch 8 Battery';
    body.innerHTML = `
      <div class="health-app-content">
        <div class="health-stat-hero" style="color: ${theme.primary};">
          <span class="hero-val">${s.battery}%</span>
          <span class="hero-unit">${s.isCharging ? 'CHARGING' : 'REMAINING'}</span>
        </div>
        <div class="health-detail-rows">
          <div class="detail-row"><span>Estimated Run Time</span><b>34 hours 15 mins</b></div>
          <div class="detail-row"><span>Power Saving Mode</span><b>Available</b></div>
          <div class="detail-row"><span>Always-On Display (AOD)</span><b>${s.isAOD ? 'Active' : 'Off'}</b></div>
        </div>
      </div>
    `;
  } else {
    title.textContent = 'Weather - Galaxy Forecast';
    body.innerHTML = `
      <div class="health-app-content">
        <div class="health-stat-hero" style="color: ${theme.secondary};">
          <span class="hero-val">${s.weather.temp}°C</span>
          <span class="hero-unit">${s.weather.condition.toUpperCase()}</span>
        </div>
        <div class="health-detail-rows">
          <div class="detail-row"><span>UV Index</span><b>${s.weather.uvIndex} (Moderate)</b></div>
          <div class="detail-row"><span>Humidity</span><b>58%</b></div>
          <div class="detail-row"><span>Wind</span><b>14 km/h SW</b></div>
        </div>
      </div>
    `;
  }

  modal.classList.add('visible');
}

function syncControlValues(s) {
  // Sync live OPR metric if in AOD
  const oprBadge = document.getElementById('opr-metric-badge');
  if (oprBadge) {
    if (s.isAOD) {
      oprBadge.style.display = 'inline-flex';
    } else {
      oprBadge.style.display = 'none';
    }
  }
}

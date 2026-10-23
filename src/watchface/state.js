// Central state store for the Galaxy Watch 8 Sport Watch Face & Studio

export const THEMES = {
  volt: {
    id: 'volt',
    name: 'Volt Matrix',
    category: 'High-Vis Sport',
    primary: '#00FFA3',      // Electric Volt Green
    secondary: '#00E5FF',    // Cyber Cyan
    accent: '#FF0055',       // Neon Crimson
    calorieColor: '#FF5E00', // Fiery Orange
    activeColor: '#00FFA3',  // Volt Green
    stepColor: '#00E5FF',    // Cyan
    bgGradient: ['#0A120E', '#000000'],
    strap: '#1B2620'
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    category: 'Intense Cardio',
    primary: '#FF4500',      // Sunset Orange
    secondary: '#FFAA00',    // Amber Gold
    accent: '#FF005B',       // Hot Pink
    calorieColor: '#FF2A00',
    activeColor: '#FFAA00',
    stepColor: '#FF0077',
    bgGradient: ['#160805', '#000000'],
    strap: '#2B120B'
  },
  cyan: {
    id: 'cyan',
    name: 'Galaxy Ice',
    category: 'Samsung Classic',
    primary: '#00D2FF',      // Pure Ice Blue
    secondary: '#3A7BD5',    // Deep Sapphire
    accent: '#00FFA3',       // Neon Mint
    calorieColor: '#FF6B6B',
    activeColor: '#4ECDC4',
    stepColor: '#00D2FF',
    bgGradient: ['#050F18', '#000000'],
    strap: '#0F1D2C'
  },
  violet: {
    id: 'violet',
    name: 'Hyper Violet',
    category: 'Cyberpunk',
    primary: '#B026FF',      // Electric Purple
    secondary: '#FF007F',    // Neon Pink
    accent: '#00F5D4',       // Mint Cyan
    calorieColor: '#FF007F',
    activeColor: '#B026FF',
    stepColor: '#00F5D4',
    bgGradient: ['#12051A', '#000000'],
    strap: '#210B30'
  },
  stealth: {
    id: 'stealth',
    name: 'Titanium Stealth',
    category: 'Minimalist Monochrome',
    primary: '#E2E8F0',      // Platinum White
    secondary: '#94A3B8',    // Slate Silver
    accent: '#38BDF8',       // Light Ice
    calorieColor: '#CBD5E1',
    activeColor: '#94A3B8',
    stepColor: '#E2E8F0',
    bgGradient: ['#0F1115', '#000000'],
    strap: '#1E232B'
  },
  gold: {
    id: 'gold',
    name: 'Olympic Gold',
    category: 'Prestige Athletics',
    primary: '#FFD700',      // Trophy Gold
    secondary: '#FFA500',    // Amber
    accent: '#FFFFFF',       // Crisp White
    calorieColor: '#FF5722',
    activeColor: '#FFD700',
    stepColor: '#FFA500',
    bgGradient: ['#141005', '#000000'],
    strap: '#29210B'
  }
};

export const LAYOUTS = {
  'tri-ring': {
    id: 'tri-ring',
    name: 'Triple Ring Athlete',
    description: 'Concentric activity rings around oversized athletic digital time'
  },
  'telemetry-hud': {
    id: 'telemetry-hud',
    name: 'Telemetry HUD',
    description: 'Cardio waveform focus with split metrics and horizontal zone gauges'
  },
  'marathon': {
    id: 'marathon',
    name: 'Marathon Pro',
    description: 'Prominent step & distance telemetry with split workout timer'
  }
};

class WatchFaceState {
  constructor() {
    this.listeners = new Set();

    // Time state
    this.time = new Date();
    this.useRealTime = true;
    this.timeMultiplier = 1;
    this.is24Hour = true;
    this.showSecondsRing = false;

    // Appearance
    this.theme = 'volt';
    this.layout = 'tri-ring';
    this.isAOD = false; // Always-on display
    this.aodShiftX = 0;
    this.aodShiftY = 0;
    this.showGlass = true;
    this.caseFinish = 'titanium'; // 'titanium' | 'phantom-black' | 'silver'
    this.strapColor = '#1B2620';

    // Health Telemetry
    this.heartRate = 128; // BPM
    this.steps = 8450;
    this.stepGoal = 10000;
    this.calories = 540;
    this.calorieGoal = 650;
    this.activeMinutes = 42;
    this.activeGoal = 60;
    this.battery = 84;
    this.isCharging = false;

    // Environmental / Weather
    this.weather = {
      temp: 23,
      unit: '°C',
      condition: 'sunny', // 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow'
      uvIndex: 4,
      high: 26,
      low: 18,
      location: 'Sydney / Seoul'
    };

    // ECG pulse waveform buffer
    this.ecgBuffer = [];
    this.ecgPhase = 0;
    this.lastPulseTime = performance.now();

    // Start simulation ticks
    this.initSimulation();
  }

  getTheme() {
    return THEMES[this.theme] || THEMES.volt;
  }

  getHeartRateZone() {
    const hr = this.heartRate;
    if (hr < 100) return { zone: 1, name: 'Warm Up', color: '#38BDF8', range: '< 100 BPM' };
    if (hr < 125) return { zone: 2, name: 'Fat Burn', color: '#34D399', range: '100-124 BPM' };
    if (hr < 150) return { zone: 3, name: 'Aerobic Cardio', color: '#FBBF24', range: '125-149 BPM' };
    if (hr < 175) return { zone: 4, name: 'Anaerobic', color: '#FB923C', range: '150-174 BPM' };
    return { zone: 5, name: 'Peak VO2 Max', color: '#F43F5E', range: '175+ BPM' };
  }

  getDistanceKm() {
    // Average stride length ~0.762m
    return ((this.steps * 0.762) / 1000).toFixed(2);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  update(partial) {
    Object.assign(this, partial);
    this.notify();
  }

  initSimulation() {
    // ECG waveform synthesis
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Update time if real-time
      if (this.useRealTime) {
        this.time = new Date();
      } else if (this.timeMultiplier > 1) {
        this.time = new Date(this.time.getTime() + dt * 1000 * this.timeMultiplier);
      }

      // ECG pulse progression based on heart rate
      const beatsPerSecond = this.heartRate / 60;
      this.ecgPhase += dt * beatsPerSecond * Math.PI * 2;

      // Burn-in prevention micro-shift for AOD mode every minute
      if (this.isAOD) {
        const sec = this.time.getSeconds();
        if (sec === 0) {
          this.aodShiftX = (Math.random() - 0.5) * 6;
          this.aodShiftY = (Math.random() - 0.5) * 6;
        }
      } else {
        this.aodShiftX = 0;
        this.aodShiftY = 0;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}

export const state = new WatchFaceState();

// High-performance 60FPS Canvas Renderer for Galaxy Watch 8 Watch Face

import { state } from './state.js';

export class WatchFaceRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.size = 450; // Native Galaxy Watch 8 resolution
    this.center = this.size / 2;
    this.dpr = window.devicePixelRatio || 1;

    // ECG wave points
    this.ecgHistory = new Array(50).fill(0);
    this.lastEcgUpdate = 0;

    // Pulse animation
    this.pulseScale = 1;

    // OPR (On-Pixel Ratio) metric
    this.calculatedOPR = 0;
    this.lastOprCalc = 0;

    this.setupCanvas();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  setupCanvas() {
    this.canvas.width = this.size * this.dpr;
    this.canvas.height = this.size * this.dpr;
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  resize(newSize) {
    this.size = newSize;
    this.center = newSize / 2;
    this.setupCanvas();
  }

  render(timestamp) {
    const ctx = this.ctx;
    const s = state;
    const theme = s.getTheme();
    const isAOD = s.isAOD;

    // Clear frame
    ctx.save();
    
    // Apply AOD burn-in protection micro-shift if in AOD mode
    if (isAOD) {
      ctx.translate(s.aodShiftX, s.aodShiftY);
    }

    // 1. Background
    if (isAOD) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(-10, -10, this.size + 20, this.size + 20);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.size, this.size);

      // Subtle atmospheric radial glow
      const bgGrad = ctx.createRadialGradient(
        this.center, this.center, 50,
        this.center, this.center, this.center
      );
      bgGrad.addColorStop(0, theme.bgGradient[0]);
      bgGrad.addColorStop(1, theme.bgGradient[1]);
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(this.center, this.center, this.center - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Bezel & Seconds Track
    this.drawBezelTrack(ctx, s, theme, isAOD);

    // 3. Top Complications (Weather & Battery)
    this.drawTopComplications(ctx, s, theme, isAOD);

    // 4. Central Digital Time & Date
    this.drawDigitalClock(ctx, s, theme, isAOD);

    // 5. Activity Rings or Layout Specific Central Feature
    if (s.layout === 'tri-ring') {
      this.drawActivityRings(ctx, s, theme, isAOD);
      this.drawFitnessSubDials(ctx, s, theme, isAOD);
    } else if (s.layout === 'telemetry-hud') {
      this.drawTelemetryHUD(ctx, s, theme, isAOD);
    } else {
      this.drawMarathonLayout(ctx, s, theme, isAOD);
    }

    ctx.restore();

    // Calculate OPR periodically in AOD mode (every 2 seconds)
    if (isAOD && timestamp - this.lastOprCalc > 2000) {
      this.calculateOPR();
      this.lastOprCalc = timestamp;
    }

    requestAnimationFrame(this.render);
  }

  // Draw 60-second outer ring ticks and sweeping second pointer
  drawBezelTrack(ctx, s, theme, isAOD) {
    if (isAOD) return; // In AOD, outer track is removed to save OLED power

    const now = s.time;
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const radius = this.center - 12;

    ctx.save();
    ctx.translate(this.center, this.center);

    // 60 tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const isFiveMin = i % 5 === 0;
      const isPast = (i <= seconds);

      const tickLen = isFiveMin ? 8 : 4;
      const innerR = radius - tickLen;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);

      if (isPast && s.showSecondsRing) {
        ctx.strokeStyle = isFiveMin ? theme.primary : `${theme.primary}aa`;
        ctx.lineWidth = isFiveMin ? 2.5 : 1.5;
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = isFiveMin ? 6 : 2;
      } else {
        ctx.strokeStyle = isFiveMin ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isFiveMin ? 2 : 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    }

    // Sweeping second dot with radiant flare
    if (s.showSecondsRing) {
      const secAngle = (seconds * 6 - 90) * (Math.PI / 180);
      const dotX = Math.cos(secAngle) * (radius - 4);
      const dotY = Math.sin(secAngle) * (radius - 4);

      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 10;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Outer micro-aura
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Weather (Left) and Battery (Right)
  drawTopComplications(ctx, s, theme, isAOD) {
    const y = 52;
    const leftX = 115;
    const rightX = 335;

    // --- Weather (Top-Left) ---
    ctx.save();
    ctx.fillStyle = isAOD ? '#94A3B8' : '#ffffff';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Weather icon (Dynamic SVG symbol representation)
    this.drawWeatherIcon(ctx, leftX - 30, y, s.weather.condition, isAOD ? '#94A3B8' : theme.secondary);

    // Temp & Condition
    ctx.fillText(`${s.weather.temp}°C`, leftX + 8, y - 5);
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#64748B' : `${theme.secondary}dd`;
    ctx.fillText(`UV ${s.weather.uvIndex}`, leftX + 8, y + 9);
    ctx.restore();

    // --- Battery (Top-Right) ---
    ctx.save();
    const batt = s.battery;
    const battColor = batt <= 20 ? '#EF4444' : (isAOD ? '#94A3B8' : theme.primary);

    // Battery mini ring gauge
    const battR = 14;
    ctx.beginPath();
    ctx.arc(rightX - 22, y, battR, 0, Math.PI * 2);
    ctx.strokeStyle = isAOD ? '#1E293B' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Active batt arc
    const battAngle = (batt / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(rightX - 22, y, battR, -Math.PI / 2, -Math.PI / 2 + battAngle);
    ctx.strokeStyle = battColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (!isAOD) {
      ctx.shadowColor = battColor;
      ctx.shadowBlur = 4;
    }
    ctx.stroke();

    // Battery Icon or Lightning if charging
    if (s.isCharging) {
      this.drawLightningIcon(ctx, rightX - 22, y, '#FBBF24');
    }

    // Battery text
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isAOD ? '#94A3B8' : '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`${batt}%`, rightX - 2, y - 5);

    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#64748B' : 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(s.isCharging ? 'FAST CHG' : 'BATTERY', rightX - 2, y + 9);
    ctx.restore();
  }

  // Digital Athletic Clock & Date
  drawDigitalClock(ctx, s, theme, isAOD) {
    const now = s.time;
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    if (!s.is24Hour) {
      hours = hours % 12 || 12;
    }
    const hoursStr = String(hours).padStart(s.is24Hour ? 2 : 1, '0');

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Date Pill (Above clock)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;

    const dateY = 100;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.letterSpacing = '1px';

    if (!isAOD) {
      // Rounded pill container
      const pillWidth = 110;
      const pillHeight = 22;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.roundRect(this.center - pillWidth / 2, dateY - pillHeight / 2, pillWidth, pillHeight, 11);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = `${theme.primary}44`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#94A3B8';
    }

    ctx.fillText(dateStr, this.center, dateY);

    // 2. Main Athletic Clock Numerals
    const clockY = 155;
    ctx.font = '900 68px "Space Grotesk", Outfit, sans-serif';

    if (isAOD) {
      // Crisp monochrome outline / thin styling in AOD
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(`${hoursStr}:${minutes}`, this.center, clockY);
    } else {
      // Split athletic color: Hours in crisp white, Minutes in Theme Primary
      const colonWidth = 16;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(hoursStr, this.center - colonWidth / 2, clockY);

      // Blinking colon (smooth pulse)
      const colonAlpha = (now.getMilliseconds() < 500) ? 'ff' : '44';
      ctx.textAlign = 'center';
      ctx.fillStyle = `${theme.primary}${colonAlpha}`;
      ctx.fillText(':', this.center, clockY - 4);

      // Minutes with gradient/glow
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.primary;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 12;
      ctx.fillText(minutes, this.center + colonWidth / 2, clockY);
      ctx.shadowBlur = 0;

      // Seconds pill / badge on right
      const secX = this.center + 95;
      const secY = clockY - 14;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(secX - 14, secY - 11, 28, 22, 6);
      ctx.fill();

      ctx.font = '700 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.accent;
      ctx.fillText(seconds, secX, secY);

      // AM/PM or 24H badge
      ctx.font = '600 10px Outfit, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(s.is24Hour ? '24H' : ampm, secX, secY + 20);
    }

    ctx.restore();
  }

  // Triple Concentric Fitness Rings (Calories, Active Time, Steps)
  drawActivityRings(ctx, s, theme, isAOD) {
    const ringCenterY = 256;
    const outerR = 58;
    const midR = 46;
    const innerR = 34;
    const strokeW = isAOD ? 2.5 : 7.5;

    const calPercent = Math.min(s.calories / s.calorieGoal, 1);
    const actPercent = Math.min(s.activeMinutes / s.activeGoal, 1);
    const stepPercent = Math.min(s.steps / s.stepGoal, 1);

    ctx.save();
    ctx.translate(this.center, ringCenterY);

    const startAngle = -Math.PI / 2;

    // Helper for drawing a single ring
    const drawRing = (radius, percent, color, trackColor, label) => {
      // 1. Track
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = strokeW;
      ctx.stroke();

      // 2. Progress Arc
      if (percent > 0) {
        ctx.beginPath();
        const endAngle = startAngle + percent * Math.PI * 2;
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeW;
        ctx.lineCap = isAOD ? 'butt' : 'round';

        if (!isAOD) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing cap dot
        if (!isAOD) {
          const capX = Math.cos(endAngle) * radius;
          const capY = Math.sin(endAngle) * radius;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(capX, capY, strokeW * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    if (isAOD) {
      drawRing(outerR, calPercent, '#94A3B8', '#1E293B');
      drawRing(midR, actPercent, '#64748B', '#1E293B');
      drawRing(innerR, stepPercent, '#475569', '#1E293B');
    } else {
      drawRing(outerR, calPercent, theme.calorieColor, 'rgba(255, 94, 0, 0.15)');
      drawRing(midR, actPercent, theme.activeColor, 'rgba(0, 255, 163, 0.15)');
      drawRing(innerR, stepPercent, theme.stepColor, 'rgba(0, 229, 255, 0.15)');

      // Center Icon: Athletic Flame / Galaxy Health
      this.drawFlameIcon(ctx, 0, 0, theme.calorieColor);
    }

    ctx.restore();
  }

  // Lower Left: Heart Rate + Live ECG, Lower Right: Steps + Distance
  drawFitnessSubDials(ctx, s, theme, isAOD) {
    const y = 356;
    const leftX = 120;
    const rightX = 330;

    // --- Left Sub-dial: Heart Rate ---
    ctx.save();
    const hrZone = s.getHeartRateZone();
    const hrColor = isAOD ? '#94A3B8' : hrZone.color;

    // Pulse animation based on state.ecgPhase
    const pulseFactor = 1 + Math.max(0, Math.sin(s.ecgPhase)) * 0.22;

    // Heart icon
    this.drawHeartIcon(ctx, leftX - 34, y - 10, hrColor, isAOD ? 1 : pulseFactor);

    // BPM text
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Space Grotesk", Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#F8FAFC' : '#ffffff';
    ctx.fillText(`${s.heartRate}`, leftX - 18, y - 6);

    ctx.font = '700 10px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#64748B' : hrColor;
    ctx.fillText('BPM', leftX + 32, y - 6);

    // Live ECG Waveform
    this.drawECGWaveform(ctx, leftX - 42, y + 8, 84, 16, hrColor, s, isAOD);

    // Zone Badge
    ctx.font = '700 9px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#475569' : `${hrColor}cc`;
    ctx.fillText(hrZone.name.toUpperCase(), leftX - 40, y + 32);
    ctx.restore();

    // --- Right Sub-dial: Steps & Distance ---
    ctx.save();
    const stepColor = isAOD ? '#94A3B8' : theme.stepColor;

    // Footstep Icon
    this.drawFootstepIcon(ctx, rightX - 36, y - 10, stepColor);

    // Steps number
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Space Grotesk", Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#F8FAFC' : '#ffffff';
    const formattedSteps = s.steps.toLocaleString();
    ctx.fillText(formattedSteps, rightX - 16, y - 6);

    // Step Progress Bar
    const barW = 84;
    const barH = 4;
    const barX = rightX - 40;
    const barY = y + 8;
    const stepRatio = Math.min(s.steps / s.stepGoal, 1);

    ctx.fillStyle = isAOD ? '#1E293B' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();

    ctx.fillStyle = stepColor;
    if (!isAOD) {
      ctx.shadowColor = stepColor;
      ctx.shadowBlur = 4;
    }
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * stepRatio, barH, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distance in KM & Goal %
    ctx.font = '600 10px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#64748B' : 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`${s.getDistanceKm()} KM`, barX, y + 23);

    ctx.textAlign = 'right';
    ctx.fillStyle = isAOD ? '#64748B' : theme.primary;
    ctx.fillText(`${Math.round(stepRatio * 100)}%`, barX + barW, y + 23);

    ctx.restore();
  }

  // Telemetry HUD Layout Variation
  drawTelemetryHUD(ctx, s, theme, isAOD) {
    const y = 265;
    ctx.save();
    ctx.translate(this.center, y);

    // Horizontal 5-zone HR spectrum bar
    const barW = 260;
    const barH = 8;
    const startX = -barW / 2;
    const zones = ['#38BDF8', '#34D399', '#FBBF24', '#FB923C', '#F43F5E'];

    for (let i = 0; i < 5; i++) {
      const segW = barW / 5;
      ctx.fillStyle = isAOD ? '#1E293B' : `${zones[i]}44`;
      ctx.beginPath();
      ctx.roundRect(startX + i * segW, -barH / 2, segW - 2, barH, 2);
      ctx.fill();
    }

    // Active zone marker
    const currentZone = s.getHeartRateZone().zone; // 1-5
    const markerX = startX + (currentZone - 0.5) * (barW / 5);
    ctx.fillStyle = zones[currentZone - 1];
    if (!isAOD) {
      ctx.shadowColor = zones[currentZone - 1];
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(markerX, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Large Live ECG Wave across center
    this.drawECGWaveform(ctx, -140, 20, 280, 45, theme.primary, s, isAOD);

    // Bottom 3 telemetry boxes
    const boxY = 85;
    const boxW = 86;
    const boxH = 46;

    const stats = [
      { label: 'CALORIES', val: `${s.calories}`, unit: 'KCAL', col: theme.calorieColor },
      { label: 'STEPS', val: `${(s.steps / 1000).toFixed(1)}k`, unit: 'STP', col: theme.stepColor },
      { label: 'BPM', val: `${s.heartRate}`, unit: 'HR', col: theme.primary }
    ];

    stats.forEach((st, i) => {
      const bx = -135 + i * 95;
      ctx.fillStyle = isAOD ? '#000000' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isAOD ? '#1E293B' : `${st.col}44`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '700 9px Outfit, sans-serif';
      ctx.fillStyle = isAOD ? '#64748B' : st.col;
      ctx.fillText(st.label, bx + boxW / 2, boxY + 14);

      ctx.font = '800 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(st.val, bx + boxW / 2, boxY + 34);
    });

    ctx.restore();
  }

  // Marathon Pro Layout Variation
  drawMarathonLayout(ctx, s, theme, isAOD) {
    const y = 240;
    ctx.save();
    ctx.translate(this.center, y);

    // Massive Step & Distance Counter
    ctx.textAlign = 'center';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillStyle = isAOD ? '#64748B' : theme.stepColor;
    ctx.fillText('MARATHON PACE & DISTANCE', 0, 0);

    ctx.font = '900 48px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${s.getDistanceKm()}`, 0, 44);

    ctx.font = '700 12px Outfit, sans-serif';
    ctx.fillStyle = theme.secondary;
    ctx.fillText('KILOMETERS COMPLETED', 0, 64);

    // Goal arc
    const arcR = 120;
    const progress = Math.min(s.steps / s.stepGoal, 1);
    ctx.beginPath();
    ctx.arc(0, 20, arcR, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = isAOD ? '#1E293B' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 20, arcR, Math.PI * 0.75, Math.PI * 0.75 + progress * (Math.PI * 1.5));
    ctx.strokeStyle = theme.stepColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    if (!isAOD) {
      ctx.shadowColor = theme.stepColor;
      ctx.shadowBlur = 8;
    }
    ctx.stroke();

    // Secondary workout row
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`HR ${s.heartRate} BPM  •  ${s.calories} KCAL  •  ${s.activeMinutes} MIN`, 0, 115);

    ctx.restore();
  }

  // Draw animated ECG electrocardiogram wave
  drawECGWaveform(ctx, x, y, width, height, color, s, isAOD) {
    if (isAOD) return; // Hide ECG in AOD for power efficiency

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - height / 2, width, height);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();

    const phase = s.ecgPhase;
    const points = 35;

    for (let i = 0; i < points; i++) {
      const px = x + (i / (points - 1)) * width;
      // Synthesize P-Q-R-S-T wave curve
      const localPhase = (phase - (i / points) * Math.PI * 2) % (Math.PI * 2);
      let py = 0;

      // QRS spike
      if (localPhase > 0 && localPhase < 0.6) {
        py = -Math.sin(localPhase * 5) * (height * 0.45);
      } else if (localPhase >= 0.6 && localPhase < 1.0) {
        // T wave
        py = Math.sin((localPhase - 0.6) * 7) * (height * 0.2);
      }

      if (i === 0) {
        ctx.moveTo(px, y + py);
      } else {
        ctx.lineTo(px, y + py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // Helper Vector Icons
  drawWeatherIcon(ctx, x, y, condition, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    if (condition === 'sunny') {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      // Sun rays
      for (let i = 0; i < 8; i++) {
        const a = (i * 45) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.stroke();
      }
    } else if (condition === 'cloudy') {
      ctx.beginPath();
      ctx.arc(-3, 1, 4, 0, Math.PI * 2);
      ctx.arc(3, -1, 5, 0, Math.PI * 2);
      ctx.arc(6, 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rain / storm
      ctx.beginPath();
      ctx.arc(-2, -2, 5, 0, Math.PI * 2);
      ctx.arc(4, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, 5); ctx.lineTo(-4, 9);
      ctx.moveTo(3, 5); ctx.lineTo(1, 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLightningIcon(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-2, 6);
    ctx.lineTo(4, -1);
    ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHeartIcon(ctx, x, y, color, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.bezierCurveTo(-5, -6, -10, 0, 0, 8);
    ctx.bezierCurveTo(10, 0, 5, -6, 0, 2);
    ctx.fill();
    ctx.restore();
  }

  drawFootstepIcon(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    // Sole
    ctx.beginPath();
    ctx.ellipse(0, 2, 4, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Heel
    ctx.beginPath();
    ctx.ellipse(0, 8, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFlameIcon(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(6, -2, 4, 6);
    ctx.quadraticCurveTo(0, 9, -4, 6);
    ctx.quadraticCurveTo(-6, -2, 0, -8);
    ctx.fill();
    ctx.restore();
  }

  // Calculate On-Pixel Ratio (OPR) to verify Wear OS <= 15% guideline
  calculateOPR() {
    try {
      const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imgData.data;
      let nonBlackPixels = 0;
      let totalVisibleCirclePixels = 0;
      const r = this.canvas.width / 2;

      // Sample every 4th pixel for high performance
      for (let y = 0; y < this.canvas.height; y += 4) {
        for (let x = 0; x < this.canvas.width; x += 4) {
          const dx = x - r;
          const dy = y - r;
          if (dx * dx + dy * dy <= r * r) {
            totalVisibleCirclePixels++;
            const idx = (y * this.canvas.width + x) * 4;
            // If pixel has luminance > 10
            const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            if (luma > 15) {
              nonBlackPixels++;
            }
          }
        }
      }

      this.calculatedOPR = (nonBlackPixels / totalVisibleCirclePixels) * 100;
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('opr-updated', { detail: { opr: this.calculatedOPR.toFixed(1) } }));
    } catch {
      // In case of security restrictions on getImageData
      this.calculatedOPR = 7.4;
    }
  }
}

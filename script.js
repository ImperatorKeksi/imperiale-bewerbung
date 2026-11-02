/**
 * IMPERIAL APPLICATION SCRIPT - IMPERATOR SHEEV PALPATINE
 * Bewerber: Nico Kaschube (Imperator Keksi)
 * Server: Aufbau des Imperiums
 *
 * Realistische Soundkulisse mit echten Film-Zitaten, echten Machtblitzen,
 * echtem Keks-Knuspern, direktem Start-Sound und natürlicher Sprachausgabe.
 */

// ===================================================================
// 1. ECHTE SOUND-EFFEKTE & PALPATINE-AUDIO-DATEIEN
// ===================================================================
const SOUND_ASSETS = {
  good: 'audio/palpatine_good.mp3',
  unlimited: 'audio/palpatine_unlimited.mp3',
  powerFull: 'audio/palpatine_power_full.mp3',
  doit: 'audio/palpatine_doit.mp3',
  order66: 'audio/palpatine_order66.mp3',
  order66Full: 'audio/palpatine_order66_full.mp3',
  senate: 'audio/palpatine_senate.mp3',
  skills: 'audio/palpatine_skills.mp3',
  foreseen: 'audio/palpatine_foreseen.mp3',
  laugh: 'audio/palpatine_laugh.mp3',
  become: 'audio/palpatine_become.mp3',
  lightningBurst: 'audio/lightning_burst.mp3',
  lightningStorm: 'audio/lightning_storm.mp3',
  cookieCrunch: 'audio/cookie_crunch.mp3',
  imperialMarch: 'audio/imperial_march.mp3',
  fanfare: 'audio/sw_music.mp3'
};

// ===================================================================
// 2. IMPERIAL AUDIO ENGINE (Hybride Audio-Engine mit echten Samples)
// ===================================================================
class ImperialAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false; // Standardmäßig AN für direkten Sound
    this.bgMusic = null;
    this.activeClips = new Set();
    this.currentSpeechUtterance = null;
    this.bgVolumeTarget = 0.28;
    this.isDucked = false;
    this.isInitialized = false;

    this.initBgMusic();
  }

  initBgMusic() {
    try {
      this.bgMusic = new Audio(SOUND_ASSETS.imperialMarch);
      this.bgMusic.loop = true;
      this.bgMusic.volume = this.bgVolumeTarget;
      this.bgMusic.preload = 'auto';
    } catch (e) {
      console.warn('Hintergrundmusik konnte nicht initialisiert werden', e);
    }
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio Context init error', e);
    }
  }

  // Hintergrundmusik sanft absenken wenn Sprachausgabe oder Zitat läuft
  duck(enable) {
    if (!this.bgMusic) return;
    this.isDucked = enable;
    const target = enable ? 0.08 : this.bgVolumeTarget;
    const step = enable ? 0.04 : 0.02;
    const interval = setInterval(() => {
      if (!this.bgMusic) {
        clearInterval(interval);
        return;
      }
      if (Math.abs(this.bgMusic.volume - target) <= step) {
        this.bgMusic.volume = target;
        clearInterval(interval);
      } else if (this.bgMusic.volume > target) {
        this.bgMusic.volume = Math.max(0, this.bgMusic.volume - step);
      } else {
        this.bgMusic.volume = Math.min(1, this.bgMusic.volume + step);
      }
    }, 40);
  }

  // Echten Soundclip abspielen
  playClip(keyOrSrc, options = {}) {
    if (this.isMuted) return null;
    this.init();

    const src = SOUND_ASSETS[keyOrSrc] || keyOrSrc;
    if (!src) return null;

    try {
      const audio = new Audio(src);
      audio.volume = options.volume !== undefined ? options.volume : 0.9;

      if (options.duck !== false) {
        this.duck(true);
      }

      this.activeClips.add(audio);

      const cleanup = () => {
        this.activeClips.delete(audio);
        if (options.duck !== false && this.activeClips.size === 0 && !this.currentSpeechUtterance) {
          this.duck(false);
        }
      };

      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play prevented:', err);
          cleanup();
        });
      }
      return audio;
    } catch (e) {
      console.warn('Fehler beim Abspielen von Audio-Clip:', src, e);
      return null;
    }
  }

  // Echte Machtblitze abspielen (angenehme, nicht zu laute Lautstärke)
  playLightning(isStorm = false) {
    if (this.isMuted) return;
    const soundKey = isStorm ? 'lightningStorm' : 'lightningBurst';
    return this.playClip(soundKey, { volume: isStorm ? 0.6 : 0.45 });
  }

  // Rollender Donner- & Machtblitz-Einschlag
  playThunder() {
    if (this.isMuted) return;
    return this.playClip('lightningStorm', { volume: 0.55 });
  }

  // Star Wars Fanfare
  playImperialFanfare() {
    return this.playClip('fanfare', { volume: 0.9 });
  }

  // Echtes Keks-Knuspern abspielen
  playCookieCrunch() {
    if (this.isMuted) return;
    this.playClip('cookieCrunch', { volume: 0.9 });
  }

  // Futuristischer Holonet-UI Beep (per Synthesizer)
  playBeep(freq = 520, duration = 0.08) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + duration);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio beep error', e);
    }
  }

  // Sound aktivieren (Imperial March & Effekte)
  startSound() {
    this.isMuted = false;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgMusic) {
      this.bgMusic.volume = this.bgVolumeTarget;
      const p = this.bgMusic.play();
      if (p !== undefined) {
        p.catch(err => console.warn('BGM play prevented by browser policy:', err));
      }
    }
    this.updateHudUi(true);
  }

  // Sound stummschalten
  stopSound() {
    this.isMuted = true;
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
    for (const clip of this.activeClips) {
      try {
        clip.pause();
      } catch (e) {}
    }
    this.activeClips.clear();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.updateHudUi(false);
  }

  // Umschalten Sound an/aus
  toggleSound() {
    if (this.isMuted) {
      this.startSound();
      this.playBeep(600, 0.08);
      return true;
    } else {
      this.stopSound();
      return false;
    }
  }

  updateHudUi(isActive) {
    const audioBtn = document.getElementById('toggleAudioBtn');
    const audioStatusText = document.getElementById('audioStatusText');
    if (audioBtn) {
      audioBtn.innerHTML = isActive
        ? '<span class="btn-icon">🔊</span> <span class="btn-text">Sound: AN</span>'
        : '<span class="btn-icon">🔇</span> <span class="btn-text">Sound: AUS</span>';
    }
    if (audioStatusText) {
      audioStatusText.innerText = isActive
        ? 'AKTIV // IMPERIAL MARCH & SITH-EFFEKTE'
        : 'STUMMGESCHALTET';
      audioStatusText.style.color = isActive ? 'var(--imperial-red-bright)' : 'var(--text-muted)';
    }
  }

  // =================================================================
  // TEXT-BEREINIGUNG & AUSSPRACHE: KEIN BUCHSTABIEREN!
  // =================================================================
  /**
   * Wandelt Abkürzungen, Akronyme, All-Caps-Wörter, Emojis und Markdown
   * in natürliche, fließende Wörter um, damit der Browser NIE buchstabiert!
   */
  pronounceClean(rawText) {
    if (!rawText) return '';
    let text = rawText;

    // 1. HTML-Tags entfernen
    text = text.replace(/<[^>]+>/g, ' ');

    // 2. Unicode Emojis restlos entfernen
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');

    // 3. Typische Abkürzungen in vollständige deutsche Wörter übersetzen
    const replacements = [
      [/\bRP\b/g, 'Rollenspiel'],
      [/\bRP-/gi, 'Rollenspiel '],
      [/\bVSY\b/gi, 'vor der Schlacht von Yavin'],
      [/\bGSY\b/gi, 'nach der Schlacht von Yavin'],
      [/\bCOG-66\b/gi, 'Kog sechsundsechzig'],
      [/\bOrder\s*66\b/gi, 'Order sechsundsechzig'],
      [/\bTK-(\d+)\b/gi, 'T K $1'],
      [/\bSEC-(\d+)\b/gi, 'Sektor $1'],
      [/\bSEC\b/gi, 'Sektor'],
      [/\bNK\b/gi, 'Nico Kaschube'],
      [/\bbzw\.?\b/gi, 'beziehungsweise'],
      [/\bz\.?\s*B\.?\b/gi, 'zum Beispiel'],
      [/\betc\.?\b/gi, 'und so weiter'],
      [/\bca\.?\b/gi, 'circa'],
      [/\bu\.?\s*a\.?\b/gi, 'unter anderem'],
      [/\bGood,?\s*good\b/gi, 'Guhd, guhd'],
      [/\bDo it\b/gi, 'Du it'],
      [/\bUnlimited power\b/gi, 'Anlimited Pauer'],
      [/\bOuter Rim\b/gi, 'Outer Rimm'],
      [/\balias\b/gi, 'alias']
    ];

    for (const [pattern, replacement] of replacements) {
      text = text.replace(pattern, replacement);
    }

    // 4. Markdown-Formatierung & störende Satzzeichen entfernen
    text = text.replace(/[*_~#|\\/\[\]{}()<>«»„“"–—]/g, ' ');

    // 5. Mehrfache Punkte oder Bindestriche glätten
    text = text.replace(/\.{2,}/g, '.');
    text = text.replace(/-{2,}/g, ' ');

    // 6. ENTSCHEIDEND GEGEN BUCHSTABIEREN:
    // Wörter in Großbuchstaben (z. B. BEWERBUNG, IMPERATOR) werden von Windows-TTS
    // als Akronyme fehlinterpretiert und buchstabiert. Wir wandeln sie in Normalschrift um!
    text = text.replace(/\b[A-ZÄÖÜ]{2,}\b/g, m => m.charAt(0) + m.slice(1).toLowerCase());

    // 7. Whitespace säubern
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Liest deutschen Text mit einer tiefen, ehrwürdigen Sith-Stimme vor,
   * ohne Buchstaben zu buchstabieren.
   */
  speak(text, onComplete) {
    if (!('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const cleaned = this.pronounceClean(text);
      if (!cleaned) {
        if (onComplete) onComplete();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 0.88;   // Ruhiges, imperiales Tempo
      utterance.pitch = 0.82;  // Dunklere, gebieterische Tonlage
      utterance.volume = this.isMuted ? 0 : 1;
      utterance.lang = 'de-DE';

      // Beste deutsche Stimme ermitteln
      const voices = window.speechSynthesis.getVoices();
      const deVoices = voices.filter(v => v.lang.toLowerCase().startsWith('de'));
      const preferred = deVoices.find(v =>
        /(stefan|conrad|daniel|david|george|mark|male|mann|natural)/i.test(v.name)
      ) || deVoices[0] || voices[0];

      if (preferred) {
        utterance.voice = preferred;
      }

      this.duck(true);
      this.currentSpeechUtterance = utterance;

      utterance.onend = () => {
        this.currentSpeechUtterance = null;
        this.duck(false);
        if (onComplete) onComplete();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.currentSpeechUtterance = null;
        this.duck(false);
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Sprachausgabe fehlgeschlagen', e);
      this.duck(false);
      if (onComplete) onComplete();
    }
  }
}

const audio = new ImperialAudioEngine();

// ===================================================================
// 3. 3D STERNENFELD CANVAS ANIMATION
// ===================================================================
const starCanvas = document.getElementById('starfield-canvas');
const starCtx = starCanvas.getContext('2d');

let stars = [];
const STAR_COUNT = 300;
let warpSpeed = 1;
let width = (starCanvas.width = window.innerWidth);
let height = (starCanvas.height = window.innerHeight);

function initStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      size: Math.random() * 1.8 + 0.6,
      color: Math.random() > 0.85 ? '#ff4d5a' : Math.random() > 0.7 ? '#ffe894' : '#e6f0fa'
    });
  }
}

function updateAndDrawStars() {
  starCtx.fillStyle = 'rgba(6, 7, 10, 0.4)';
  starCtx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.z -= 1.2 * warpSpeed;

    if (s.z <= 0) {
      s.z = width;
      s.x = (Math.random() - 0.5) * width * 2;
      s.y = (Math.random() - 0.5) * height * 2;
    }

    const k = 220 / s.z;
    const px = s.x * k + cx;
    const py = s.y * k + cy;

    if (px >= 0 && px < width && py >= 0 && py < height) {
      const alpha = Math.min(1, (1 - s.z / width) * 1.2);
      const r = s.size * k * 0.8;
      starCtx.beginPath();
      starCtx.fillStyle = s.color;
      starCtx.globalAlpha = alpha;
      starCtx.arc(px, py, Math.max(0.6, r), 0, Math.PI * 2);
      starCtx.fill();
    }
  }

  starCtx.globalAlpha = 1;
  requestAnimationFrame(updateAndDrawStars);
}

window.addEventListener('resize', () => {
  width = starCanvas.width = window.innerWidth;
  height = starCanvas.height = window.innerHeight;
  lightningCanvas.width = window.innerWidth;
  lightningCanvas.height = window.innerHeight;
  initStars();
});

// ===================================================================
// 4. REALISTISCHE SITH-MACHTBLITZE CANVAS ENGINE
// ===================================================================
const lightningCanvas = document.getElementById('lightning-canvas');
const lCtx = lightningCanvas.getContext('2d');
lightningCanvas.width = window.innerWidth;
lightningCanvas.height = window.innerHeight;

let activeBolts = [];

function shootLightning(startX, startY, endX, endY, color = '#00f3ff', branches = 3, playAudio = true) {
  if (playAudio) {
    audio.playLightning(false);
  }
  const bolt = {
    startX,
    startY,
    endX,
    endY,
    color,
    branches,
    alpha: 1,
    segments: generateLightningSegments(startX, startY, endX, endY, branches)
  };
  activeBolts.push(bolt);
}

function generateLightningSegments(x1, y1, x2, y2, branchDepth) {
  const segments = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(dist / 20);

  let currentX = x1;
  let currentY = y1;

  for (let i = 1; i <= steps; i++) {
    const targetX = x1 + (dx / steps) * i;
    const targetY = y1 + (dy / steps) * i;
    const jitter = (Math.random() - 0.5) * 26;
    const nextX = i === steps ? x2 : targetX + jitter;
    const nextY = i === steps ? y2 : targetY + jitter;

    segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });

    if (branchDepth > 0 && Math.random() < 0.28) {
      const subLength = 40 + Math.random() * 70;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.6;
      const subEndX = nextX + Math.cos(angle) * subLength;
      const subEndY = nextY + Math.sin(angle) * subLength;
      segments.push(...generateLightningSegments(nextX, nextY, subEndX, subEndY, branchDepth - 1));
    }

    currentX = nextX;
    currentY = nextY;
  }
  return segments;
}

function updateAndDrawLightning() {
  lCtx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

  for (let i = activeBolts.length - 1; i >= 0; i--) {
    const b = activeBolts[i];
    b.alpha -= 0.08;

    if (b.alpha <= 0) {
      activeBolts.splice(i, 1);
      continue;
    }

    lCtx.save();
    lCtx.strokeStyle = b.color;
    lCtx.shadowColor = b.color;
    lCtx.shadowBlur = 18;
    lCtx.lineWidth = 2.8;
    lCtx.globalAlpha = b.alpha;

    lCtx.beginPath();
    for (const seg of b.segments) {
      lCtx.moveTo(seg.x1, seg.y1);
      lCtx.lineTo(seg.x2, seg.y2);
    }
    lCtx.stroke();

    // Heller, weißer Kernstrahl
    lCtx.strokeStyle = '#ffffff';
    lCtx.lineWidth = 1.2;
    lCtx.stroke();
    lCtx.restore();
  }

  requestAnimationFrame(updateAndDrawLightning);
}

// Bildschirm-Blitz / Schockwelle
function triggerScreenShockwave(color = 'rgba(255, 42, 59, 0.45)') {
  const flash = document.createElement('div');
  flash.id = 'fx-flash';
  flash.style.position = 'fixed';
  flash.style.inset = '0';
  flash.style.background = `radial-gradient(circle, ${color} 0%, rgba(224, 26, 34, 0.15) 70%, transparent 100%)`;
  flash.style.zIndex = '2600';
  flash.style.pointerEvents = 'none';
  flash.style.transition = 'opacity 0.6s ease';
  flash.style.opacity = '1';
  document.body.appendChild(flash);
  document.body.classList.add('fx-lit');

  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      flash.remove();
      document.body.classList.remove('fx-lit');
    }, 600);
  }, 60);
}

// Gewaltiger Sith-Machtblitz-Sturm
function triggerLightningStorm(withSound = true) {
  triggerScreenShockwave('rgba(0, 243, 255, 0.55)');
  if (withSound) {
    audio.playLightning(true);
  }

  warpSpeed = 5;
  setTimeout(() => (warpSpeed = 1), 1200);

  const colors = ['#00f3ff', '#ffffff', '#e01a22', '#ffd066'];
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const startX = Math.random() * window.innerWidth;
      const startY = 0;
      const endX = Math.random() * window.innerWidth;
      const endY = window.innerHeight * (0.35 + Math.random() * 0.55);
      const color = colors[Math.floor(Math.random() * colors.length)];
      shootLightning(startX, startY, endX, endY, color, 3, false);
    }, i * 90);
  }
}

// ===================================================================
// 5. KEKSI-MODUS & SCHWEBENDE PARTIKEL
// ===================================================================
let keksiMode = false;
let cookieInterval = null;

function toggleKeksiMode() {
  keksiMode = !keksiMode;
  document.body.classList.toggle('keksi-active', keksiMode);

  const modeBtn = document.getElementById('modeToggleBtn');
  if (keksiMode) {
    modeBtn.innerHTML = '<span class="btn-icon">🍪</span> <span class="btn-text">Keksi-Modus: AKTIV!</span>';
    audio.playCookieCrunch();
    showToast('🍪 KEKSI-PROTOKOLL 66 AKTIVIERT! Willkommen auf der süßen Seite der Macht!');
    startFloatingCookies();
  } else {
    modeBtn.innerHTML = '<span class="btn-icon">🍪</span> <span class="btn-text">Keksi-Modus: AUS</span>';
    audio.playBeep(320, 0.1);
    showToast('⚡ Zurück zur imperialen Standard-Doktrin.');
    stopFloatingCookies();
  }
}

function startFloatingCookies() {
  if (cookieInterval) clearInterval(cookieInterval);
  cookieInterval = setInterval(() => {
    if (!keksiMode) return;
    const cookie = document.createElement('div');
    cookie.innerText = Math.random() > 0.3 ? '🍪' : '⚡';
    cookie.style.position = 'fixed';
    cookie.style.bottom = '-40px';
    cookie.style.left = Math.random() * window.innerWidth + 'px';
    cookie.style.fontSize = Math.floor(Math.random() * 20 + 16) + 'px';
    cookie.style.opacity = '0.85';
    cookie.style.zIndex = '50';
    cookie.style.pointerEvents = 'none';
    cookie.style.transition = 'transform 6s linear, opacity 6s ease';
    document.body.appendChild(cookie);

    setTimeout(() => {
      cookie.style.transform = `translateY(-${window.innerHeight + 80}px) rotate(${Math.random() * 360}deg)`;
      cookie.style.opacity = '0';
    }, 20);

    setTimeout(() => cookie.remove(), 6200);
  }, 500);
}

function stopFloatingCookies() {
  if (cookieInterval) {
    clearInterval(cookieInterval);
    cookieInterval = null;
  }
}

// ===================================================================
// 7. KEKS-DISPENSER MINIGAME
// ===================================================================
let cookieCount = 0;
const ranks = [
  { min: 0, title: 'Rekrut der Bäckerei' },
  { min: 5, title: 'Sturmtruppler-Koster' },
  { min: 15, title: 'Keks-Inquisitor' },
  { min: 30, title: 'Großmoff der Süßwaren' },
  { min: 50, title: 'Galaktischer Keks-Lord' }
];

function updateCookieStats() {
  document.getElementById('cookieCounter').innerText = cookieCount;
  let currentRank = ranks[0].title;
  for (let r of ranks) {
    if (cookieCount >= r.min) currentRank = r.title;
  }
  document.getElementById('loyaltyRank').innerText = currentRank;
}

function handleGiveCookie() {
  cookieCount++;
  updateCookieStats();
  audio.playCookieCrunch();
  const logEl = document.getElementById('dispenserLog');
  const messages = [
    `[LOG]: Loyalitäts-Keks an Sektor 7 ausgegeben. Moral: +100%`,
    `[LOG]: Schoko-Cookie an Sturmtruppe TK-421 überreicht.`,
    `[LOG]: Kaiserliche Belohnung verbucht. Die Loyalität wächst!`
  ];
  logEl.innerText = messages[Math.floor(Math.random() * messages.length)];
}

function handleZapRebel() {
  audio.playClip('unlimited');
  triggerScreenShockwave('rgba(0, 243, 255, 0.55)');

  const logEl = document.getElementById('dispenserLog');
  logEl.innerText = `[ALARM]: Rebellen-Spion mit Sith-Blitzen pulverisiert! Krümel beseitigt.`;
  showToast('⚡ REBELLEN-SPION ELIMINIERT! Die Ordnung bleibt gewahrt.');

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  shootLightning(cx, cy - 200, cx + (Math.random() - 0.5) * 300, cy + 100, '#00f3ff', 4);
}

// ===================================================================
// 8. ECHTES SOUNDBOARD (12 Buttons mit Filmzitaten & Effekten)
// ===================================================================
function setupSoundboard() {
  const pads = document.querySelectorAll('.sound-pad');
  pads.forEach(pad => {
    pad.addEventListener('click', () => {
      // Soundboard-Klick aktiviert immer zuverlässig die Tonkulisse
      if (audio.isMuted) {
        audio.startSound();
      }

      const type = pad.getAttribute('data-sound');
      pad.classList.add('is-playing');

      let audioClip = null;

      switch (type) {
        case 'good':
          audioClip = audio.playClip('good');
          showToast('🎙️ Palpatine: „Good, good...“');
          break;
        case 'unlimited':
          audioClip = audio.playClip('unlimited', { volume: 1.0 });
          showToast('⚡ Palpatine: „UNLIMITED POWER!“');
          break;
        case 'doit':
          audioClip = audio.playClip('doit');
          showToast('🗡️ Palpatine: „Do it.“');
          break;
        case 'order66':
          audioClip = audio.playClip('order66', { volume: 1.0 });
          showToast('💀 Palpatine: „Execute Order 66.“');
          break;
        case 'senate':
          audioClip = audio.playClip('senate');
          showToast('🏛️ Palpatine: „I am the Senate.“');
          break;
        case 'skills':
          audioClip = audio.playClip('skills');
          showToast('🌌 Palpatine: „Your feeble skills are no match for the power of the dark side.“');
          break;
        case 'foreseen':
          audioClip = audio.playClip('foreseen');
          showToast('👁️ Palpatine: „Everything is proceeding as I have foreseen.“');
          break;
        case 'laugh':
          audioClip = audio.playClip('laugh');
          showToast('😈 *Sith-Imperator Palpatine lacht teuflisch*');
          break;
        case 'crunch':
          audioClip = audio.playClip('cookieCrunch');
          showToast('🍪 *Keks-Knuspern im Thronsaal*');
          break;
        case 'lightning':
          triggerLightningStorm(false);
          audioClip = audio.playLightning(true);
          showToast('🌩️ *Sith-Machtblitze durchzucken den Thronsaal*');
          break;
        case 'march':
          audioClip = audio.playClip('imperialMarch');
          showToast('🎺 *The Imperial March erklingt*');
          break;
        case 'fanfare':
          audioClip = audio.playClip('fanfare');
          showToast('⭐ *Star Wars Fanfare*');
          break;
      }

      if (audioClip) {
        audioClip.addEventListener('ended', () => {
          pad.classList.remove('is-playing');
        }, { once: true });
      } else {
        setTimeout(() => pad.classList.remove('is-playing'), 1500);
      }
    });
  });
}

// ===================================================================
// 9. TIMELINE NAVIGATION
// ===================================================================
function setupTimeline() {
  const nodes = document.querySelectorAll('.timeline-node');
  const yearEl = document.getElementById('timelineYear');
  const textEl = document.getElementById('timelineText');

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      audio.playBeep(520, 0.06);

      const year = node.getAttribute('data-year');
      const desc = node.getAttribute('data-desc');
      const label = node.querySelector('.t-label').innerText;

      yearEl.innerText = `${year} // ${label.toUpperCase()}`;
      textEl.innerText = desc;
    });
  });
}

// ===================================================================
// 10. MODALS (AUDIENZ-DEMO)
// ===================================================================
function setupModals() {
  const audienceModal = document.getElementById('audienceModal');

  // Open Audience Preview
  const openBtn = document.getElementById('openAudienceDemoBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      audio.playBeep(440, 0.08);
      if (audienceModal) audienceModal.classList.add('open');
    });
  }

  // Close Audience Preview
  const closeBtn1 = document.getElementById('closeModalBtn');
  if (closeBtn1) {
    closeBtn1.addEventListener('click', () => {
      if (audienceModal) audienceModal.classList.remove('open');
    });
  }

  const closeBtn2 = document.getElementById('closeModalBtn2');
  if (closeBtn2) {
    closeBtn2.addEventListener('click', () => {
      if (audienceModal) audienceModal.classList.remove('open');
    });
  }

  // Backdrop click to close
  window.addEventListener('click', (e) => {
    if (audienceModal && e.target === audienceModal) {
      audienceModal.classList.remove('open');
    }
  });
}

// ===================================================================
// 11. TOAST BENACHRICHTIGUNGEN
// ===================================================================
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toastMessage');
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ===================================================================
// 12. INITIALISIERUNG & DIREKTER START-SOUND
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Canvases initialisieren
  initStars();
  updateAndDrawStars();
  updateAndDrawLightning();

  // Timeline laden
  setupTimeline();

  // Soundboard & Modals einrichten
  setupSoundboard();
  setupModals();

  // Audio Toggle Button im HUD
  const audioBtn = document.getElementById('toggleAudioBtn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isPlaying = audio.toggleSound();
      if (isPlaying) {
        showToast('🔊 Imperialer Sound & Effekte aktiviert!');
      } else {
        showToast('🔇 Ton stummgeschaltet.');
      }
    });
  }

  // Keksi Mode Toggle
  document.getElementById('modeToggleBtn').addEventListener('click', toggleKeksiMode);

  // Quick Order 66 Button im Header
  document.getElementById('order66QuickBtn').addEventListener('click', () => {
    audio.playClip('order66', { volume: 1.0 });
    showToast('💀 Palpatine: „Execute Order 66.“');
  });

  // Hero Quote Button: Echtes "Good, good..." Zitat von Palpatine
  document.getElementById('playQuoteBtn').addEventListener('click', () => {
    audio.playClip('good');
    showToast('🎙️ Palpatine: „Good, good...“');
  });

  // Keks-Dispenser Buttons
  document.getElementById('giveCookieBtn').addEventListener('click', handleGiveCookie);
  document.getElementById('zapRebelBtn').addEventListener('click', handleZapRebel);

  // Scroll to Top
  document.getElementById('scrollToTopBtn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Trait Cards mit echten Sounds
  document.querySelectorAll('.trait-card').forEach(card => {
    card.addEventListener('click', () => {
      const s = card.getAttribute('data-sound');
      if (s === 'lightning') {
        audio.playLightning(true);
      } else if (s === 'crunch') {
        audio.playCookieCrunch();
      } else if (s === 'power') {
        audio.playClip('unlimited', { volume: 1.0 });
      } else {
        audio.playBeep(440, 0.08);
      }
    });
  });

  // =================================================================
  // INTERAKTIVER BLITZ-EFFEKT AUF DEM IMPERATOR-THRON-BILD
  // =================================================================
    // =================================================================
  // 12. BLITZLICHT- & INTRO-MODUL (ORIGINAL AUS IMPERIALE-BEWERBUNGAFSAFA)
  // =================================================================
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let quiet = false;

  // Flash Effect Overlay
    const fl = document.getElementById('fx-flash');
  function flash(o) {
    if (rm || !fl) return;
    fl.style.transition = 'none';
    fl.style.opacity = o || 0.8;
    document.body.classList.add('fx-lit');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fl.style.transition = 'opacity 0.7s ease-out';
        fl.style.opacity = 0;
        setTimeout(() => {
          document.body.classList.remove('fx-lit');
        }, 220);
      });
    });
  }

  function thunder() {
    audio.playThunder();
  }

  // Blitzeinschlag: playAudio ist standardmäßig FALSE (Ton nur bei Klick oder im Intro)
  function strike(x, big, playAudio = false) {
    if (rm) return;
    const W = window.innerWidth, H = window.innerHeight;
    const posX = x == null ? Math.random() * W : x;
    flash(big ? 0.9 : 0.6);
    shootLightning(posX, 0, posX + (Math.random() - 0.5) * 300, H * (0.35 + Math.random() * 0.4), '#ffffff', 3, playAudio);
    setTimeout(() => {
      shootLightning(posX, 0, posX + (Math.random() - 0.5) * 260, H * 0.55, '#00f3ff', 2, false);
    }, 90);
    if (big) {
      setTimeout(() => flash(0.5), 170);
    }
    if (playAudio) {
      setTimeout(thunder, 350);
    }
  }

  // Startsequenz (fx-intro)
  const it = document.getElementById('fx-intro');
  let hasEntered = false;

  function enter() {
    if (hasEntered) return;
    hasEntered = true;
    document.body.style.overflow = '';
    if (it) it.classList.add('out');

    audio.startSound();
    const b = document.getElementById('toggleAudioBtn');
    if (b && audio.isMuted) {
      audio.toggleSound();
    }
    setTimeout(() => {
      audio.playImperialFanfare();
    }, 350);

    triggerLightningStorm();
    flash(1);
    setTimeout(thunder, 300);
    setTimeout(() => {
      if (it) it.remove();
      showToast('⚡ Das Imperium ist auferstanden! Tipp: Auf den Imperator oder Hintergrund klicken zum Zappen.');
    }, 1300);
  }

  // Sofortige Audio-Aktivierung beim Laden & bei erster Bewegung
  audio.startSound();
  const unlockAudio = () => {
    audio.startSound();
    if (audio.ctx && audio.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => {});
    }
  };
  ['pointerdown', 'pointermove', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { capture: true, once: true });
  });

  if (it && !rm) {
    document.body.style.overflow = 'hidden';

    // Choreografie mit echten Star Wars Blitzen (im Intro MIT Ton)
    setTimeout(() => { strike(window.innerWidth * 0.5, 1, true); }, 500);
    setTimeout(() => {
      const f1 = document.getElementById('fx1');
      if (f1) f1.classList.add('on');
      strike(window.innerWidth * 0.3, 1, true);
    }, 1300);
    setTimeout(() => {
      const f2 = document.getElementById('fx2');
      if (f2) f2.classList.add('on');
    }, 2600);
    setTimeout(() => {
      strike(window.innerWidth * 0.7, 1, true);
      const b1 = document.getElementById('fx-go');
      const b2 = document.getElementById('fx-go2');
      if (b1) b1.classList.add('on');
      if (b2) b2.classList.add('on');
    }, 3600);

    const b1 = document.getElementById('fx-go');
    const b2 = document.getElementById('fx-go2');
    if (b1) b1.addEventListener('click', (e) => { e.stopPropagation(); enter(); });
    if (b2) b2.addEventListener('click', (e) => { e.stopPropagation(); enter(); });

    // Klick auf den Bildschirm betritt ebenfalls
    it.addEventListener('click', (e) => {
      if (e.target !== b1 && e.target !== b2) {
        enter();
      }
    });

    // Automatischer Übergang nach 25 Sekunden falls nichts angeklickt wird
    setTimeout(() => {
      if (!hasEntered) enter();
    }, 25000);
  } else if (it) {
    enter();
  }

  // Hover-Sound für interaktive Buttons
  let lastHover = null;
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('button, .btn, .trait-card, a, .sound-pad');
    if (t && t !== lastHover) {
      lastHover = t;
      audio.playBeep(700, 0.04);
    } else if (!t) {
      lastHover = null;
    }
  });

  // Interaktive Machtblitze aus den Händen des Imperators (heroImage) - MIT TON BEIM KLICKEN
  const heroImage = document.getElementById('heroImage');
  function getHands() {
    const r = heroImage.getBoundingClientRect();
    return [
      { x: r.left + r.width * 0.37, y: r.top + r.height * 0.53 },
      { x: r.left + r.width * 0.68, y: r.top + r.height * 0.54 }
    ];
  }
  function isHeroVisible() {
    const r = heroImage.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  if (heroImage && !rm) {
    // Gelegentliche kleine Funken zwischen den Händen (STUMM)
    setInterval(() => {
      if (!isHeroVisible() || document.hidden || document.getElementById('fx-intro')) return;
      const h = getHands();
      quiet = true;
      shootLightning(h[0].x, h[0].y, h[1].x, h[1].y, '#00f3ff', 1, false);
      quiet = false;
    }, 2400);

    let zapInterval = null;
    let px = 0, py = 0;

    function fireHandZaps() {
      const h = getHands();
      shootLightning(h[0].x, h[0].y, px, py, '#00f3ff', 2, true);
      shootLightning(h[1].x, h[1].y, px, py, '#ffffff', 2, false);
    }

    function stopZap() {
      if (zapInterval) {
        clearInterval(zapInterval);
        zapInterval = null;
      }
      heroImage.classList.remove('fx-zap');
    }

    heroImage.addEventListener('pointerdown', (e) => {
      px = e.clientX;
      py = e.clientY;
      heroImage.classList.add('fx-zap');
      flash(0.35);
      audio.playLightning(false);
      fireHandZaps();
      clearInterval(zapInterval);
      zapInterval = setInterval(fireHandZaps, 110);
    });

    heroImage.addEventListener('pointermove', (e) => {
      px = e.clientX;
      py = e.clientY;
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => {
      heroImage.addEventListener(t, stopZap);
    });
  }

  // Klick auf den Hintergrund: Blitz schlägt zum Klickpunkt mit Ton ein!
  // Buttons, Soundboard-Pads, Karten und Formulare lösen KEINEN Hintergrundblitz aus!
  document.addEventListener('pointerdown', (e) => {
    if (document.getElementById('fx-intro')) return;
    if (e.target.closest('button, a, input, textarea, select, .btn, .sound-pad, .card, .card-panel, .trait-card, .timeline-node, .modal-box, .modal-overlay, .navbar, .hud, #heroImage')) return;
    flash(0.28);
    shootLightning(e.clientX + (Math.random() - 0.5) * 80, 0, e.clientX, e.clientY, '#00f3ff', 2, true);
  });

  // Sektions-Scroll-Observer: Machtblitze beim Scrollen (VISUELL JA, ABER STUMM!)
  if (!rm) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const heading = entry.target.querySelector('h2, h3') || entry.target;
        const r = heading.getBoundingClientRect();
        flash(0.25);
        shootLightning(
          r.left + r.width / 2,
          0,
          r.left + r.width / 2 + (Math.random() - 0.5) * 80,
          Math.max(40, r.top),
          '#00f3ff',
          2,
          false // STUMM beim normalen Scrollen!
        );
      });
    }, { threshold: 0.35 });

    document.querySelectorAll('.section:not(.hero-section)').forEach((s) => {
      io.observe(s);
    });

    // Gelegentliche zufällige Hintergrund-Blitze (VISUELL JA, ABER STUMM!)
    (function randomLightningLoop() {
      setTimeout(() => {
        if (!document.hidden && !document.getElementById('fx-intro')) {
          strike(null, false, false); // STUMM im Hintergrund!
        }
        randomLightningLoop();
      }, 7000 + Math.random() * 9000);
    })();
  }
});

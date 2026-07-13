const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class RomanticAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.bgmBus = null;
    this.sfxBus = null;
    this.reverb = null;
    this.enabled = true;
    this.started = false;
    this.loopTimer = null;
    this.loopIndex = 0;
    this.loopBeat = 0.48;
    this.loopDuration = this.loopBeat * 16;
    this.nextLoopAt = 0;
    this.lastTickAt = 0;
    this.mediaAudio = null;
    this.mediaBgmActive = false;
    this.mediaPlaybackFailed = false;
    this.userUnlocked = false;
    this.contextStateHandler = null;
  }

  prepare() {
    this.ensureMediaAudio();
  }

  ensureMediaAudio() {
    if (this.mediaAudio || typeof document === "undefined") return this.mediaAudio;

    const audio = document.createElement("audio");
    audio.src = `${import.meta.env.BASE_URL}assets/audio/fairytale-loop.wav`;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.34;
    audio.muted = !this.enabled;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.setAttribute("aria-hidden", "true");
    audio.style.display = "none";
    audio.addEventListener("playing", () => {
      this.mediaBgmActive = true;
      this.mediaPlaybackFailed = false;
      this.stopProceduralBgm();
    });
    audio.addEventListener("error", () => {
      this.mediaBgmActive = false;
      this.mediaPlaybackFailed = true;
      this.startProceduralBgmWhenReady();
    });
    document.body.appendChild(audio);
    audio.load();
    this.mediaAudio = audio;
    return audio;
  }

  ensureContext() {
    if (this.context || typeof window === "undefined") return this.context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const bgmBus = context.createGain();
    const sfxBus = context.createGain();
    const reverb = context.createConvolver();
    const reverbGain = context.createGain();

    master.gain.value = this.enabled ? 0.82 : 0.0001;
    bgmBus.gain.value = 0.3;
    sfxBus.gain.value = 0.62;
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.25;

    const impulseLength = Math.floor(context.sampleRate * 1.9);
    const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
    for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
      const channel = impulse.getChannelData(channelIndex);
      for (let index = 0; index < impulseLength; index += 1) {
        const decay = Math.pow(1 - index / impulseLength, 2.6);
        channel[index] = (Math.random() * 2 - 1) * decay * 0.42;
      }
    }
    reverb.buffer = impulse;
    reverbGain.gain.value = 0.28;

    bgmBus.connect(compressor);
    sfxBus.connect(compressor);
    bgmBus.connect(reverb);
    sfxBus.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    this.bgmBus = bgmBus;
    this.sfxBus = sfxBus;
    this.reverb = reverb;
    this.contextStateHandler = () => {
      if (context.state === "running" && this.mediaPlaybackFailed) this.startProceduralBgm();
    };
    context.addEventListener?.("statechange", this.contextStateHandler);
    return context;
  }

  primeContext(context) {
    if (!context) return;
    try {
      const silentBuffer = context.createBuffer(1, 1, context.sampleRate);
      const silentSource = context.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(context.destination);
      silentSource.start(0);
    } catch {
      // Some older WebViews do not need (or support) the silent-buffer primer.
    }
  }

  playMediaBgm() {
    const audio = this.ensureMediaAudio();
    if (!audio || !this.enabled) return Promise.resolve(false);

    audio.muted = false;
    audio.volume = 0.34;
    try {
      const playResult = audio.play();
      if (!playResult?.then) {
        this.mediaBgmActive = !audio.paused;
        this.mediaPlaybackFailed = audio.paused;
        return Promise.resolve(this.mediaBgmActive);
      }
      return playResult
        .then(() => {
          this.mediaBgmActive = true;
          this.mediaPlaybackFailed = false;
          this.stopProceduralBgm();
          return true;
        })
        .catch(() => {
          this.mediaBgmActive = false;
          this.mediaPlaybackFailed = true;
          return false;
        });
    } catch {
      this.mediaBgmActive = false;
      this.mediaPlaybackFailed = true;
      return Promise.resolve(false);
    }
  }

  unlockFromGesture() {
    this.userUnlocked = true;
    const context = this.ensureContext();
    const mediaAttempt = this.playMediaBgm();

    // Both calls deliberately happen synchronously inside the real click handler.
    // KakaoTalk's iOS/Android WebViews can reject audio after even one awaited task.
    this.primeContext(context);
    const resumeAttempt = context?.state === "suspended"
      ? context.resume().catch(() => undefined)
      : Promise.resolve();

    Promise.all([mediaAttempt, resumeAttempt]).then(([mediaStarted]) => {
      if (!mediaStarted && this.enabled) this.startProceduralBgmWhenReady();
    });
  }

  unlock() {
    const context = this.ensureContext();
    if (this.userUnlocked && this.enabled && this.mediaAudio?.paused) {
      this.playMediaBgm().then((mediaStarted) => {
        if (!mediaStarted) this.startProceduralBgmWhenReady();
      });
    }
    if (!context) return;
    if (this.userUnlocked && context.state === "suspended") context.resume().catch(() => {});
    if (this.mediaPlaybackFailed) this.startProceduralBgmWhenReady();
  }

  startProceduralBgmWhenReady() {
    if (!this.enabled || this.mediaBgmActive || !this.context) return;
    if (this.context.state === "running") this.startProceduralBgm();
  }

  startProceduralBgm() {
    if (!this.context || this.started || !this.enabled || this.mediaBgmActive) return;
    this.started = true;
    this.nextLoopAt = this.context.currentTime + 0.1;
    this.pumpBgmScheduler();
  }

  stopProceduralBgm() {
    if (typeof window !== "undefined") window.clearTimeout(this.loopTimer);
    this.loopTimer = null;
    this.started = false;
  }

  handlePageVisible() {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    if (!this.userUnlocked || !this.enabled) return;
    this.unlock();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const audio = this.ensureMediaAudio();
    if (audio) audio.muted = !enabled;
    if (!enabled) this.stopProceduralBgm();
    if (enabled && this.userUnlocked) {
      this.playMediaBgm().then((mediaStarted) => {
        if (!mediaStarted) this.startProceduralBgmWhenReady();
      });
    }
    if (!this.context || !this.master) return;
    if (enabled && this.userUnlocked && this.context.state === "suspended") this.context.resume().catch(() => {});
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
    this.master.gain.exponentialRampToValueAtTime(enabled ? 0.82 : 0.0001, now + 0.16);
  }

  tone(frequency, start, duration, gain = 0.08, type = "sine", destination = this.sfxBus, endFrequency = null) {
    if (!this.context || !destination) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(30, frequency), start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.025, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  bell(frequency, start, gain = 0.055, duration = 0.72, destination = this.bgmBus) {
    this.tone(frequency, start, duration, gain, "sine", destination);
    this.tone(frequency * 2.01, start, duration * 0.62, gain * 0.26, "sine", destination);
    this.tone(frequency * 3.98, start, duration * 0.32, gain * 0.1, "sine", destination);
  }

  noise(start, duration, gain = 0.025, filterFrequency = 1200, filterType = "highpass") {
    if (!this.context || !this.sfxBus) return;
    const length = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.025, duration * 0.25));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.sfxBus);
    source.start(start);
  }

  pumpBgmScheduler() {
    if (!this.context || !this.started) return;
    const now = this.context.currentTime;

    // Background-tab throttling can pause the scheduler. Skip missed cycles instead
    // of trying to play several old loops at once when the page becomes active again.
    if (this.nextLoopAt < now - 0.08) this.nextLoopAt = now + 0.08;

    let scheduled = 0;
    while (this.nextLoopAt < now + 0.9 && scheduled < 2) {
      this.scheduleBgmLoop(this.nextLoopAt);
      this.nextLoopAt += this.loopDuration;
      scheduled += 1;
    }

    window.clearTimeout(this.loopTimer);
    this.loopTimer = window.setTimeout(() => this.pumpBgmScheduler(), 180);
  }

  scheduleBgmLoop(start) {
    if (!this.context || !this.started) return;
    const beat = this.loopBeat;
    const chords = [
      [NOTE.C3, NOTE.E3, NOTE.G3],
      [NOTE.A3 / 2, NOTE.C3, NOTE.E3],
      [NOTE.F3, NOTE.A3, NOTE.C4],
      [NOTE.G3, NOTE.B4 / 2, NOTE.D4],
    ];
    const arpeggios = [
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5],
      [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.C5],
      [NOTE.F4, NOTE.A4, NOTE.C5, NOTE.A4],
      [NOTE.G4, NOTE.B4, NOTE.D5, NOTE.B4],
    ];
    const melodyA = [NOTE.E5, null, NOTE.G5, NOTE.A5, NOTE.G5, null, NOTE.E5, NOTE.D5, NOTE.C5, null, NOTE.E5, NOTE.F5, NOTE.G5, NOTE.E5, NOTE.D5, null];
    const melodyB = [NOTE.G5, null, NOTE.C6, NOTE.B5, NOTE.A5, null, NOTE.G5, NOTE.E5, NOTE.F5, null, NOTE.A5, NOTE.G5, NOTE.E5, NOTE.D5, NOTE.C5, null];
    const melody = this.loopIndex % 2 === 0 ? melodyA : melodyB;

    chords.forEach((chord, chordIndex) => {
      const chordStart = start + chordIndex * beat * 4;
      chord.forEach((frequency, noteIndex) => {
        this.tone(frequency, chordStart, beat * 3.9, 0.021 - noteIndex * 0.002, "triangle", this.bgmBus);
      });
      arpeggios[chordIndex].forEach((frequency, step) => {
        this.bell(frequency, chordStart + step * beat, 0.032, beat * 0.92, this.bgmBus);
      });
    });

    melody.forEach((frequency, index) => {
      if (frequency) this.bell(frequency, start + index * beat, 0.027, beat * 1.35, this.bgmBus);
    });

    [0, 4, 8, 12].forEach((index) => {
      this.bell(NOTE.C6 * (index === 8 ? 1.122 : 1), start + index * beat + 0.04, 0.012, 1.5, this.bgmBus);
    });

    this.loopIndex += 1;
  }

  dispose() {
    this.stopProceduralBgm();
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setValueAtTime(0.0001, this.context.currentTime);
    }
    if (this.contextStateHandler) this.context?.removeEventListener?.("statechange", this.contextStateHandler);
    this.context?.close().catch(() => {});
    if (this.mediaAudio) {
      this.mediaAudio.pause();
      this.mediaAudio.removeAttribute("src");
      this.mediaAudio.load();
      this.mediaAudio.remove();
      this.mediaAudio = null;
    }
  }

  playChime(notes = [NOTE.C5, NOTE.E5, NOTE.G5]) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const now = this.context.currentTime + 0.01;
    notes.forEach((frequency, index) => this.bell(frequency, now + index * 0.085, 0.11, 0.55, this.sfxBus));
  }

  progressTick(progress = 0) {
    if (!this.enabled || typeof performance === "undefined") return;
    const nowMs = performance.now();
    if (nowMs - this.lastTickAt < 105) return;
    this.lastTickAt = nowMs;
    this.sfx("tick", { progress });
  }

  sfx(name, options = {}) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const now = this.context.currentTime + 0.005;
    const progress = clamp(options.progress ?? 0, 0, 100);

    if (name === "press") {
      this.tone(NOTE.E5, now, 0.09, 0.035, "sine");
      this.tone(NOTE.C6, now + 0.025, 0.08, 0.018, "sine");
    } else if (name === "toggleOn") {
      [NOTE.C5, NOTE.E5, NOTE.G5].forEach((frequency, index) => this.bell(frequency, now + index * 0.07, 0.075, 0.48, this.sfxBus));
    } else if (name === "back") {
      [NOTE.G5, NOTE.E5, NOTE.C5].forEach((frequency, index) => this.bell(frequency, now + index * 0.055, 0.055, 0.34, this.sfxBus));
    } else if (name === "transition") {
      this.noise(now, 0.42, 0.034, 950, "bandpass");
      this.tone(NOTE.C5, now, 0.4, 0.055, "triangle", this.sfxBus, NOTE.G5);
    } else if (name === "launch") {
      this.noise(now, 0.55, 0.055, 700, "highpass");
      this.tone(NOTE.C4, now, 0.6, 0.085, "sawtooth", this.sfxBus, NOTE.C6);
      [NOTE.E5, NOTE.G5, NOTE.C6].forEach((frequency, index) => this.bell(frequency, now + 0.2 + index * 0.08, 0.075, 0.62, this.sfxBus));
    } else if (name === "planet") {
      this.tone(NOTE.G3, now, 0.72, 0.07, "triangle", this.sfxBus, NOTE.G4);
      [NOTE.G5, NOTE.C6, NOTE.E6].forEach((frequency, index) => this.bell(frequency, now + 0.1 + index * 0.09, 0.08, 0.72, this.sfxBus));
    } else if (name === "zoomOut") {
      this.noise(now, 0.32, 0.025, 1500, "bandpass");
      this.tone(NOTE.G5, now, 0.38, 0.052, "sine", this.sfxBus, NOTE.C5);
    } else if (name === "photoNext" || name === "photoPrev") {
      this.noise(now, 0.18, 0.04, 1700, "bandpass");
      const notes = name === "photoNext" ? [NOTE.E5, NOTE.G5] : [NOTE.G5, NOTE.E5];
      notes.forEach((frequency, index) => this.bell(frequency, now + index * 0.045, 0.042, 0.28, this.sfxBus));
    } else if (name === "missionStart") {
      [NOTE.C5, NOTE.G5, NOTE.C6].forEach((frequency, index) => this.bell(frequency, now + index * 0.1, 0.085, 0.68, this.sfxBus));
    } else if (name === "heartTap") {
      this.tone(NOTE.C5 + progress * 2.1, now, 0.17, 0.065, "sine");
      this.bell(NOTE.E5 + progress * 2.4, now + 0.025, 0.055, 0.26, this.sfxBus);
    } else if (name === "holdStart") {
      this.tone(NOTE.C4, now, 0.45, 0.055, "triangle", this.sfxBus, NOTE.G4);
    } else if (name === "tick") {
      this.bell(NOTE.C5 + progress * 4.2, now, 0.032, 0.13, this.sfxBus);
    } else if (name === "dragStart") {
      this.tone(NOTE.E4, now, 0.18, 0.045, "triangle");
    } else if (name === "dragReset") {
      this.tone(NOTE.E5, now, 0.24, 0.045, "sine", this.sfxBus, NOTE.C5);
    } else if (name === "success") {
      this.noise(now, 0.48, 0.042, 1800, "highpass");
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((frequency, index) => this.bell(frequency, now + index * 0.085, 0.095, 0.9, this.sfxBus));
    } else if (name === "finaleArrival") {
      this.noise(now, 1.08, 0.075, 720, "highpass");
      this.tone(110, now, 1.15, 0.13, "sawtooth", this.sfxBus, 920);
      [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5].forEach((frequency, index) => this.bell(frequency, now + 0.62 + index * 0.14, 0.09, 1.05, this.sfxBus));
    } else if (name === "finaleOpen") {
      this.noise(now, 0.72, 0.11, 1450, "highpass");
      this.tone(NOTE.E3, now, 0.72, 0.15, "triangle", this.sfxBus, NOTE.E5);
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].forEach((frequency, index) => this.bell(frequency, now + 0.08 + index * 0.11, 0.105, 1.25, this.sfxBus));
    }
  }
}

export const romanticAudio = new RomanticAudio();

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__romanticAudio = romanticAudio;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => romanticAudio.dispose());
}

// Game cues are bundled; free writing uses only installed Spanish voices.
export class AudioPlayer extends EventTarget {
  constructor() {
    super();
    this.muted = false;
    this.current = null;
    this.clip = null;
    this.speechTimer = null;
    // Ask early: mobile browsers may populate the list asynchronously.
    globalThis.speechSynthesis?.getVoices();
    this.utterance = null;
    this.speechState = 'idle';
    this.playbackId = 0;
  }
  get speechSupported() {
    return !!globalThis.speechSynthesis && typeof globalThis.SpeechSynthesisUtterance === 'function';
  }
  spanishVoice() {
    const voices = globalThis.speechSynthesis?.getVoices().filter(voice => voice.localService && /^es(?:[-_]|$)/i.test(voice.lang)) || [];
    const score = voice => (/premium|enhanced|natural|neural|mejorada|alta calidad/i.test(voice.name || '') ? 100 : 0)
      + (/^es[-_]AR$/i.test(voice.lang) ? 30 : /^es[-_](MX|UY|CL|US)$/i.test(voice.lang) ? 20 : 0)
      + (voice.default ? 5 : 0);
    return voices.sort((a, b) => score(b) - score(a))[0];
  }
  setSpeechState(state) {
    this.speechState = state;
    this.dispatchEvent(new Event('change'));
  }
  speak(text) {
    this.stop();
    if (!text.trim() || this.muted) return;
    if (!this.speechSupported) { this.setSpeechState('unsupported'); return; }
    const voice = this.spanishVoice();
    if (!voice) { this.setSpeechState('no-voice'); return; }
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1;
    this.utterance = utterance;
    const finish = state => {
      // A late callback from a cancelled reading must not affect the next one.
      if (this.utterance !== utterance) return;
      clearTimeout(this.speechTimer);
      this.utterance = null;
      this.setSpeechState(state);
    };
    utterance.onstart = () => { if (this.utterance === utterance) clearTimeout(this.speechTimer); };
    utterance.onend = () => finish('idle');
    utterance.onerror = () => finish('error');
    this.setSpeechState('speaking');
    // Keep speak in the original tap; awaiting voices or a timer loses the
    // user gesture required by mobile Safari. cancel() does not clear pause.
    this.speechTimer = setTimeout(() => {
      if (this.utterance !== utterance) return;
      finish('error');
      globalThis.speechSynthesis?.cancel();
    }, 8000);
    this.speechTimer.unref?.();
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(utterance);
    } catch { finish('error'); }
  }
  play(name) {
    this.stop();
    if (this.muted) return;
    const names = Array.isArray(name) ? [...name] : [name];
    const playbackId = this.playbackId;
    const next = () => {
      if (this.muted || playbackId !== this.playbackId || !names.length) return;
      this.playClip(names.shift(), next);
    };
    next();
  }
  playClip(name, onended) {
    const source = name instanceof URL ? name.href : new URL(`./assets/audio/${name}.wav`, import.meta.url).href;
    // Reuse the same media element across clips so a mobile tap unlocks the
    // entire sequence, including the next flavor in an ice cream order.
    const clip = this.clip ||= new Audio();
    const playbackId = this.playbackId;
    if (clip.src !== source) clip.src = source;
    this.current = clip;
    clip.onended = onended;
    const failed = () => {
      if (this.current === clip && this.playbackId === playbackId) this.setSpeechState('audio-error');
    };
    clip.onerror = failed;
    clip.currentTime = 0;
    clip.play().catch(failed);
  }

  stop() {
    this.playbackId++;
    clearTimeout(this.speechTimer);
    if (this.current) { this.current.onended = null; this.current.onerror = null; this.current.pause(); this.current.currentTime = 0; }
    this.current = null;
    if (this.utterance) {
      this.utterance.onstart = null;
      this.utterance.onend = null;
      this.utterance.onerror = null;
      this.utterance = null;
      globalThis.speechSynthesis?.cancel();
    }
    this.setSpeechState('idle');
  }
  toggle() {
    this.muted = !this.muted;
    if (this.muted) this.stop();
    else this.dispatchEvent(new Event('change'));
    return this.muted;
  }
}

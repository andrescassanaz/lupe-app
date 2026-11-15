// Game cues are bundled; free writing uses only installed Spanish voices.
export class AudioPlayer extends EventTarget {
  constructor() {
    super();
    this.muted = false;
    this.current = null;
    this.cache = new Map();
    this.utterance = null;
    this.speechState = 'idle';
    this.playbackId = 0;
  }
  get speechSupported() {
    return !!globalThis.speechSynthesis && typeof globalThis.SpeechSynthesisUtterance === 'function';
  }
  spanishVoice() {
    const voices = globalThis.speechSynthesis?.getVoices().filter(voice => voice.localService && /^es(?:[-_]|$)/i.test(voice.lang)) || [];
    return voices.find(voice => /^es[-_]AR$/i.test(voice.lang)) || voices.find(voice => voice.default) || voices[0];
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
    utterance.rate = 0.85;
    this.utterance = utterance;
    const finish = state => {
      // A late callback from a cancelled reading must not affect the next one.
      if (this.utterance !== utterance) return;
      this.utterance = null;
      this.setSpeechState(state);
    };
    utterance.onend = () => finish('idle');
    utterance.onerror = () => finish('error');
    this.setSpeechState('speaking');
    try { speechSynthesis.speak(utterance); } catch { finish('error'); }
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
    let clip = this.cache.get(source);
    if (!clip) {
      clip = new Audio(source);
      clip.preload = 'auto';
      this.cache.set(source, clip);
    }
    this.current = clip;
    clip.onended = onended;
    clip.currentTime = 0;
    // iOS may require a fresh tap. The illustration always carries the same cue.
    clip.play().catch(() => {});
  }
  stop() {
    this.playbackId++;
    if (this.current) { this.current.onended = null; this.current.pause(); this.current.currentTime = 0; }
    this.current = null;
    if (this.utterance) {
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

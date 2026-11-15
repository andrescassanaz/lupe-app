// Each game gets the common audio controls and its own named sound files.
export function gameContext(player, game) {
  const clips = new Map(game.sounds.map(name => [name, new URL(`../games/${game.id}/assets/audio/${name}.wav`, import.meta.url)]));
  const audio = {
    play: name => player.play(Array.isArray(name) ? name.map(id => clips.get(id) || id) : clips.get(name) || name),
    stop: () => player.stop(),
    speak: text => player.speak(text),
    spanishVoice: () => player.spanishVoice(),
    get muted() { return player.muted; },
    get speechState() { return player.speechState; },
    get speechSupported() { return player.speechSupported; },
    addEventListener: (...args) => player.addEventListener(...args),
    removeEventListener: (...args) => player.removeEventListener(...args),
  };
  return Object.freeze({ audio: Object.freeze(audio) });
}

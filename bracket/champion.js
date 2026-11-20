function playVictoryMusic() {
  const audio = new AudioContext();
  const start = audio.currentTime + 0.04;
  const master = audio.createGain();
  master.gain.value = 0.2;
  master.connect(audio.destination);
  function note(midi, beat, length, volume, waveform) {
    const time = start + beat * 0.24;
    const end = time + length * 0.24;
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.type = waveform;
    tone.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    tone.connect(gain).connect(master);
    tone.start(time);
    tone.stop(end);
  }
  [67,67,67,72,76,79,76,79,81,79,77,74,76,79,84].forEach((pitch, i) =>
    note(pitch, i, i === 14 ? 5.8 : 0.98, 0.64, 'triangle'));
  [48,53,55,48,48].forEach((pitch, i) => {
    note(pitch, i * 4, 3.8, 0.68, 'sine');
    note(pitch + 7, i * 4, 3.8, 0.28, 'triangle');
  });
  audio.resume().catch(() => {});
  return audio;
}

function celebrateChampion(name, portrait) {
  const stage = document.createElement('dialog');
  stage.className = 'champion-show';
  stage.setAttribute('aria-labelledby', 'champion-title champion-name');
  stage.innerHTML = '<div class="rays"></div><div class="confetti"></div><div class="podium"><b aria-hidden="true">🏆</b><h2 id="champion-title">總冠軍</h2><div class="champion-pair"><img class="champion-portrait" alt=""><img class="cheering-sprout" src="../multiplication tug of war/assets/sprout-sun.png" alt="跳舞歡呼的皮可敏"></div><strong id="champion-name"></strong></div>';
  stage.querySelector('.champion-portrait').src = portrait;
  stage.querySelector('strong').textContent = name;
  const colors = ['#ffdc69', '#ff7089', '#56e4ff', '#b68aff', '#fff'];
  const confetti = stage.querySelector('.confetti');
  for (let i = 0; i < 96; i++) {
    const piece = document.createElement('i');
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = -Math.random() * 3 + 's';
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    confetti.append(piece);
  }
  const takeFullscreen = !document.fullscreenElement && document.fullscreenEnabled;
  // Fullscreen a regular element. Browsers exclude modal dialogs from this API.
  const root = document.documentElement;
  if (takeFullscreen) root.requestFullscreen().catch(() => {});
  document.body.append(stage);
  stage.showModal();
  let music;
  try { music = playVictoryMusic(); } catch {}
  const timer = setTimeout(() => stage.close(), 5000);
  stage.addEventListener('close', () => {
    clearTimeout(timer);
    music?.close().catch(() => {});
    if (takeFullscreen && document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
    stage.remove();
  }, {once: true});
}

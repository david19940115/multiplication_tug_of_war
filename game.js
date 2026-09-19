(() => {
  'use strict';

  const DEFAULT_MINUTES = 1;
  const LEAD_TO_WIN = 15;
  const MAX_INPUT = 7;
  const assets = [
    'assets/sprout-aqua.png',
    'assets/sprout-sun.png',
    'assets/sprout-violet.png'
  ];
  const riderAsset = 'assets/pikmin-oatchi-puller.png';
  const handRatios = {
    'assets/sprout-aqua.png': .70,
    'assets/sprout-sun.png': .67,
    'assets/sprout-violet.png': .65,
    'assets/pikmin-oatchi-puller.png': .67
  };
  const questionTypes = [
    { label: '2 位數 × 1 位數', a: [10, 99], b: [1, 9] },
    { label: '2 位數 × 2 位數', a: [10, 99], b: [10, 99] },
    { label: '3 位數 × 1 位數', a: [100, 999], b: [1, 9] },
    { label: '3 位數 × 2 位數', a: [100, 999], b: [10, 99] },
    { label: '4 位數 × 1 位數', a: [1000, 9999], b: [1, 9] },
    { label: '4 位數 × 2 位數', a: [1000, 9999], b: [10, 99] }
  ];

  const state = {
    running: false,
    seconds: DEFAULT_MINUTES * 60,
    roundSeconds: DEFAULT_MINUTES * 60,
    timerId: null,
    finishTimer: null,
    sound: true,
    teams: [makeTeamState(), makeTeamState()]
  };

  function makeTeamState() {
    return { score: 0, wrong: 0, answer: '', problem: null, locked: false, feedbackTimer: null };
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function buildKeypads() {
    const keys = ['1','2','3','4','5','6','7','8','9','清除','0','送出'];
    $$('.team-panel').forEach((panel, teamIndex) => {
      const keypad = panel.querySelector('.keypad');
      keys.forEach((label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'key';
        button.textContent = label;
        button.dataset.value = label;
        button.setAttribute('aria-label', label === '清除' ? '清除一位數字' : label);
        if (label === '清除') button.classList.add('clear');
        if (label === '送出') button.classList.add('action');
        button.addEventListener('click', () => handleKey(teamIndex, label));
        keypad.appendChild(button);
      });
      panel.addEventListener('pointerdown', () => focusTeam(teamIndex));
    });
  }

  function focusTeam(teamIndex) {
    $(`#answer-${teamIndex}`).focus({ preventScroll: true });
  }

  function handleKey(teamIndex, key) {
    if (!state.running || state.teams[teamIndex].locked) return;
    const team = state.teams[teamIndex];
    if (key === '清除') {
      team.answer = team.answer.slice(0, -1);
      tone(210, .04);
    } else if (key === '送出') {
      submitAnswer(teamIndex);
      return;
    } else if (team.answer.length < MAX_INPUT) {
      team.answer += key;
      tone(280 + Number(key) * 14, .035);
    }
    renderAnswer(teamIndex);
  }

  function generateProblem(teamIndex) {
    const type = questionTypes[randomInt(0, questionTypes.length - 1)];
    const a = randomInt(type.a[0], type.a[1]);
    const b = randomInt(type.b[0], type.b[1]);
    const team = state.teams[teamIndex];
    team.problem = { a, b, result: a * b, label: type.label };
    team.wrong = 0;
    team.answer = '';
    team.locked = false;
    $(`#type-${teamIndex}`).textContent = type.label;
    $(`#question-${teamIndex}`).textContent = `${a.toLocaleString('zh-TW')} × ${b} = ?`;
    setFeedback(teamIndex, '答對就能把繩子拉過來！', '');
    renderAnswer(teamIndex);
    renderAttempts(teamIndex);
  }

  function submitAnswer(teamIndex) {
    const team = state.teams[teamIndex];
    if (!team.answer) {
      setFeedback(teamIndex, '請先輸入答案喔！', 'bad');
      shakePanel(teamIndex);
      tone(150, .08);
      return;
    }

    const isCorrect = Number(team.answer) === team.problem.result;
    if (isCorrect) {
      const points = team.wrong === 0 ? 2 : 1;
      team.score += points;
      team.locked = true;
      renderScore(teamIndex);
      setFeedback(teamIndex, `答對了！＋${points} 分`, 'good');
      $(`#round-status`).textContent = `${teamIndex === 0 ? '小寶隊' : '小貝隊'}拉近了！`;
      animateTug(teamIndex);
      successTone();
      window.clearTimeout(team.feedbackTimer);
      if (Math.abs(state.teams[0].score - state.teams[1].score) >= LEAD_TO_WIN) {
        finishByLead(teamIndex);
        return;
      }
      team.feedbackTimer = window.setTimeout(() => generateProblem(teamIndex), 720);
    } else {
      team.wrong += 1;
      team.answer = '';
      renderAnswer(teamIndex);
      renderAttempts(teamIndex);
      shakePanel(teamIndex);
      errorTone();
      if (team.wrong >= 3) {
        team.locked = true;
        setFeedback(teamIndex, `答案是 ${team.problem.result.toLocaleString('zh-TW')}，換下一題！`, 'bad');
        window.clearTimeout(team.feedbackTimer);
        team.feedbackTimer = window.setTimeout(() => generateProblem(teamIndex), 1150);
      } else {
        setFeedback(teamIndex, `再想想看，還有 ${3 - team.wrong} 次機會`, 'bad');
      }
    }
  }

  function renderAnswer(teamIndex) {
    $(`#answer-${teamIndex}`).value = state.teams[teamIndex].answer;
  }

  function renderAttempts(teamIndex) {
    const remaining = Math.max(0, 3 - state.teams[teamIndex].wrong);
    $(`#attempts-${teamIndex}`).textContent = remaining ? `還有 ${remaining} 次機會` : '準備換題';
  }

  function renderScore(teamIndex) {
    const element = $(`#score-${teamIndex}`);
    element.textContent = state.teams[teamIndex].score;
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.45)', color: '#fff4a3' },
      { transform: 'scale(1)' }
    ], { duration: 420, easing: 'ease-out' });
  }

  function setFeedback(teamIndex, message, kind) {
    const feedback = $(`#feedback-${teamIndex}`);
    feedback.textContent = message;
    feedback.className = `feedback ${kind}`.trim();
  }

  function shakePanel(teamIndex) {
    const card = $(`.team-panel[data-team="${teamIndex}"] .question-card`);
    card.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }
    ], { duration: 260, easing: 'ease-out' });
  }

  function animateTug(teamIndex) {
    updateTugPosition();
    const arena = $('.arena');
    arena.classList.remove('celebrate');
    void arena.offsetWidth;
    arena.classList.add('celebrate');
    const color = teamIndex === 0 ? '#0b9cc0' : '#f05f5f';
    confetti(color, teamIndex === 0 ? 36 : 64);
  }

  function updateTugPosition() {
    const difference = state.teams[1].score - state.teams[0].score;
    const rope = $('.rope');
    const leftKnot = $('.knot-left');
    const ropeCenter = rope.offsetWidth / 2;
    const leftKnotCenter = leftKnot.offsetLeft + leftKnot.offsetWidth / 2;
    const distanceToCenter = Math.max(35, ropeCenter - leftKnotCenter);
    const shift = clamp(difference / LEAD_TO_WIN * distanceToCenter, -distanceToCenter, distanceToCenter);
    $('#tug-party').style.transform = `translateX(${shift}px)`;
  }

  function finishByLead(teamIndex) {
    state.running = false;
    window.clearInterval(state.timerId);
    state.teams.forEach((team) => window.clearTimeout(team.feedbackTimer));
    setControlsDisabled(true);
    const winner = teamIndex === 0 ? '小寶隊' : '小貝隊';
    $('#round-status').textContent = `${winner}領先 15 分！`;
    window.clearTimeout(state.finishTimer);
    state.finishTimer = window.setTimeout(() => endRound('lead'), 850);
  }

  function confetti(color, percentX) {
    const arena = $('.arena');
    for (let i = 0; i < 8; i += 1) {
      const particle = document.createElement('i');
      particle.style.cssText = `position:absolute;z-index:8;left:${percentX + randomInt(-9,9)}%;top:45%;width:${randomInt(5,9)}px;height:${randomInt(5,9)}px;border-radius:${i % 2 ? '50%' : '2px'};background:${i % 3 ? color : '#ffd76a'};pointer-events:none;`;
      arena.appendChild(particle);
      particle.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${randomInt(-48,48)}px,${randomInt(-90,-40)}px) rotate(${randomInt(80,250)}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${randomInt(-70,70)}px,${randomInt(45,100)}px) rotate(${randomInt(260,540)}deg)`, opacity: 0 }
      ], { duration: randomInt(700,1000), easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => particle.remove();
    }
  }

  function randomizePlayers() {
    const hues = [0, 38, 75, 122, 178, 224, 275, 322];
    const shuffled = [...assets].sort(() => Math.random() - .5);
    [0, 2].forEach((index, assetIndex) => {
      const player = $(`#player-${index}`);
      player.src = shuffled[assetIndex % shuffled.length];
      player.dataset.handRatio = handRatios[player.src.split('/').slice(-2).join('/')]
        || handRatios[shuffled[assetIndex % shuffled.length]];
      const hue = hues.splice(randomInt(0, hues.length - 1), 1)[0];
      const saturation = randomInt(90, 118);
      player.style.setProperty('--player-filter', `hue-rotate(${hue}deg) saturate(${saturation}%)`);
    });
    [1, 3].forEach((index) => {
      const player = $(`#player-${index}`);
      player.src = riderAsset;
      player.dataset.handRatio = handRatios[riderAsset];
      player.style.removeProperty('--player-filter');
    });
    Promise.all($$('.characters img').map((image) => image.decode().catch(() => {}))).then(queueAlignHands);
  }

  let alignFrame;
  function queueAlignHands() {
    window.cancelAnimationFrame(alignFrame);
    alignFrame = window.requestAnimationFrame(alignHandsToRope);
  }

  function alignHandsToRope() {
    const rope = $('.rope');
    if (!rope) return;
    const players = $$('.characters img');
    players.forEach((player) => player.style.setProperty('--hand-shift', '0px'));
    const ropeRect = rope.getBoundingClientRect();
    const ropeY = ropeRect.top + ropeRect.height / 2;
    players.forEach((player) => {
      const rect = player.getBoundingClientRect();
      const handRatio = Number(player.dataset.handRatio || .66);
      const handY = rect.top + rect.height * handRatio;
      player.style.setProperty('--hand-shift', `${Math.round(ropeY - handY)}px`);
    });
  }

  function readRoundMinutes() {
    const input = $('#round-minutes');
    const value = Number(input.value);
    const isWholeMinute = Number.isInteger(value);
    if (!isWholeMinute || value < 1 || value > 60) {
      $('#time-error').textContent = '請輸入 1～60 的整數分鐘。';
      input.focus();
      return null;
    }
    $('#time-error').textContent = '';
    return value;
  }

  function startRound() {
    const minutes = readRoundMinutes();
    if (minutes === null) return;
    window.clearInterval(state.timerId);
    window.clearTimeout(state.finishTimer);
    state.running = true;
    state.roundSeconds = minutes * 60;
    state.seconds = state.roundSeconds;
    state.teams.forEach((team) => window.clearTimeout(team.feedbackTimer));
    state.teams = [makeTeamState(), makeTeamState()];
    renderTimer();
    $('.timer').classList.remove('danger');
    $('#round-status').textContent = '比賽開始！';
    $('#tug-party').style.transform = 'translateX(0)';
    [0, 1].forEach((index) => {
      renderScore(index);
      generateProblem(index);
    });
    randomizePlayers();
    setControlsDisabled(false);
    $('#start-modal').classList.remove('visible');
    $('#result-modal').classList.remove('visible');
    countdownTone();
    state.timerId = window.setInterval(tick, 1000);
  }

  function tick() {
    state.seconds -= 1;
    renderTimer();
    if (state.seconds <= 10) $('.timer').classList.add('danger');
    if (state.seconds > 0 && state.seconds <= 5) tone(560, .055);
    if (state.seconds <= 0) endRound();
  }

  function renderTimer() {
    const minutes = String(Math.floor(state.seconds / 60)).padStart(2, '0');
    const seconds = String(state.seconds % 60).padStart(2, '0');
    $('#timer').textContent = `${minutes}:${seconds}`;
  }

  function openRoundSetup() {
    window.clearInterval(state.timerId);
    window.clearTimeout(state.finishTimer);
    state.running = false;
    const savedMinutes = Number($('#round-minutes').value);
    state.seconds = Number.isInteger(savedMinutes) && savedMinutes >= 1 && savedMinutes <= 60
      ? savedMinutes * 60
      : DEFAULT_MINUTES * 60;
    renderTimer();
    $('.timer').classList.remove('danger');
    setControlsDisabled(true);
    $('#result-modal').classList.remove('visible');
    $('#start-modal').classList.add('visible');
    window.setTimeout(() => $('#round-minutes').select(), 0);
  }

  function endRound(reason = 'time') {
    window.clearInterval(state.timerId);
    window.clearTimeout(state.finishTimer);
    state.running = false;
    setControlsDisabled(true);
    const [a, b] = state.teams.map((team) => team.score);
    const title = a === b ? '平手！旗鼓相當！' : a > b ? '小寶隊獲勝！' : '小貝隊獲勝！';
    const copy = a === b
      ? '兩隊的乘法實力一樣厲害！'
      : reason === 'lead'
        ? '率先拉開 15 分，提前獲勝！'
        : '漂亮的合作，把勝利拉過來了！';
    $('#result-title').textContent = title;
    $('#result-copy').textContent = copy;
    $('#final-score-0').textContent = a;
    $('#final-score-1').textContent = b;
    $('#round-status').textContent = reason === 'lead'
      ? '分差達 15 分，提前結束！'
      : '時間到！';
    $('#result-modal').classList.add('visible');
    finishTone();
  }

  function setControlsDisabled(disabled) {
    $$('.key').forEach((button) => { button.disabled = disabled; });
  }

  let audioContext;
  function tone(frequency, duration, delay = 0) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(.12, audioContext.currentTime + delay + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + delay + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + duration + .02);
    } catch (_) { /* The game remains fully usable without audio. */ }
  }
  function successTone() { tone(520,.09); tone(690,.12,.08); }
  function errorTone() { tone(190,.11); tone(150,.13,.09); }
  function countdownTone() { tone(440,.07); tone(620,.1,.09); }
  function finishTone() { tone(390,.1); tone(520,.1,.1); tone(760,.22,.2); }

  function initialize() {
    buildKeypads();
    randomizePlayers();
    [0, 1].forEach(generateProblem);
    setControlsDisabled(true);
    $('#start-button').addEventListener('click', startRound);
    $('#play-again-button').addEventListener('click', openRoundSetup);
    $('#restart-button').addEventListener('click', openRoundSetup);
    $('#round-minutes').addEventListener('input', () => { $('#time-error').textContent = ''; });
    $('#sound-toggle').addEventListener('click', (event) => {
      state.sound = !state.sound;
      event.currentTarget.setAttribute('aria-pressed', String(state.sound));
      event.currentTarget.setAttribute('aria-label', state.sound ? '關閉音效' : '開啟音效');
      event.currentTarget.textContent = state.sound ? '♪' : '×';
      if (state.sound) tone(520, .08);
    });
    window.addEventListener('resize', () => {
      updateTugPosition();
      queueAlignHands();
    });
    window.addEventListener('keydown', (event) => {
      const active = document.activeElement?.id;
      if (!active?.startsWith('answer-')) return;
      const teamIndex = Number(active.split('-')[1]);
      if (/^[0-9]$/.test(event.key)) handleKey(teamIndex, event.key);
      if (event.key === 'Backspace') handleKey(teamIndex, '清除');
      if (event.key === 'Enter') handleKey(teamIndex, '送出');
    });
  }

  initialize();
})();

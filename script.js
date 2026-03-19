const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

function numberToHiragana(n) {
  if (n === 0) return 'ぜろ';

  const man   = Math.floor(n / 10000);
  const sen   = Math.floor((n % 10000) / 1000);
  const hyaku = Math.floor((n % 1000) / 100);
  const ju    = Math.floor((n % 100) / 10);
  const one   = n % 10;

  let result = '';

  if (man === 10)     result += 'じゅうまん';
  else if (man > 0)   result += ONES[man] + 'まん';

  if (sen === 1)      result += 'せん';
  else if (sen === 3) result += 'さんぜん';
  else if (sen === 8) result += 'はっせん';
  else if (sen > 0)   result += ONES[sen] + 'せん';

  if (hyaku === 1)      result += 'ひゃく';
  else if (hyaku === 3) result += 'さんびゃく';
  else if (hyaku === 6) result += 'ろっぴゃく';
  else if (hyaku === 8) result += 'はっぴゃく';
  else if (hyaku > 0)   result += ONES[hyaku] + 'ひゃく';

  if (ju === 1)    result += 'じゅう';
  else if (ju > 0) result += ONES[ju] + 'じゅう';

  if (one === 4) result += Math.random() < 0.5 ? 'よん' : 'し';
  else if (one === 7) result += Math.random() < 0.5 ? 'なな' : 'しち';
  else if (one > 0) result += ONES[one];

  return result;
}

function randomNumber() {
  const max = parseInt(document.querySelector('input[name="range"]:checked').value, 10);
  return Math.floor(Math.random() * max) + 1;
}

const audioCtx = new AudioContext();

// On iOS, Web Audio is muted by the silent switch unless an <audio> element
// plays first, which elevates the session to "playback" mode. We build a
// minimal silent WAV in memory so there's no external file needed.
function makeSilentAudio() {
  const buf = new ArrayBuffer(45);
  const v = new DataView(buf);
  const str = (offset, s) => [...s].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)));
  str(0,  'RIFF'); v.setUint32(4,  37,   true);
  str(8,  'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16,   true);
  v.setUint16(20, 1,    true);  // PCM
  v.setUint16(22, 1,    true);  // mono
  v.setUint32(24, 8000, true);  // sample rate
  v.setUint32(28, 8000, true);  // byte rate
  v.setUint16(32, 1,    true);  // block align
  v.setUint16(34, 8,    true);  // 8-bit
  str(36, 'data'); v.setUint32(40, 1, true);
  v.setUint8(44, 0x80);         // silence
  const audio = new Audio();
  audio.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return audio;
}

const silentAudio = makeSilentAudio();

function unlockAudio() {
  audioCtx.resume();
  silentAudio.play().catch(() => {});
}

document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click',      unlockAudio, { once: true });

function playTone(frequency, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playBell() { playTone(1318.5, 1.2); } // E6
function playDong()  { playTone(220,    1.5); } // A3

function speak() {
  const utterance = new SpeechSynthesisUtterance(numberToHiragana(currentNumber));
  utterance.lang = 'ja-JP';
  speechSynthesis.speak(utterance);
}

function isListening() {
  return document.querySelector('input[name="mode"]:checked').value === 'listening';
}

// --- DOM ---
const display      = document.getElementById('number-display');
const replayBtn    = document.getElementById('replay-btn');
const speakBtn     = document.getElementById('speak-btn');
const feedbackText = document.getElementById('feedback-text');
const input        = document.getElementById('answer-input');
const actionBtn    = document.getElementById('action-btn');

let currentNumber;
let awaitingNext = false;

function applyMode() {
  if (isListening()) {
    display.classList.add('hidden');
    replayBtn.classList.remove('hidden');
    speakBtn.classList.add('hidden');
  } else {
    display.classList.remove('hidden');
    replayBtn.classList.add('hidden');
    speakBtn.classList.remove('hidden');
  }
}

function showNewNumber(autoSpeak = false) {
  currentNumber = randomNumber();
  display.textContent = numberToHiragana(currentNumber);
  feedbackText.textContent = '';
  feedbackText.className = '';
  input.value = '';
  input.readOnly = false;
  actionBtn.textContent = 'Submit';
  awaitingNext = false;
  applyMode();
  if (autoSpeak && isListening()) speak();
  input.focus();
}

function submitAnswer() {
  const raw = input.value.trim();

  if (raw === '') {
    showNewNumber(true);
    return;
  }

  const guess = parseInt(raw, 10);
  input.readOnly = true;
  awaitingNext = true;
  actionBtn.textContent = 'Next';

  if (guess === currentNumber) {
    feedbackText.textContent = 'Correct!';
    feedbackText.className = 'correct';
    if (isListening()) playBell();
  } else {
    feedbackText.textContent = `Wrong — the answer was ${currentNumber.toLocaleString()}`;
    feedbackText.className = 'wrong';
    if (isListening()) playDong();
  }
}

speakBtn.addEventListener('click', speak);
replayBtn.addEventListener('click', speak);

document.querySelectorAll('input[name="range"]').forEach(radio => {
  radio.addEventListener('change', () => showNewNumber(true));
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => showNewNumber(true));
});

actionBtn.addEventListener('click', () => {
  if (awaitingNext) showNewNumber(true);
  else submitAnswer();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (awaitingNext) showNewNumber(true);
    else submitAnswer();
  }
});

showNewNumber();

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

  if (one > 0) result += ONES[one];

  return result;
}

function randomNumber() {
  const max = parseInt(document.querySelector('input[name="range"]:checked').value, 10);
  return Math.floor(Math.random() * max) + 1;
}

// --- DOM ---
const display      = document.getElementById('number-display');
const speakBtn     = document.getElementById('speak-btn');
const feedbackText = document.getElementById('feedback-text');
const input        = document.getElementById('answer-input');
const actionBtn    = document.getElementById('action-btn');

let currentNumber;
let awaitingNext = false;

function showNewNumber() {
  currentNumber = randomNumber();
  display.textContent = numberToHiragana(currentNumber);
  feedbackText.textContent = '';
  feedbackText.className = '';
  input.value = '';
  input.readOnly = false;
  actionBtn.textContent = 'Submit';
  awaitingNext = false;
  input.focus();
}

function submitAnswer() {
  const raw = input.value.trim();

  // Empty input = skip
  if (raw === '') {
    showNewNumber();
    return;
  }

  const guess = parseInt(raw, 10);
  input.readOnly = true;
  awaitingNext = true;
  actionBtn.textContent = 'Next';

  if (guess === currentNumber) {
    feedbackText.textContent = 'Correct!';
    feedbackText.className = 'correct';
  } else {
    feedbackText.textContent = `Wrong — the answer was ${currentNumber.toLocaleString()}`;
    feedbackText.className = 'wrong';
  }
}

speakBtn.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(display.textContent);
  utterance.lang = 'ja-JP';
  speechSynthesis.speak(utterance);
});

document.querySelectorAll('input[name="range"]').forEach(radio => {
  radio.addEventListener('change', showNewNumber);
});

actionBtn.addEventListener('click', () => {
  if (awaitingNext) showNewNumber();
  else submitAnswer();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (awaitingNext) showNewNumber();
    else submitAnswer();
  }
});

showNewNumber();

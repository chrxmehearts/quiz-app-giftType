'use strict';

/* ── State ── */
let allQuestions      = [];
let displayedQuestions = [];
let currentTopic      = 'All';
let filterMode        = null; // 'wrong' | 'unanswered' | null
let currentFileName   = null;
let rawGiftText       = null;

/* ── DOM refs ── */
const fileInput      = document.getElementById('file-input');
const fileNameEl     = document.getElementById('file-name');
const quizContainer  = document.getElementById('quiz-container');
const emptyState     = document.getElementById('empty-state');
const errorState     = document.getElementById('error-state');
const topicTabs      = document.getElementById('topic-tabs');
const progressFill   = document.getElementById('progress-fill');
const statAnswered   = document.getElementById('stat-answered');
const statCorrect    = document.getElementById('stat-correct');
const statWrong      = document.getElementById('stat-wrong');
const statPct        = document.getElementById('stat-pct');
const statTotal      = document.getElementById('stat-total');
const btnWrong       = document.getElementById('btn-wrong');
const btnUnanswered  = document.getElementById('btn-unanswered');
const btnShuffle     = document.getElementById('btn-shuffle');
const btnReset       = document.getElementById('btn-reset');
const btnSaveOffline = document.getElementById('btn-save-offline');

/* ── File loading ── */
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  currentFileName = file.name;
  fileNameEl.textContent = file.name;
  localStorage.setItem(FILENAME_KEY, file.name);
  const reader = new FileReader();
  reader.onload = ev => {
    rawGiftText = ev.target.result;
    loadGift(rawGiftText);
  };
  reader.readAsText(file, 'UTF-8');
  fileInput.value = '';
});

function loadGift(text) {
  errorState.style.display = 'none';
  try {
    const parsed = parseGiftFile(text);
    if (!parsed.length) throw new Error('No valid questions found in file.');
    allQuestions = parsed;
    applyStoredAnswers(allQuestions);
    currentTopic = 'All';
    filterMode   = null;
    btnWrong.classList.remove('active');
    btnUnanswered.classList.remove('active');
    emptyState.style.display = 'none';
    btnSaveOffline.classList.add('visible');
    renderTopicTabs();
    applyFilterAndRender();
  } catch (err) {
    showError(err.message);
  }
}

function showError(msg) {
  errorState.textContent = 'Parse error: ' + msg;
  errorState.style.display = 'block';
}

/* ── Controls ── */
btnWrong.addEventListener('click', () => {
  filterMode = filterMode === 'wrong' ? null : 'wrong';
  btnWrong.classList.toggle('active', filterMode === 'wrong');
  btnUnanswered.classList.remove('active');
  applyFilterAndRender();
});

btnUnanswered.addEventListener('click', () => {
  filterMode = filterMode === 'unanswered' ? null : 'unanswered';
  btnUnanswered.classList.toggle('active', filterMode === 'unanswered');
  btnWrong.classList.remove('active');
  applyFilterAndRender();
});

btnShuffle.addEventListener('click', () => {
  displayedQuestions = shuffle(displayedQuestions);
  renderQuestions(displayedQuestions);
});

btnReset.addEventListener('click', () => {
  if (!allQuestions.length) return;
  for (const q of allQuestions) {
    q.answered = false;
    q.correct  = null;
    q.selectedIndices = [];
  }
  clearStorage();
  filterMode = null;
  btnWrong.classList.remove('active');
  btnUnanswered.classList.remove('active');
  applyFilterAndRender();
});

btnSaveOffline.addEventListener('click', saveEmbedded);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Init ── */
const lastFile = localStorage.getItem(FILENAME_KEY);
if (lastFile) fileNameEl.textContent = `Last: ${lastFile}`;
updateStats();

if (window.__EMBEDDED_GIFT__) {
  rawGiftText = window.__EMBEDDED_GIFT__;
  fileNameEl.textContent = 'Embedded quiz';
  loadGift(rawGiftText);
}

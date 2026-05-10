'use strict';

const STORAGE_KEY  = 'quiz_answers_v1';
const FILENAME_KEY = 'quiz_last_file';

function loadStoredAnswers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAnswer(question) {
  const stored = loadStoredAnswers();
  stored[question.id] = {
    answered: question.answered,
    correct: question.correct,
    selectedIndices: question.selectedIndices,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function applyStoredAnswers(questions) {
  const stored = loadStoredAnswers();
  for (const q of questions) {
    if (stored[q.id]) {
      q.answered        = stored[q.id].answered;
      q.correct         = stored[q.id].correct;
      q.selectedIndices = stored[q.id].selectedIndices || [];
    }
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

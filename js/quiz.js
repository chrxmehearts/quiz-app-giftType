'use strict';

function handleOptionClick(q, idx, card) {
  if (q.isMulti) {
    const btn = card.querySelectorAll('.option-btn')[idx];
    if (q.selectedIndices.includes(idx)) {
      q.selectedIndices = q.selectedIndices.filter(i => i !== idx);
      btn.classList.remove('selected-neutral');
    } else {
      q.selectedIndices.push(idx);
      btn.classList.add('selected-neutral');
    }
  } else {
    q.selectedIndices = [idx];
    q.answered = true;
    q.correct  = q.answers[idx].correct;
    finalizeCard(q, card);
    saveAnswer(q);
    updateStats();
  }
}

function submitMulti(q, card) {
  if (!q.selectedIndices.length) return;
  q.answered = true;
  const correctIndices = q.answers.map((a, i) => a.correct ? i : -1).filter(i => i >= 0);
  const selectedSet = new Set(q.selectedIndices);
  const correctSet  = new Set(correctIndices);
  q.correct = [...correctSet].every(i => selectedSet.has(i)) &&
              [...selectedSet].every(i => correctSet.has(i));
  finalizeCard(q, card);
  saveAnswer(q);
  updateStats();
}

function finalizeCard(q, card) {
  card.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    applyAnsweredStyle(btn, q, i);
  });
  const checkBtn = card.querySelector('.check-btn');
  if (checkBtn) checkBtn.remove();
  const exp = card.querySelector('.explanation');
  if (exp) exp.classList.add('visible');
}

function handleCardKey(e, q, card) {
  if (q.answered) return;
  const keyMap  = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
  const alphaMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
  const key = e.key.toLowerCase();
  const idx = keyMap[e.key] !== undefined ? keyMap[e.key] : alphaMap[key];
  if (idx !== undefined && idx < q.answers.length) {
    e.preventDefault();
    handleOptionClick(q, idx, card);
  }
}

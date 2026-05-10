'use strict';

function updateStats() {
  const total    = allQuestions.length;
  const answered = allQuestions.filter(q => q.answered).length;
  const correct  = allQuestions.filter(q => q.answered && q.correct).length;
  const wrong    = allQuestions.filter(q => q.answered && !q.correct).length;
  const pct      = answered ? Math.round((correct / answered) * 100) : null;

  statTotal.textContent    = total;
  statAnswered.textContent = answered;
  statCorrect.textContent  = correct;
  statWrong.textContent    = wrong;
  statPct.textContent      = pct !== null ? pct + '%' : '—';

  progressFill.style.width = total ? (answered / total * 100) + '%' : '0%';
}

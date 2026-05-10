'use strict';

// iOS QuickLook: touchend fires instantly; click has a 300ms ghost delay.
// We prioritize touchend and suppress the follow-up ghost click.
function onTap(el, fn) {
  let touchHandled = false;
  el.addEventListener('touchend', e => {
    e.preventDefault();
    touchHandled = true;
    fn();
    setTimeout(() => { touchHandled = false; }, 600);
  }, { passive: false });
  el.addEventListener('click', () => {
    if (!touchHandled) fn();
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTopicTabs() {
  const topics = ['All', ...new Set(allQuestions.map(q => q.topic))];
  topicTabs.innerHTML = '';
  for (const topic of topics) {
    const count = topic === 'All'
      ? allQuestions.length
      : allQuestions.filter(q => q.topic === topic).length;
    const btn = document.createElement('button');
    btn.className = 'tab-pill' + (topic === currentTopic ? ' active' : '');
    btn.textContent = `${topic} (${count})`;
    btn.dataset.topic = topic;
    btn.addEventListener('click', () => {
      currentTopic = topic;
      filterMode = null;
      btnWrong.classList.remove('active');
      btnUnanswered.classList.remove('active');
      applyFilterAndRender();
      renderTopicTabs();
    });
    topicTabs.appendChild(btn);
  }
}

function getFilteredQuestions() {
  let qs = currentTopic === 'All'
    ? [...allQuestions]
    : allQuestions.filter(q => q.topic === currentTopic);
  if (filterMode === 'wrong')      qs = qs.filter(q => q.answered && !q.correct);
  if (filterMode === 'unanswered') qs = qs.filter(q => !q.answered);
  return qs;
}

function applyFilterAndRender() {
  displayedQuestions = getFilteredQuestions();
  renderQuestions(displayedQuestions);
  updateStats();
}

function renderQuestions(questions) {
  quizContainer.innerHTML = '';
  if (!questions.length) {
    quizContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No questions match the current filter.</p>';
    return;
  }
  questions.forEach((q, idx) => quizContainer.appendChild(buildCard(q, idx)));
}

function buildCard(q, idx) {
  const card = document.createElement('div');
  card.className = 'question-card';
  card.tabIndex = 0;
  card.dataset.qid = q.id;

  const meta = document.createElement('div');
  meta.className = 'q-meta';
  meta.innerHTML = `<span class="q-num">Q${idx + 1}</span>
    <span class="q-topic">${escHtml(q.topic)}</span>
    ${q.isMulti ? '<span class="q-multi-hint">Select all correct</span>' : ''}`;
  card.appendChild(meta);

  const qtext = document.createElement('div');
  qtext.className = 'q-text';
  qtext.textContent = q.text;
  card.appendChild(qtext);

  const optList = document.createElement('ul');
  optList.className = 'options-list';
  const keys = ['A', 'B', 'C', 'D', 'E', 'F'];

  q.answers.forEach((ans, i) => {
    const li  = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.disabled  = q.answered;
    btn.dataset.index = i;
    btn.innerHTML = `<span class="option-key">${keys[i] || i + 1}</span><span>${escHtml(ans.text)}</span>`;

    if (q.answered) {
      applyAnsweredStyle(btn, q, i);
    } else if (q.isMulti && q.selectedIndices.includes(i)) {
      btn.classList.add('selected-neutral');
    }

    if (!q.answered) {
      onTap(btn, () => handleOptionClick(q, i, card));
    }

    li.appendChild(btn);
    optList.appendChild(li);
  });
  card.appendChild(optList);

  if (q.isMulti && !q.answered) {
    const checkBtn = document.createElement('button');
    checkBtn.className   = 'check-btn';
    checkBtn.textContent = 'Check Answers';
    onTap(checkBtn, () => submitMulti(q, card));
    card.appendChild(checkBtn);
  }

  if (q.explanation) {
    const exp = document.createElement('div');
    exp.className = 'explanation' + (q.answered ? ' visible' : '');
    exp.innerHTML = `<strong>Explanation:</strong> ${escHtml(q.explanation)}`;
    card.appendChild(exp);
  }

  card.addEventListener('keydown', e => handleCardKey(e, q, card));
  return card;
}

function applyAnsweredStyle(btn, q, idx) {
  const ans = q.answers[idx];
  if (q.isMulti) {
    if (ans.correct && q.selectedIndices.includes(idx))  btn.classList.add('correct');
    else if (!ans.correct && q.selectedIndices.includes(idx)) btn.classList.add('wrong');
    else if (ans.correct) btn.classList.add('correct');
  } else {
    if (ans.correct)                      btn.classList.add('correct');
    else if (q.selectedIndices.includes(idx)) btn.classList.add('wrong');
  }
}

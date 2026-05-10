'use strict';

function parseGiftFile(text) {
  const questions = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawBlocks = normalized.split(/\n{2,}/);

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const blockLines = trimmed.split('\n');
    let explanation = '';
    let questionLines = [];
    let inComment = true;

    for (const line of blockLines) {
      if (inComment && line.trim().startsWith('//')) {
        const commentText = line.trim().replace(/^\/\/\s*/, '');
        if (commentText.toUpperCase().startsWith('EXPLANATION:')) {
          explanation = commentText.replace(/^EXPLANATION:\s*/i, '').trim();
        }
      } else {
        inComment = false;
        questionLines.push(line);
      }
    }

    const qText = questionLines.join('\n').trim();
    if (!qText) continue;

    const titleMatch = qText.match(/^::([^:]+)::/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const topicMatch = title.match(/\|\s*(.+)$/);
    const topic = topicMatch ? topicMatch[1].trim() : 'General';

    // Match GIFT answer block: { followed by newline then =, ~, or %
    const braceStartMatch = /\{\s*\n\s*[=~%]/.exec(qText);
    if (!braceStartMatch) continue;
    const braceStart = braceStartMatch.index;
    const braceEnd = qText.lastIndexOf('}');
    if (braceEnd === -1) continue;

    const questionText = qText.slice(qText.indexOf('::', 2) + 2, braceStart).trim().replace(/^::\s*/, '');
    const answerBlock  = qText.slice(braceStart + 1, braceEnd).trim();

    const { answers, isMulti } = parseAnswers(answerBlock);
    if (!answers.length) continue;

    questions.push({
      id: hashStr(title + questionText),
      title,
      topic,
      text: questionText,
      answers,
      isMulti,
      explanation,
      answered: false,
      correct: null,
      selectedIndices: [],
    });
  }

  return questions;
}

function parseAnswers(block) {
  const answers = [];
  let isMulti = false;

  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.startsWith('=')) {
      answers.push({ text: line.slice(1).trim(), correct: true, weight: 100 });
    } else if (line.startsWith('~')) {
      const inner = line.slice(1).trim();
      const weightMatch = inner.match(/^%([-\d.]+)%(.+)$/s);
      if (weightMatch) {
        isMulti = true;
        const weight = parseFloat(weightMatch[1]);
        answers.push({ text: weightMatch[2].trim(), correct: weight > 0, weight });
      } else {
        answers.push({ text: inner, correct: false, weight: 0 });
      }
    }
  }

  return { answers, isMulti };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

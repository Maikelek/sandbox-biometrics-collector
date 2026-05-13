const getNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const parseJsonMaybe = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
};

const parseEvents = (events) => {
  const parsed = parseJsonMaybe(events, []);

  return Array.isArray(parsed) ? parsed : [];
};

const parseTypingMetrics = (typingMetrics) => {
  const parsed = parseJsonMaybe(typingMetrics, {});

  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed
    : {};
};

const calculateLongestHiddenTime = (events) => {
  let hiddenStart = null;
  let longestHiddenMs = 0;

  events.forEach((event) => {
    const isVisibilityEvent =
      event.type === 'tab' || event.type === 'tab_visibility';

    if (!isVisibilityEvent) return;

    if (event.visible === false) {
      hiddenStart = getNumber(event.t);
      return;
    }

    if (event.visible === true && hiddenStart !== null) {
      const duration = getNumber(event.t) - hiddenStart;

      if (duration > longestHiddenMs) {
        longestHiddenMs = duration;
      }

      hiddenStart = null;
    }
  });

  return longestHiddenMs;
};

const analyzeSubmission = ({ code, typingMetrics = {}, otherEvents = [] }) => {
  const events = parseEvents(otherEvents);
  const metrics = parseTypingMetrics(typingMetrics);

  const reasons = [];
  let score = 0;

  const codeLength = String(code || '').length;

  const activeTypingMs = getNumber(metrics.activeTypingMs);
  const activeTypingSeconds = getNumber(
    metrics.activeTypingSeconds || activeTypingMs / 1000
  );

  const totalKeystrokes = getNumber(metrics.totalKeystrokes);
  const charsAdded = getNumber(metrics.charsAdded);
  const charsRemoved = getNumber(metrics.charsRemoved);
  const typingSpeedCpm = getNumber(metrics.typingSpeedCpm);
  const typingSpeedWpm = getNumber(metrics.typingSpeedWpm);
  const pasteCount = getNumber(metrics.pasteCount);
  const copyCount = getNumber(metrics.copyCount);
  const cutCount = getNumber(metrics.cutCount);
  const backspaces = getNumber(metrics.backspaces);
  const deletes = getNumber(metrics.deletes);
  const pauseCount = getNumber(metrics.pauseCount);
  const maxPauseMs = getNumber(metrics.maxPauseMs);
  const focusCount = getNumber(metrics.focusCount);
  const blurCount = getNumber(metrics.blurCount);
  const scrollEvents = getNumber(metrics.scrollEvents);

  const tabVisibilityEvents = events.filter(
    (event) => event.type === 'tab' || event.type === 'tab_visibility'
  );

  const tabLeaves = tabVisibilityEvents.filter(
    (event) => event.visible === false
  ).length;

  const editorFocusEvents = events.filter(
    (event) => event.type === 'editor_focus'
  ).length;

  const editorBlurEvents = events.filter(
    (event) => event.type === 'editor_blur'
  ).length;

  const clickEvents = events.filter((event) => event.type === 'click').length;

  const resizeEvents = events.filter(
    (event) =>
      event.type === 'resize' ||
      event.type === 'window_resize' ||
      event.type === 'screen_resize'
  );

  const extremeResizeEvents = resizeEvents.filter((event) => {
    const width = getNumber(event.w || event.width);
    const height = getNumber(event.h || event.height);

    if (!width || !height) return false;

    return width < 500 || height < 500;
  });

  const longestHiddenMs = calculateLongestHiddenTime(events);

  if (pasteCount >= 1 && charsAdded >= 40) {
    score += 35;
    reasons.push({
      code: 'large_paste',
      message: 'Používateľ vložil väčšie množstvo kódu naraz.',
      value: pasteCount,
    });
  }

  if (pasteCount >= 2) {
    score += 20;
    reasons.push({
      code: 'multiple_pastes',
      message: 'Používateľ opakovane vkladal obsah do editora.',
      value: pasteCount,
    });
  }

  if (copyCount >= 2 || cutCount >= 1) {
    score += 10;
    reasons.push({
      code: 'clipboard_activity',
      message: 'Počas riešenia bola zaznamenaná aktivita schránky.',
      value: {
        copyCount,
        cutCount,
      },
    });
  }

  if (typingSpeedCpm >= 350) {
    score += 25;
    reasons.push({
      code: 'high_typing_speed',
      message: 'Rýchlosť písania je neobvykle vysoká.',
      value: typingSpeedCpm,
    });
  }

  if (typingSpeedWpm >= 80) {
    score += 20;
    reasons.push({
      code: 'high_wpm',
      message: 'Odhadovaná rýchlosť písania je veľmi vysoká.',
      value: typingSpeedWpm,
    });
  }

  if (codeLength >= 80 && activeTypingSeconds > 0 && activeTypingSeconds <= 10) {
    score += 25;
    reasons.push({
      code: 'very_short_typing_time',
      message: 'Riešenie bolo vytvorené za veľmi krátky čas.',
      value: activeTypingSeconds,
    });
  }

  if (
    codeLength >= 80 &&
    totalKeystrokes > 0 &&
    codeLength / totalKeystrokes >= 5
  ) {
    score += 20;
    reasons.push({
      code: 'low_keystrokes_for_code_size',
      message:
        'Veľkosť kódu nezodpovedá počtu zaznamenaných stlačení kláves.',
      value: Math.round(codeLength / totalKeystrokes),
    });
  }

  if (tabLeaves >= 5) {
    score += 45;
    reasons.push({
      code: 'frequent_tab_switching',
      message: 'Používateľ viackrát opustil kartu počas riešenia.',
      value: tabLeaves,
    });
  }

  if (longestHiddenMs >= 15000) {
    score += 20;
    reasons.push({
      code: 'long_tab_leave',
      message: 'Používateľ bol dlhšie mimo stránky s editorom.',
      value: Math.round(longestHiddenMs / 1000),
    });
  }

  const totalFocusChanges =
    focusCount + blurCount + editorFocusEvents + editorBlurEvents;

  if (totalFocusChanges >= 10) {
    score += 20;
    reasons.push({
      code: 'frequent_focus_changes',
      message: 'Editor často strácal a získaval focus.',
      value: totalFocusChanges,
    });
  }

  if (resizeEvents.length >= 3) {
    score += 10;
    reasons.push({
      code: 'frequent_window_resize',
      message: 'Používateľ počas riešenia viackrát menil veľkosť okna.',
      value: resizeEvents.length,
    });
  }

  if (extremeResizeEvents.length >= 1) {
    score += 10;
    reasons.push({
      code: 'small_window_resize',
      message: 'Počas riešenia bolo okno výrazne zmenšené.',
      value: extremeResizeEvents.length,
    });
  }

  if (clickEvents >= 10 && tabLeaves >= 3) {
    score += 10;
    reasons.push({
      code: 'many_clicks_and_tab_changes',
      message: 'Používateľ často klikal mimo editor a prepínal kartu.',
      value: clickEvents,
    });
  }

  if (maxPauseMs >= 30000) {
    score += 15;
    reasons.push({
      code: 'long_pause',
      message: 'Počas riešenia bola zaznamenaná dlhá pauza.',
      value: Math.round(maxPauseMs / 1000),
    });
  }

  if (pauseCount >= 5 && maxPauseMs >= 8000) {
    score += 10;
    reasons.push({
      code: 'many_long_pauses',
      message: 'Počas riešenia bolo zaznamenaných viacero dlhších prestávok.',
      value: pauseCount,
    });
  }

  if (
    codeLength >= 60 &&
    backspaces + deletes <= 1 &&
    pasteCount === 0 &&
    activeTypingSeconds > 0 &&
    activeTypingSeconds <= 12
  ) {
    score += 15;
    reasons.push({
      code: 'almost_no_corrections',
      message: 'Pri riešení bolo zaznamenaných veľmi málo opráv.',
      value: backspaces + deletes,
    });
  }

  if (
    codeLength >= 60 &&
    totalKeystrokes === 0 &&
    charsAdded >= 40
  ) {
    score += 35;
    reasons.push({
      code: 'code_changed_without_keystrokes',
      message: 'Kód sa výrazne zmenil bez zaznamenaného písania.',
      value: charsAdded,
    });
  }

  if (
    scrollEvents >= 5 &&
    activeTypingSeconds <= 10 &&
    codeLength >= 80
  ) {
    score += 10;
    reasons.push({
      code: 'scrolling_without_typing',
      message: 'Používateľ sa pohyboval v editore, ale písal veľmi málo.',
      value: scrollEvents,
    });
  }

  score = Math.min(score, 100);

  return {
    flagged: score >= 60,
    score,
    reasons,
  };
};

module.exports = {
  analyzeSubmission,
};
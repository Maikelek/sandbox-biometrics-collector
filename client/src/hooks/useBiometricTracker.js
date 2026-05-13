import { useRef, useCallback, useEffect } from 'react';

const MAX_MOUSE_EVENTS = 2000;
const MAX_OTHER_EVENTS = 3000;
const MAX_TYPING_SESSIONS = 200;

const TYPING_IDLE_MS = 2500;
const PAUSE_THRESHOLD_MS = 1500;

const pushLimited = (ref, item, limit) => {
  ref.current.push(item);

  if (ref.current.length > limit) {
    ref.current.splice(0, ref.current.length - limit);
  }
};

const classifyKey = (key) => {
  if (!key) return 'unknown';

  if (key === ' ' || key === 'Spacebar' || key === 'Space') return 'space';
  if (key.length === 1) return 'character';

  if (key === 'Backspace') return 'backspace';
  if (key === 'Delete') return 'delete';
  if (key === 'Enter') return 'enter';
  if (key === 'Tab') return 'tab';
  if (key.startsWith('Arrow')) return 'arrow';
  if (key === 'Escape') return 'escape';

  if (
    key === 'Shift' ||
    key === 'Control' ||
    key === 'Alt' ||
    key === 'Meta' ||
    key === 'CapsLock'
  ) {
    return 'modifier';
  }

  return 'special';
};

const getRelativeTime = (startTimeRef) => Date.now() - startTimeRef.current;

export const useBiometricTracker = () => {
  const mouseMovesRef = useRef([]);
  const otherEventsRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  const mouseThrottleRef = useRef(0);
  const scrollThrottleRef = useRef(0);

  const typingStopTimerRef = useRef(null);
  const editorCleanupRef = useRef(null);
  const lastInputLengthRef = useRef(0);

  const typingStateRef = useRef({
    currentSession: null,
    sessions: [],

    totalKeystrokes: 0,
    charsAdded: 0,
    charsRemoved: 0,

    backspaces: 0,
    deletes: 0,
    enters: 0,
    tabs: 0,
    spaces: 0,

    pasteCount: 0,
    copyCount: 0,
    cutCount: 0,

    pauseCount: 0,
    totalPauseMs: 0,
    maxPauseMs: 0,

    focusCount: 0,
    blurCount: 0,
    scrollEvents: 0,
  });

  const logAction = useCallback((category, type, details = {}) => {
    const entry = {
      type,
      t: getRelativeTime(startTimeRef),
      ...details,
    };

    if (category === 'mouse') {
      pushLimited(mouseMovesRef, entry, MAX_MOUSE_EVENTS);
    } else {
      pushLimited(otherEventsRef, entry, MAX_OTHER_EVENTS);
    }
  }, []);

  const finalizeTypingSession = useCallback(
    (reason = 'idle') => {
      const state = typingStateRef.current;
      const session = state.currentSession;

      if (!session) return;

      const end = session.lastInputAt || getRelativeTime(startTimeRef);

      const finishedSession = {
        ...session,
        end,
        durationMs: Math.max(0, end - session.start),
      };

      state.sessions.push(finishedSession);

      if (state.sessions.length > MAX_TYPING_SESSIONS) {
        state.sessions.splice(0, state.sessions.length - MAX_TYPING_SESSIONS);
      }

      logAction('other', 'typing_stop', {
        reason,
        durationMs: finishedSession.durationMs,
        keystrokes: finishedSession.keystrokes,
        charsAdded: finishedSession.charsAdded,
        charsRemoved: finishedSession.charsRemoved,
        pauses: finishedSession.pauseCount,
      });

      state.currentSession = null;
    },
    [logAction]
  );

  const scheduleTypingStop = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = setTimeout(() => {
      finalizeTypingSession('idle');
    }, TYPING_IDLE_MS);
  }, [finalizeTypingSession]);

  const ensureTypingSession = useCallback(
    (time) => {
      const state = typingStateRef.current;

      if (!state.currentSession) {
        state.currentSession = {
          start: time,
          lastInputAt: time,
          end: time,

          keystrokes: 0,
          charsAdded: 0,
          charsRemoved: 0,

          backspaces: 0,
          deletes: 0,
          enters: 0,
          tabs: 0,
          spaces: 0,

          pasteCount: 0,
          pauseCount: 0,
          totalPauseMs: 0,
          maxPauseMs: 0,
        };

        logAction('other', 'typing_start');
      }

      return state.currentSession;
    },
    [logAction]
  );

  const recordTypingActivity = useCallback(
    ({
      source = 'editor',
      keystrokes = 0,
      charsAdded = 0,
      charsRemoved = 0,
      keyType = null,
      paste = false,
    } = {}) => {
      const time = getRelativeTime(startTimeRef);
      const state = typingStateRef.current;
      const session = ensureTypingSession(time);

      if (state.lastInputAt && time - state.lastInputAt > PAUSE_THRESHOLD_MS) {
        const pauseMs = time - state.lastInputAt;

        state.pauseCount += 1;
        state.totalPauseMs += pauseMs;
        state.maxPauseMs = Math.max(state.maxPauseMs, pauseMs);

        session.pauseCount += 1;
        session.totalPauseMs += pauseMs;
        session.maxPauseMs = Math.max(session.maxPauseMs, pauseMs);

        logAction('other', 'typing_pause', {
          durationMs: pauseMs,
        });
      }

      state.lastInputAt = time;

      state.totalKeystrokes += keystrokes;
      state.charsAdded += charsAdded;
      state.charsRemoved += charsRemoved;

      session.keystrokes += keystrokes;
      session.charsAdded += charsAdded;
      session.charsRemoved += charsRemoved;
      session.lastInputAt = time;
      session.end = time;

      if (paste) {
        state.pasteCount += 1;
        session.pasteCount += 1;
      }

      if (keyType === 'backspace') {
        state.backspaces += 1;
        session.backspaces += 1;
      }

      if (keyType === 'delete') {
        state.deletes += 1;
        session.deletes += 1;
      }

      if (keyType === 'enter') {
        state.enters += 1;
        session.enters += 1;
      }

      if (keyType === 'tab') {
        state.tabs += 1;
        session.tabs += 1;
      }

      if (keyType === 'space') {
        state.spaces += 1;
        session.spaces += 1;
      }

      logAction('other', 'typing_activity', {
        source,
        keystrokes,
        charsAdded,
        charsRemoved,
        keyType,
        paste,
      });

      scheduleTypingStop();
    },
    [ensureTypingSession, logAction, scheduleTypingStop]
  );

  const recordKeyDown = useCallback(
    (key, modifiers = {}) => {
      const keyType = classifyKey(key);

      const isTypingKey = [
        'character',
        'space',
        'backspace',
        'delete',
        'enter',
        'tab',
      ].includes(keyType);

      const isShortcut = modifiers.ctrl || modifiers.meta;

      logAction('other', 'key_press', {
        keyType,
        ctrl: Boolean(modifiers.ctrl),
        alt: Boolean(modifiers.alt),
        shift: Boolean(modifiers.shift),
        meta: Boolean(modifiers.meta),
      });

      if (!isTypingKey && !isShortcut) return;

      if (isShortcut) {
        const normalizedKey = String(key || '').toLowerCase();

        if (normalizedKey === 'v') {
          recordTypingActivity({
            source: 'keyboard_shortcut',
            keystrokes: 1,
            paste: true,
          });
          return;
        }

        if (normalizedKey === 'c') {
          typingStateRef.current.copyCount += 1;
          return;
        }

        if (normalizedKey === 'x') {
          typingStateRef.current.cutCount += 1;
          return;
        }
      }

      recordTypingActivity({
        source: 'keydown',
        keystrokes: 1,
        keyType,
      });
    },
    [logAction, recordTypingActivity]
  );

  const recordEditorChange = useCallback(
    (event) => {
      let charsAdded = 0;
      let charsRemoved = 0;
      let changes = 1;

      if (event?.changes && Array.isArray(event.changes)) {
        changes = event.changes.length;

        event.changes.forEach((change) => {
          charsAdded += change.text?.length || 0;
          charsRemoved += change.rangeLength || 0;
        });
      }

      recordTypingActivity({
        source: 'editor_change',
        charsAdded,
        charsRemoved,
      });

      logAction('other', 'editor_change', {
        changes,
        charsAdded,
        charsRemoved,
      });
    },
    [logAction, recordTypingActivity]
  );

  const setEditorInstance = useCallback(
    (editor) => {
      if (editorCleanupRef.current) {
        editorCleanupRef.current();
        editorCleanupRef.current = null;
      }

      if (!editor) return;

      const state = typingStateRef.current;

      const handleFocus = () => {
        state.focusCount += 1;
        logAction('other', 'editor_focus');
      };

      const handleBlur = () => {
        state.blurCount += 1;
        logAction('other', 'editor_blur');
        finalizeTypingSession('blur');
      };

      const handleScroll = () => {
        const now = Date.now();

        if (now - scrollThrottleRef.current > 500) {
          state.scrollEvents += 1;
          logAction('other', 'editor_scroll');
          scrollThrottleRef.current = now;
        }
      };

      const handlePaste = () => {
        state.pasteCount += 1;
        logAction('other', 'paste');
        recordTypingActivity({
          source: 'paste',
          paste: true,
        });
      };

      const handleCopy = () => {
        state.copyCount += 1;
        logAction('other', 'copy');
      };

      const handleCut = () => {
        state.cutCount += 1;
        logAction('other', 'cut');
      };

      if (typeof editor.onDidChangeModelContent === 'function') {
        const disposables = [];

        disposables.push(editor.onDidChangeModelContent(recordEditorChange));

        if (typeof editor.onKeyDown === 'function') {
          disposables.push(
            editor.onKeyDown((e) => {
              const browserEvent = e.browserEvent || {};

              recordKeyDown(browserEvent.key || e.code, {
                ctrl: browserEvent.ctrlKey || e.ctrlKey,
                alt: browserEvent.altKey || e.altKey,
                shift: browserEvent.shiftKey || e.shiftKey,
                meta: browserEvent.metaKey || e.metaKey,
              });
            })
          );
        }

        if (typeof editor.onDidFocusEditorText === 'function') {
          disposables.push(editor.onDidFocusEditorText(handleFocus));
        }

        if (typeof editor.onDidBlurEditorText === 'function') {
          disposables.push(editor.onDidBlurEditorText(handleBlur));
        }

        if (typeof editor.onDidScrollChange === 'function') {
          disposables.push(editor.onDidScrollChange(handleScroll));
        }

        editorCleanupRef.current = () => {
          disposables.forEach((disposable) => {
            if (typeof disposable?.dispose === 'function') {
              disposable.dispose();
            }
          });
        };

        return;
      }

      if (editor instanceof HTMLElement) {
        const getLength = () => {
          if ('value' in editor) return editor.value.length;
          return editor.textContent?.length || 0;
        };

        lastInputLengthRef.current = getLength();

        const handleInput = () => {
          const newLength = getLength();
          const diff = newLength - lastInputLengthRef.current;

          lastInputLengthRef.current = newLength;

          recordTypingActivity({
            source: 'html_input',
            charsAdded: diff > 0 ? diff : 0,
            charsRemoved: diff < 0 ? Math.abs(diff) : 0,
          });

          logAction('other', 'editor_change', {
            charsAdded: diff > 0 ? diff : 0,
            charsRemoved: diff < 0 ? Math.abs(diff) : 0,
          });
        };

        const handleKeyDown = (e) => {
          recordKeyDown(e.key, {
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
          });
        };

        editor.addEventListener('input', handleInput);
        editor.addEventListener('keydown', handleKeyDown);
        editor.addEventListener('focus', handleFocus);
        editor.addEventListener('blur', handleBlur);
        editor.addEventListener('scroll', handleScroll);
        editor.addEventListener('paste', handlePaste);
        editor.addEventListener('copy', handleCopy);
        editor.addEventListener('cut', handleCut);

        editorCleanupRef.current = () => {
          editor.removeEventListener('input', handleInput);
          editor.removeEventListener('keydown', handleKeyDown);
          editor.removeEventListener('focus', handleFocus);
          editor.removeEventListener('blur', handleBlur);
          editor.removeEventListener('scroll', handleScroll);
          editor.removeEventListener('paste', handlePaste);
          editor.removeEventListener('copy', handleCopy);
          editor.removeEventListener('cut', handleCut);
        };
      }
    },
    [
      finalizeTypingSession,
      logAction,
      recordEditorChange,
      recordKeyDown,
      recordTypingActivity,
    ]
  );

  const getMetrics = useCallback(() => {
    const state = typingStateRef.current;

    const sessions = [...state.sessions];

    if (state.currentSession) {
      const end = state.currentSession.lastInputAt || getRelativeTime(startTimeRef);

      sessions.push({
        ...state.currentSession,
        end,
        durationMs: Math.max(0, end - state.currentSession.start),
      });
    }

    const activeTypingMs = sessions.reduce(
      (sum, session) => sum + (session.durationMs || 0),
      0
    );

    const activeMinutes = activeTypingMs / 60000;

    const typingSpeedCpm =
      activeMinutes > 0 ? Math.round(state.charsAdded / activeMinutes) : 0;

    const typingSpeedWpm =
      activeMinutes > 0 ? Math.round(state.charsAdded / 5 / activeMinutes) : 0;

    const keystrokesPerMinute =
      activeMinutes > 0 ? Math.round(state.totalKeystrokes / activeMinutes) : 0;

    return {
      mouse_moves: mouseMovesRef.current,
      other_events: otherEventsRef.current,

      typing_sessions: sessions,

      typing_metrics: {
        activeTypingMs,
        activeTypingSeconds: Math.round(activeTypingMs / 1000),

        totalKeystrokes: state.totalKeystrokes,
        keystrokesPerMinute,

        charsAdded: state.charsAdded,
        charsRemoved: state.charsRemoved,

        typingSpeedCpm,
        typingSpeedWpm,

        backspaces: state.backspaces,
        deletes: state.deletes,
        enters: state.enters,
        tabs: state.tabs,
        spaces: state.spaces,

        pasteCount: state.pasteCount,
        copyCount: state.copyCount,
        cutCount: state.cutCount,

        pauseCount: state.pauseCount,
        averagePauseMs:
          state.pauseCount > 0
            ? Math.round(state.totalPauseMs / state.pauseCount)
            : 0,
        maxPauseMs: state.maxPauseMs,

        focusCount: state.focusCount,
        blurCount: state.blurCount,
        scrollEvents: state.scrollEvents,
      },
    };
  }, []);

  const clearMetrics = useCallback(() => {
    mouseMovesRef.current = [];
    otherEventsRef.current = [];

    typingStateRef.current = {
      currentSession: null,
      sessions: [],

      totalKeystrokes: 0,
      charsAdded: 0,
      charsRemoved: 0,

      backspaces: 0,
      deletes: 0,
      enters: 0,
      tabs: 0,
      spaces: 0,

      pasteCount: 0,
      copyCount: 0,
      cutCount: 0,

      pauseCount: 0,
      totalPauseMs: 0,
      maxPauseMs: 0,

      focusCount: 0,
      blurCount: 0,
      scrollEvents: 0,
    };

    startTimeRef.current = Date.now();

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const now = Date.now();

      if (now - mouseThrottleRef.current > 500) {
        logAction('mouse', 'move', {
          x: e.clientX,
          y: e.clientY,
        });

        mouseThrottleRef.current = now;
      }
    };

    const handleClick = (e) => {
      logAction('other', 'click', {
        x: e.clientX,
        y: e.clientY,
        button: e.button,
        target: e.target?.tagName || 'unknown',
      });
    };

    const handleResize = () => {
      logAction('other', 'resize', {
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    const handleVisibility = () => {
      logAction('other', 'tab_visibility', {
        visible: !document.hidden,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);

      if (editorCleanupRef.current) {
        editorCleanupRef.current();
      }

      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
    };
  }, [logAction]);

  return {
    getMetrics,
    clearMetrics,
    setEditorInstance,
    logAction,
  };
};
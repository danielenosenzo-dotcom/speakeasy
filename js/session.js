const ZoeSession = (() => {
  const DURATION_SEC = 8 * 60;
  let remaining = DURATION_SEC;
  let timerId = null;
  let tickCb = null;
  let endCb = null;

  function start() {
    remaining = DURATION_SEC;
    clear();
    timerId = setInterval(() => {
      remaining -= 1;
      if (tickCb) tickCb(remaining, DURATION_SEC);
      if (remaining <= 0) {
        stop();
        if (endCb) endCb('timeout');
      }
    }, 1000);
    if (tickCb) tickCb(remaining, DURATION_SEC);
  }

  function stop() {
    clear();
  }

  function endNow(reason = 'manual') {
    clear();
    if (endCb) endCb(reason);
  }

  function clear() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function onTick(cb) {
    tickCb = cb;
  }

  function onEnd(cb) {
    endCb = cb;
  }

  function formatTime(sec) {
    const m = Math.max(0, Math.floor(sec / 60));
    const s = Math.max(0, sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return { start, stop, endNow, onTick, onEnd, formatTime };
})();

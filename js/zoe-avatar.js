const ZoeAvatar = (() => {
  const STATES = ['idle', 'speaking', 'listening', 'thinking'];
  let currentState = 'idle';
  let blinkTimer = null;
  let mouthTimer = null;
  let rootEl = null;

  function svgMarkup(mode) {
    if (mode === 'geometric') return geometricSvg();
    return realisticSvg();
  }

  function realisticSvg() {
    return `
      <svg class="zoe-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="zoe-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-purple)" />
            <stop offset="50%" stop-color="var(--accent-pink)" />
            <stop offset="100%" stop-color="var(--accent-blue)" />
          </linearGradient>
        </defs>

        <circle class="zoe-ring zoe-ring-outer" cx="120" cy="120" r="112" fill="none" stroke="url(#zoe-ring-gradient)" stroke-width="3" opacity="0.5" />
        <circle class="zoe-ring zoe-ring-inner" cx="120" cy="120" r="100" fill="none" stroke="url(#zoe-ring-gradient)" stroke-width="2" opacity="0.35" />

        <circle cx="120" cy="120" r="88" fill="var(--surface-2)" stroke="url(#zoe-ring-gradient)" stroke-width="3" />

        <path d="M 60 100 Q 60 45 120 42 Q 180 45 180 100 L 178 120 Q 175 140 120 145 Q 65 140 62 120 Z" fill="#5c3a28" />
        <path d="M 55 95 Q 50 130 58 160 L 68 158 Q 62 125 65 95 Z" fill="#5c3a28" />
        <path d="M 185 95 Q 190 130 182 160 L 172 158 Q 178 125 175 95 Z" fill="#5c3a28" />

        <ellipse cx="120" cy="130" rx="52" ry="58" fill="#f6c9a0" />

        <circle class="zoe-freckle" cx="95" cy="140" r="1.6" fill="#c98a5e" opacity="0.6" />
        <circle class="zoe-freckle" cx="102" cy="145" r="1.4" fill="#c98a5e" opacity="0.6" />
        <circle class="zoe-freckle" cx="140" cy="145" r="1.4" fill="#c98a5e" opacity="0.6" />
        <circle class="zoe-freckle" cx="147" cy="140" r="1.6" fill="#c98a5e" opacity="0.6" />

        <g class="zoe-eye zoe-eye-left">
          <ellipse cx="103" cy="122" rx="8" ry="9" fill="#fff" />
          <circle cx="103" cy="123" r="4.5" fill="#5b3a29" />
          <circle cx="104.5" cy="121" r="1.3" fill="#fff" />
          <path class="zoe-eyeliner" d="M 94 116 Q 103 111 111 116" fill="none" stroke="#2a1a12" stroke-width="1.4" stroke-linecap="round" />
        </g>
        <g class="zoe-eye zoe-eye-right">
          <ellipse cx="137" cy="122" rx="8" ry="9" fill="#fff" />
          <circle cx="137" cy="123" r="4.5" fill="#5b3a29" />
          <circle cx="138.5" cy="121" r="1.3" fill="#fff" />
          <path class="zoe-eyeliner" d="M 129 116 Q 137 111 146 116" fill="none" stroke="#2a1a12" stroke-width="1.4" stroke-linecap="round" />
        </g>

        <path class="zoe-eyelid zoe-eyelid-left" d="M 94 116 Q 103 111 111 116 L 111 116 Q 103 118 94 116 Z" fill="#f6c9a0" opacity="0" />
        <path class="zoe-eyelid zoe-eyelid-right" d="M 129 116 Q 137 111 146 116 L 146 116 Q 137 118 129 116 Z" fill="#f6c9a0" opacity="0" />

        <path d="M 116 130 Q 120 138 124 130" fill="none" stroke="#d99b78" stroke-width="1.5" stroke-linecap="round" />

        <g class="zoe-mouth-group">
          <path class="zoe-mouth" d="M 100 154 Q 120 162 140 154" fill="none" stroke="#a85c4a" stroke-width="3.5" stroke-linecap="round" />
        </g>

        <circle cx="60" cy="150" r="7" fill="var(--accent-purple)" opacity="0.85" />
        <circle cx="60" cy="150" r="3" fill="var(--accent-pink)" />
        <circle cx="180" cy="150" r="7" fill="var(--accent-purple)" opacity="0.85" />
        <circle cx="180" cy="150" r="3" fill="var(--accent-pink)" />

        <path d="M 62 96 Q 40 60 70 38 Q 100 20 120 38" fill="none" stroke="#5c3a28" stroke-width="10" stroke-linecap="round" opacity="0.9" />
      </svg>
    `;
  }

  function geometricSvg() {
    return `
      <svg class="zoe-svg zoe-svg-geometric" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="zoe-ring-gradient-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-purple)" />
            <stop offset="50%" stop-color="var(--accent-pink)" />
            <stop offset="100%" stop-color="var(--accent-blue)" />
          </linearGradient>
        </defs>
        <circle class="zoe-ring zoe-ring-outer" cx="120" cy="120" r="112" fill="none" stroke="url(#zoe-ring-gradient-g)" stroke-width="3" opacity="0.5" />
        <circle cx="120" cy="120" r="88" fill="var(--surface-2)" stroke="url(#zoe-ring-gradient-g)" stroke-width="3" />
        <circle cx="103" cy="122" r="6" fill="var(--accent-blue)" class="zoe-eye zoe-eye-left" />
        <circle cx="137" cy="122" r="6" fill="var(--accent-blue)" class="zoe-eye zoe-eye-right" />
        <rect class="zoe-eyelid zoe-eyelid-left" x="97" y="116" width="12" height="12" fill="var(--surface-2)" opacity="0" />
        <rect class="zoe-eyelid zoe-eyelid-right" x="131" y="116" width="12" height="12" fill="var(--surface-2)" opacity="0" />
        <g class="zoe-mouth-group">
          <path class="zoe-mouth" d="M 100 154 Q 120 162 140 154" fill="none" stroke="var(--accent-pink)" stroke-width="4" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  function mount(selector, options = {}) {
    rootEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!rootEl) throw new Error('ZoeAvatar.mount: elemento non trovato');
    rootEl.classList.add('zoe-avatar');
    rootEl.innerHTML = svgMarkup(options.mode || 'realistic');
    setState('idle');
    startBlinking();
    return rootEl;
  }

  function setState(state) {
    if (!STATES.includes(state)) return;
    currentState = state;
    if (!rootEl) return;
    STATES.forEach((s) => rootEl.classList.remove(`zoe-state-${s}`));
    rootEl.classList.add(`zoe-state-${state}`);

    if (state === 'speaking') {
      startMouthAnimation();
    } else {
      stopMouthAnimation();
    }
  }

  function getState() {
    return currentState;
  }

  function startBlinking() {
    stopBlinking();
    const blink = () => {
      const lids = rootEl.querySelectorAll('.zoe-eyelid');
      lids.forEach((lid) => {
        lid.style.transition = 'opacity 90ms ease';
        lid.style.opacity = '1';
      });
      setTimeout(() => {
        lids.forEach((lid) => {
          lid.style.opacity = '0';
        });
      }, 120);
      const next = 2500 + Math.random() * 3000;
      blinkTimer = setTimeout(blink, next);
    };
    blinkTimer = setTimeout(blink, 2000 + Math.random() * 2000);
  }

  function stopBlinking() {
    if (blinkTimer) clearTimeout(blinkTimer);
    blinkTimer = null;
  }

  function startMouthAnimation() {
    stopMouthAnimation();
    const mouth = rootEl.querySelector('.zoe-mouth');
    if (!mouth) return;
    const shapes = [
      'M 100 154 Q 120 162 140 154',
      'M 100 152 Q 120 172 140 152',
      'M 102 155 Q 120 158 138 155',
      'M 100 153 Q 120 168 140 153',
    ];
    let i = 0;
    mouthTimer = setInterval(() => {
      mouth.setAttribute('d', shapes[i % shapes.length]);
      i++;
    }, 140);
  }

  function stopMouthAnimation() {
    if (mouthTimer) clearInterval(mouthTimer);
    mouthTimer = null;
    if (rootEl) {
      const mouth = rootEl.querySelector('.zoe-mouth');
      if (mouth) mouth.setAttribute('d', 'M 100 154 Q 120 162 140 154');
    }
  }

  function destroy() {
    stopBlinking();
    stopMouthAnimation();
    if (rootEl) rootEl.innerHTML = '';
    rootEl = null;
  }

  return { mount, setState, getState, destroy };
})();

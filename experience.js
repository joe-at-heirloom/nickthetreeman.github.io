/* Presentation, accessible controls, local career records, and procedural sound. */
(() => {
  'use strict';
  const JOBS = [
    { name: 'First light in Cedar Hollow', short: 'Cedar Hollow', tag: 'A quiet morning. A good place to start.', difficulty: 'THE FIRST SHIFT', par: 70, contract: 0, district: 0, trees: 2, seed: 129 },
    { name: 'A change in the weather', short: 'Harbor Crossing', tag: 'Read the wind. Trust your notch.', difficulty: 'CROSSWINDS', par: 110, contract: 1, district: 1, trees: 3, seed: 845 },
    { name: 'The golden-hour job', short: 'Orchard Lane', tag: 'Heavy limbs, long shadows, good company.', difficulty: 'HEAVY BRANCHES', par: 125, contract: 2, district: 0, trees: 3, seed: 306 },
    { name: 'A very close shave', short: 'Museum Row', tag: 'Beautiful houses. Very little room for error.', difficulty: 'PRECISION WORK', par: 140, contract: 0, district: 2, trees: 4, seed: 917 },
    { name: 'The old king of the hill', short: 'The Heritage Grove', tag: 'One big tree. Your finest work.', difficulty: 'THE HERITAGE GIANT', par: 150, contract: 2, district: 0, trees: 3, seed: 567 },
  ];
  window.TREE_JOBS = JOBS;
  window.createTreeExperience = function(api) {
    const ui = document.getElementById('game-ui');
    const dock = document.getElementById('action-dock');
    const toast = document.getElementById('game-toast');
    const recordKey = 'nick-tree-man-career-v2';
    let record = { unlocked: 1, medals: {}, best: {}, sound: true };
    try {
      const saved = JSON.parse(localStorage.getItem(recordKey));
      if (saved && typeof saved === 'object') {
        record.unlocked = Math.min(5, Math.max(1, Math.floor(Number(saved.unlocked)) || 1));
        for (let i = 1; i <= 5; i++) {
          record.medals[i] = Math.min(3, Math.max(0, Number(saved.medals?.[i]) || 0));
          record.best[i] = Math.max(0, Number(saved.best?.[i]) || 0);
        }
        record.sound = saved.sound !== false;
      }
    } catch (_) { /* Storage may be unavailable in private browsing. */ }
    let context, master, viewKey = '', lastToast = '', lastSound = 0;
    const save = () => { try { localStorage.setItem(recordKey, JSON.stringify(record)); } catch (_) {} };
    function unlockAudio() {
      if (!record.sound) return;
      try {
        context ||= new (window.AudioContext || window.webkitAudioContext)();
        if (!master) { master = context.createGain(); master.gain.value = 0.23; master.connect(context.destination); }
        if (context.state === 'suspended') context.resume().catch(() => {});
      } catch (_) { /* Sound is optional; the game works without Web Audio. */ }
    }
    function tone(frequency, duration = .15, type = 'sine', volume = .15, delay = 0, end = frequency) {
      if (!context || !master || !record.sound || context.state !== 'running') return;
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), start + duration);
      gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(volume, start + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain); gain.connect(master); oscillator.start(start); oscillator.stop(start + duration + .02);
    }
    function noise(duration, lowpass, volume) {
      if (!context || !record.sound || context.state !== 'running') return;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const src = context.createBufferSource(); src.buffer = buffer;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = lowpass;
      const gain = context.createGain(); gain.gain.value = volume;
      src.connect(filter); filter.connect(gain); gain.connect(master); src.start();
    }
    function sound(kind) {
      if (!record.sound || !context) return;
      const now = context.currentTime;
      if (kind === 'cut' && now - lastSound < .08) return;
      if (kind === 'cut') { lastSound = now; noise(.13, 2400, .65); tone(130, .13, 'sawtooth', .12, 0, 70); }
      if (kind === 'chop') { noise(.12, 1400, .7); tone(165, .13, 'triangle', .5, 0, 48); }
      if (kind === 'sever') { noise(.2, 2800, .75); tone(620, .13, 'triangle', .17, 0, 950); }
      if (kind === 'fall') { tone(140, .65, 'sawtooth', .1, 0, 45); noise(.45, 850, .3); }
      if (kind === 'land') { noise(.5, 550, 1); tone(85, .5, 'sine', .9, 0, 25); }
      if (kind === 'jump') tone(180, .18, 'triangle', .2, 0, 450);
      if (kind === 'click') tone(480, .08, 'sine', .12);
      if (kind === 'complete') [392, 494, 587, 784].forEach((f, i) => tone(f, .35, 'triangle', .22, i * .12));
      if (kind === 'fail') [220, 185, 147].forEach((f, i) => tone(f, .3, 'triangle', .2, i * .14));
      if (kind === 'fiddle') tone([392, 494, 587, 659, 587, 494][Math.floor(api.state.visualTime * 3) % 6], .2, 'triangle', .11);
    }
    const introDock = () => `<div class="dock-intro"><div class="dock-feature"><span class="feature-num">01</span><span><strong>Read the tree</strong>Every branch changes the balance.</span></div><div class="dock-feature"><span class="feature-num">02</span><span><strong>Make your cut</strong>A little strategy goes a long way.</span></div><div class="dock-feature"><span class="feature-num">03</span><span><strong>Bring it home</strong>Save the neighborhood. Stick the landing.</span></div><span class="dock-tail">Honest work. Excellent hat.</span></div>`;
    function playDock() {
      return `<div class="control-group"><span class="group-label">TOOL</span><button class="tool-button" data-action="saw">Saw <kbd>X</kbd></button><button class="tool-button" data-action="axe">Axe</button></div><div class="dock-divider"></div><div class="control-group"><button class="small-button" data-action="low" title="Lower branches (1 or Down)">Lower <kbd>1</kbd></button><button class="small-button" data-action="high" title="Upper branches (2 or Up)">Upper <kbd>2</kbd></button></div><div class="control-group"><button class="cut-button" data-action="left">Cut left <kbd>A</kbd></button><button class="cut-button" data-action="right">Cut right <kbd>D</kbd></button></div><div class="dock-divider"></div><div class="control-group"><span class="group-label">WEDGE</span><button class="small-button" data-action="wedge-left" title="Wedge left (Q)">← <kbd>Q</kbd></button><button class="small-button" data-action="wedge-none" title="Clear wedge (W)">· <kbd>W</kbd></button><button class="small-button" data-action="wedge-right" title="Wedge right (E)">→ <kbd>E</kbd></button></div><div class="control-group"><button class="small-button" data-action="next" title="Next tree (Tab)">Next tree ↗</button><button class="small-button" data-action="fiddle" title="Play fiddle and rescue cats (V)">♫</button><button class="small-button" data-action="jump" title="Jump (Space)">↟</button></div>`;
    }
    function menuHTML() {
      const next = Math.min(record.unlocked, 5);
      return `<div class="hero"><div class="eyebrow">A woodland physics adventure</div><h1>A little sawdust.<br>A lot of <em>heart.</em></h1><p class="hero-description">Meet Nick. Tree man. Fiddle enthusiast.<br>Help him take on the town's trickiest trees —<br>and leave the neighborhood standing.</p><div class="hero-actions"><button id="start-btn" class="primary-button" data-action="start">${next > 1 ? 'Back to work' : "Let's get to work"}<span>↗</span></button><button class="text-button" data-action="help">How to play <span class="nav-arrow">→</span></button></div><div class="hero-foot"><span>5 good jobs</span><span>Real tree physics</span><span>One very fine beard</span></div></div><div class="hero-stamp"><span>LOCALLY GROWN</span><strong>100% Nick</strong><span>NO SHORTCUTS</span></div><div class="hero-location">CEDAR HOLLOW &nbsp; / &nbsp; 6:42 AM</div>`;
    }
    function hudHTML() {
      const job = JOBS[api.state.level - 1];
      return `<div class="hud-top"><div class="job-label"><div class="eyebrow">JOB 0${api.state.level} / 05 &nbsp; · &nbsp; ${job.difficulty}</div><h2>${job.short}</h2><p>${job.tag}</p></div><div class="hud-stats"><div class="hud-stat"><small>TREES</small><strong id="hud-trees"></strong></div><div class="hud-stat"><small>SCORE</small><strong id="hud-score"></strong></div><div class="hud-stat"><small>TIME</small><strong id="hud-time"></strong></div><button class="hud-pause" data-action="pause" aria-label="Pause game (P)">Ⅱ</button></div></div><div class="hud-task"><b id="coach-title"></b><span id="coach-copy"></span></div><div class="hud-bottom"><div class="target-card"><div><small id="target-number"></small><b id="target-name"></b></div><span class="target-divider"></span><div><small id="target-safe"></small><div class="balance-track"><span class="balance-needle" id="balance-needle"></span></div></div></div><div class="wind-chip" id="wind-status"></div></div>`;
    }
    function modalHTML(title, eyebrow, content, actions, closable = true) {
      return `<div class="modal-scrim"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${closable ? '<button class="modal-close" data-action="close" aria-label="Close dialog">×</button>' : ''}<div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2>${content}<div class="modal-actions">${actions}</div></section></div>`;
    }
    function overlayHTML() {
      const s = api.state;
      if (s.overlay === 'help') return modalHTML('A good day’s work.', 'THE FIELD GUIDE', `<p>Fell every tree. Keep homes, cars, and neighbors out of its path.</p><div class="guide-grid"><div class="guide-card"><b>01 &nbsp; Shift the balance</b><p>Cut branches on the <strong>opposite side</strong> of your intended fall. Heavy limbs may take a few hits. Click a branch, swipe, or use A / D.</p></div><div class="guide-card"><b>02 &nbsp; Guide the landing</b><p>The striped green area shows safe ground. Set a wedge with Q / E. Use the balance needle to see which way the tree wants to tip.</p></div><div class="guide-card"><b>03 &nbsp; Finish with the axe</b><p>Switch with X. Chop the side you want it to fall toward until the notch is ready. Then chop the opposite side to release the trunk.</p></div><div class="guide-card"><b>04 &nbsp; Leave it better</b><p>Play your fiddle (V) to coax cats to safety for +200. Occupied limbs are protected. Earn stars for a clean job, finishing under par, and trimming at least twice.</p></div></div><div class="guide-keys">A / D cut · 1 / 2 branch height · Tab next tree · Space jump<br>V fiddle · P / Esc pause · M sound · F fullscreen</div>`, '<button class="primary-button" data-action="close">Got it. Let’s do this. ↗</button>');
      if (s.overlay === 'board') return modalHTML('There’s work to do.', 'THE NEIGHBORHOOD JOB BOARD', `<p>Five jobs. A town that’s counting on you. Records stay on this device.</p><div class="job-list">${JOBS.map((job, i) => `<button class="job-option" data-action="job-${i + 1}" ${i + 1 > record.unlocked ? 'disabled' : ''}><span class="job-number">0${i + 1}</span><span><strong>${job.short}</strong><small>${job.difficulty} · ${job.par}s PAR</small></span><span class="job-medal">${i + 1 > record.unlocked ? '⌑' : record.medals[i + 1] ? '★'.repeat(record.medals[i + 1]) + '☆'.repeat(3 - record.medals[i + 1]) : '→'}</span></button>`).join('')}</div>`, '<button class="secondary-button" data-action="close">Back</button>');
      if (s.paused) return modalHTML('Take a breather.', 'THE TREES CAN WAIT', '<p>Your job is right where you left it.<br>Stretch your legs. Nick will tune his fiddle.</p>', '<button class="primary-button" data-action="resume">Back to work ↗</button><button class="secondary-button" data-action="retry">Retry job</button><button class="text-button" data-action="help">Field guide</button><button class="text-button" data-action="home">Go home</button>');
      if (s.mode === 'gameover') return modalHTML('Let’s give that another go.', 'EVEN NICK HAS HIS DAYS', `<p>${s.failReason === 'oldlady' ? 'A neighbor was in the fall path.' : 'That tree found something it shouldn’t have.'}<br>Watch the green landing zone. Cut the opposite branches,<br>or make an axe notch on the side you want to land.</p><div class="bonus-line">Retry this job with the same layout. Your career records are safe.</div>`, '<button class="primary-button" data-action="retry">Try this job again ↗</button><button class="secondary-button" data-action="board">Job board</button>', false);
      if (s.mode === 'levelComplete' || s.mode === 'victory') {
        const report = s.levelReport; const stars = report.stars || 1;
        return modalHTML(s.mode === 'victory' ? 'The town’s in good hands.' : 'That’s a job well done.', s.mode === 'victory' ? 'NICK, THE NEIGHBORHOOD LEGEND' : `JOB 0${s.level} COMPLETE`, `<div class="medals" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}<span class="empty">${'★'.repeat(3 - stars)}</span></div><p>${s.mode === 'victory' ? 'Five jobs finished. The old giant, gracefully retired.<br>Take a bow, Nick. You’ve earned a little fiddle time.' : 'Trees down. Neighbors happy. Hat still on.'}</p><div class="result-stats"><div><strong>${report.jobScore.toLocaleString()}</strong><small>JOB SCORE</small></div><div><strong>${formatTime(report.seconds)}</strong><small>YOUR TIME</small></div><div><strong>${report.saved}</strong><small>KEPT SAFE</small></div></div><div class="bonus-line">${report.seconds <= JOBS[s.level - 1].par ? '✓' : '○'} Under ${JOBS[s.level - 1].par}s par &nbsp; · &nbsp; ${report.cuts >= 2 ? '✓' : '○'} Two or more branches trimmed &nbsp; · &nbsp; ✓ Clean landing<br>Best on this job: ${record.best[s.level]?.toLocaleString() || report.jobScore.toLocaleString()} points</div>`, `<button class="primary-button" data-action="${s.mode === 'victory' ? 'board' : 'continue'}">${s.mode === 'victory' ? 'Your job board' : 'Next job'} ↗</button><button class="secondary-button" data-action="retry">Chase three stars</button>`, false);
      }
      return '';
    }
    function formatTime(seconds) { const whole = Math.floor(seconds || 0); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`; }
    function setText(id, value) { const el = document.getElementById(id); if (el && el.textContent !== String(value)) el.textContent = value; }
    function coach() {
      const s = api.state, t = api.selected();
      if (!t || t.fallen) return ['Lovely landing.', 'One less tree. One happier neighborhood.'];
      if (t.falling) return ['Timber! Give it some room.', 'Nick is heading for safety. Watch that landing.'];
      const dir = t.safeDirectionHint || (t.imbalance >= 0 ? 1 : -1); const side = dir < 0 ? 'left' : 'right'; const other = dir < 0 ? 'right' : 'left';
      if (s.controlMode === 'axe') {
        const axe = t.axe;
        if (axe.stage === 'backcut') return [`Now back-cut ${axe.targetSide < 0 ? 'right' : 'left'}.`, `${axe.backHits} / ${axe.backNeed} cuts. The hinge will guide the tree toward your notch.`];
        if (axe.targetSide) return [`Keep notching ${axe.targetSide < 0 ? 'left' : 'right'}.`, `${axe.notchHits} / ${axe.notchNeed} cuts. Then switch to the opposite side.`];
        return [`Make your notch on the ${side}.`, `Use ${dir < 0 ? 'A / Cut left' : 'D / Cut right'} to start. Complete the notch, then back-cut the other side.`];
      }
      if (s.level === 1 && t.cutCount === 0) return [`Let’s trim the ${other} side.`, `The safe landing is ${side}. Tap ${dir < 0 ? 'D / Cut right' : 'A / Cut left'} a few times to lighten the opposite side.`];
      if (s.level === 1 && t.cutCount > 0) return ['Nice cut. Keep the balance moving.', `Trim another ${other} limb, or switch to the axe for a controlled ${side} fall.`];
      return [`Aim for a clean ${side} landing.`, `Trim ${other} to shift the weight. For a precise fall, notch ${side} with your axe.`];
    }
    function render() {
      const s = api.state;
      const nextKey = [s.mode, s.overlay, s.paused, s.level, record.unlocked].join(':');
      if (viewKey !== nextKey) {
        const previousFocus = document.activeElement;
        viewKey = nextKey;
        ui.innerHTML = (s.mode === 'menu' ? menuHTML() : hudHTML()) + overlayHTML();
        dock.innerHTML = s.mode === 'menu' ? introDock() : playDock();
        const dialog = ui.querySelector('[role="dialog"]');
        if (dialog) dialog.querySelector('.primary-button, .job-option:not(:disabled), button')?.focus({ preventScroll: true });
        else if (previousFocus?.closest('.modal')) document.getElementById('game').focus({ preventScroll: true });
      }
      document.getElementById('sound-button').textContent = record.sound ? '♪' : '♩';
      document.getElementById('sound-button').setAttribute('aria-label', record.sound ? 'Mute sound' : 'Enable sound');
      document.getElementById('sound-button').setAttribute('aria-pressed', String(record.sound));
      setText('scene-status', s.mode === 'menu' ? 'EST. EARLY THIS MORNING' : `JOB 0${s.level} · ${s.paused || s.overlay ? 'ON A LITTLE BREAK' : 'A GOOD DAY FOR HONEST WORK'}`);
      if (s.mode !== 'menu') {
        setText('hud-trees', `${s.trees.filter(t => t.fallen).length}/${s.trees.length}`);
        setText('hud-score', Math.floor(s.score).toLocaleString()); setText('hud-time', formatTime(s.jobTime));
        const [title, copy] = coach(); setText('coach-title', title); setText('coach-copy', copy);
        const t = api.selected();
        if (t) {
          setText('target-number', `TREE 0${s.trees.indexOf(t) + 1} · ${t.isBoss ? 'HERITAGE' : 'SELECTED'}`);
          setText('target-name', t.isBoss ? 'The old giant' : t.species.name);
          setText('target-safe', t.safeDirectionHint < 0 ? '← LAND LEFT' : t.safeDirectionHint > 0 ? 'LAND RIGHT →' : 'EITHER SIDE IS CLEAR');
          const needle = document.getElementById('balance-needle');
          if (needle) needle.style.left = `${50 + Math.max(-1, Math.min(1, t.imbalance)) * 45}%`;
        }
        setText('wind-status', s.gust.active ? `≋ GUST ${s.wind < 0 ? '←' : '→'} · ${Math.abs(Math.round(s.wind * 45))} MPH` : `≋ ${Math.abs(Math.round(s.wind * 45))} MPH ${s.wind < 0 ? '←' : '→'}  ·  ${s.flowStreak > 1 ? 'FLOW ×' + s.flowStreak : 'STEADY DOES IT'}`);
        for (const action of ['saw','axe','low','high','wedge-left','wedge-none','wedge-right','fiddle']) {
          const el = dock.querySelector(`[data-action="${action}"]`); if (!el) continue;
          const active = action === s.controlMode || action === s.activeTier || (action === 'fiddle' && s.showtime.active) || (action === 'wedge-left' && t?.wedge === -1) || (action === 'wedge-right' && t?.wedge === 1) || (action === 'wedge-none' && t?.wedge === 0);
          el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active));
        }
        for (const button of dock.querySelectorAll('button')) button.disabled = s.mode !== 'playing' || s.paused || !!s.overlay;
      }
      const callout = s.callouts[s.callouts.length - 1];
      const message = s.mode === 'playing' && !s.overlay && !s.paused && callout ? callout.text : '';
      if (lastToast !== message) { toast.textContent = message; toast.classList.toggle('visible', !!message); lastToast = message; }
    }
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('keydown', unlockAudio, { passive: true });
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
      unlockAudio(); sound('click'); const action = button.dataset.action;
      if (action === 'sound') { record.sound = !record.sound; if (!record.sound && master) master.gain.value = 0; else { unlockAudio(); if (master) master.gain.value = .23; } save(); render(); return; }
      api.action(action); render();
    });
    document.getElementById('home-link').addEventListener('click', e => { e.preventDefault(); api.action('home'); render(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !ui.querySelector('[role="dialog"]')) return;
      const items = [...ui.querySelectorAll('[role="dialog"] button:not(:disabled)')];
      if (!items.length) return;
      const index = items.indexOf(document.activeElement);
      if ((e.shiftKey && index <= 0) || (!e.shiftKey && index === items.length - 1)) { e.preventDefault(); items[e.shiftKey ? items.length - 1 : 0].focus(); }
    });
    return { render, sound, unlockAudio, record, save,
      complete(level, stars, score) { record.unlocked = Math.min(5, Math.max(record.unlocked, level + 1)); record.medals[level] = Math.max(record.medals[level] || 0, stars); record.best[level] = Math.max(record.best[level] || 0, score); save(); viewKey = ''; },
      invalidate() { viewKey = ''; },
    };
  };
})();

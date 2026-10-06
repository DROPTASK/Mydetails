// Sonic HTML5 Engine - Enhanced for Mobile & Desktop
// Original game by Avalojandro. Enhanced with responsive mobile controls, reset, and modal UI.

(function () {
  // DOM Elements
  const background = document.querySelector('.background');
  const sonic = document.querySelector('.sonic');

  // Rings (1-50)
  const ringsList = [];
  for (let i = 1; i <= 50; i++) {
    const selector = i === 1 ? '.ring' : `.ring${i}`;
    ringsList.push(document.querySelector(selector));
  }

  // Spikes & Bosses
  const eggman = document.querySelector('.eggman');
  const spikes = document.querySelector('.spikes');
  const spikes2 = document.querySelector('.spikes2');
  const spikes3 = document.querySelector('.spikes3');
  const spikes4 = document.querySelector('.spikes4');
  const spikes5 = document.querySelector('.spikes5');

  const puntaje = document.querySelector('.score');
  const keepRuning = document.querySelector('.keep');
  const eggman2 = document.querySelector('.eggman2');

  const win = document.querySelector('.win');
  const morir = document.querySelector('.die');
  const puntajeText = document.getElementById('puntaje');

  // Modal Elements
  const gameOverModal = document.getElementById('game-over-modal');
  const gameWinModal = document.getElementById('game-win-modal');

  // Audio Objects with fixed pool to eliminate cloneNode memory leaks
  const song = new Audio('./audio/greenHill.mp3');
  song.loop = true;

  const ringPool = [
    new Audio('./audio/ringSound.mp3'),
    new Audio('./audio/ringSound.mp3'),
    new Audio('./audio/ringSound.mp3'),
  ];
  let ringIdx = 0;

  const jumpPool = [
    new Audio('./audio/jump.mp3'),
    new Audio('./audio/jump.mp3'),
  ];
  let jumpIdx = 0;

  let isMuted = false;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    if (!isMuted && song) {
      song.play().catch(() => {});
    }
  }

  function playJumpSound() {
    if (isMuted) return;
    try {
      const s = jumpPool[jumpIdx];
      jumpIdx = (jumpIdx + 1) % jumpPool.length;
      s.currentTime = 0;
      s.volume = 0.8;
      s.play().catch(() => {});
    } catch (e) {}
  }

  function playRingSound() {
    if (isMuted) return;
    try {
      const s = ringPool[ringIdx];
      ringIdx = (ringIdx + 1) % ringPool.length;
      s.currentTime = 0;
      s.volume = 0.8;
      s.play().catch(() => {});
    } catch (e) {}
  }

  // Game State
  const moveBy = 18;
  let x = 0; // Horizontal scroll coordinate
  let y = 0; // Vertical coordinate (0 = ground, 1 = jumping)
  let score = 0;
  let die = 0;
  let hasWon = false;

  // Initial exact positions map
  const INITIAL_POSITIONS = [
    { el: sonic, left: 120, top: 95 },
    { el: eggman, left: 925, top: -2130 },
    { el: ringsList[0], left: 730, top: 40 },
    { el: ringsList[1], left: 780, top: 0 },
    { el: ringsList[2], left: 830, top: -40 },
    { el: ringsList[3], left: 880, top: -80 },
    { el: ringsList[4], left: 1330, top: -120 },
    { el: ringsList[5], left: 1380, top: -160 },
    { el: ringsList[6], left: 1430, top: -200 },
    { el: ringsList[7], left: 1480, top: -240 },
    { el: ringsList[8], left: 1530, top: -280 },
    { el: ringsList[9], left: 1580, top: -320 },
    { el: ringsList[10], left: 807, top: -450 },
    { el: ringsList[11], left: 1960, top: -490 },
    { el: ringsList[12], left: 2020, top: -530 },
    { el: ringsList[13], left: 2080, top: -570 },
    { el: ringsList[14], left: 2530, top: -525 },
    { el: ringsList[15], left: 2580, top: -565 },
    { el: ringsList[16], left: 2630, top: -605 },
    { el: ringsList[17], left: 2680, top: -645 },
    { el: ringsList[18], left: 2730, top: -685 },
    { el: ringsList[19], left: 3130, top: -810 },
    { el: ringsList[20], left: 3180, top: -850 },
    { el: spikes, left: 3250, top: -925 },
    { el: ringsList[21], left: 3350, top: -980 },
    { el: ringsList[22], left: 3400, top: -1020 },
    { el: ringsList[23], left: 3125, top: -980 },
    { el: ringsList[24], left: 3175, top: -1020 },
    { el: ringsList[25], left: 3225, top: -1060 },
    { el: ringsList[26], left: 3275, top: -1100 },
    { el: ringsList[27], left: 3325, top: -1140 },
    { el: ringsList[28], left: 3850, top: -1180 },
    { el: ringsList[29], left: 3900, top: -1220 },
    { el: ringsList[30], left: 3950, top: -1260 },
    { el: ringsList[31], left: 4000, top: -1300 },
    { el: ringsList[32], left: 4050, top: -1340 },
    { el: ringsList[33], left: 4100, top: -1380 },
    { el: ringsList[34], left: 4150, top: -1420 },
    { el: ringsList[35], left: 4200, top: -1460 },
    { el: ringsList[36], left: 4250, top: -1500 },
    { el: ringsList[37], left: 4300, top: -1540 },
    { el: ringsList[38], left: 4900, top: -1660 },
    { el: ringsList[39], left: 4970, top: -1700 },
    { el: ringsList[40], left: 5040, top: -1740 },
    { el: ringsList[41], left: 5040, top: -1700 },
    { el: ringsList[42], left: 5090, top: -1740 },
    { el: ringsList[43], left: 5140, top: -1780 },
    { el: ringsList[44], left: 5190, top: -1820 },
    { el: ringsList[45], left: 5240, top: -1860 },
    { el: ringsList[46], left: 5290, top: -1900 },
    { el: ringsList[47], left: 5340, top: -1940 },
    { el: ringsList[48], left: 5630, top: -2050 },
    { el: ringsList[49], left: 5750, top: -2090 },
    { el: spikes2, left: 3850, top: -2315 },
    { el: spikes3, left: 3930, top: -2405 },
    { el: spikes4, left: 4010, top: -2495 },
    { el: spikes5, left: 5110, top: -2585 },
    { el: puntaje, left: 10, top: -2650 },
    { el: keepRuning, left: 10, top: -2650 },
    { el: eggman2, left: 4000, top: -2675 },
    { el: win, left: 220, top: -2745 },
    { el: morir, left: 220, top: -2768 },
  ];

  function applyPositions() {
    INITIAL_POSITIONS.forEach(({ el, left, top }) => {
      if (el) {
        el.style.position = 'relative';
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      }
    });
  }

  function updateHUD() {
    if (puntajeText) puntajeText.textContent = score;
  }

  function getLeft(el, fallback = 0) {
    if (!el || !el.style.left) return fallback;
    const v = parseInt(el.style.left);
    return isNaN(v) ? fallback : v;
  }

  // Reset Game
  function restartGame() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (jumpTimeout) {
      clearTimeout(jumpTimeout);
      jumpTimeout = null;
    }

    x = 0;
    y = 0;
    score = 0;
    die = 0;
    hasWon = false;

    applyPositions();
    updateHUD();

    // Reset classes
    if (sonic) {
      sonic.className = 'sonic';
    }
    if (background) {
      background.classList.remove('background2');
    }
    if (eggman) {
      eggman.className = 'eggman';
    }
    if (eggman2) {
      eggman2.className = 'eggman2';
    }
    if (keepRuning) {
      keepRuning.className = 'keep';
    }
    if (win) {
      win.classList.remove('mostrar');
    }
    if (morir) {
      morir.classList.remove('mostrar');
    }

    // Remove blink from all rings
    ringsList.forEach((r) => {
      if (r) r.classList.remove('blink');
    });

    // Hide modals
    if (gameOverModal) gameOverModal.classList.remove('active');
    if (gameWinModal) gameWinModal.classList.remove('active');

    // Rewind music
    if (song) {
      song.currentTime = 0;
      if (!isMuted && audioUnlocked) {
        song.play().catch(() => {});
      }
    }
  }

  // Ring & Score Helpers
  function rings(value, ringEl) {
    if (x === value && ringEl) {
      if (!ringEl.classList.contains('blink')) {
        ringEl.classList.add('blink');
        playRingSound();
      }
    }
  }

  function ringsY(v1, v2, ringEl) {
    if (y === 1 && x >= v1 && x <= v2 && ringEl) {
      if (!ringEl.classList.contains('blink')) {
        ringEl.classList.add('blink');
        playRingSound();
      }
    }
  }

  function scoreR(value) {
    if (x === value) {
      score++;
      updateHUD();
    }
  }

  function scoreL(value) {
    if (x === value) {
      score = Math.max(0, score - 1);
      updateHUD();
    }
  }

  function scoreY(v1, v2) {
    if (y === 1 && x >= v1 && x <= v2) {
      score++;
      updateHUD();
    }
  }

  function lose(p1, p2) {
    if (y === 1 && x >= p1 && x <= p2) {
      sonic.classList.add('died');
      die++;
      showGameOver();
    }
  }

  function showGameOver() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (jumpTimeout) {
      clearTimeout(jumpTimeout);
      jumpTimeout = null;
    }
    if (morir) morir.classList.add('mostrar');
    if (gameOverModal) gameOverModal.classList.add('active');
  }

  function showVictory() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (jumpTimeout) {
      clearTimeout(jumpTimeout);
      jumpTimeout = null;
    }
    hasWon = true;
    if (win) win.classList.add('mostrar');
    if (eggman2) eggman2.classList.add('eggLoses');
    if (gameWinModal) gameWinModal.classList.add('active');
  }

  function ganar(v, clase) {
    if (x >= v && !hasWon) {
      showVictory();
    }
  }

  function eggManCheck() {
    if (score >= 50 && keepRuning) {
      keepRuning.classList.add('keep2');
    }
  }

  // Movement: RIGHT
  function runRight() {
    ringsList.forEach((r) => {
      if (r) r.style.left = (getLeft(r) - moveBy) + 'px';
    });
    if (spikes) spikes.style.left = (getLeft(spikes, 3250) - moveBy) + 'px';
    if (spikes2) spikes2.style.left = (getLeft(spikes2, 3850) - moveBy) + 'px';
    if (spikes3) spikes3.style.left = (getLeft(spikes3, 3930) - moveBy) + 'px';
    if (spikes4) spikes4.style.left = (getLeft(spikes4, 4010) - moveBy) + 'px';
    if (spikes5) spikes5.style.left = (getLeft(spikes5, 5110) - moveBy) + 'px';

    if (eggman) eggman.style.left = (getLeft(eggman, 925) + moveBy) + 'px';
    x++;
  }

  // Movement: LEFT
  function runLeft() {
    ringsList.forEach((r) => {
      if (r) r.style.left = (getLeft(r) + moveBy) + 'px';
    });
    if (spikes) spikes.style.left = (getLeft(spikes, 3250) + moveBy) + 'px';
    if (spikes2) spikes2.style.left = (getLeft(spikes2, 3850) + moveBy) + 'px';
    if (spikes3) spikes3.style.left = (getLeft(spikes3, 3930) + moveBy) + 'px';
    if (spikes4) spikes4.style.left = (getLeft(spikes4, 4010) + moveBy) + 'px';
    if (spikes5) spikes5.style.left = (getLeft(spikes5, 5110) + moveBy) + 'px';

    if (eggman) eggman.style.left = (getLeft(eggman, 925) + moveBy) + 'px';
    x--;
  }

  // Step Right Execution
  function stepRight() {
    if (die > 0 || hasWon) return;
    unlockAudio();
    runRight();

    sonic.classList.add('moving');
    sonic.classList.remove('sonic2');
    sonic.classList.add('sonic');
    background.classList.add('background2');
    eggman.classList.add('eggRun');
    eggman.classList.remove('eggman');
    y = 0;

    // Score checking
    const rightScores = [
      31, 35, 38, 41, 66, 69, 71, 74, 77, 80,
      132, 135, 138, 141, 144, 165, 168, 171, 174, 177,
      205, 208, 211, 214, 217, 220, 223, 226, 229, 232,
      272, 275, 278, 281, 284, 287, 288,
    ];
    rightScores.forEach((v) => scoreR(v));

    // Rings animation
    rings(31, ringsList[0]);
    rings(35, ringsList[1]);
    rings(38, ringsList[2]);
    rings(41, ringsList[3]);
    rings(66, ringsList[4]);
    rings(69, ringsList[5]);
    rings(71, ringsList[6]);
    rings(74, ringsList[7]);
    rings(77, ringsList[8]);
    rings(80, ringsList[9]);
    rings(132, ringsList[14]);
    rings(135, ringsList[15]);
    rings(138, ringsList[16]);
    rings(141, ringsList[17]);
    rings(144, ringsList[18]);
    rings(165, ringsList[23]);
    rings(168, ringsList[24]);
    rings(171, ringsList[25]);
    rings(174, ringsList[26]);
    rings(177, ringsList[27]);
    rings(205, ringsList[28]);
    rings(208, ringsList[29]);
    rings(211, ringsList[30]);
    rings(214, ringsList[31]);
    rings(217, ringsList[32]);
    rings(220, ringsList[33]);
    rings(223, ringsList[34]);
    rings(226, ringsList[35]);
    rings(229, ringsList[36]);
    rings(232, ringsList[37]);
    rings(272, ringsList[41]);
    rings(275, ringsList[42]);
    rings(278, ringsList[43]);
    rings(281, ringsList[44]);
    rings(284, ringsList[45]);
    rings(287, ringsList[46]);
    rings(288, ringsList[47]);

    ganar(528, eggman2);

    if (score >= 50 && eggman2) {
      eggman2.style.left = (getLeft(eggman2, 4000) - moveBy) + 'px';
    }
  }

  function stopRight() {
    sonic.classList.remove('moving');
    background.classList.remove('background2');
    eggman.classList.add('eggman');
  }

  // Step Left Execution
  function stepLeft() {
    if (die > 0 || hasWon) return;
    unlockAudio();
    runLeft();
    y = 0;

    sonic.classList.add('moving2');
    background.classList.add('background2');
    eggman.classList.add('eggRun');
    eggman.classList.remove('eggman');

    const leftScores = [
      31, 35, 38, 41, 66, 69, 71, 74, 77, 80,
      132, 135, 138, 141, 144, 165, 168, 171, 174, 177,
      205, 208, 211, 214, 217, 220, 223, 226, 229, 232,
      272, 275, 278, 281, 284, 287, 288,
    ];
    leftScores.forEach((v) => scoreL(v));

    if (score >= 50 && eggman2) {
      eggman2.style.left = (getLeft(eggman2, 4000) + moveBy) + 'px';
    }
  }

  function stopLeft() {
    sonic.classList.remove('moving2');
    sonic.classList.remove('sonic');
    sonic.classList.add('sonic2');
    background.classList.remove('background2');
    eggman.classList.add('eggman');
  }

  // Jump Execution
  let jumpTimeout = null;
  function startJump() {
    if (die > 0 || hasWon) return;
    unlockAudio();
    sonic.classList.add('jumping');
    y = 1;
    playJumpSound();

    ringsY(36, 39, ringsList[10]);
    ringsY(101, 103, ringsList[11]);
    ringsY(104, 106, ringsList[12]);
    ringsY(107, 109, ringsList[13]);
    ringsY(166, 168, ringsList[19]);
    ringsY(169, 171, ringsList[20]);
    ringsY(178, 180, ringsList[21]);
    ringsY(181, 183, ringsList[22]);
    ringsY(264, 266, ringsList[38]);
    ringsY(268, 270, ringsList[39]);
    ringsY(272, 274, ringsList[40]);
    ringsY(305, 307, ringsList[48]);
    ringsY(311, 314, ringsList[49]);

    // Ensure jump completes naturally if held or released
    if (jumpTimeout) clearTimeout(jumpTimeout);
    jumpTimeout = setTimeout(() => {
      endJump();
    }, 400);
  }

  function endJump() {
    if (jumpTimeout) {
      clearTimeout(jumpTimeout);
      jumpTimeout = null;
    }
    sonic.classList.remove('jumping');

    if (y === 1) {
      scoreY(36, 39);
      scoreY(101, 103);
      scoreY(104, 106);
      scoreY(107, 109);
      scoreY(166, 168);
      scoreY(169, 171);
      scoreY(178, 180);
      scoreY(181, 183);
      scoreY(264, 266);
      scoreY(268, 270);
      scoreY(272, 274);
      scoreY(305, 307);
      scoreY(311, 314);

      lose(172, 177);
      lose(205, 219);
      lose(275, 280);

      eggManCheck();
      y = 0;
    }
  }

  // Continuous holding for mobile buttons
  let holdInterval = null;
  function startHold(action) {
    if (holdInterval) clearInterval(holdInterval);
    action();
    holdInterval = setInterval(action, 65);
  }
  function stopHold(cleanup) {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    if (cleanup) cleanup();
  }

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.key === 'd') {
      stepRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.key === 'a') {
      stepLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'w' || e.key === ' ') {
      startJump();
    } else if (e.key === 'KeyR' || e.key === 'r') {
      restartGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'KeyD' || e.key === 'd') {
      stopRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'KeyA' || e.key === 'a') {
      stopLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'w' || e.key === ' ') {
      endJump();
    }
  });

  // Setup Touch / Mobile In-App Buttons
  function setupTouchControls() {
    const btnLeft = document.getElementById('ctrl-left');
    const btnRight = document.getElementById('ctrl-right');
    const btnJump = document.getElementById('ctrl-jump');
    const btnRestart = document.getElementById('ctrl-restart');
    const btnMute = document.getElementById('ctrl-mute');

    if (btnLeft) {
      const startLeft = (e) => {
        e.preventDefault();
        startHold(stepLeft);
      };
      const endLeft = (e) => {
        e.preventDefault();
        stopHold(stopLeft);
      };
      btnLeft.addEventListener('touchstart', startLeft, { passive: false });
      btnLeft.addEventListener('touchend', endLeft, { passive: false });
      btnLeft.addEventListener('mousedown', startLeft);
      btnLeft.addEventListener('mouseup', endLeft);
      btnLeft.addEventListener('mouseleave', endLeft);
    }

    if (btnRight) {
      const startRight = (e) => {
        e.preventDefault();
        startHold(stepRight);
      };
      const endRight = (e) => {
        e.preventDefault();
        stopHold(stopRight);
      };
      btnRight.addEventListener('touchstart', startRight, { passive: false });
      btnRight.addEventListener('touchend', endRight, { passive: false });
      btnRight.addEventListener('mousedown', startRight);
      btnRight.addEventListener('mouseup', endRight);
      btnRight.addEventListener('mouseleave', endRight);
    }

    if (btnJump) {
      const doJump = (e) => {
        e.preventDefault();
        startJump();
      };
      const releaseJump = (e) => {
        e.preventDefault();
        endJump();
      };
      btnJump.addEventListener('touchstart', doJump, { passive: false });
      btnJump.addEventListener('touchend', releaseJump, { passive: false });
      btnJump.addEventListener('mousedown', doJump);
      btnJump.addEventListener('mouseup', releaseJump);
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', (e) => {
        e.preventDefault();
        restartGame();
      });
    }

    if (btnMute) {
      btnMute.addEventListener('click', (e) => {
        e.preventDefault();
        isMuted = !isMuted;
        if (isMuted) {
          song.pause();
          btnMute.textContent = '🔇';
          btnMute.title = 'Sound Muted';
        } else {
          btnMute.textContent = '🔊';
          btnMute.title = 'Sound On';
          if (audioUnlocked) song.play().catch(() => {});
        }
      });
    }

    // Modal retry buttons
    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', restartGame);
    }
    const winPlayAgainBtn = document.getElementById('btn-win-again');
    if (winPlayAgainBtn) {
      winPlayAgainBtn.addEventListener('click', restartGame);
    }
  }

  // Immediate layout initialization (never waits for late events)
  function initGame() {
    applyPositions();
    updateHUD();
    setupTouchControls();
  }

  // Run immediately right now!
  initGame();

  // Also hook to lifecycle events to be completely sure
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  }
  window.addEventListener('load', initGame);

  // Allow clicking on canvas or buttons to unlock audio
  document.body.addEventListener('click', unlockAudio, { once: true });
  document.body.addEventListener('touchstart', unlockAudio, { once: true });

  // Tab visibility: pause audio and clear hold intervals when tab is hidden to save memory & battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (song) song.pause();
      if (holdInterval) {
        clearInterval(holdInterval);
        holdInterval = null;
      }
    } else {
      if (!isMuted && audioUnlocked && song && !die && !hasWon) {
        song.play().catch(() => {});
      }
    }
  });

  // Expose API for parent window (e.g., React component)
  window.sonicGame = {
    restart: restartGame,
    moveLeft: () => { stepLeft(); setTimeout(stopLeft, 200); },
    moveRight: () => { stepRight(); setTimeout(stopRight, 200); },
    jump: () => { startJump(); setTimeout(endJump, 300); },
    toggleMute: () => {
      const btnMute = document.getElementById('ctrl-mute');
      if (btnMute) btnMute.click();
    },
  };
})();

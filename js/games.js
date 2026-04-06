/**
 * js/games.js — Mini Games: Reaction Time, Speed Typing, Memory Match, Quick Trivia
 * Exports: GamesController (attached to window)
 */
(function () {
  'use strict';

  /* =========================================================
     REACTION TIME GAME
     ========================================================= */
  function initReactionGame() {
    const zone     = document.getElementById('reactionZone');
    const msg      = document.getElementById('reactionMessage');
    const msEl     = document.getElementById('reactionMs');
    const bestEl   = document.getElementById('reactionBest');
    const startBtn = document.getElementById('reactionStartBtn');
    if (!zone || !startBtn) return;

    let state = 'idle';   // idle | wait | go | result
    let startTime = 0;
    let waitTimer = null;
    let best = Infinity;

    function setState(s) {
      state = s;
      zone.dataset.state = s;
    }

    function showBest() {
      if (bestEl && best !== Infinity) {
        bestEl.textContent = `Best: ${best} ms`;
      }
    }

    function reset() {
      clearTimeout(waitTimer);
      setState('idle');
      if (msg)  msg.textContent = 'Press Start';
      if (msEl) msEl.textContent = '';
      startBtn.textContent = 'Start';
      showBest();
    }

    function startGame() {
      setState('wait');
      startBtn.textContent = 'Cancel';
      if (msg)  msg.textContent = 'Wait for green...';
      if (msEl) msEl.textContent = '';

      const delay = 2000 + Math.random() * 3500;
      waitTimer = setTimeout(() => {
        setState('go');
        if (msg) msg.textContent = 'CLICK NOW!';
        startTime = performance.now();
      }, delay);
    }

    zone.addEventListener('click', () => {
      if (state === 'go') {
        const elapsed = Math.round(performance.now() - startTime);
        if (elapsed < best) best = elapsed;
        setState('result');
        if (msg)  msg.textContent = '';
        if (msEl) msEl.textContent = `${elapsed} ms`;
        startBtn.textContent = 'Again';
        showBest();
      } else if (state === 'wait') {
        clearTimeout(waitTimer);
        setState('too-early');
        if (msg)  msg.textContent = 'Too early! Try again.';
        if (msEl) msEl.textContent = '';
        startBtn.textContent = 'Retry';
      }
    });

    startBtn.addEventListener('click', () => {
      if (state === 'idle' || state === 'result' || state === 'too-early') {
        startGame();
      } else {
        reset();
      }
    });

    reset();
  }

  /* =========================================================
     SPEED TYPING GAME
     ========================================================= */
  const TYPING_PROMPTS = [
    'The quick brown fox jumps over the lazy dog near the riverbank',
    'Productivity is not about doing more things but doing the right things well',
    'Focus on one task at a time and you will accomplish far more each day',
    'Deep work produces the best results when distractions are eliminated',
    'Time is the most valuable resource and once spent it cannot be recovered',
    'Consistency over intensity is the key principle behind lasting achievement',
    'Every second you spend focused is an investment in your future success',
    'Break large tasks into small steps and progress becomes unstoppable today',
  ];

  function initTypingGame() {
    const promptEl  = document.getElementById('typingPromptText');
    const inputEl   = document.getElementById('typingInputField');
    const wpmEl     = document.getElementById('typingWpm');
    const timerEl   = document.getElementById('typingTimerDisplay');
    const startBtn  = document.getElementById('typingStartBtn');
    if (!promptEl || !inputEl || !startBtn) return;

    const DURATION = 30; // seconds
    let running = false, startTime = 0, interval = null, prompt = '';

    function getRandomPrompt() {
      return TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)];
    }

    function reset() {
      clearInterval(interval);
      running = false;
      prompt  = '';
      promptEl.textContent = 'Press Start to begin';
      promptEl.style.color = '';
      inputEl.value   = '';
      inputEl.disabled = true;
      if (wpmEl)   wpmEl.textContent   = '';
      if (timerEl) timerEl.textContent = '';
      startBtn.textContent = 'Start';
    }

    function startGame() {
      prompt = getRandomPrompt();
      promptEl.textContent = prompt;
      promptEl.style.color = '';
      inputEl.value   = '';
      inputEl.disabled = false;
      inputEl.focus();
      running   = true;
      startTime = performance.now();
      startBtn.textContent = 'Reset';
      if (wpmEl)   wpmEl.textContent   = '';

      let remaining = DURATION;
      if (timerEl) timerEl.textContent = `${remaining}s`;

      interval = setInterval(() => {
        remaining--;
        if (timerEl) timerEl.textContent = `${remaining}s`;
        if (remaining <= 0) {
          clearInterval(interval);
          finishGame();
        }
      }, 1000);
    }

    function finishGame() {
      running = false;
      inputEl.disabled = true;

      const typed = inputEl.value.trim();
      const words = typed.split(/\s+/).filter(Boolean).length;
      const elapsed = (performance.now() - startTime) / 60000; // minutes
      const wpm = Math.round(words / Math.max(elapsed, 0.001));

      if (wpmEl) wpmEl.textContent = `${wpm} WPM`;

      // Highlight accuracy
      const correct = typed.split('').filter((c, i) => c === prompt[i]).length;
      const acc = prompt.length > 0 ? Math.round((correct / prompt.length) * 100) : 0;
      if (timerEl) timerEl.textContent = `Accuracy: ${acc}%`;

      startBtn.textContent = 'Play Again';
    }

    inputEl.addEventListener('input', () => {
      if (!running) return;
      const typed = inputEl.value;
      // Live color feedback on prompt text
      let html = '';
      for (let i = 0; i < prompt.length; i++) {
        const ch = typed[i];
        if (ch === undefined) {
          html += `<span>${prompt[i]}</span>`;
        } else if (ch === prompt[i]) {
          html += `<span style="color:var(--clr-accent3)">${prompt[i]}</span>`;
        } else {
          html += `<span style="color:var(--clr-accent2)">${prompt[i]}</span>`;
        }
      }
      promptEl.innerHTML = html;
    });

    startBtn.addEventListener('click', () => {
      if (!running) startGame();
      else          reset();
    });

    reset();
  }

  /* =========================================================
     MEMORY MATCH GAME
     ========================================================= */
  const MEMORY_COLORS = [
    '#6c63ff', '#ff6584', '#43e97b', '#4facfe',
    '#f7971e', '#a18cd1', '#f5a623', '#00c6ff',
  ];

  function initMemoryGame() {
    const board    = document.getElementById('memoryBoard');
    const movesEl  = document.getElementById('memoryMoves');
    const scoreEl  = document.getElementById('memoryScore');
    const startBtn = document.getElementById('memoryStartBtn');
    if (!board || !startBtn) return;

    let cards = [], flipped = [], matched = 0, moves = 0, locked = false;

    function buildBoard() {
      const pairs = MEMORY_COLORS.slice(0, 6); // 6 pairs = 12 cards
      const deck  = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
      board.innerHTML = '';
      cards = [];
      flipped = [];
      matched = 0;
      moves   = 0;

      deck.forEach((color, idx) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.color = color;
        card.dataset.idx   = idx;

        const inner = document.createElement('div');
        inner.className = 'memory-card-inner';
        inner.style.background = color;
        inner.style.opacity = '0';
        inner.style.transition = 'opacity 0.25s ease';
        card.appendChild(inner);

        card.addEventListener('click', () => onCardClick(card));
        board.appendChild(card);
        cards.push(card);
      });

      if (movesEl) movesEl.textContent = 'Moves: 0';
      if (scoreEl) scoreEl.textContent = '';
    }

    function onCardClick(card) {
      if (locked) return;
      if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
      if (flipped.length >= 2) return;

      revealCard(card, true);
      flipped.push(card);

      if (flipped.length === 2) {
        moves++;
        if (movesEl) movesEl.textContent = `Moves: ${moves}`;
        locked = true;
        const [a, b] = flipped;
        if (a.dataset.color === b.dataset.color) {
          a.classList.add('matched');
          b.classList.add('matched');
          matched++;
          flipped = [];
          locked  = false;
          if (matched === 6) {
            if (scoreEl) scoreEl.textContent = `Done in ${moves} moves`;
            startBtn.textContent = 'Play Again';
          }
        } else {
          setTimeout(() => {
            revealCard(a, false);
            revealCard(b, false);
            flipped = [];
            locked  = false;
          }, 700);
        }
      }
    }

    function revealCard(card, show) {
      const inner = card.querySelector('.memory-card-inner');
      if (show) {
        card.classList.add('flipped');
        card.style.background = card.dataset.color + '22';
        card.style.borderColor = card.dataset.color + '88';
        if (inner) inner.style.opacity = '1';
      } else {
        card.classList.remove('flipped');
        card.style.background = '';
        card.style.borderColor = '';
        if (inner) inner.style.opacity = '0';
      }
    }

    function reset() {
      board.innerHTML = '<div class="memory-idle-msg">Press Start to play</div>';
      if (movesEl) movesEl.textContent = '';
      if (scoreEl) scoreEl.textContent = '';
      startBtn.textContent = 'Start';
    }

    startBtn.addEventListener('click', () => {
      buildBoard();
      startBtn.textContent = 'Restart';
    });

    reset();
  }

  /* =========================================================
     QUICK TRIVIA GAME
     ========================================================= */
  const TRIVIA_BANK = [
    { q: 'How many seconds are in one hour?',                      a: '3600',   opts: ['1800', '3600', '7200', '900'] },
    { q: 'What is the capital of Japan?',                          a: 'Tokyo',  opts: ['Osaka', 'Kyoto', 'Tokyo', 'Beijing'] },
    { q: 'Which planet is closest to the Sun?',                    a: 'Mercury',opts: ['Venus', 'Earth', 'Mercury', 'Mars'] },
    { q: 'How many sides does a hexagon have?',                    a: '6',      opts: ['5', '6', '7', '8'] },
    { q: 'What is the chemical symbol for water?',                 a: 'H2O',    opts: ['CO2', 'O2', 'H2O', 'NaCl'] },
    { q: 'Who painted the Mona Lisa?',                             a: 'da Vinci',opts: ['Picasso', 'Michelangelo', 'da Vinci', 'Raphael'] },
    { q: 'What is the largest ocean on Earth?',                    a: 'Pacific', opts: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
    { q: 'In what year did World War II end?',                     a: '1945',    opts: ['1942', '1944', '1945', '1947'] },
    { q: 'What is the square root of 144?',                        a: '12',      opts: ['10', '11', '12', '14'] },
    { q: 'Which element has the symbol Au?',                       a: 'Gold',    opts: ['Silver', 'Gold', 'Copper', 'Iron'] },
    { q: 'How many continents are there on Earth?',                a: '7',       opts: ['5', '6', '7', '8'] },
    { q: 'What programming language was created by Guido van Rossum?', a: 'Python', opts: ['Ruby', 'Java', 'Python', 'Perl'] },
    { q: 'What is the speed of light in km/s (approx)?',          a: '300,000', opts: ['150,000', '300,000', '500,000', '1,000,000'] },
    { q: 'Which country invented the World Wide Web?',             a: 'UK',      opts: ['USA', 'Germany', 'UK', 'France'] },
    { q: 'How many bytes are in one kilobyte (binary)?',           a: '1024',    opts: ['512', '1000', '1024', '2048'] },
  ];

  function initTriviaGame() {
    const qEl       = document.getElementById('triviaQuestionText');
    const ansEl     = document.getElementById('triviaAnswers');
    const feedEl    = document.getElementById('triviaFeedback');
    const progEl    = document.getElementById('triviaProgressDisplay');
    const startBtn  = document.getElementById('triviaStartBtn');
    if (!qEl || !startBtn) return;

    const QUESTIONS_PER_ROUND = 5;
    let questions = [], current = 0, score = 0, answered = false;

    function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

    function reset() {
      qEl.textContent = 'Press Start to begin';
      if (ansEl)  ansEl.innerHTML  = '';
      if (feedEl) feedEl.textContent = '';
      if (feedEl) feedEl.className = 'trivia-feedback';
      if (progEl) progEl.textContent = '';
      startBtn.textContent = 'Start';
    }

    function startGame() {
      questions = shuffle(TRIVIA_BANK).slice(0, QUESTIONS_PER_ROUND);
      current   = 0;
      score     = 0;
      startBtn.textContent = 'Restart';
      showQuestion();
    }

    function showQuestion() {
      answered = false;
      const q = questions[current];
      if (!q) { showResult(); return; }

      qEl.textContent = q.q;
      if (progEl) progEl.textContent = `${current + 1} / ${QUESTIONS_PER_ROUND}`;
      if (feedEl) { feedEl.textContent = ''; feedEl.className = 'trivia-feedback'; }

      const shuffledOpts = shuffle(q.opts);
      if (ansEl) {
        ansEl.innerHTML = '';
        shuffledOpts.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'trivia-answer-btn';
          btn.textContent = opt;
          btn.addEventListener('click', () => onAnswer(opt, q.a));
          ansEl.appendChild(btn);
        });
      }
    }

    function onAnswer(chosen, correct) {
      if (answered) return;
      answered = true;

      const btns = ansEl?.querySelectorAll('.trivia-answer-btn') || [];
      btns.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct)  btn.classList.add('correct');
        if (btn.textContent === chosen && chosen !== correct) btn.classList.add('wrong');
      });

      const isCorrect = chosen === correct;
      if (isCorrect) score++;

      if (feedEl) {
        feedEl.textContent = isCorrect ? 'Correct!' : `Wrong — ${correct}`;
        feedEl.className   = 'trivia-feedback ' + (isCorrect ? 'correct' : 'wrong');
      }

      setTimeout(() => {
        current++;
        showQuestion();
      }, 1200);
    }

    function showResult() {
      qEl.textContent = `Game over! You scored ${score} / ${QUESTIONS_PER_ROUND}`;
      if (ansEl)  ansEl.innerHTML  = '';
      if (feedEl) { feedEl.textContent = score >= 4 ? 'Excellent!' : score >= 2 ? 'Good effort!' : 'Keep practicing!'; feedEl.className = 'trivia-feedback correct'; }
      if (progEl) progEl.textContent = `${score}/${QUESTIONS_PER_ROUND} correct`;
      startBtn.textContent = 'Play Again';
    }

    startBtn.addEventListener('click', startGame);
    reset();
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    initReactionGame();
    initTypingGame();
    initMemoryGame();
    initTriviaGame();
  }

  window.GamesController = { init };
})();

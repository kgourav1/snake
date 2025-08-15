// Game variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 30;
const canvasSize = 600;

let snake = [{ x: 300, y: 300 }];
let direction = { x: 0, y: 0 };
let letters = [];
let blockers = []; // New: array to store blocker positions
let currentWord = [];
let score = 0;
let wordsCompleted = 0;
let level = 1;
let streak = 0;
let bestStreak = 0;
let gameRunning = true;
let gameSpeed = 200;
const HIGH_SCORE_KEY = "snake_high_score";
let hasPlayedCheer = false;
let isPaused = false;

const validWords = new Set();
let allowedLetters = [];

function loadMissionWords(level) {
  validWords.clear();
  allowedLetters = [];

  fetch(`mission/${level}.txt`)
    .then((response) => response.text())
    .then((text) => {
      const lettersSet = new Set();

      text.split(/,|\n/).forEach((word) => {
        const trimmed = word.trim();
        if (trimmed.length > 0) {
          const upper = trimmed.toUpperCase();
          validWords.add(upper);

          // Add all letters from this word to allowed set
          for (const ch of upper) {
            if (/[A-Z]/.test(ch)) {
              lettersSet.add(ch);
            }
          }
        }
      });

      allowedLetters = Array.from(lettersSet);
      console.log(`Loaded ${validWords.size} words for Mission ${level}`);
      console.log(
        `Allowed letters for Mission ${level}: ${allowedLetters.join(",")}`
      );
    })
    .catch((error) =>
      console.error(`Error loading mission ${level} word list:`, error)
    );
}

function updateMission(level) {
  fetch("./missions.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load missions.json`);
      return response.json();
    })
    .then((missions) => {
      const missionText =
        missions[level] || `Mission ${level}: No mission found`;
      document.getElementById("mission").textContent = missionText;
    })
    .catch((error) => console.error("Error loading missions:", error));
}

// New: Function to generate blockers
function generateBlockers() {
  blockers = [];
  const numBlockers = Math.min(3 + Math.floor(level / 3), 15); // 3 + level/3 blockers, max 15

  for (let i = 0; i < numBlockers; i++) {
    let x, y;
    let attempts = 0;

    do {
      x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
      y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
      attempts++;
    } while (
      (snake.some((segment) => segment.x === x && segment.y === y) ||
        letters.some((letter) => letter.x === x && letter.y === y) ||
        blockers.some((blocker) => blocker.x === x && blocker.y === y) ||
        (x === snake[0].x && y === snake[0].y)) && // Don't spawn on snake head
      attempts < 100
    );

    if (attempts < 100) {
      blockers.push({ x, y });
    }
  }
}

// New: Function to draw blockers
function drawBlockers() {
  blockers.forEach((blocker) => {
    // Blocker with modern styling
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(blocker.x + 2, blocker.y + 2, gridSize - 4, gridSize - 4);

    // Add X pattern for visual clarity
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fef2f2";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(blocker.x + 8, blocker.y + 8);
    ctx.lineTo(blocker.x + gridSize - 8, blocker.y + gridSize - 8);
    ctx.moveTo(blocker.x + gridSize - 8, blocker.y + 8);
    ctx.lineTo(blocker.x + 8, blocker.y + gridSize - 8);
    ctx.stroke();
  });
}

// New: Function to wrap coordinates around boundaries
function wrapCoordinate(coord, max) {
  if (coord < 0) return max - gridSize;
  if (coord >= max) return 0;
  return coord;
}

// Smarter getRandomLetter()
function getRandomLetter() {
  if (allowedLetters.length === 0) {
    return getInitialRandomLetter();
  }

  // If player has started forming a word
  if (currentWord.length > 0) {
    const currentStr = currentWord.join("");

    // Find all possible valid words that start with currentStr
    const possibleMatches = Array.from(validWords).filter((w) =>
      w.startsWith(currentStr)
    );

    if (possibleMatches.length > 0) {
      // Pick the shortest possible match so it's easier to complete
      const targetWord = possibleMatches.sort((a, b) => a.length - b.length)[0];

      // Return the next needed letter in that word
      return targetWord[currentWord.length];
    }
  }

  // If no word started, pick a random allowed letter to start a new one
  const randomIndex = Math.floor(Math.random() * allowedLetters.length);
  return allowedLetters[randomIndex];
}

let missionProgress = {
  completedWords: [], // stores completed words in current mission
  vowelsCollected: new Set(),
  consonantsCollected: [],
  sameLetterWords: {}, // for missions 12 & 13
  rhymeGroups: {}, // for mission 14
};

const missionCheckFunctions = {
  1: function (word) {
    // Mission 1: Any 5 consecutive alphabets
    const chars = word.split("").map((c) => c.charCodeAt(0));
    for (let i = 0; i <= chars.length - 5; i++) {
      if (chars[i + 4] - chars[i] === 4) {
        return true;
      }
    }
    return false;
  },
  2: function (word) {
    // Mission 2: 5 different vowels
    for (const ch of word) {
      if ("AEIOU".includes(ch)) {
        missionProgress.vowelsCollected.add(ch);
      }
    }
    return missionProgress.vowelsCollected.size >= 5;
  },
  3: function (word) {
    // Mission 3: Collect 5 consonants in dictionary order
    const consonants = word.replace(/[AEIOU]/g, "").split("");

    consonants.forEach((ch) => {
      if (missionProgress.consonantsCollected.length === 0) {
        missionProgress.consonantsCollected.push(ch);
      } else {
        const lastChar =
          missionProgress.consonantsCollected[
            missionProgress.consonantsCollected.length - 1
          ];
        if (ch >= lastChar) {
          // Only add if in dictionary order
          missionProgress.consonantsCollected.push(ch);
        }
      }
    });

    if (missionProgress.consonantsCollected.length >= 5) {
      return true; // Mission complete
    }

    return false; // Keep going
  },
  4: function (word) {
    // Mission 4: 5 two-letter words
    if (word.length === 2 && validWords.has(word)) {
      missionProgress.completedWords.push(word);
    }
    return missionProgress.completedWords.length >= 5;
  },
  5: function (word) {
    if (word.length === 3 && validWords.has(word)) {
      missionProgress.completedWords.push(word);
    }
    return missionProgress.completedWords.length >= 5;
  },
  6: function (word) {
    if (word.length === 4 && validWords.has(word)) {
      missionProgress.completedWords.push(word);
    }
    return missionProgress.completedWords.length >= 5;
  },
  7: function (word) {
    if (word.length === 5 && validWords.has(word)) {
      missionProgress.completedWords.push(word);
    }
    return missionProgress.completedWords.length >= 5;
  },
  8: function (word) {
    return word.length > 1 && word === word.split("").reverse().join("");
  },
  9: function (word) {
    return word.length > 1 && word[0] === word[word.length - 1];
  },
  10: function (word) {
    return isConsecutive(word);
  },
  11: function (word) {
    return word.includes("Q") && word.includes("U");
  },
  12: function (word) {
    const first = word[0];
    missionProgress.sameLetterWords[first] =
      missionProgress.sameLetterWords[first] || new Set();
    missionProgress.sameLetterWords[first].add(word);
    return Object.values(missionProgress.sameLetterWords).some(
      (set) => set.size >= 5
    );
  },
  13: function (word) {
    const last = word[word.length - 1];
    missionProgress.sameLetterWords[last] =
      missionProgress.sameLetterWords[last] || new Set();
    missionProgress.sameLetterWords[last].add(word);
    return Object.values(missionProgress.sameLetterWords).some(
      (set) => set.size >= 5
    );
  },
  14: function (word) {
    const ending = word.slice(-2);
    missionProgress.rhymeGroups[ending] =
      missionProgress.rhymeGroups[ending] || new Set();
    missionProgress.rhymeGroups[ending].add(word);
    return Object.values(missionProgress.rhymeGroups).some(
      (set) => set.size >= 3
    );
  },
  15: function (word) {
    return "AEIOU".split("").every((v) => word.includes(v));
  },
  16: function (word) {
    return /(.)\1/.test(word);
  },
  17: function (word) {
    return !/[AEIOU]/.test(word);
  },
  18: function (word) {
    return word.includes("Z");
  },
};

// Helper to check if letters are consecutive
function isConsecutive(word) {
  const chars = word.split("").map((c) => c.charCodeAt(0));
  for (let i = 0; i < chars.length - 1; i++) {
    if (chars[i + 1] - chars[i] !== 1) {
      return false;
    }
  }
  return true;
}

function onWordCompleted(word) {
  word = word.toUpperCase();
  if (missionCheckFunctions[level] && missionCheckFunctions[level](word)) {
    levelUp(); // move to next mission
    missionProgress = {
      completedWords: [],
      vowelsCollected: new Set(),
      consonantsCollected: [],
      sameLetterWords: {},
      rhymeGroups: {},
    };
  }
}

// When the level changes, reload the mission words and regenerate blockers
function levelUp() {
  level++;
  updateMission(level);
  gameSpeed = Math.max(80, gameSpeed - 25);
  document.getElementById("level").textContent = level;
  showLevelUp();
  loadMissionWords(level);
  generateBlockers(); // Regenerate blockers for new level
}

// Modify completeWord to use levelUp()
function completeWord() {
  const wordStr = currentWord.join("");
  const completedWord = hasValidSubstring(wordStr, validWords, 2);

  if (!completedWord) return; // No valid word found

  const matchedWord = completedWord.matched.toUpperCase();
  onWordCompleted(matchedWord); // Check mission progress

  const wordLength = completedWord.matched.length;
  const letterBonus = wordLength; // Bonus points equal to word length
  score += letterBonus * level;
  wordsCompleted++;
  streak++;
  bestStreak = Math.max(bestStreak, streak);

  // Show word completion message
  const wordDisplay = document.getElementById("wordCompleted");
  wordDisplay.textContent = `${completedWord.matched} +${letterBonus} BONUS!`;
  wordDisplay.classList.add("show");
  setTimeout(() => {
    wordDisplay.classList.remove("show");
  }, 2000);

  playWordCompleteSound();

  // Remove tail segments equal to word length
  for (let i = 0; i < wordLength && snake.length > 1; i++) {
    snake.pop();
  }

  // Reset current word
  currentWord = completedWord.remaining.split("");
  updateCurrentWordDisplay();
  updateSuggestions();
  updateScore();
}

// Load mission 1 at game start and generate initial blockers
loadMissionWords(level);
generateBlockers();

// Audio context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = "sine", volume = 0.3) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playEatSound() {
  playSound(550, 0.1, "sine", 0.4);
}

function playWordCompleteSound() {
  playSound(523, 0.2); // C
  setTimeout(() => playSound(659, 0.2), 80); // E
  setTimeout(() => playSound(784, 0.3), 160); // G
  setTimeout(() => playSound(1047, 0.4), 240); // High C
}

function playLevelUpSound() {
  playSound(400, 0.3, "sine", 0.5);
  setTimeout(() => playSound(500, 0.3, "sine", 0.5), 150);
  setTimeout(() => playSound(600, 0.5, "sine", 0.5), 300);
}

function playGameOverSound() {
  playSound(200, 0.6, "sawtooth", 0.5);
}

function playCheerSound() {
  if (hasPlayedCheer) return; // already played
  hasPlayedCheer = true; // mark as played
  let timeOffset = 0;

  const tones = [
    { freq: 523.25, duration: 0.15 }, // C5
    { freq: 659.25, duration: 0.15 }, // E5
    { freq: 783.99, duration: 0.15 }, // G5
    { freq: 1046.5, duration: 0.2 }, // C6 - a final happy high note!
  ];

  tones.forEach(({ freq, duration }) => {
    setTimeout(() => {
      playSound(freq, duration, "triangle", 0.4);
    }, timeOffset * 1000);
    timeOffset += duration;
  });
}

// Better letter distribution
function getInitialRandomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const weights = [
    8, 2, 3, 4, 12, 2, 2, 6, 7, 1, 1, 4, 2, 7, 8, 2, 1, 6, 6, 9, 3, 2, 2, 1, 2,
    1,
  ];

  let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < letters.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return letters[i];
    }
  }
  return "A";
}

function spawnLetter() {
  let x, y;
  let attempts = 0;
  do {
    x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    attempts++;
  } while (
    (snake.some((segment) => segment.x === x && segment.y === y) ||
      blockers.some((blocker) => blocker.x === x && blocker.y === y)) &&
    attempts < 100
  );

  const hue = Math.random() * 360;
  letters.push({
    x: x,
    y: y,
    letter: getRandomLetter(),
    color: `hsl(${hue}, 75%, 65%)`,
    glow: `hsl(${hue}, 85%, 75%)`,
  });
}

function findPossibleWords() {
  if (currentWord.length === 0) return [];

  const currentStr = currentWord.join("");
  const possible = [];

  // Find words that start with current letters
  for (const word of validWords) {
    if (word.startsWith(currentStr) && word.length > currentStr.length) {
      possible.push(word);
    }
  }

  return possible.slice(0, 8); // Show max 8 suggestions
}

function updateSuggestions() {
  const suggestions = findPossibleWords();
  const suggestionsEl = document.getElementById("suggestions");

  if (suggestions.length === 0) {
    if (currentWord.length === 0) {
      suggestionsEl.textContent = "Collect letters to see suggestions!";
    } else {
      suggestionsEl.innerHTML =
        '<span style="color: #ff6b6b;">No valid words found. Try different letters!</span>';
    }
  } else {
    suggestionsEl.innerHTML = suggestions
      .map((word) => `<span class="suggestion-item">${word}</span>`)
      .join("");
  }
}

function showPointPopup(points, x, y) {
  const popup = document.createElement("div");
  popup.className = "point-popup";
  popup.textContent = `+${points}`;
  popup.style.left = x + 50 + "px";
  popup.style.top = y + 100 + "px";
  document.body.appendChild(popup);

  setTimeout(() => {
    document.body.removeChild(popup);
  }, 1000);
}

function showLevelUp() {
  const levelUpEl = document.getElementById("levelUp");
  levelUpEl.textContent = `LEVEL ${level}!`;
  levelUpEl.classList.add("show");

  setTimeout(() => {
    levelUpEl.classList.remove("show");
  }, 2500);

  playLevelUpSound();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const gradient = ctx.createLinearGradient(
      segment.x,
      segment.y,
      segment.x + gridSize,
      segment.y + gridSize
    );

    if (index === 0) {
      // Head with glow
      gradient.addColorStop(0, "#4ade80");
      gradient.addColorStop(1, "#22c55e");
      ctx.fillStyle = gradient;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 15;
    } else {
      // Body segments with modern gradient
      const alpha = Math.max(0.3, 1 - index * 0.1);
      gradient.addColorStop(0, `rgba(34, 197, 94, ${alpha})`);
      gradient.addColorStop(1, `rgba(21, 128, 61, ${alpha})`);
      ctx.fillStyle = gradient;
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 8;
    }

    ctx.fillRect(segment.x + 1, segment.y + 1, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;

    if (index === 0) {
      // Modern snake eyes
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(segment.x + 8, segment.y + 8, 6, 6);
      ctx.fillRect(segment.x + 16, segment.y + 8, 6, 6);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(segment.x + 9, segment.y + 9, 4, 4);
      ctx.fillRect(segment.x + 17, segment.y + 9, 4, 4);
    }
  });
}

function drawLetters() {
  letters.forEach((letterObj) => {
    // Letter background with glow
    ctx.shadowBlur = 20;
    ctx.fillStyle = letterObj.color;
    ctx.fillRect(letterObj.x + 2, letterObj.y + 2, gridSize - 4, gridSize - 4);

    // Letter text with better styling
    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 2;
    ctx.fillText(
      letterObj.letter,
      letterObj.x + gridSize / 2,
      letterObj.y + gridSize / 2
    );
    ctx.shadowBlur = 0;
  });
}

// Enhanced moveSnake function with wraparound and blocker collision
function moveSnake() {
  if (direction.x === 0 && direction.y === 0) return;

  const head = {
    x: wrapCoordinate(snake[0].x + direction.x, canvasSize),
    y: wrapCoordinate(snake[0].y + direction.y, canvasSize),
  };

  // Check blocker collision
  if (
    blockers.some((blocker) => blocker.x === head.x && blocker.y === head.y)
  ) {
    gameOver();
    return;
  }

  // Self collision
  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check letter collision
  const letterIndex = letters.findIndex(
    (letter) => letter.x === head.x && letter.y === head.y
  );
  if (letterIndex !== -1) {
    const collectedLetter = letters[letterIndex];
    letters.splice(letterIndex, 1);
    currentWord.push(collectedLetter.letter);

    // +1 point for each letter
    score += 1;
    playEatSound();
    showPointPopup(1, head.x + canvas.offsetLeft, head.y + canvas.offsetTop);

    updateCurrentWordDisplay();
    updateSuggestions();
    updateScore();

    // Check if current word is valid
    const wordStr = currentWord.join("");

    if (
      wordStr.length >= 2 &&
      (validWords.has(wordStr) || hasValidSubstring(wordStr, validWords))
    ) {
      completeWord();
    }
  } else {
    snake.pop();
  }
}

function hasValidSubstring(word, validWords, mode = 1) {
  const len = word.length;

  for (let start = 0; start < len; start++) {
    for (let end = start + 1; end <= len; end++) {
      const sub = word.slice(start, end);
      if (validWords.has(sub)) {
        if (mode === 1) {
          return true;
        }
        if (mode === 2) {
          const remaining = word.slice(0, start) + word.slice(end);
          return { matched: sub, remaining };
        }
      }
    }
  }

  return mode === 1 ? false : null;
}

function completeWord() {
  const wordStr = currentWord.join("");
  const completedWord = hasValidSubstring(wordStr, validWords, 2);

  if (!completedWord) return; // No valid word found

  const matchedWord = completedWord.matched.toUpperCase();
  onWordCompleted(matchedWord); // Check mission progress

  const wordLength = completedWord.matched.length;
  const letterBonus = wordLength; // Bonus points equal to word length
  score += letterBonus * level;
  wordsCompleted++;
  streak++;
  bestStreak = Math.max(bestStreak, streak);

  // Show word completion message
  const wordDisplay = document.getElementById("wordCompleted");
  wordDisplay.textContent = `${completedWord.matched} +${letterBonus} BONUS!`;
  wordDisplay.classList.add("show");
  setTimeout(() => {
    wordDisplay.classList.remove("show");
  }, 2000);

  playWordCompleteSound();

  // Remove tail segments equal to word length
  for (let i = 0; i < wordLength && snake.length > 1; i++) {
    snake.pop();
  }

  // Reset current word
  currentWord = completedWord.remaining.split("");
  updateCurrentWordDisplay();
  updateSuggestions();
  updateScore();
}

function updateCurrentWordDisplay() {
  const display = document.getElementById("current-letters");
  if (currentWord.length === 0) {
    display.textContent = "READY";
    display.style.color = "#94a3b8";
  } else {
    display.textContent = currentWord.join(" ");
    display.style.color = "#00ff96";
  }
}

function updateScore() {
  document.getElementById("score").textContent = score;
  document.getElementById("words").textContent = wordsCompleted;
  document.getElementById("streak").textContent = streak;

  const currentHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

  if (score > currentHighScore) {
    localStorage.setItem(HIGH_SCORE_KEY, score);
    document.getElementById("highScore").textContent = "🎉" + score;
    playCheerSound();
  } else {
    document.getElementById("highScore").textContent = currentHighScore;
  }
}

function gameOver() {
  gameRunning = false;
  playGameOverSound();
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalWords").textContent = wordsCompleted;
  document.getElementById("finalStreak").textContent = bestStreak;
  document.getElementById("gameOver").style.display = "block";
}

function restartGame() {
  snake = [{ x: 300, y: 300 }];
  direction = { x: 0, y: 0 };
  letters = [];
  blockers = [];
  currentWord = [];
  score = 0;
  wordsCompleted = 0;
  level = 1; // Start at level 4 as in original
  streak = 0;
  gameRunning = true;
  gameSpeed = 200;
  hasPlayedCheer = false;
  isPaused = false;

  document.getElementById("gameOver").style.display = "none";
  const pauseEl = document.getElementById("pauseOverlay");
  if (pauseEl) pauseEl.style.display = "none";

  updateScore();
  updateCurrentWordDisplay();
  updateSuggestions();
  document.getElementById("level").textContent = level;
  updateMission(level);
  loadMissionWords(level);
  generateBlockers();

  gameLoop();
}

// Enhanced gameLoop function with proper pause handling
function gameLoop() {
  if (!gameRunning) return;

  if (isPaused) {
    // When paused, just schedule the next loop without updating game state
    setTimeout(gameLoop, gameSpeed);
    return;
  }

  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#16213e");
  gradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Maintain letter count based on level
  const maxLetters = Math.min(12 + Math.floor(level / 2), 20);
  while (letters.length < maxLetters) {
    spawnLetter();
  }

  moveSnake();
  drawSnake();
  drawLetters();
  drawBlockers(); // Draw the new blockers

  setTimeout(gameLoop, gameSpeed);
}

// Enhanced controls with proper pause functionality
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault(); // Prevent page scroll

    if (!gameRunning) return; // Don't allow pause when game is over

    isPaused = !isPaused;

    const pauseEl = document.getElementById("pauseOverlay");
    if (isPaused) {
      console.log("Game Paused");
      if (pauseEl) pauseEl.style.display = "flex";
    } else {
      console.log("Game Resumed");
      if (pauseEl) pauseEl.style.display = "none";
    }
    return; // Skip movement when pausing
  }

  if (!gameRunning || isPaused) return;

  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      if (direction.y === 0) {
        direction = { x: 0, y: -gridSize };
      }
      break;
    case "arrowdown":
    case "s":
      if (direction.y === 0) {
        direction = { x: 0, y: gridSize };
      }
      break;
    case "arrowleft":
    case "a":
      if (direction.x === 0) {
        direction = { x: -gridSize, y: 0 };
      }
      break;
    case "arrowright":
    case "d":
      if (direction.x === 0) {
        direction = { x: gridSize, y: 0 };
      }
      break;
  }
  e.preventDefault();
});

// Initialize game
for (let i = 0; i < 10; i++) {
  spawnLetter();
}
updateScore();
updateCurrentWordDisplay();
updateSuggestions();
gameLoop();
updateMission(level);

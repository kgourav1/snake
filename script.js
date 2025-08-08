// Game variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 30;
const canvasSize = 600;

let snake = [{ x: 300, y: 300 }];
let direction = { x: 0, y: 0 };
let letters = [];
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

// Expanded dictionary with more words
// const validWords = new Set([
//   "CAT",
//   "DOG",
//   "BIRD",
//   "FISH",
//   "TREE",
//   "BOOK",
//   "GAME",
//   "PLAY",
//   "FUN",
//   "WORD",
//   "SNAKE",
//   "APPLE",
//   "WATER",
//   "FIRE",
//   "WIND",
//   "SUN",
//   "MOON",
//   "STAR",
//   "SKY",
//   "SEA",
//   "LOVE",
//   "LIFE",
//   "TIME",
//   "HOME",
//   "FOOD",
//   "BLUE",
//   "RED",
//   "GREEN",
//   "HELP",
//   "SMILE",
//   "HAPPY",
//   "MAGIC",
//   "DREAM",
//   "PEACE",
//   "LIGHT",
//   "SOUND",
//   "MUSIC",
//   "DANCE",
//   "JUMP",
//   "RUN",
//   "HOUSE",
//   "CHAIR",
//   "TABLE",
//   "PHONE",
//   "POWER",
//   "HEART",
//   "WORLD",
//   "SPACE",
//   "OCEAN",
//   "MOUNTAIN",
//   "FLOWER",
//   "GARDEN",
//   "WINDOW",
//   "BRIDGE",
//   "PLANET",
//   "FRIEND",
//   "FAMILY",
//   "SCHOOL",
//   "BEACH",
//   "FOREST",
//   "YELLOW",
//   "ORANGE",
//   "PURPLE",
//   "SILVER",
//   "GOLDEN",
//   "BRIGHT",
//   "SHADOW",
//   "CIRCLE",
//   "SQUARE",
//   "TRIANGLE",
//   "ANIMAL",
//   "PLANTS",
//   "GROWTH",
//   "WINTER",
//   "SPRING",
//   "SUMMER",
//   "AUTUMN",
//   "SEASON",
//   "NATURE",
//   "ENERGY",
//   "STORM",
//   "CLOUD",
//   "RIVER",
//   "VALLEY",
//   "DESERT",
//   "JUNGLE",
//   "ISLAND",
//   "CASTLE",
//   "TEMPLE",
//   "PALACE",
// ]);

const validWords = new Set();

fetch("words_alpha.txt")
  .then((response) => response.text())
  .then((text) => {
    text.split("\n").forEach((word) => {
      const trimmed = word.trim();
      if (trimmed.length > 2) {
        validWords.add(trimmed.toUpperCase());
      }
    });

    // Example usage:
    console.log("Loaded words:", validWords.length);
    console.log("First 10 words:", validWords.slice(0, 10));
  })
  .catch((error) => console.error("Error loading word list:", error));

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
  if (hasPlayedCheer) return; // ❌ already played
  hasPlayedCheer = true; // ✅ mark as played
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
function getRandomLetter() {
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
    snake.some((segment) => segment.x === x && segment.y === y) &&
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
    // ctx.shadowColor = letterObj.glow;
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

function moveSnake() {
  if (direction.x === 0 && direction.y === 0) return;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Wall collision
  if (
    head.x < 0 ||
    head.x >= canvasSize ||
    head.y < 0 ||
    head.y >= canvasSize
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
      wordStr.length >= 3 &&
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
    for (let end = start + 3; end <= len; end++) {
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

  // Level up every 5 words instead of 3
  if (wordsCompleted % 5 === 0) {
    level++;
    // Make snake faster each level - more aggressive speed increase
    gameSpeed = Math.max(80, gameSpeed - 25);
    document.getElementById("level").textContent = level;
    showLevelUp();
  }
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
  currentWord = [];
  score = 0;
  wordsCompleted = 0;
  level = 1;
  streak = 0;
  gameRunning = true;
  gameSpeed = 200;
  hasPlayedCheer = false;

  document.getElementById("gameOver").style.display = "none";
  updateScore();
  updateCurrentWordDisplay();
  updateSuggestions();
  document.getElementById("level").textContent = level;

  gameLoop();
}

function gameLoop() {
  if (!gameRunning) return;

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

  setTimeout(gameLoop, gameSpeed);
}

// Controls
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

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

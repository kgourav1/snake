# 🐍 Snake Word Game

A fun and addictive **JavaScript-based Snake Word Game** where you form valid words from the snake’s tail and grow your score! Sharpen your vocabulary, react quickly, and level up as the snake speeds up with each level.

---

## 🎮 Game Concept

This is not your traditional snake game! In this game:

- You control a snake that collects **letters**.
- Combine collected letters to form **valid English words**.
- Each valid word shortens the snake's tail and gives you a **bonus score**.
- Wrong combinations? Try again by using the **last letter of the tail** to start a new word!
- As you form more words, you **level up**, and the game gets **faster and more challenging**.

---

## 🧠 How to Play

1. **Use arrow keys** to move the snake and collect letters.
2. Keep an eye on the letters forming in the **snake's tail**.
3. Press **Enter** to submit a word formed from the tail.
4. Only **valid English words** will be accepted.
5. If the word is valid:
   - The tail shortens.
   - You earn points: `Score = Word Length × Current Level`
   - A cheering sound will play if it's your **new high score** 🎉
6. If the word is invalid:
   - No penalty, but try to form a valid word using the **last letter** of the tail.
7. After every 5 valid words:
   - You **level up**.
   - The snake moves **faster**.
   - You earn higher bonuses for word formations.

---

## ✨ Features

- 🎯 Real-time gameplay and smooth controls
- 🧩 Dictionary-based word validation
- 🔊 Cheer sound for new high scores (played only once)
- 🚀 Dynamic difficulty: snake speed increases with level
- 📱 Responsive design for desktop and mobile
- 🎨 Beautiful and modern game layout

---

## 🏆 Scoring & Levels

| Word Length | Score at Level 1 | Score at Level 2 | ... |
| ----------- | ---------------- | ---------------- | --- |
| 3           | 3                | 6                | ... |
| 4           | 4                | 8                | ... |
| 5           | 5                | 10               | ... |

- **Level Up**: After 5 valid words.
- **Max Score**: Continually updates and saves your high score in `localStorage`.

---

## 📦 Technologies Used

- **HTML5** – Markup and layout
- **CSS3** – Styling and responsiveness
- **JavaScript (Vanilla)** – Game logic and interaction
- **Web Audio API** – Custom cheer sound
- **localStorage** – Save and persist high scores

---

## 🔊 Sound Note

The game includes a cheer sound when a new high score is achieved. To avoid annoyance:

- The cheer plays **only once per session**, not for every new score.

---

## 💡 Tip

> Got stuck? Try forming a word using the **last letter of the tail**. It may unlock possibilities you didn't expect!

---

## 🛠️ Setup

Just clone this repo and open the `index.html` in your browser.

```bash
git clone https://github.com/your-username/snake-word-game.git
cd snake-word-game
open index.html

---

👨‍💻 Author
Kumar Gourav
🎓 Passionate Developer | 🧠 Chess Lover | 🎮 Game Builder | 📚 Educator
📺 Let's Practice Together

📄 License
This project is open-source and free to use under the MIT License.
```

Skip to content
Chat history

You said:
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="style.css">
<title>Memory Card Game (JS)</title>

</head>
<body>
<div class="app">
<header>
<div class="title">🃏 Memory Card Game</div>
<div class="stats">
<div class="pill">Moves: <strong id="moves">0</strong></div>
<div class="pill">Time: <strong id="time">00:00</strong></div>
<div class="pill">Pairs: <strong id="pairs">0</strong>/<span
id="totalPairs">0</span></div>
<div class="pill small">Best: <strong id="best">—</strong></div>
</div>
<div class="controls">
<label for="size" class="small">Board</label>
<select id="size" title="Board size">
<option value="8">4×4 (8 pairs)</option>
<option value="10">5×4 (10 pairs)</option>
<option value="12">6×4 (12 pairs)</option>
</select>
<button id="restart">Restart</button>
</div>
</header>
<div id="grid" class="grid" aria-label="Memory board" role="grid"></div>
<div id="win" class="win">
<div><strong>🎉 You matched all pairs!</strong></div>
<div class="hint">Moves: <span id="finalMoves">0</span> • Time: <span
id="finalTime">00:00</span></div>
</div>
</div>
<script src="script.js">

</script>
</body>
</html>:root{
--bg:#0b1022; --panel:#0f172a; --text:#e5e7eb; --muted:#94a3b8;
--accent:#22c55e; --warn:#ef4444; --card:#111827; --ring:#1f2a44;
}
*{box-sizing:border-box}
body{
margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;
background:radial-gradient(1200px 600px at 10% 0%,#0a1530,#070b18), var(--bg);
color:var(--text); display:grid; min-height:100dvh; place-items:center; padding:18px;
}
.app{
width:100%; max-width:960px; background:var(--panel); border:1px solid var(--ring);
border-radius:20px; padding:18px; box-shadow:0 20px 60px rgba(0,0,0,.4);
}
header{display:flex; flex-wrap:wrap; gap:12px; align-items:center;
justify-content:space-between}
.title{font-weight:800; letter-spacing:.3px}
.stats{display:flex; gap:10px; flex-wrap:wrap}
.pill{padding:8px 12px; border:1px solid var(--ring); border-radius:999px; background:#0b162c}
.controls{display:flex; gap:8px; align-items:center}
button{
padding:10px 14px; border-radius:12px; border:1px solid #263246; background:#0e1d36;
color:var(--text); font-weight:600; cursor:pointer;
}
select{
padding:10px 12px; border-radius:12px; border:1px solid #263246; background:#0e1d36;
color:var(--text);
}
.grid{
margin-top:16px;
display:grid; gap:12px;
grid-template-columns: repeat(4, minmax(0,1fr));
}
@media (min-width:700px){
.grid{grid-template-columns: repeat(6, minmax(0,1fr));}
}
.card{
position:relative; aspect-ratio:3/4; border-radius:16px; perspective:1000px; cursor:pointer;
}
.card-inner{
position:absolute; inset:0; transition:transform .5s; transform-style:preserve-3d;
}
.card.flipped .card-inner{ transform:rotateY(180deg); }
.face{
position:absolute; inset:0; display:grid; place-items:center;
border:1px solid var(--ring); border-radius:16px; backface-visibility:hidden;
}
.front{ background:linear-gradient(145deg,#0c1b33,#0a1428); }
.back{ background:linear-gradient(145deg,#102038,#0c182c); transform:rotateY(180deg); }
.emoji{ font-size: clamp(28px, 6vw, 48px); filter: drop-shadow(0 6px 12px rgba(0,0,0,.35)); }
.front::after{
content:""; width:55%; height:55%; border-radius:14px; border:1px dashed #2a3a5a;
}
.win{
margin-top:14px; padding:12px; border-radius:14px; border:1px solid #244;
background:#0b1b2e;
display:none;
}
.win.show{ display:block; }
.small{ color:var(--muted); font-size:.95rem }
.hint{ margin-top:6px; color:var(--muted) }
.matched .front{ opacity:.25 }
.matched .back{ outline:2px solid rgba(34,197,94,.35) }// --- Config / Data ---
const EMOJIS =
["🍎","🍊","🍋","🍉","🍇","🍓","🍒","🥝","🍍","🥥","🥑","🌶️","🧀","🥨","🍔","🍟","🍕","🍪","🍰"
,"🧁","🍩","🍫","🍿","🥕","🍄","🥦","🌽","🍗","🍤","🍣","🍙","🍜","🍝","🌮","🌯","🥟","🥞"];
const gridEl = document.getElementById("grid");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const pairsEl = document.getElementById("pairs");
const totalPairsEl = document.getElementById("totalPairs");
const bestEl = document.getElementById("best");
const winEl = document.getElementById("win");
const finalMovesEl = document.getElementById("finalMoves");
const finalTimeEl = document.getElementById("finalTime");
const sizeSel = document.getElementById("size");
const restartBtn = document.getElementById("restart");
let deck = []; // [{id, emoji, matched, el}]
let first = null; // first flipped card
let second = null; // second flipped card
let lock = false; // lock board during checks
let moves = 0;
let pairs = 0;
let totalPairs = 0;
let timer = null; // interval id
let seconds = 0;
let running = false;
// --- Utils ---
const $fmtTime = s => {
const m = Math.floor(s/60), r = s%60;
return ${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')};
};
const shuffle = (arr) => {
const a = arr.slice();
for(let i=a.length-1;i>0;i--){
const j = Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];
}
return a;
};
const bestKey = pairs => memory_best_${pairs};
// --- Timer ---
function startTimer(){
if(running) return;
running = true;
timer = setInterval(()=>{
seconds++;
timeEl.textContent = $fmtTime(seconds);
},1000);
}
function stopTimer(){
running = false;
clearInterval(timer);
timer = null;
}
function resetTimer(){
stopTimer();
seconds = 0;
timeEl.textContent = "00:00";
}
// --- Board Setup ---
function buildDeck(nPairs){
const chosen = shuffle(EMOJIS).slice(0, nPairs);
const pairs = chosen.flatMap((e,i)=>[
{ id:${i}a, emoji:e, matched:false },
{ id:${i}b, emoji:e, matched:false }
]);
return shuffle(pairs);
}
function renderBoard(){
gridEl.innerHTML = "";
gridEl.style.setProperty("--cols", Math.min(totalPairs*2 >= 18 ? 6 : 4));
deck.forEach(card=>{
const cell = document.createElement("div");
cell.className = "card";
cell.setAttribute("role","button");
cell.setAttribute("aria-label","Hidden card");
cell.dataset.id = card.id;
const inner = document.createElement("div");
inner.className = "card-inner";
const front = document.createElement("div");
front.className = "face front";
const back = document.createElement("div");
back.className = "face back";
const span = document.createElement("div");
span.className = "emoji";
span.textContent = card.emoji;
back.appendChild(span);
inner.appendChild(front);
inner.appendChild(back);
cell.appendChild(inner);
gridEl.appendChild(cell);
card.el = cell;
cell.addEventListener("click", ()=> onFlip(card));
});
}
// --- Game Flow ---
function newGame(nPairs){
// reset state
first = second = null;
lock = false; moves = 0; pairs = 0;
totalPairs = nPairs;
movesEl.textContent = "0";
pairsEl.textContent = "0";
totalPairsEl.textContent = String(totalPairs);
winEl.classList.remove("show");
resetTimer();
// setup deck & board
deck = buildDeck(nPairs);
renderBoard();
// best display
const best = JSON.parse(localStorage.getItem(bestKey(nPairs)) || "null");
bestEl.textContent = best ? ${best.moves} in ${$fmtTime(best.time)} : "—";
}
function onFlip(card){
if(lock) return;
if(card.matched) return;
if(card === first) return;
// start timer on first action
if(!running) startTimer();
flip(card, true);
if(!first){ first = card; return; }
second = card;
lock = true;
moves++;
movesEl.textContent = String(moves);
// check match
if(first.emoji === second.emoji){
// Match
first.matched = second.matched = true;
card.el.classList.add("matched");
first.el.classList.add("matched");
pairs++;
pairsEl.textContent = String(pairs);
[first,second] = [null,null];
lock = false;
// Win?
if(pairs === totalPairs) onWin();
} else {
// Not a match: flip back after short delay
setTimeout(()=>{
flip(first, false);
flip(second, false);
[first,second] = [null,null];
lock = false;
}, 700);
}
}
function flip(card, show){
if(!card?.el) return;
card.el.classList.toggle("flipped", show);
}
function onWin(){
stopTimer();
finalMovesEl.textContent = String(moves);
finalTimeEl.textContent = $fmtTime(seconds);
winEl.classList.add("show");
// Save best (lower moves prioritized, then lower time)
const key = bestKey(totalPairs);
const prev = JSON.parse(localStorage.getItem(key) || "null");
const current = { moves, time: seconds, date: new Date().toISOString() };
const better = !prev ||
current.moves < prev.moves ||
(current.moves === prev.moves && current.time < prev.time);
if(better){
localStorage.setItem(key, JSON.stringify(current));
bestEl.textContent = ${current.moves} in ${$fmtTime(current.time)};
}
}
// --- Events ---
restartBtn.addEventListener("click", ()=> newGame(Number(sizeSel.value)));
sizeSel.addEventListener("change", ()=> newGame(Number(sizeSel.value)));
// --- Init ---
newGame(Number(sizeSel.value)); creat a redme for this game
ChatGPT said:
Got it ✅
Here’s a clean README.md you can use for your Memory Card Game project:

🃏 Memory Card Game (JavaScript)
A simple and fun Memory Matching Card Game built with HTML, CSS, and Vanilla JavaScript.
Test your memory by flipping cards, matching emoji pairs, and try to beat your best score in the least moves and shortest time possible!

🎮 Features
. 🎴 Multiple Board Sizes

. 4×4 (8 pairs)

. 5×4 (10 pairs)

. 6×4 (12 pairs)

. ⏱️ Timer & Move Counter

. Tracks elapsed time

. Counts every move

.🏆 Best Score Tracking

. Saves best performance (moves & time) in localStorage

. 🎉 Win Screen

. Displays stats when all pairs are matched

.📱 Responsive Design

. Works on desktop & mobile

🚀 Demo
(If you host it on GitHub Pages or Netlify, add the link here)
👉 Play the Game

📂 Project Structure
memory-card-game/
│── index.html      # Game UI
│── style.css       # Styles
│── script.js       # Game logic
⚙️ How to Play
1. Select a board size (4x4, 5x4, or 6x4).

2. Click on a card to flip it.

3. Match two identical emoji cards.

4. Keep flipping until all pairs are matched.

5. Try to finish with the fewest moves and fastest time!

🛠️ Technologies Used
. HTML5 – Structure

. CSS3 – Styling (modern gradients, animations, responsive grid)

. JavaScript (ES6) – Game logic & interactivity

📸 Screenshots
Add a screenshot of your game here (optional).

🔮 Future Improvements
. Add sound effects 🎵

. Difficulty levels (easy/medium/hard)

. Themed decks (animals, fruits, flags, etc.)

. Multiplayer / Leaderboard

👨‍💻 Author
Made with ❤️ using Vanilla JavaScript.

Would you like me to also format this into an actual README.md file (Markdown file) that you can drop directly into your project folder?




No file chosenNo file chosen
ChatGPT can make mistakes. Check important info.

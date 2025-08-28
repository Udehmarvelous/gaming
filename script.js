// --- Config / Data ---
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
return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
};
const shuffle = (arr) => {
const a = arr.slice();
for(let i=a.length-1;i>0;i--){
const j = Math.floor(Math.random()*(i+1));
[a[i],a[j]]=[a[j],a[i]];
}
return a;
};
const bestKey = pairs => `memory_best_${pairs}`;
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
{ id:`${i}a`, emoji:e, matched:false },
{ id:`${i}b`, emoji:e, matched:false }
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
bestEl.textContent = best ? `${best.moves} in ${$fmtTime(best.time)}` : "—";
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
bestEl.textContent = `${current.moves} in ${$fmtTime(current.time)}`;
}
}
// --- Events ---
restartBtn.addEventListener("click", ()=> newGame(Number(sizeSel.value)));
sizeSel.addEventListener("change", ()=> newGame(Number(sizeSel.value)));
// --- Init ---
newGame(Number(sizeSel.value));
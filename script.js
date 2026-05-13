let room = null;
let isHost = false;
let gameData = [];
let current = 0;
let players = {};

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

show("home");

// ===== CREATE ROOM =====
function createRoom() {
  const name = document.getElementById("hostName").value;
  const code = Math.random().toString(36).substring(2,6).toUpperCase();

  room = code;
  isHost = true;

  players = {};
  players["host"] = { name, score: 0 };

  fbSet(fbRef(window.db, "rooms/" + code), {
    players,
    gameStarted: false,
    question: 0
  });

  listenRoom(code);
  document.getElementById("roomCodeBox").innerText = code;
  show("lobby");
}

// ===== JOIN =====
function joinRoom() {
  const name = document.getElementById("playerName").value;
  const code = document.getElementById("joinCode").value;

  room = code;

  const id = Date.now();

  fbSet(fbRef(window.db, `rooms/${code}/players/${id}`), {
    name,
    score: 0
  });

  listenRoom(code);
  show("lobby");
}

// ===== LISTEN =====
function listenRoom(code) {
  fbOn(fbRef(window.db, "rooms/" + code), snap => {
    const data = snap.val();
    if (!data) return;

    document.getElementById("roomCode").innerText = code;

    const div = document.getElementById("players");
    div.innerHTML = "";

    for (let id in data.players) {
      div.innerHTML += `<div>👤 ${data.players[id].name}</div>`;
    }

    if (data.gameStarted && !isHost) {
      gameData = QUESTIONS[data.theme];
      current = data.question;
      showQuestion();
      show("game");
    }
  });
}

// ===== START =====
function startGame(theme) {
  gameData = QUESTIONS[theme];

  fbUpdate(fbRef(window.db, "rooms/" + room), {
    gameStarted: true,
    theme,
    question: 0
  });

  showQuestion();
  show("game");
}

// ===== QUESTION =====
function showQuestion() {
  const q = gameData[current];

  document.getElementById("question").innerText = q.q;

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  q.a.forEach((t,i)=>{
    const d = document.createElement("div");
    d.className = "answer";
    d.innerText = t;

    d.onclick = () => {
      if (i === q.correct) alert("✔ правильно");
      else alert("✖ неверно");

      next();
    };

    answers.appendChild(d);
  });
}

// ===== NEXT =====
function next() {
  current++;

  fbUpdate(fbRef(window.db, "rooms/" + room), {
    question: current
  });

  if (current < gameData.length) showQuestion();
  else showResults();
}

// ===== RESULTS =====
function showResults() {
  show("results");
  document.getElementById("winners").innerText = "Игра окончена 🏆";
}
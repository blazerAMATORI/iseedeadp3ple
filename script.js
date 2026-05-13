let room = null;
let isHost = false;
let gameData = QUESTIONS;
let currentQuestion = 0;
let answered = false;
let timer = 15;
let timerInterval;

// ===== SCREEN =====
function show(id) {
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

// ===== CREATE ROOM =====
function createRoom() {
  const name = document.getElementById("hostName").value;

  const code = Math.random()
    .toString(36)
    .substring(2,6)
    .toUpperCase();

  room = code;
  isHost = true;

  fbSet(fbRef(db, "rooms/" + code), {
    host: name,
    started: false,
    question: 0,
    players: {}
  });

  addPlayer(name);
  listenRoom();

  document.getElementById("roomCodeBox").innerText =
    "КОД КОМНАТЫ: " + code;

  show("lobby");
}

// ===== JOIN =====
function joinRoom() {
  const name = document.getElementById("playerName").value;
  const code = document.getElementById("joinCode").value;

  room = code;

  addPlayer(name);

  listenRoom();

  show("lobby");
}

// ===== ADD PLAYER =====
function addPlayer(name) {
  const id = localStorage.getItem("playerId") || Date.now();

  localStorage.setItem("playerId", id);

  fbSet(
    fbRef(db, `rooms/${room}/players/${id}`),
    {
      name,
      score: 0
    }
  );
}

// ===== LISTENER =====
function listenRoom() {
  fbOn(fbRef(db, "rooms/" + room), snap=>{
    const data = snap.val();

    if(!data) return;

    renderPlayers(data.players);

    if(data.started) {
      currentQuestion = data.question;

      if(currentQuestion >= gameData.length) {
        showWinner(data.players);
      } else {
        showQuestion();
        show("game");
      }
    }
  });
}

// ===== RENDER PLAYERS =====
function renderPlayers(players) {
  const div = document.getElementById("players");

  div.innerHTML = "";

  for(let id in players) {
    div.innerHTML += `
      <div class="player">
        👤 ${players[id].name}
        — ${players[id].score} pts
      </div>
    `;
  }
}

// ===== START =====
function startGame() {
  fbUpdate(
    fbRef(db, "rooms/" + room),
    {
      started: true,
      question: 0
    }
  );
}

// ===== SHOW QUESTION =====
function showQuestion() {
  answered = false;

  const q = gameData[currentQuestion];

  document.getElementById("question").innerText = q.q;

  const answers = document.getElementById("answers");

  answers.innerHTML = "";

  q.a.forEach((ans,i)=>{
    const btn = document.createElement("button");

    btn.className = "answer";

    btn.innerText = ans;

    btn.onclick = ()=>{
      if(answered) return;

      answered = true;

      clearInterval(timerInterval);

      document
        .querySelectorAll(".answer")
        .forEach((b,index)=>{
          if(index === q.correct)
            b.style.background = "#00ff99";

          else
            b.style.background = "#ff3355";
        });

      if(i === q.correct) {
        addScore(timer);
      }

      setTimeout(()=>{
        if(isHost) nextQuestion();
      },3000);
    };

    answers.appendChild(btn);
  });

  startTimer();
}

// ===== TIMER =====
function startTimer() {
  timer = 15;

  document.getElementById("timer")
    .innerText = timer;

  clearInterval(timerInterval);

  timerInterval = setInterval(()=>{

    timer--;

    document.getElementById("timer")
      .innerText = timer;

    if(timer <= 0) {
      clearInterval(timerInterval);

      if(isHost)
        nextQuestion();
    }

  },1000);
}

// ===== SCORE =====
function addScore(points) {
  const id = localStorage.getItem("playerId");

  const refPath =
    fbRef(db,
      `rooms/${room}/players/${id}/score`
    );

  fbOn(refPath, snap=>{
    const current = snap.val() || 0;

    fbSet(refPath, current + points);
  }, { onlyOnce: true });
}

// ===== NEXT =====
function nextQuestion() {
  fbUpdate(
    fbRef(db, "rooms/" + room),
    {
      question: currentQuestion + 1
    }
  );
}

// ===== WINNER =====
function showWinner(players) {

  show("results");

  const arr = Object.values(players)
    .sort((a,b)=>b.score-a.score);

  const winner = arr[0];

  document.getElementById("winners")
    .innerHTML = `
      <div class="winnerCircle">
        🏆
      </div>

      <h1>${winner.name}</h1>

      <h2>${winner.score} pts</h2>

      <p>ПОБЕДИТЕЛЬ</p>
    `;
}

const gameContainer = document.getElementById("game-container");
const startMenu = document.getElementById("start-menu");
const mazeArea = document.getElementById("maze-area");
const mobileControls = document.getElementById("mobile-controls");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const canvas = document.getElementById("maze-canvas");
const ctx = canvas.getContext("2d");
const timerElement = document.getElementById("time-left");

let maze, player, exit;
let gameInterval, timerInterval;
let timeLeft = 5 * 60; // 5 minutes in seconds
let isPaused = false;

const CELL_SIZE = 20;
const ROWS = 20;
const COLS = 20;

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;
  }
}

function generateMaze() {
  maze = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => new Cell(row, col))
  );

  const stack = [];
  const startCell = maze[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const currentCell = stack.pop();
    const neighbors = getUnvisitedNeighbors(currentCell);

    if (neighbors.length > 0) {
      stack.push(currentCell);
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(currentCell, chosen);
      chosen.visited = true;
      stack.push(chosen);
    }
  }

  player = { row: 0, col: 0 };
  exit = { row: ROWS - 1, col: COLS - 1 };
}

function getUnvisitedNeighbors(cell) {
  const { row, col } = cell;
  const neighbors = [];

  if (row > 0 && !maze[row - 1][col].visited)
    neighbors.push(maze[row - 1][col]);
  if (col < COLS - 1 && !maze[row][col + 1].visited)
    neighbors.push(maze[row][col + 1]);
  if (row < ROWS - 1 && !maze[row + 1][col].visited)
    neighbors.push(maze[row + 1][col]);
  if (col > 0 && !maze[row][col - 1].visited)
    neighbors.push(maze[row][col - 1]);

  return neighbors;
}

function removeWall(cell1, cell2) {
  const rowDiff = cell2.row - cell1.row;
  const colDiff = cell2.col - cell1.col;

  if (rowDiff === 1) {
    cell1.walls.bottom = false;
    cell2.walls.top = false;
  } else if (rowDiff === -1) {
    cell1.walls.top = false;
    cell2.walls.bottom = false;
  } else if (colDiff === 1) {
    cell1.walls.right = false;
    cell2.walls.left = false;
  } else if (colDiff === -1) {
    cell1.walls.left = false;
    cell2.walls.right = false;
  }
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = maze[row][col];
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;

      ctx.strokeStyle = "#000";
      ctx.beginPath();
      if (cell.walls.top) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + CELL_SIZE, y);
      }
      if (cell.walls.right) {
        ctx.moveTo(x + CELL_SIZE, y);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
      }
      if (cell.walls.bottom) {
        ctx.moveTo(x, y + CELL_SIZE);
        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
      }
      if (cell.walls.left) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + CELL_SIZE);
      }
      ctx.stroke();
    }
  }

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(
    player.col * CELL_SIZE + 2,
    player.row * CELL_SIZE + 2,
    CELL_SIZE - 4,
    CELL_SIZE - 4
  );

  // Draw exit
  ctx.fillStyle = "green";
  ctx.fillRect(
    exit.col * CELL_SIZE + 2,
    exit.row * CELL_SIZE + 2,
    CELL_SIZE - 4,
    CELL_SIZE - 4
  );
}

function movePlayer(direction) {
  if (isPaused) return;

  const currentCell = maze[player.row][player.col];
  let newRow = player.row;
  let newCol = player.col;

  switch (direction) {
    case "up":
      if (!currentCell.walls.top) newRow--;
      break;
    case "right":
      if (!currentCell.walls.right) newCol++;
      break;
    case "down":
      if (!currentCell.walls.bottom) newRow++;
      break;
    case "left":
      if (!currentCell.walls.left) newCol--;
      break;
  }

  if (newRow !== player.row || newCol !== player.col) {
    player.row = newRow;
    player.col = newCol;
    drawMaze();
    checkWinCondition();
  }
}

function checkWinCondition() {
  if (player.row === exit.row && player.col === exit.col) {
    endGame(true);
  }
}

function updateTimer() {
  if (!isPaused) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;

    if (timeLeft <= 0) {
      endGame(false);
    } else {
      timeLeft--;
    }
  }
}

function startGame() {
  startMenu.style.display = "none";
  mazeArea.style.display = "block";
  if (window.innerWidth <= 768) {
    mobileControls.style.display = "grid";
  }

  generateMaze();
  drawMaze();

  timeLeft = 5 * 60; // Reset to 5 minutes
  isPaused = false;
  timerInterval = setInterval(updateTimer, 1000);

  document.addEventListener("keydown", handleKeyPress);
}

function endGame(win) {
  clearInterval(timerInterval);
  document.removeEventListener("keydown", handleKeyPress);

  const endScreen = document.createElement("div");
  endScreen.id = "end-screen";
  endScreen.innerHTML = `
        <h2>${
          win ? "Congratulations! You escaped!" : "Time's up! You're trapped!"
        }</h2>
        <button id="restart-button">Play Again</button>
    `;

  gameContainer.innerHTML = "";
  gameContainer.appendChild(endScreen);

  document.getElementById("restart-button").addEventListener("click", () => {
    location.reload();
  });
}

function handleKeyPress(e) {
  switch (e.key) {
    case "ArrowUp":
      movePlayer("up");
      break;
    case "ArrowRight":
      movePlayer("right");
      break;
    case "ArrowDown":
      movePlayer("down");
      break;
    case "ArrowLeft":
      movePlayer("left");
      break;
  }
}

function togglePause() {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);

// Mobile controls
document.getElementById("up").addEventListener("click", () => movePlayer("up"));
document
  .getElementById("right")
  .addEventListener("click", () => movePlayer("right"));
document
  .getElementById("down")
  .addEventListener("click", () => movePlayer("down"));
document
  .getElementById("left")
  .addEventListener("click", () => movePlayer("left"));

// Responsive canvas sizing
window.addEventListener("resize", () => {
  if (window.innerWidth <= 768) {
    canvas.width = window.innerWidth - 20;
    canvas.height = canvas.width;
    CELL_SIZE = canvas.width / COLS;
    drawMaze();
  } else {
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    drawMaze();
  }
});

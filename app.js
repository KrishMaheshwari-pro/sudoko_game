// Example starting puzzle: 0 = empty
const EASY_PUZZLES = [
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  "009000000080605020501078006000001090040000070010700000600820905090306080000000600",
];

const DEFAULT_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";

const size = 9;
let givenGrid = parsePuzzle(DEFAULT_PUZZLE);
let grid = cloneGrid(givenGrid);

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const btnCheck = document.getElementById("btn-check");
const btnSolve = document.getElementById("btn-solve");
const btnReset = document.getElementById("btn-reset");
const btnNew = document.getElementById("btn-new");

init();

function init() {
  renderBoard();
  attachHandlers();
  setStatus("Ready.");
}

function parsePuzzle(str) {
  if (!str || str.length !== 81) throw new Error("Invalid puzzle string");
  const g = [];
  for (let r = 0; r < size; r++) {
    g[r] = [];
    for (let c = 0; c < size; c++) {
      const ch = str[r * 9 + c];
      g[r][c] = (ch === "." || ch === "0") ? 0 : Number(ch);
    }
  }
  return g;
}

function cloneGrid(g) {
  return g.map(row => row.slice());
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = `cell row-${r} col-${c}`;
      const input = document.createElement("input");
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("aria-label", `Row ${r+1} Column ${c+1}`);
      input.maxLength = 1;

      const val = grid[r][c];
      if (givenGrid[r][c] !== 0) {
        input.value = String(givenGrid[r][c]);
        input.disabled = true;
      } else {
        input.value = val ? String(val) : "";
        input.addEventListener("input", (e) => {
          let v = e.target.value.replace(/[^\d]/g, "");
          if (v === "0") v = "";
          if (v.length > 1) v = v.slice(-1);
          e.target.value = v;
          grid[r][c] = v ? Number(v) : 0;
          validateBoardVisual();
          setStatus("");
        });
        input.addEventListener("blur", () => {
          if (!/^[1-9]$/.test(input.value)) {
            input.value = "";
            grid[r][c] = 0;
          }
          validateBoardVisual();
        });
      }
      cell.appendChild(input);
      boardEl.appendChild(cell);
    }
  }
  validateBoardVisual();
}

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function isValidPlacement(g, row, col, num) {
  for (let c = 0; c < size; c++) if (g[row][c] === num && c !== col) return false;
  for (let r = 0; r < size; r++) if (g[r][col] === num && r !== row) return false;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (g[r][c] === num && !(r === row && c === col)) return false;
  return true;
}

function validateBoardVisual() {
  for (const cell of boardEl.children) cell.classList.remove("error");
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (!isValidPlacement(grid, r, c, val)) {
        const idx = r * 9 + c;
        boardEl.children[idx].classList.add("error");
      }
    }
  }
}

function findEmpty(g) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (g[r][c] === 0) return [r, c];
  return null;
}

function solveSudoku(g) {
  const empty = findEmpty(g);
  if (!empty) return true;
  const [row, col] = empty;

  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(g, row, col, num)) {
      g[row][col] = num;
      if (solveSudoku(g)) return true;
      g[row][col] = 0;
    }
  }
  return false;
}

function readFromUI() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * 9 + c;
      const input = boardEl.children[idx].querySelector("input");
      const v = input.value.trim();
      grid[r][c] = v ? Number(v) : 0;
    }
  }
}

function writeToUI() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * 9 + c;
      const input = boardEl.children[idx].querySelector("input");
      if (!input.disabled) input.value = grid[r][c] ? String(grid[r][c]) : "";
    }
  }
  validateBoardVisual();
}

function isGridValid(g) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = g[r][c];
      if (v === 0) continue;
      if (!isValidPlacement(g, r, c, v)) return false;
    }
  }
  return true;
}

function attachHandlers() {
  btnCheck.addEventListener("click", () => {
    readFromUI();
    if (!isGridValid(grid)) {
      setStatus("Conflicts found. Fix highlighted cells.");
      validateBoardVisual();
      return;
    }
    const done = !findEmpty(grid);
    setStatus(done ? "Looks solved! Great job." : "No conflicts so far. Keep going!");
  });

  btnSolve.addEventListener("click", () => {
    readFromUI();
    if (!isGridValid(grid)) {
      setStatus("Cannot solve: fix conflicts first.");
      validateBoardVisual();
      return;
    }
    const g = cloneGrid(grid);
    const ok = solveSudoku(g);
    if (!ok) {
      setStatus("No solution found for this puzzle.");
      return;
    }
    grid = g;
    writeToUI();
    setStatus("Solved.");
  });

  btnReset.addEventListener("click", () => {
    grid = cloneGrid(givenGrid);
    renderBoard();
    setStatus("Reset to initial puzzle.");
  });

  btnNew.addEventListener("click", () => {
    const pick = EASY_PUZZLES[Math.floor(Math.random() * EASY_PUZZLES.length)];
    givenGrid = parsePuzzle(pick);
    grid = cloneGrid(givenGrid);
    renderBoard();
    setStatus("Loaded a new easy puzzle.");
  });
}

const flagImage = '<img src="images/flag.png">';
const bombImage = '<img src="images/bomb.png">';
const wrongBombImage = '<img src="images/wrong-bomb.png">'
const sizeLookup = {
  '16': {totalTime: 40, tableWidth: '420px'},
};
const colors = [
  '#0000FA',
  '#4B802D',
  '#DB1300',
  '#202081',
  '#690400',
  '#457A7A',
  '#1B1B1B',
  '#7A7A7A',
];

let size = 16;
let board;
let bombCount;
let timeElapsed;
let adjBombs;
let hitBomb;
let elapsedTime;
let timerId;
let winner;

let boardEl = document.getElementById('board');

  init();
  render('game-board');

boardEl.addEventListener('click', function(e) {
  if (winner || hitBomb) return;
  let clickedEl;
  clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  if (clickedEl.classList.contains('game-cell')) {
    if (!timerId) setTimer();
    let row = parseInt(clickedEl.dataset.row);
    let col = parseInt(clickedEl.dataset.col);
    let cell = board[row][col];
    if (e.shiftKey && !cell.revealed && bombCount > 0) {
      bombCount += cell.flag() ? -1 : 1;
    } else {
      hitBomb = cell.reveal();
      if (hitBomb) {
        revealAll();
        clearInterval(timerId);
        e.target.style.backgroundColor = 'red';
      }
    }
    winner = getWinner();
    render();
  }
});

function createResetListener() { 
  document.getElementById('reset').addEventListener('click', function() {
    init();
    render();
  });
}

function setTimer () {
  timerId = setInterval(function(){
    elapsedTime += 1;
    document.getElementById('timer').innerText = elapsedTime.toString().padStart(3, '0');
  }, 1000);
};

function revealAll() {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cell.reveal();
    });
  });
};

function buildTable() {
  let topRow = `
    <tr>
      <td class="menu" colspan="${size}">
          <section id="status-bar">
            <div id="bomb-counter">000</div>
            <div id="reset"><img src="images/smiley-face.png"></div>
            <div id="timer">000</div>
          </section>
      </td>
    </tr>
    `;
  boardEl.innerHTML = topRow + `<tr>${'<td class="game-cell"></td>'.repeat(size)}</tr>`.repeat(size);
  boardEl.style.width = sizeLookup[size].tableWidth;
  createResetListener();
  let cells = Array.from(document.querySelectorAll('td:not(.menu)'));
  cells.forEach(function(cell, idx) {
    cell.setAttribute('data-row', Math.floor(idx / size));
    cell.setAttribute('data-col', idx % size);
  });
}

function buildArrays() {
  let arr = Array(size).fill(null);
  arr = arr.map(function() {
    return new Array(size).fill(null);
  });
  return arr;
};

function buildCells(){
  board.forEach(function(rowArr, rowIdx) {
    rowArr.forEach(function(slot, colIdx) {
      board[rowIdx][colIdx] = new Cell(rowIdx, colIdx, board);
    });
  });
  addBombs();
  runCodeForAllCells(function(cell){
    cell.calcAdjBombs();
  });
};

function init() {
  buildTable();
  board = buildArrays();
  buildCells();
  bombCount = getBombCount();
  elapsedTime = 0;
  clearInterval(timerId);
  timerId = null;
  hitBomb = false;
  winner = false;
};

function getBombCount() {
  let count = 0;
  board.forEach(function(row){
    count += row.filter(function(cell) {
      return cell.bomb;
    }).length
  });
  return count;
};

function addBombs() {
  let currentTotalTime = sizeLookup[`${size}`].totalTime;
  while (currentTotalTime !== 0) {
    let row = Math.floor(Math.random() * size);
    let col = Math.floor(Math.random() * size);
    let currentCell = board[row][col]
    if (!currentCell.bomb){
      currentCell.bomb = true
      currentTotalTime -= 1
    }
  }
};

function getWinner() {
  for (let row = 0; row<board.length; row++) {
    for (let col = 0; col<board[0].length; col++) {
      let cell = board[row][col];
      if (!cell.revealed && !cell.bomb) return false;
    }
  } 
  return true;
};

function render() {
  document.getElementById('bomb-counter').innerText = bombCount.toString().padStart(3, '0');
  let tdList = Array.from(document.querySelectorAll('[data-row]'));
  tdList.forEach(function(td) {
    let rowIdx = parseInt(td.getAttribute('data-row'));
    let colIdx = parseInt(td.getAttribute('data-col'));
    let cell = board[rowIdx][colIdx];
    if (cell.flagged) {
      td.innerHTML = flagImage;
    } else if (cell.revealed) {
      if (cell.bomb) {
        td.innerHTML = bombImage;
      } else if (cell.adjBombs) {
        td.className = 'revealed'
        td.style.color = colors[cell.adjBombs];
        td.textContent = cell.adjBombs;
      } else {
        td.className = 'revealed'
      }
    } else {
      td.innerHTML = '';
    }
  });
  if (hitBomb) {
    document.getElementById('reset').innerHTML = '<img src=images/dead-face.png>';
    runCodeForAllCells(function(cell) {
      if (!cell.bomb && cell.flagged) {
        let td = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
        td.innerHTML = wrongBombImage;
      }
    });
  } else if (winner) {
    document.getElementById('reset').innerHTML = '<img src=images/cool-face.png>';
    clearInterval(timerId);
  }
};

function runCodeForAllCells(cb) {
  board.forEach(function(rowArr) {
    rowArr.forEach(function(cell) {
      cb(cell);
    });
  });
}

init();
render();
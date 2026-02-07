class GridGame {
    constructor(size = 25) {
        this.size = size;
        this.grid = [];
        this.currentPositions = []; // 改为多个起点
        this.currentPath = [];
        this.maxPathLength = 0;
        this.stepCount = 0;
        this.selectingStart = false;
        this.startColors = []; // 每个起点的颜色

        // 历史记录用于撤销/重做
        this.history = [];
        this.historyIndex = -1;

        this.init();
    }

    init() {
        this.generateGrid();
        this.renderGrid();
        this.bindEvents();
        this.updateStats();
    }

    generateGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                const num = Math.floor(Math.random() * 10);
                const letter = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
                row.push(`${letter}${num}`);
            }
            this.grid.push(row);
        }
    }

    generateStartColor(index) {
        const colors = [
            '#48bb78', // 绿色
            '#ed8936', // 橙色
            '#4299e1', // 蓝色
            '#ed64a6', // 粉色
            '#9f7aea', // 紫色
            '#48bb78', // 绿色（重复）
            '#f6ad55', // 浅橙
            '#63b3ed', // 浅蓝
        ];
        return colors[index % colors.length];
    }

    renderGrid() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const cellContent = this.grid[i][j];
                cell.textContent = cellContent || '·';
                cell.dataset.row = i;
                cell.dataset.col = j;

                // 空格子样式
                if (!cellContent) {
                    cell.classList.add('empty');
                }
                // 检查是否是当前起点之一
                else {
                    const posIndex = this.currentPositions.findIndex(
                        pos => pos[0] === i && pos[1] === j
                    );
                    if (posIndex !== -1) {
                        cell.classList.add('current');
                        cell.style.backgroundColor = this.startColors[posIndex];
                        cell.style.borderColor = this.startColors[posIndex];
                    }
                    // 高亮可选择的起点
                    else if (this.selectingStart) {
                        cell.classList.add('selectable');
                    }
                }

                cell.addEventListener('click', () => this.handleCellClick(i, j));
                board.appendChild(cell);
            }
        }

        this.updateAvailableMoves();
    }

    isInPath(row, col) {
        return this.currentPath.some(pos => pos[0] === row && pos[1] === col);
    }

    handleCellClick(row, col) {
        if (this.selectingStart) {
            // 只能选择非空格子作为起点
            if (this.grid[row][col]) {
                // 检查是否已经选择了这个位置
                const existingIndex = this.currentPositions.findIndex(
                    pos => pos[0] === row && pos[1] === col
                );

                if (existingIndex !== -1) {
                    // 如果已选择，则取消选择
                    this.currentPositions.splice(existingIndex, 1);
                    this.startColors.splice(existingIndex, 1);
                } else {
                    // 添加新起点
                    this.currentPositions.push([row, col]);
                    this.startColors.push(this.generateStartColor(this.currentPositions.length - 1));
                }

                this.renderGrid();
                this.updateStartPointsList();
            } else {
                alert('请选择一个非空格子作为起点！');
            }
        }
    }

    finishSelectingStarts() {
        if (this.currentPositions.length === 0) {
            alert('请至少选择一个起点！');
            return;
        }

        this.selectingStart = false;
        this.currentPath = this.currentPositions.map(pos => [...pos]);

        if (this.currentPath.length > this.maxPathLength) {
            this.maxPathLength = this.currentPath.length;
        }

        // 保存初始状态
        this.saveState();

        this.updateStats();
        this.updatePathDisplay();
        this.renderGrid();
    }

    updateStartPointsList() {
        const startsList = document.getElementById('startPointsList');
        if (!startsList) return;

        if (this.currentPositions.length === 0) {
            startsList.innerHTML = '<p class="empty-message">点击棋盘选择起点</p>';
        } else {
            startsList.innerHTML = this.currentPositions.map((pos, index) => {
                const cell = this.grid[pos[0]][pos[1]];
                return `<div class="start-point-item" style="border-left-color: ${this.startColors[index]}">
                    <span>起点${index + 1}: (${pos[0]}, ${pos[1]}) [${cell}]</span>
                </div>`;
            }).join('');
        }
    }

    getNeighbors(pos) {
        const [row, col] = pos;
        const neighbors = [];
        const directions = [
            [-1, 0, '↑'],  // 上
            [1, 0, '↓'],   // 下
            [0, -1, '←'],  // 左
            [0, 1, '→']    // 右
        ];

        for (const [dr, dc, symbol] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                neighbors.push([[newRow, newCol], symbol]);
            }
        }

        return neighbors;
    }

    canMove(fromPos, toPos) {
        const fromCell = this.grid[fromPos[0]][fromPos[1]];
        const toCell = this.grid[toPos[0]][toPos[1]];

        // 允许移动到空格子
        if (!toCell) {
            return true;
        }

        const fromLetter = fromCell[0];
        const fromNum = fromCell[1];
        const toLetter = toCell[0];
        const toNum = toCell[1];

        return fromNum === toNum || fromLetter === toLetter;
    }

    mergeCells(fromPos, toPos) {
        const fromCell = this.grid[fromPos[0]][fromPos[1]];
        const toCell = this.grid[toPos[0]][toPos[1]];

        // 如果目标格子是空的，把原格子的内容移动过去
        if (!toCell) {
            this.grid[toPos[0]][toPos[1]] = fromCell;  // 目标位置设为原内容
            this.grid[fromPos[0]][fromPos[1]] = '';    // 清空原位置
            return toPos;
        }

        const fromLetter = fromCell[0];
        const fromNum = parseInt(fromCell[1]);
        const toLetter = toCell[0];
        const toNum = parseInt(toCell[1]);

        let newNum, newLetter;

        // 数字和字母都相同
        if (fromNum === toNum && fromLetter === toLetter) {
            newNum = toNum;
            newLetter = toLetter;
        }
        // 只有字母相同
        else if (fromLetter === toLetter) {
            newNum = (fromNum + toNum) % 10;
            newLetter = toLetter;
        }
        // 只有数字相同
        else {
            const letterMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 0 };
            const reverseMap = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 0: 'E' };
            const newLetterVal = (letterMap[fromLetter] + letterMap[toLetter]) % 5;
            newLetter = reverseMap[newLetterVal];
            newNum = toNum;
        }

        // 清空原来的格子
        this.grid[fromPos[0]][fromPos[1]] = '';
        // 更新目标格子
        this.grid[toPos[0]][toPos[1]] = `${newLetter}${newNum}`;
        return toPos;
    }

    move(direction) {
        if (this.currentPositions.length === 0) {
            alert('请先选择起点！');
            return;
        }

        const directionMap = {
            'up': [-1, 0],
            'down': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };

        const [dr, dc] = directionMap[direction];
        const newPositions = [];
        const pathIncremented = [];

        // 检查所有起点的移动
        for (let i = 0; i < this.currentPositions.length; i++) {
            const [currentRow, currentCol] = this.currentPositions[i];
            const newRow = currentRow + dr;
            const newCol = currentCol + dc;

            // 检查边界
            if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
                // 撞墙，保持原位置
                newPositions.push([currentRow, currentCol]);
                pathIncremented.push(false);
                continue;
            }

            const newPos = [newRow, newCol];
            const targetCell = this.grid[newPos[0]][newPos[1]];

            // 检查是否可以移动
            if (!this.canMove(this.currentPositions[i], newPos)) {
                // 无法移动，保持原位置
                newPositions.push([currentRow, currentCol]);
                pathIncremented.push(false);
                continue;
            }

            // 执行移动
            const resultPos = this.mergeCells(this.currentPositions[i], newPos);
            newPositions.push(resultPos);

            // 判断是否计入路径
            if (targetCell) {
                pathIncremented.push(true);
            } else {
                pathIncremented.push(false);
            }
        }

        // 更新所有起点位置
        this.currentPositions = newPositions;

        // 检查是否有起点被消除（移动到了同一个位置）
        const uniquePositions = [];
        const uniqueColors = [];
        const seenPositions = new Set();

        for (let i = 0; i < this.currentPositions.length; i++) {
            const posKey = `${this.currentPositions[i][0]},${this.currentPositions[i][1]}`;
            if (!seenPositions.has(posKey)) {
                seenPositions.add(posKey);
                uniquePositions.push(this.currentPositions[i]);
                uniqueColors.push(this.startColors[i]);
            }
        }

        this.currentPositions = uniquePositions;
        this.startColors = uniqueColors;

        // 如果有任何起点计入了路径，增加步数
        if (pathIncremented.some(v => v)) {
            this.currentPath.push([...this.currentPositions]);
            this.stepCount++;

            // 更新最长路径
            if (this.currentPath.length > this.maxPathLength) {
                this.maxPathLength = this.currentPath.length;
            }
        }

        // 如果所有起点都被消除了
        if (this.currentPositions.length === 0) {
            alert('所有起点都已消除！请选择新的起点。');
        }

        // 保存状态到历史记录
        this.saveState();

        this.updateStats();
        this.updatePathDisplay();
        this.updateStartPointsList();
        this.renderGrid();
    }

    updateStats() {
        document.getElementById('stepCount').textContent = this.stepCount;
        document.getElementById('currentPathLength').textContent = this.currentPath.length;
        document.getElementById('maxPathLength').textContent = this.maxPathLength;

        // 更新撤销/重做按钮状态
        this.updateUndoRedoButtons();
    }

    saveState() {
        // 深拷贝当前状态
        const state = {
            grid: this.grid.map(row => [...row]),
            currentPositions: this.currentPositions.map(pos => [...pos]),
            startColors: [...this.startColors],
            currentPath: this.currentPath.map(entry =>
                Array.isArray(entry[0]) ? entry.map(pos => [...pos]) : [...entry]
            ),
            stepCount: this.stepCount,
            maxPathLength: this.maxPathLength
        };

        // 删除当前索引之后的所有历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);

        // 添加新状态
        this.history.push(state);
        this.historyIndex++;

        // 限制历史记录数量（最多保存50步）
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex <= 0) {
            return; // 没有可撤销的操作
        }

        this.historyIndex--;
        this.restoreState(this.history[this.historyIndex]);
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) {
            return; // 没有可重做的操作
        }

        this.historyIndex++;
        this.restoreState(this.history[this.historyIndex]);
    }

    restoreState(state) {
        this.grid = state.grid.map(row => [...row]);
        this.currentPositions = state.currentPositions.map(pos => [...pos]);
        this.startColors = [...state.startColors];
        this.currentPath = state.currentPath.map(entry =>
            Array.isArray(entry[0]) ? entry.map(pos => [...pos]) : [...entry]
        );
        this.stepCount = state.stepCount;
        this.maxPathLength = state.maxPathLength;

        this.updateStats();
        this.updatePathDisplay();
        this.updateStartPointsList();
        this.renderGrid();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    updatePathDisplay() {
        const pathList = document.getElementById('pathList');

        if (this.currentPath.length === 0) {
            pathList.innerHTML = '<p class="empty-message">请选择起点开始游戏</p>';
            return;
        }

        pathList.innerHTML = this.currentPath.map((entry, index) => {
            if (Array.isArray(entry[0])) {
                // 多个起点的情况
                const positionsStr = entry.map(pos => {
                    const cell = this.grid[pos[0]][pos[1]] || '空';
                    return `(${pos[0]},${pos[1]})[${cell}]`;
                }).join(', ');
                return `<div class="path-item">${index + 1}. ${positionsStr}</div>`;
            } else {
                // 单个起点的情况
                const cell = this.grid[entry[0]][entry[1]] || '空';
                return `<div class="path-item">${index + 1}. (${entry[0]}, ${entry[1]}) [${cell}]</div>`;
            }
        }).join('');

        // 自动滚动到底部
        pathList.scrollTop = pathList.scrollHeight;
    }

    updateAvailableMoves() {
        const movesList = document.getElementById('movesList');

        if (this.currentPositions.length === 0) {
            movesList.innerHTML = '<p class="empty-message">暂无可用移动</p>';
            return;
        }

        // 检查所有方向
        const directions = [
            [[-1, 0], '↑ 上'],
            [[1, 0], '↓ 下'],
            [[0, -1], '← 左'],
            [[0, 1], '→ 右']
        ];

        const availableMoves = [];

        for (const [[dr, dc], name] of directions) {
            let canAnyMove = false;

            for (const [row, col] of this.currentPositions) {
                const newRow = row + dr;
                const newCol = col + dc;

                // 检查边界
                if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                    const newPos = [newRow, newCol];
                    if (this.canMove([row, col], newPos)) {
                        canAnyMove = true;
                        break;
                    }
                }
            }

            if (canAnyMove) {
                availableMoves.push(name);
            }
        }

        if (availableMoves.length === 0) {
            movesList.innerHTML = '<p class="empty-message">没有可用移动！</p>';
            return;
        }

        movesList.innerHTML = availableMoves.map(move => {
            return `<div class="move-item">
                <span>${move}</span>
            </div>`;
        }).join('');
    }

    bindEvents() {
        // 新起点按钮
        document.getElementById('newStartBtn').addEventListener('click', () => {
            this.currentPositions = [];
            this.startColors = [];
            this.selectingStart = true;
            this.updateStartPointsList();
            this.renderGrid();
        });

        // 完成选择按钮
        document.getElementById('finishSelectBtn').addEventListener('click', () => {
            this.finishSelectingStarts();
        });

        // 重置按钮
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置游戏吗？这将清除所有进度。')) {
                this.reset();
            }
        });

        // 撤销按钮
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        // 重做按钮
        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        // 方向按钮
        document.getElementById('upBtn').addEventListener('click', () => this.move('up'));
        document.getElementById('downBtn').addEventListener('click', () => this.move('down'));
        document.getElementById('leftBtn').addEventListener('click', () => this.move('left'));
        document.getElementById('rightBtn').addEventListener('click', () => this.move('right'));

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.selectingStart) return;

            // Ctrl+Z 撤销
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
                return;
            }

            // Ctrl+Y 或 Ctrl+Shift+Z 重做
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                this.redo();
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 's':
                case 'arrowdown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'a':
                case 'arrowleft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'd':
                case 'arrowright':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'n':
                    e.preventDefault();
                    this.currentPositions = [];
                    this.startColors = [];
                    this.selectingStart = true;
                    this.updateStartPointsList();
                    this.renderGrid();
                    break;
                case 'r':
                    e.preventDefault();
                    if (confirm('确定要重置游戏吗？')) {
                        this.reset();
                    }
                    break;
            }
        });
    }

    reset() {
        this.currentPositions = [];
        this.startColors = [];
        this.currentPath = [];
        this.maxPathLength = 0;
        this.stepCount = 0;
        this.selectingStart = false;
        this.history = [];
        this.historyIndex = -1;
        this.generateGrid();
        this.renderGrid();
        this.updateStats();
        this.updatePathDisplay();
        this.updateStartPointsList();
    }
}

// 初始化游戏
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new GridGame(25);
});

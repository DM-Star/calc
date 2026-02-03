// 观察力训练 - JavaScript逻辑
// 独立文件，用于分离HTML和JavaScript代码

// 宝石类型定义
const GEM_TYPES = {
    HEXAGON_UP: 'hexagon_up',      // 正六边形尖头朝上
    HEXAGON_LEFT: 'hexagon_left',  // 正六边形尖头朝左
    PENTAGON_UP: 'pentagon_up',    // 正五边形尖头朝上
    PENTAGON_DOWN: 'pentagon_down',// 正五边形尖头朝下
    PENTAGON_LEFT: 'pentagon_left',// 正五边形尖头朝左
    PENTAGON_RIGHT: 'pentagon_right',// 正五边形尖头朝右
    SQUARE: 'square'               // 正方形
};

// 宝石颜色定义（全部设为纯黑色）
const GEM_COLORS = {
    [GEM_TYPES.HEXAGON_UP]: '#000000',    // 黑色
    [GEM_TYPES.HEXAGON_LEFT]: '#000000',   // 黑色
    [GEM_TYPES.PENTAGON_UP]: '#000000',    // 黑色
    [GEM_TYPES.PENTAGON_DOWN]: '#000000',  // 黑色
    [GEM_TYPES.PENTAGON_LEFT]: '#000000',  // 黑色
    [GEM_TYPES.PENTAGON_RIGHT]: '#000000', // 黑色
    [GEM_TYPES.SQUARE]: '#000000'          // 黑色
};

// 游戏状态变量
let gameState = {};

// 页面加载完成后初始化游戏状态
document.addEventListener('DOMContentLoaded', function() {
    initGameState();
    
    // 从URL参数加载配置（优先执行，以便根据参数决定显示哪个界面）
    loadConfigFromURL();
    
    // 如果没有URL参数或不是分享链接，显示主菜单界面
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (!typeParam || (typeParam !== 'observation' && typeParam !== 'grid-painting')) {
        showScreen('main-menu');
    }
    
    // 支持回车键提交答案
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // 保存当前答案但不显示正误状态
                const userAnswer = saveCurrentAnswer();
                if (userAnswer === null) {
        document.getElementById('feedback').textContent = `请输入有效答案（1-${gameState.boardCount}）`;
                    document.getElementById('feedback').className = 'feedback wrong';
                } else {
                    document.getElementById('feedback').textContent = '✓ 答案已保存';
                    document.getElementById('feedback').className = 'feedback';
                }
            }
        });
    }
});

// 初始化游戏状态
function initGameState() {
    gameState = {
        boards: [],           // 动态尺寸的棋盘数组
        questions: [],        // 5个问题
        currentQuestion: 0,   // 当前题目索引
        answers: [],         // 用户答案
        startTime: 0,        // 开始时间
        endTime: 0,          // 结束时间（用户提交答案的时间点）
        questionStartTime: 0, // 当前题目开始时间
        runningTime: 0,      // 跑动时间
        actualAnswerTime: 0,  // 实际答题时间
        seed: null,          // 随机数种
        playerName: '',      // 玩家姓名
        isObserving: false   // 是否在观察界面
    };
}

// 显示指定屏幕
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error('屏幕ID不存在:', screenId);
    }
}

// 开始训练
function startTraining() {
    // 初始化游戏状态
    initGameState();
    
    // 获取玩家设置
    const seedInput = document.getElementById('random-seed');
    const boardSizeInput = document.getElementById('board-size');
    const boardCountInput = document.getElementById('board-count');
    
    const seedInputValue = seedInput.value ? parseInt(seedInput.value) : null;
    gameState.boardSize = boardSizeInput ? parseInt(boardSizeInput.value) : 15;
    gameState.boardCount = boardCountInput ? parseInt(boardCountInput.value) : 30;
    gameState.playerName = '玩家';
    
    // 设置随机数种并获取实际使用的随机数种
    gameState.seed = setRandomSeed(seedInputValue);
    
    // 生成棋盘和问题
    generateBoards();
    generateQuestions();
    
    // 设置棋盘数量显示
    const maxBoardNumber = document.getElementById('max-board-number');
    const boardCountDisplay = document.getElementById('board-count-display');
    const answerInput = document.getElementById('answer-input');
    
    if (maxBoardNumber) maxBoardNumber.textContent = gameState.boardCount;
    if (boardCountDisplay) boardCountDisplay.textContent = gameState.boardCount;
    if (answerInput) answerInput.setAttribute('max', gameState.boardCount);
    
    // 初始化游戏状态
    gameState.startTime = Date.now();
    gameState.runningTime = 0;
    gameState.actualAnswerTime = 0;
    gameState.isObserving = false;
    
    // 更新界面显示
    document.getElementById('seed-value').textContent = gameState.seed;
    
    // 显示答题界面
    showScreen('practice-screen');
    showQuestion();
    
    // 开始计时器
    startTimer();
}

// 设置随机数种
function setRandomSeed(seed) {
    let actualSeed = seed;
    
    if (seed && seed >= 1 && seed <= 999999) {
        // 使用固定的伪随机数生成器
        Math.seed = seed;
        Math.random = function() {
            Math.seed = (Math.seed * 9301 + 49297) % 233280;
            return Math.seed / 233280;
        };
    } else {
        // 使用系统随机数，生成一个实际的随机数种
        actualSeed = Math.floor(Math.random() * 999999) + 1;
        Math.seed = actualSeed;
        Math.random = function() {
            Math.seed = (Math.seed * 9301 + 49297) % 233280;
            return Math.seed / 233280;
        };
    }
    
    return actualSeed;
}

// 生成棋盘
function generateBoards() {
    gameState.boards = [];
    const boardSize = gameState.boardSize;
    const boardCount = gameState.boardCount;
    
    for (let boardIndex = 0; boardIndex < boardCount; boardIndex++) {
        const board = [];
        
        for (let i = 0; i < boardSize; i++) {
            board[i] = [];
            for (let j = 0; j < boardSize; j++) {
                // 随机选择宝石类型
                const gemTypes = Object.values(GEM_TYPES);
                const randomIndex = Math.floor(Math.random() * gemTypes.length);
                board[i][j] = gemTypes[randomIndex];
            }
        }
        
        gameState.boards.push(board);
    }
}

// 生成5个问题
function generateQuestions() {
    gameState.questions = [];
    const boardCount = gameState.boardCount;
    const boardSize = gameState.boardSize;
    
    // 从棋盘中随机选择5个
    const selectedBoardIndices = [];
    while (selectedBoardIndices.length < 5) {
        const randomIndex = Math.floor(Math.random() * boardCount);
        if (!selectedBoardIndices.includes(randomIndex)) {
            selectedBoardIndices.push(randomIndex);
        }
    }
    
    // 为每个选中的棋盘生成一个5x5区域
    for (const boardIndex of selectedBoardIndices) {
        // 随机选择5x5区域的起始位置（确保在棋盘范围内）
        const maxStart = boardSize - 5;
        const startRow = Math.floor(Math.random() * (maxStart + 1));
        const startCol = Math.floor(Math.random() * (maxStart + 1));
        
        // 提取5x5区域
        const region = [];
        
        // 安全检查：确保boards数组存在且boardIndex有效
        if (!gameState.boards || !gameState.boards[boardIndex]) {
            console.error('无效的boardIndex或boards数组未初始化:', boardIndex);
            continue; // 跳过这个棋盘
        }
        
        for (let i = 0; i < 5; i++) {
            region[i] = [];
            for (let j = 0; j < 5; j++) {
                region[i][j] = gameState.boards[boardIndex][startRow + i][startCol + j];
            }
        }
        
        gameState.questions.push({
            boardIndex: boardIndex, // 保持0-boardCount-1的索引
            startRow: startRow,
            startCol: startCol,
            region: region
        });
    }
}

// 显示当前题目
function showQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    
    // 更新界面显示
    document.getElementById('current-question').textContent = 
        `${gameState.currentQuestion + 1}/${gameState.questions.length}`;
    document.getElementById('obs-current-question').textContent = 
        `${gameState.currentQuestion + 1}/${gameState.questions.length}`;
    
    // 更新棋盘数量范围显示
    document.getElementById('max-board-number').textContent = gameState.boards.length;
    
    // 更新进度条
    const progress = ((gameState.currentQuestion + 1) / gameState.questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    
    // 绘制问题区域
    drawQuestionBoard(question.region);
    
    // 检查当前题目是否已有答案，并显示在输入框中
    const existingAnswer = gameState.answers.find(a => a.questionIndex === gameState.currentQuestion);
    if (existingAnswer && existingAnswer.userAnswer !== null) {
        document.getElementById('answer-input').value = existingAnswer.userAnswer;
        
        // 只在答题过程中显示已作答状态，不显示正误
        document.getElementById('feedback').textContent = '✓ 已作答';
        document.getElementById('feedback').className = 'feedback';
    } else {
        // 清空答案输入框和反馈
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
    }
    
    // 记录题目开始时间
    gameState.questionStartTime = Date.now();
    
    // 更新导航按钮状态
    updateNavigationButtons();
}

// 绘制单个宝石
function drawGem(ctx, x, y, size, gemType) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2 - 2;
    
    ctx.fillStyle = GEM_COLORS[gemType] || '#ccc';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    switch (gemType) {
        case GEM_TYPES.HEXAGON_UP:
            drawHexagon(ctx, centerX, centerY, radius, 0);
            break;
        case GEM_TYPES.HEXAGON_LEFT:
            drawHexagon(ctx, centerX, centerY, radius, Math.PI / 2);
            break;
        case GEM_TYPES.PENTAGON_UP:
            drawPentagon(ctx, centerX, centerY, radius, 0);
            break;
        case GEM_TYPES.PENTAGON_DOWN:
            drawPentagon(ctx, centerX, centerY, radius, Math.PI);
            break;
        case GEM_TYPES.PENTAGON_LEFT:
            drawPentagon(ctx, centerX, centerY, radius, Math.PI / 2);
            break;
        case GEM_TYPES.PENTAGON_RIGHT:
            drawPentagon(ctx, centerX, centerY, radius, -Math.PI / 2);
            break;
        case GEM_TYPES.SQUARE:
            drawSquare(ctx, centerX, centerY, radius);
            break;
        default:
            drawCircle(ctx, centerX, centerY, radius);
    }
}

// 绘制正六边形
function drawHexagon(ctx, x, y, radius, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = rotation + (i * 2 * Math.PI) / 6;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// 绘制正五边形
function drawPentagon(ctx, x, y, radius, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = rotation + (i * 2 * Math.PI) / 5;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// 绘制正方形
function drawSquare(ctx, x, y, radius) {
    const side = radius * Math.sqrt(2);
    ctx.beginPath();
    ctx.rect(x - side / 2, y - side / 2, side, side);
    ctx.fill();
    ctx.stroke();
}

// 绘制圆形（备用）
function drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

// 更新时间显示（立即更新）
function updateTimeDisplay() {
    // 计算总用时（当前时间减去开始时间，加上跑动时间）
    const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000) + gameState.runningTime;
    document.getElementById('game-time').textContent = elapsedTime;
    document.getElementById('obs-time').textContent = elapsedTime;
    
    // 更新跑动时间显示
    document.getElementById('running-time').textContent = gameState.runningTime + '秒';
    document.getElementById('obs-running-time').textContent = gameState.runningTime + '秒';
}

// 开始计时器
function startTimer() {
    // 清除之前的计时器
    if (window.gameTimer) {
        clearInterval(window.gameTimer);
    }
    
    // 立即更新一次时间显示
    updateTimeDisplay();
    
    window.gameTimer = setInterval(function() {
        updateTimeDisplay();
    }, 1000);
}

// 保存当前题目的答案
function saveCurrentAnswer() {
    const userAnswer = parseInt(document.getElementById('answer-input').value);
    const question = gameState.questions[gameState.currentQuestion];
    
    // 如果用户没有输入答案，则保存为null
        const answerValue = isNaN(userAnswer) || userAnswer < 1 || userAnswer > gameState.boardCount ? null : userAnswer;
    const isCorrect = answerValue === (question.boardIndex + 1); // boardIndex是0-(boardCount-1)，正确答案应该是1-boardCount
    
    // 计算答题时间
    const questionTime = Math.round((Date.now() - gameState.questionStartTime) / 1000);
    
    // 保存或更新答案
    const existingAnswerIndex = gameState.answers.findIndex(a => a.questionIndex === gameState.currentQuestion);
    
    if (existingAnswerIndex !== -1) {
        // 更新现有答案
        gameState.answers[existingAnswerIndex] = {
            questionIndex: gameState.currentQuestion,
            userAnswer: answerValue,
            correctAnswer: question.boardIndex + 1, // boardIndex是0-(boardCount-1)，正确答案应该是1-boardCount
            time: questionTime,
            isCorrect: isCorrect
        };
    } else {
        // 添加新答案
        gameState.answers.push({
            questionIndex: gameState.currentQuestion,
            userAnswer: answerValue,
            correctAnswer: question.boardIndex + 1, // boardIndex是0-(boardCount-1)，正确答案应该是1-boardCount
            time: questionTime,
            isCorrect: isCorrect
        });
    }
    
    return answerValue;
}

// 显示上一题
function prevQuestion() {
    // 保存当前答案
    saveCurrentAnswer();
    
    // 循环导航：如果已经是第一题，跳转到最后一题
    if (gameState.currentQuestion === 0) {
        gameState.currentQuestion = gameState.questions.length - 1;
    } else {
        gameState.currentQuestion--;
    }
    
    gameState.questionStartTime = Date.now();
    showQuestion();
    updateNavigationButtons(); // 更新导航按钮状态
}

// 显示下一题
function nextQuestion() {
    // 保存当前答案
    saveCurrentAnswer();
    
    // 循环导航：如果已经是最后一题，跳转到第一题
    if (gameState.currentQuestion === gameState.questions.length - 1) {
        gameState.currentQuestion = 0;
    } else {
        gameState.currentQuestion++;
    }
    
    gameState.questionStartTime = Date.now();
    showQuestion();
    updateNavigationButtons(); // 更新导航按钮状态
}

// 提交全部答案
function submitAllAnswers() {
    // 保存当前题目的答案
    const userAnswer = saveCurrentAnswer();
    
    // 验证当前题目是否有答案
    if (userAnswer === null) {
        document.getElementById('feedback').textContent = '请先输入当前题目的答案';
        document.getElementById('feedback').className = 'feedback wrong';
        return;
    }
    
    // 验证是否所有题目都有答案
    const unansweredQuestions = gameState.questions.filter((_, index) => {
        const answer = gameState.answers.find(a => a.questionIndex === index);
        return !answer || answer.userAnswer === null;
    });
    
    if (unansweredQuestions.length > 0) {
        document.getElementById('feedback').textContent = `还有${unansweredQuestions.length}道题未作答`;
        document.getElementById('feedback').className = 'feedback wrong';
        return;
    }
    
    // 显示成功提交反馈
    document.getElementById('feedback').textContent = '✓ 答案已提交，正在计算结果...';
    document.getElementById('feedback').className = 'feedback correct';
    
    // 重新显示当前题目，更新正误状态显示
    showQuestion();
    
    // 记录结束时间（用户提交答案的时间点）
    gameState.endTime = Date.now();
    
    // 延迟后显示结果
    setTimeout(() => {
        showResults();
    }, 1000);
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.querySelector('button[onclick="prevQuestion()"]');
    const nextBtn = document.querySelector('button[onclick="nextQuestion()"]');
    
    if (prevBtn) {
        prevBtn.disabled = false; // 不再禁用，支持循环导航
    }
    if (nextBtn) {
        nextBtn.disabled = false; // 不再禁用，支持循环导航
    }
}
// 显示观察界面
function showObservationScreen() {
    // 增加10秒跑动时间
    gameState.runningTime += 10;
    gameState.isObserving = true;
    
    // 立即更新时间显示
    updateTimeDisplay();
    
    // 更新棋盘数量显示
    document.getElementById('board-count-display').textContent = gameState.boards.length;
    
    // 生成观察界面
    generateObservationGrid();
    
    // 显示观察界面
    showScreen('observation-screen');
}

// 显示答题界面（从观察界面返回）
function showPracticeScreen() {
    // 增加10秒跑动时间
    gameState.runningTime += 10;
    gameState.isObserving = false;
    
    // 立即更新时间显示
    updateTimeDisplay();
    
    // 显示答题界面
    showScreen('practice-screen');
}

// 单棋盘显示状态
let currentBoardIndex = 0;

// 生成单棋盘观察界面
function generateObservationGrid() {
    // 重置当前棋盘索引
    currentBoardIndex = 0;
    
    // 显示第一个棋盘
    showCurrentBoard();
}

// 显示当前棋盘
function showCurrentBoard() {
    // 安全检查：确保boards数组存在且currentBoardIndex在有效范围内
    if (!gameState.boards || gameState.boards.length === 0) {
        console.error('boards数组未初始化或为空');
        return;
    }
    
    if (currentBoardIndex < 0 || currentBoardIndex >= gameState.boards.length) {
        console.error('currentBoardIndex超出有效范围:', currentBoardIndex);
        currentBoardIndex = 0; // 重置为安全值
    }
    
    // 更新棋盘计数器，动态显示棋盘数量
    document.getElementById('board-counter').textContent = `棋盘 ${currentBoardIndex + 1}/${gameState.boards.length}`;
    
    // 绘制当前棋盘
    const canvas = document.getElementById('single-observation-board');
    drawObservationBoard(canvas, gameState.boards[currentBoardIndex]);
}

// 显示上一个棋盘
function prevBoard() {
    // 循环导航：如果已经是第一个棋盘，跳转到最后一个棋盘
    if (currentBoardIndex === 0) {
        currentBoardIndex = gameState.boards.length - 1;
    } else {
        currentBoardIndex--;
    }
    showCurrentBoard();
}

// 显示下一个棋盘
function nextBoard() {
    // 循环导航：如果已经是最后一个棋盘，跳转到第一个棋盘
    if (currentBoardIndex === gameState.boards.length - 1) {
        currentBoardIndex = 0;
    } else {
        currentBoardIndex++;
    }
    showCurrentBoard();
}

// 绘制观察棋盘（动态尺寸）
function drawObservationBoard(canvas, board) {
    // 安全检查：确保board参数有效
    const boardSize = gameState.boardSize || 15;
    if (!board || !Array.isArray(board) || board.length !== boardSize) {
        console.error('无效的board参数:', board);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const cellSize = Math.min(canvas.width / boardSize, canvas.height / boardSize);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制每个宝石（使用正确的形状）
    for (let i = 0; i < boardSize; i++) {
        // 安全检查：确保board[i]存在
        if (!board[i] || !Array.isArray(board[i])) {
            continue;
        }
        
        for (let j = 0; j < boardSize; j++) {
            const gemType = board[i][j];
            drawGem(ctx, j * cellSize, i * cellSize, cellSize, gemType);
        }
    }
}

// 结果界面棋盘索引
let resultBoardIndex = 0;

// 显示结果
function showResults() {
    // 停止计时器
    if (window.gameTimer) {
        clearInterval(window.gameTimer);
    }
    
    // 计算总用时（结束时间减去开始时间，加上跑动时间）
    const totalTime = Math.floor((gameState.endTime - gameState.startTime) / 1000) + gameState.runningTime;    
    // 计算正确率
    const correctAnswers = gameState.answers.filter(answer => answer.isCorrect).length;
    const accuracy = Math.round((correctAnswers / gameState.answers.length) * 100);
    
    // 更新结果界面
    document.getElementById('total-time').textContent = totalTime;
    document.getElementById('final-running-time').textContent = gameState.runningTime;
    document.getElementById('final-seed').textContent = gameState.seed;
    
    // 生成分享链接
    generateShareLink(totalTime, gameState.runningTime, gameState.seed);
    
    // 生成详细结果
    generateResultsList();
    
    // 初始化结果界面棋盘显示
    resultBoardIndex = 0;
    showResultBoard();
    
    // 显示结果界面
    showScreen('result-screen');
}

// 显示结果界面的棋盘
function showResultBoard() {
    // 安全检查：确保boards数组存在且resultBoardIndex在有效范围内
    if (!gameState.boards || gameState.boards.length === 0) {
        console.error('boards数组未初始化或为空');
        return;
    }
    
    if (resultBoardIndex < 0 || resultBoardIndex >= gameState.boards.length) {
        console.error('resultBoardIndex超出有效范围:', resultBoardIndex);
        resultBoardIndex = 0; // 重置为安全值
    }
    
    document.getElementById('result-board-counter').textContent = `棋盘 ${resultBoardIndex + 1}/${gameState.boards.length}`;
    
    const canvas = document.getElementById('result-observation-board');
    drawResultBoard(canvas, gameState.boards[resultBoardIndex]);
}

// 绘制结果界面的棋盘（标记正确答案区域）
function drawResultBoard(canvas, board) {
    // 安全检查：确保board参数有效
    const boardSize = gameState.boardSize || 15;
    if (!board || !Array.isArray(board) || board.length !== boardSize) {
        console.error('无效的board参数:', board);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const cellSize = Math.min(canvas.width / boardSize, canvas.height / boardSize);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制每个宝石
    for (let i = 0; i < boardSize; i++) {
        // 安全检查：确保board[i]存在
        if (!board[i] || !Array.isArray(board[i])) {
            continue;
        }
        
        for (let j = 0; j < boardSize; j++) {
            const gemType = board[i][j];
            drawGem(ctx, j * cellSize, i * cellSize, cellSize, gemType);
        }
    }
    
    // 标记正确答案区域（绿色边框）
    const answerQuestions = gameState.questions.filter(q => q.boardIndex === resultBoardIndex);
    if (answerQuestions.length > 0) {
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
        
        answerQuestions.forEach(question => {
            const region = question.region;
            const startRow = question.startRow;
            const startCol = question.startCol;
            
            ctx.strokeRect(
                startCol * cellSize,
                startRow * cellSize,
                5 * cellSize,
                5 * cellSize
            );
        });
    }
}

// 结果界面上一个棋盘（支持循环导航）
function resultPrevBoard() {
    // 循环导航：如果已经是第一个棋盘，跳转到最后一个棋盘
    if (resultBoardIndex === 0) {
        resultBoardIndex = gameState.boardCount - 1;
    } else {
        resultBoardIndex--;
    }
    showResultBoard();
}

// 结果界面下一个棋盘（支持循环导航）
function resultNextBoard() {
    // 循环导航：如果已经是最后一个棋盘，跳转到第一个棋盘
    if (resultBoardIndex === gameState.boardCount - 1) {
        resultBoardIndex = 0;
    } else {
        resultBoardIndex++;
    }
    showResultBoard();
}

// 生成分享链接
function generateShareLink(totalTime, runningTime, seed) {
    const boardSize = gameState.boardSize;
    const boardCount = gameState.boardCount;
    
    // 生成分享消息
    const shareMessage = `本次训练总用时：${totalTime}秒（含跑动时间${runningTime}秒）（随机数种：${seed}）`;
    document.getElementById('share-message').textContent = shareMessage;
    
    // 生成分享链接（只包含核心配置参数）
    const baseUrl = window.location.href.split('?')[0];
    const shareParams = new URLSearchParams();
    shareParams.append('boardSize', boardSize);
    shareParams.append('boardCount', boardCount);
    shareParams.append('seed', seed);
    
    const shareLink = `${baseUrl}?${shareParams.toString()}`;
    document.getElementById('share-link').value = shareLink;
}

// 为结果列表绘制原题
function drawQuestionBoard(region) {
    const canvas = document.getElementById('question-board');
    const ctx = canvas.getContext('2d');
    
    // 使用与原画作相同的CellSize计算逻辑
    const cellSize = Math.min(canvas.width / 5, canvas.height / 5);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制每个宝石
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const gemType = region[i][j];
            drawGem(ctx, j * cellSize, i * cellSize, cellSize, gemType);
        }
    }
}

function drawQuestionBoardForResult(canvas, region) {
    const ctx = canvas.getContext('2d');
    
    // 使用与原画作相同的CellSize计算逻辑
    const cellSize = Math.min(canvas.width / 5, canvas.height / 5);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制每个宝石
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const gemType = region[i][j];
            drawGem(ctx, j * cellSize, i * cellSize, cellSize, gemType);
        }
    }
}

// 生成详细结果列表
function generateResultsList() {
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    
    gameState.answers.forEach((answer, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        
        let resultText = `第${index + 1}题：`;
        if (answer.userAnswer === null) {
            resultText += `未作答（正确答案：${answer.correctAnswer}）`;
        } else {
            resultText += `你的答案：${answer.userAnswer}，正确答案：${answer.correctAnswer}`;
        }
        
        if (answer.isCorrect) {
            resultText += ' ✓';
        } else if (answer.userAnswer !== null) {
            resultText += ' ✗';
        }
        
        // 创建展开栏结构
        const expandableContainer = document.createElement('div');
        expandableContainer.className = 'expandable-result-item';
        
        // 结果摘要行（可点击展开）
        const summaryRow = document.createElement('div');
        summaryRow.className = 'result-summary';
        summaryRow.innerHTML = `<span class="result-text">${resultText}</span><span class="expand-icon">▼</span>`;
        
        // 展开内容区域（显示原题）
        const expandContent = document.createElement('div');
        expandContent.className = 'expand-content';
        expandContent.style.display = 'none';
        
        // 创建原题显示区域
        const questionCanvas = document.createElement('canvas');
        questionCanvas.className = 'result-question-canvas';
        questionCanvas.width = 150;
        questionCanvas.height = 150;
        
        // 绘制原题
        const question = gameState.questions[index];
        if (question && question.region) {
            drawQuestionBoardForResult(questionCanvas, question.region);
        }
        
        expandContent.appendChild(questionCanvas);
        
        // 点击展开/收起事件
        summaryRow.addEventListener('click', function() {
            if (expandContent.style.display === 'none') {
                expandContent.style.display = 'block';
                summaryRow.querySelector('.expand-icon').textContent = '▲';
            } else {
                expandContent.style.display = 'none';
                summaryRow.querySelector('.expand-icon').textContent = '▼';
            }
        });
        
        expandableContainer.appendChild(summaryRow);
        expandableContainer.appendChild(expandContent);
        resultsList.appendChild(expandableContainer);
    });
}

// 复制分享链接
function copyShareLink() {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = new URL(baseUrl);
    
    // 添加分享参数（只包含核心配置参数）
    shareUrl.searchParams.set('type', 'observation');
    shareUrl.searchParams.set('seed', gameState.seed);
    shareUrl.searchParams.set('boardSize', gameState.boardSize);
    shareUrl.searchParams.set('boardCount', gameState.boardCount);
    
    // 计算相关数据
    const totalTime = Math.floor((gameState.endTime - gameState.startTime) / 1000) + gameState.runningTime;
    const totalQuestions = gameState.answers.length;
    const correctQuestions = gameState.answers.filter(a => a.isCorrect).length;
    
    const shareText = `🎉我用了${totalTime}秒完成了${totalQuestions}道宝石迷阵(${gameState.seed})，正确${correctQuestions}题！你也来试试吧~💪\n` +
                `🔗 ：${shareUrl.toString()}`;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareText).then(() => {
        alert('分享内容已复制到剪贴板！');
    }).catch(() => {
        // 备用方案
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('分享内容已复制到剪贴板！');
    });
}

// 重新开始训练
function restartTraining() {
    clearURLSeedParameter();
    
    showScreen('setup-screen');
    console.log('重新开始宝石迷阵训练：所有随机数种已完全清空，包括URL参数');
}

// 退出训练
function exitTraining() {
    if (confirm('确定要退出训练吗？未完成的题目将不会保存。')) {
        ReturnToMainMenu();
    }
}

function ReturnToMainMenu() {
    const url = new URL(window.location);
    const urlParams = new URLSearchParams(url.search);
    if (urlParams.has('type')) {
        urlParams.delete('type');
    }
    if (urlParams.has('seed')) {
        urlParams.delete('seed');
    }
    url.search = urlParams.toString();
    window.history.replaceState({}, '', url);
    showScreen('main-menu');
}

// ==================== 格子画功能 ====================

// 格子画游戏状态变量
let gridGameState = {};

// 开始格子画训练
function startGridTraining() {
    // 初始化格子画游戏状态
    initGridGameState();
    
    // 获取玩家设置
    const seedInput = document.getElementById('grid-random-seed');
    const canvasSizeInput = document.getElementById('canvas-size');
    const paintingCountInput = document.getElementById('painting-count');
    const observationRegionSizeInput = document.getElementById('observation-region-size');
    
    const seedInputValue = seedInput.value ? parseInt(seedInput.value) : null;
    gridGameState.canvasSize = canvasSizeInput ? parseInt(canvasSizeInput.value) : 20;
    gridGameState.paintingCount = paintingCountInput ? parseInt(paintingCountInput.value) : 10;
    gridGameState.observationRegionSize = observationRegionSizeInput ? parseInt(observationRegionSizeInput.value) : 5;
    
    // 设置随机数种
    gridGameState.seed = setRandomSeed(seedInputValue);
    
    // 生成蒙德里安风格的画作
    generateGridPaintings();
    
    // 生成格子画问题
    generateGridQuestions();
    
    // 设置画作数量显示
    const maxPaintingNumber = document.getElementById('max-painting-number');
    const answerInput = document.getElementById('grid-answer-input');
    
    if (maxPaintingNumber) maxPaintingNumber.textContent = gridGameState.paintingCount;
    if (answerInput) answerInput.setAttribute('max', gridGameState.paintingCount);
    
    // 初始化游戏状态
    gridGameState.startTime = Date.now();
    gridGameState.runningTime = 0;
    gridGameState.actualAnswerTime = 0;
    gridGameState.isObserving = false;
    
    // 更新界面显示
    document.getElementById('grid-seed-value').textContent = gridGameState.seed;
    
    // 显示格子画答题界面
    showScreen('grid-practice-screen');
    showGridQuestion();
    
    // 开始计时器
    startGridTimer();
}

// 生成格子画画作（蒙德里安风格）
function generateGridPaintings() {
    gridGameState.paintings = [];
    
    for (let i = 0; i < gridGameState.paintingCount; i++) {
        const painting = {
            id: i,
            data: [],
            lines: [],
            colorBlocks: [],
            questionRegion: null // 新增：存储剔除区域信息
        };
        
        // 初始化画布为白色
        for (let row = 0; row < gridGameState.canvasSize; row++) {
            painting.data[row] = [];
            for (let col = 0; col < gridGameState.canvasSize; col++) {
                painting.data[row][col] = '#FFFFFF'; // 初始为白色
            }
        }
        
        // 生成蒙德里安风格的画作
        generateMondrianPainting(painting, gridGameState.canvasSize);
        
        // 为每幅画作添加一个剔除区域（绿色边框包围，中央打问号）
        addQuestionRegionToPainting(painting, gridGameState.canvasSize);
        
        gridGameState.paintings.push(painting);
    }
}

// 为画作添加剔除区域（绿色边框包围，中央打问号）
function addQuestionRegionToPainting(painting, canvasSize) {
    const regionSize = gridGameState.observationRegionSize || getObservationRegionSize();
    
    // 确保剔除区域不会超出画布范围
    const maxStart = canvasSize - regionSize;
    if (maxStart < 0) {
        console.error('观察区域大小超过画布尺寸');
        return;
    }
    
    // 定义颜色检查函数
    function hasRequiredColors(region) {
        const colors = new Set();
        let hasBlack = false;
        let hasWhite = false;
        let hasColor = false;
        
        for (let row = 0; row < regionSize; row++) {
            for (let col = 0; col < regionSize; col++) {
                const color = region[row][col];
                colors.add(color);
                
                if (color === '#000000' || color === 'black') hasBlack = true;
                if (color === '#FFFFFF' || color === 'white') hasWhite = true;
                // 检查是否为彩色（非黑非白）
                if (color !== '#000000' && color !== '#FFFFFF' && 
                    color !== 'black' && color !== 'white') hasColor = true;
            }
        }
        
        return hasBlack && hasWhite && hasColor;
    }
    
    // 尝试选择符合条件的区域（最多尝试100次）
    let startRow, startCol;
    let originalRegion;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        // 随机选择剔除区域的起始位置
        startRow = Math.floor(Math.random() * (maxStart + 1));
        startCol = Math.floor(Math.random() * (maxStart + 1));
        
        // 保存剔除区域的原始颜色信息（用于生成题目）
        originalRegion = [];
        for (let row = 0; row < regionSize; row++) {
            originalRegion[row] = [];
            for (let col = 0; col < regionSize; col++) {
                originalRegion[row][col] = painting.data[startRow + row][startCol + col];
            }
        }
        
        attempts++;
        
        // 如果尝试次数过多，放宽条件（只要求有彩色）
        if (attempts >= maxAttempts) {
            const colors = new Set();
            let hasColor = false;
            
            for (let row = 0; row < regionSize; row++) {
                for (let col = 0; col < regionSize; col++) {
                    const color = originalRegion[row][col];
                    colors.add(color);
                    if (color !== '#000000' && color !== '#FFFFFF' && 
                        color !== 'black' && color !== 'white') hasColor = true;
                }
            }
            
            if (hasColor) break; // 至少要有彩色
        }
    } while (!hasRequiredColors(originalRegion) && attempts < maxAttempts);
    
    // 记录剔除区域信息
    painting.questionRegion = {
        startRow: startRow,
        startCol: startCol,
        regionWidth: regionSize,
        regionHeight: regionSize,
        originalColors: originalRegion // 保存原始颜色信息
    };
    
    // 处理观察区域：保留原始宝石内容，只添加绿色边框标记
    for (let row = startRow; row < startRow + regionSize; row++) {
        for (let col = startCol; col < startCol + regionSize; col++) {
            // 如果是边框位置，设置为绿色边框（半透明，不覆盖原始内容）
            if (row === startRow || row === startRow + regionSize - 1 || 
                col === startCol || col === startCol + regionSize - 1) {
                // 保留原始颜色，只在外围绘制绿色边框标记
                // 实际边框绘制将在绘制函数中处理，这里不修改原始数据
            }
            // 内部区域保持原始宝石内容不变
        }
    }
}
    // 不在中央位置添加问号，保持观察区域的原始内容完整性}

// 生成蒙德里安格子画
function generatePaintings() {
    gridGameState.paintings = [];
    
    // 蒙德里安颜色调色板
    const mondrianColors = [
        '#FFFFFF', // 白色（留白）
        '#FF0000', // 红色
        '#FFFF00', // 黄色
        '#0000FF', // 蓝色
        '#000000'  // 黑色（线条）
    ];
    
    for (let i = 0; i < gridGameState.paintingCount; i++) {
        const painting = {
            id: i,
            data: [],
            lines: [], // 黑色线条位置
            colorBlocks: [] // 彩色区域
        };
        
        // 初始化画布为白色
        for (let row = 0; row < gridGameState.canvasSize; row++) {
            painting.data[row] = [];
            for (let col = 0; col < gridGameState.canvasSize; col++) {
                painting.data[row][col] = '#FFFFFF'; // 初始为白色
            }
        }
        
        // 生成蒙德里安风格的线条和色块
        generateMondrianPainting(painting, gridGameState.canvasSize);
        
        gridGameState.paintings.push(painting);
    }
}

// 生成蒙德里安格子画
function generateMondrianPainting(painting, canvasSize) {
    // 蒙德里安风格：使用黑色线条划分区域，然后用红黄蓝三原色填充部分区域
    
    // 生成随机数量的垂直线条（3-6条）
    const verticalLines = generateRandomLines(canvasSize, 3, 6);
    
    // 生成随机数量的水平线条（3-6条）
    const horizontalLines = generateRandomLines(canvasSize, 3, 6);
    
    // 记录线条位置（用于后续逻辑）
    painting.lines = [...verticalLines, ...horizontalLines];
    
    // 绘制黑色线条（蒙德里安风格的关键）
    verticalLines.forEach(line => {
        for (let row = 0; row < canvasSize; row++) {
            painting.data[row][line] = '#000000'; // 黑色线条
        }
    });
    
    horizontalLines.forEach(line => {
        for (let col = 0; col < canvasSize; col++) {
            painting.data[line][col] = '#000000'; // 黑色线条
        }
    });
    
    // 生成彩色区域（蒙德里安三原色：红、黄、蓝）
    generateMondrianColorBlocks(painting, verticalLines, horizontalLines, canvasSize);
    
    // 计算并存储原画作的CellSize作为OriginCellSize
    // 在画作生成时直接计算并存储CellSize值，确保观察区域使用完全相同的CellSize
    const canvas = document.getElementById('single-grid-observation-board');
    if (canvas) {
        // 直接计算CellSize值并存储
        const actualCellSize = Math.min(canvas.width / canvasSize, canvas.height / canvasSize);
        painting.originCellSize = actualCellSize;
        painting.originCanvasSize = canvasSize; // 同时存储画布大小用于参考
    } else {
        // 如果画布不存在，使用默认值
        painting.originCellSize = 10; // 默认CellSize值
        painting.originCanvasSize = canvasSize;
    }
}

// 生成随机线条位置
function generateRandomLines(canvasSize, minLines, maxLines) {
    const lineCount = Math.floor(Math.random() * (maxLines - minLines + 1)) + minLines;
    const lines = [];
    
    // 避免在边缘生成线条
    const minPos = 2;
    const maxPos = canvasSize - 3;
    
    for (let i = 0; i < lineCount; i++) {
        let pos;
        do {
            pos = Math.floor(Math.random() * (maxPos - minPos + 1)) + minPos;
        } while (lines.includes(pos));
        
        lines.push(pos);
    }
    
    return lines.sort((a, b) => a - b);
}

// 绘制格子画问题区域


// 绘制格子画结果画布（蒙德里安风格，不显示格线）
function drawGridResultBoard(canvas, painting) {
    const ctx = canvas.getContext('2d');
    // 直接使用原画作存储的CellSize值，确保完全一致
    const cellSize = painting.originCellSize || 10; // 使用存储的CellSize值，如果不存在则使用默认值
    
    // 使用gridGameState中的canvasSize变量
    const canvasSize = gridGameState.canvasSize || 20;
    
    // 根据CellSize和画布大小确定画布尺寸
    // 画布大小 = CellSize × 画布格子数
    const desiredCanvasSize = cellSize * canvasSize;
    if (canvas.width !== desiredCanvasSize || canvas.height !== desiredCanvasSize) {
        canvas.width = desiredCanvasSize;
        canvas.height = desiredCanvasSize;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蒙德里安格子画（不显示网格线）
    for (let i = 0; i < canvasSize; i++) {
        for (let j = 0; j < canvasSize; j++) {
            const color = painting.data[i][j] || '#FFFFFF';
            ctx.fillStyle = color;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // 不绘制网格线，保持蒙德里安风格的简洁性
        }
    }
    
    const startRow = painting.questionRegion.startRow;
    const startCol = painting.questionRegion.startCol;
    const regionWidth = painting.questionRegion.regionWidth;
    const regionHeight = painting.questionRegion.regionHeight;
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.strokeRect(
        startCol * cellSize,
        startRow * cellSize,
        regionWidth * cellSize,
        regionHeight * cellSize
    );
}

// 生成格子画问题
function generateGridQuestions() {
    gridGameState.questions = [];
    
    // 获取观察区域大小（优先使用用户配置，其次使用URL参数）
    const regionSize = gridGameState.observationRegionSize || getObservationRegionSize();
    
    // 从所有画作中随机选择5个画作，使用它们的剔除区域作为题目
    const selectedPaintings = [];
    
    // 确保选择的画作不重复
    while (selectedPaintings.length < 5 && selectedPaintings.length < gridGameState.paintingCount) {
        const paintingIndex = Math.floor(Math.random() * gridGameState.paintingCount);
        if (!selectedPaintings.includes(paintingIndex)) {
            selectedPaintings.push(paintingIndex);
        }
    }
    
    for (let i = 0; i < selectedPaintings.length; i++) {
        const paintingIndex = selectedPaintings[i];
        const painting = gridGameState.paintings[paintingIndex];
        
        // 使用画作中已有的剔除区域信息
        if (!painting.questionRegion) {
            console.error('画作缺少剔除区域信息，跳过该题目');
            continue;
        }
        
        const startRow = painting.questionRegion.startRow;
        const startCol = painting.questionRegion.startCol;
        const regionWidth = painting.questionRegion.regionWidth;
        const regionHeight = painting.questionRegion.regionHeight;
        
        // 提取观察区域（使用保存的原始颜色信息，不包括绿色边框和问号）
        const region = [];
        for (let row = 0; row < regionHeight; row++) {
            region[row] = [];
            for (let col = 0; col < regionWidth; col++) {
                // 使用保存的原始颜色信息，确保题目显示的是原始画作内容
                region[row][col] = painting.questionRegion.originalColors[row][col];
            }
        }
        
        gridGameState.questions.push({
            paintingIndex: paintingIndex,
            startRow: startRow,
            startCol: startCol,
            region: region,
            regionWidth: regionWidth,
            regionHeight: regionHeight
        });
    }
}

// 获取观察区域大小（从URL参数或默认值）
function getObservationRegionSize() {
    const urlParams = new URLSearchParams(window.location.search);
    const regionSizeParam = urlParams.get('regionSize');
    
    if (regionSizeParam && !isNaN(regionSizeParam) && regionSizeParam >= 3 && regionSizeParam <= 10) {
        return parseInt(regionSizeParam);
    }
    
    // 默认观察区域大小
    return 5;
}



// 生成蒙德里安彩色区域
function generateMondrianColorBlocks(painting, verticalLines, horizontalLines, canvasSize) {
    // 蒙德里安三原色
    const mondrianColors = ['#FF0000', '#FFFF00', '#0000FF'];
    
    // 所有线条位置（包括边界）
    const allVerticalLines = [0, ...verticalLines, canvasSize];
    const allHorizontalLines = [0, ...horizontalLines, canvasSize];
    
    // 根据线条划分的区域
    for (let i = 0; i < allHorizontalLines.length - 1; i++) {
        for (let j = 0; j < allVerticalLines.length - 1; j++) {
            const startRow = allHorizontalLines[i];
            const endRow = allHorizontalLines[i + 1];
            const startCol = allVerticalLines[j];
            const endCol = allVerticalLines[j + 1];
            
            // 区域大小
            const width = endCol - startCol;
            const height = endRow - startRow;
            
            // 只对足够大的区域进行上色（避免太小的区域）
            if (width >= 3 && height >= 3 && Math.random() > 0.4) {
                // 随机选择蒙德里安颜色
                const color = mondrianColors[Math.floor(Math.random() * mondrianColors.length)];
                
                // 记录彩色区域信息
                painting.colorBlocks.push({
                    startRow: startRow,
                    endRow: endRow,
                    startCol: startCol,
                    endCol: endCol,
                    color: color
                });
                
                // 填充颜色（避开黑色线条）
                for (let row = startRow; row < endRow; row++) {
                    for (let col = startCol; col < endCol; col++) {
                        // 确保不是线条位置
                        if (!verticalLines.includes(col) && !horizontalLines.includes(row)) {
                            painting.data[row][col] = color;
                        }
                    }
                }
            }
        }
    }
}

// 显示格子画当前题目
function showGridQuestion() {
    const question = gridGameState.questions[gridGameState.currentQuestion];
    
    // 更新界面显示
    document.getElementById('grid-current-question').textContent = 
        `${gridGameState.currentQuestion + 1}/${gridGameState.questions.length}`;
    document.getElementById('grid-obs-current-question').textContent = 
        `${gridGameState.currentQuestion + 1}/${gridGameState.questions.length}`;
    
    // 更新进度条
    const progress = ((gridGameState.currentQuestion + 1) / gridGameState.questions.length) * 100;
    document.getElementById('grid-progress-fill').style.width = progress + '%';
    
    // 更新观察区域标题
    const painting = gridGameState.paintings[question.paintingIndex];
    // 使用画作中实际的剔除区域大小，确保与显示的区域完全一致
    const actualRegionSize = question.region ? question.region.length : 
                          (painting.questionRegion ? painting.questionRegion.regionWidth : 5);
    
    const boardTitle = document.getElementById('grid-board-title');
    if (boardTitle) {
        boardTitle.textContent = `观察区域（${actualRegionSize}×${actualRegionSize}）`;
    }
    
    // 绘制问题区域（使用预先生成的region）
    if (question && question.region) {
        // 直接使用预先生成的region数组
        drawGridQuestionBoard(question.region);
    } else {
        console.error('Invalid question or missing region:', question);
        // 绘制默认的白色区域作为备用
        const defaultRegion = [];
        const regionSize = gridGameState.observationRegionSize || getObservationRegionSize();
        for (let i = 0; i < regionSize; i++) {
            defaultRegion[i] = [];
            for (let j = 0; j < regionSize; j++) {
                defaultRegion[i][j] = '#FFFFFF';
            }
        }
        drawGridQuestionBoard(defaultRegion);
    }
    
    // 检查当前题目是否已有答案
    const existingAnswer = gridGameState.answers.find(a => a.questionIndex === gridGameState.currentQuestion);
    if (existingAnswer && existingAnswer.userAnswer !== null) {
        document.getElementById('grid-answer-input').value = existingAnswer.userAnswer;
        document.getElementById('grid-feedback').textContent = '✓ 已作答';
        document.getElementById('grid-feedback').className = 'feedback';
    } else {
        document.getElementById('grid-answer-input').value = '';
        document.getElementById('grid-feedback').textContent = '';
        document.getElementById('grid-feedback').className = 'feedback';
    }
    
    // 记录题目开始时间
    gridGameState.questionStartTime = Date.now();
    
    // 更新导航按钮状态
    updateGridNavigationButtons();
}

// 显示格子画答题界面
function showGridPracticeScreen() {
    // 增加10秒跑动时间
    gridGameState.runningTime += 10;
    gridGameState.isObserving = false;
    
    // 更新时间显示
    updateGridTimeDisplay();
    
    // 显示答题界面
    showScreen('grid-practice-screen');
}

// 绘制格子画问题区域（支持动态观察区域大小）
function drawGridQuestionBoard(region) {
    const canvas = document.getElementById('grid-question-board');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 直接从传入的region参数获取实际的剔除区域大小
    // 确保观察区域大小与画作中实际的剔除区域大小完全一致
    const actualRegionSize = region && Array.isArray(region) ? region.length : 0;
    
    if (actualRegionSize === 0) {
        console.error('Invalid region parameter:', region);
        return;
    }
    
    // 获取当前题目对应的画作，直接使用存储的CellSize值
    const currentQuestion = gridGameState.questions[gridGameState.currentQuestion];
    const painting = gridGameState.paintings[currentQuestion.paintingIndex];
    
    // 直接使用原画作存储的CellSize值，确保完全一致
    const cellSize = painting.originCellSize || 10; // 使用存储的CellSize值，如果不存在则使用默认值
    
    // 根据CellSize和观察区域大小确定画布大小
    // 画布大小 = CellSize × 观察区域大小
    const desiredCanvasSize = cellSize * actualRegionSize;
    if (canvas.width !== desiredCanvasSize || canvas.height !== desiredCanvasSize) {
        canvas.width = desiredCanvasSize;
        canvas.height = desiredCanvasSize;
    }
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 安全检查：确保region参数有效
    if (!region || !Array.isArray(region) || region.length === 0) {
        console.error('Invalid region parameter:', region);
        // 绘制默认的白色网格作为备用
        for (let i = 0; i < actualRegionSize; i++) {
            for (let j = 0; j < actualRegionSize; j++) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
        return;
    }
    
    // 绘制观察区域（不显示网格线），现在画布大小正好等于观察区域图像大小
    // 不需要偏移计算，观察区域将填满整个画布
    for (let i = 0; i < actualRegionSize; i++) {
        // 安全检查：确保region[i]存在
        if (!region[i] || !Array.isArray(region[i])) {
            for (let j = 0; j < actualRegionSize; j++) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
            continue;
        }
        
        for (let j = 0; j < actualRegionSize; j++) {
            const color = region[i][j] || '#FFFFFF';
            ctx.fillStyle = color;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // 不绘制网格线，保持蒙德里安风格的简洁性
        }
    }
}
// 保存格子画当前答案
function saveGridCurrentAnswer() {
    const userAnswer = parseInt(document.getElementById('grid-answer-input').value);
    const question = gridGameState.questions[gridGameState.currentQuestion];
    
    const answerValue = isNaN(userAnswer) || userAnswer < 1 || userAnswer > gridGameState.paintingCount ? null : userAnswer;
    const isCorrect = answerValue === (question.paintingIndex + 1);
    
    const questionTime = Math.round((Date.now() - gridGameState.questionStartTime) / 1000);
    
    const existingAnswerIndex = gridGameState.answers.findIndex(a => a.questionIndex === gridGameState.currentQuestion);
    
    if (existingAnswerIndex !== -1) {
        gridGameState.answers[existingAnswerIndex] = {
            questionIndex: gridGameState.currentQuestion,
            userAnswer: answerValue,
            correctAnswer: question.paintingIndex + 1,
            time: questionTime,
            isCorrect: isCorrect,
            paintingIndex: question.paintingIndex,
            regionSize: question.regionWidth,
            startRow: question.startRow,
            startCol: question.startCol
        };
    } else {
        gridGameState.answers.push({
            questionIndex: gridGameState.currentQuestion,
            userAnswer: answerValue,
            correctAnswer: question.paintingIndex + 1,
            time: questionTime,
            isCorrect: isCorrect,
            paintingIndex: question.paintingIndex,
            regionSize: question.regionWidth, // 区域大小（正方形，所以width=height）
            startRow: question.startRow,
            startCol: question.startCol
        });
    }
    
    return answerValue;
}

// 格子画上一题
function gridPrevQuestion() {
    saveGridCurrentAnswer();
    
    if (gridGameState.currentQuestion === 0) {
        gridGameState.currentQuestion = gridGameState.questions.length - 1;
    } else {
        gridGameState.currentQuestion--;
    }
    
    gridGameState.questionStartTime = Date.now();
    showGridQuestion();
    updateGridNavigationButtons();
}

// 格子画下一题
function gridNextQuestion() {
    saveGridCurrentAnswer();
    
    if (gridGameState.currentQuestion === gridGameState.questions.length - 1) {
        gridGameState.currentQuestion = 0;
    } else {
        gridGameState.currentQuestion++;
    }
    
    gridGameState.questionStartTime = Date.now();
    showGridQuestion();
    updateGridNavigationButtons();
}

// 更新格子画导航按钮状态
function updateGridNavigationButtons() {
    // 暂时不实现特殊逻辑，保持按钮可用状态
}

// 显示当前画作
function showCurrentPainting() {
    if (!gridGameState.paintings || gridGameState.paintings.length === 0) {
        console.error('paintings数组未初始化或为空');
        return;
    }
    
    if (currentPaintingIndex < 0 || currentPaintingIndex >= gridGameState.paintings.length) {
        console.error('currentPaintingIndex超出有效范围:', currentPaintingIndex);
        currentPaintingIndex = 0;
    }
    
    document.getElementById('painting-counter').textContent = `画作 ${currentPaintingIndex + 1}/${gridGameState.paintings.length}`;
    
    // 绘制当前画作
    const canvas = document.getElementById('single-grid-observation-board');
    const painting = gridGameState.paintings[currentPaintingIndex];
    if (canvas && painting) {
        // 动态设置canvas尺寸，使画布大小与观察区域大小成比例
        // 画布大小 = 画作画布尺寸 / 画作尺寸 * 观察区域大小
        const paintingCanvasSize = gridGameState.canvasSize || 20;
        const actualRegionSize = painting.questionRegion ? painting.questionRegion.regionWidth : 
                              (gridGameState.observationRegionSize || getObservationRegionSize());
        const desiredCanvasSize = Math.max(200, Math.min(600, paintingCanvasSize * actualRegionSize * 2)); // 保持比例一致
        if (canvas.width !== desiredCanvasSize || canvas.height !== desiredCanvasSize) {
            canvas.width = desiredCanvasSize;
            canvas.height = desiredCanvasSize;
        }
    }
        drawGridObservationBoard(canvas, painting);
}

// 绘制格子画观察画布（蒙德里安风格，不显示格线）
function drawGridObservationBoard(canvas, painting) {
    const ctx = canvas.getContext('2d');
    
    // 直接使用原画作存储的CellSize值，确保完全一致
    const cellSize = painting.originCellSize || 10; // 使用存储的CellSize值，如果不存在则使用默认值
    
    // 使用gridGameState中的canvasSize变量
    const canvasSize = gridGameState.canvasSize || 20;
    
    // 根据CellSize和画布大小确定画布尺寸
    // 画布大小 = CellSize × 画布格子数
    const desiredCanvasSize = cellSize * canvasSize;
    if (canvas.width !== desiredCanvasSize || canvas.height !== desiredCanvasSize) {
        canvas.width = desiredCanvasSize;
        canvas.height = desiredCanvasSize;
    }
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蒙德里安格子画（不显示网格线）
    for (let i = 0; i < canvasSize; i++) {
        for (let j = 0; j < canvasSize; j++) {
            const color = painting.data[i][j] || '#FFFFFF';
            ctx.fillStyle = color;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // 不绘制网格线，保持蒙德里安风格的简洁性
        }
    }
    
    // 绘制剔除区域（绿色边框包围，白色背景，中央打问号，不显示原宝石内容）
    if (painting.questionRegion) {
        const region = painting.questionRegion;
        const startRow = region.startRow;
        const startCol = region.startCol;
        const regionSize = region.regionWidth;
        
        // 先用白色填充整个剔除区域，覆盖原来的宝石内容
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
            startCol * cellSize,
            startRow * cellSize,
            regionSize * cellSize,
            regionSize * cellSize
        );
        
        // 绘制绿色边框
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            startCol * cellSize,
            startRow * cellSize,
            regionSize * cellSize,
            regionSize * cellSize
        );
        
        // 在剔除区域中央绘制问号
        const centerX = (startCol + regionSize / 2) * cellSize;
        const centerY = (startRow + regionSize / 2) * cellSize;
        
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.floor(cellSize * 0.6)}px Arial`; // 调整字体大小和粗细
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', centerX, centerY);
    }
}

// 格子画上一幅画
function gridPrevPainting() {
    if (currentPaintingIndex === 0) {
        currentPaintingIndex = gridGameState.paintings.length - 1;
    } else {
        currentPaintingIndex--;
    }
    showCurrentPainting();
}

// 格子画下一幅画
function gridNextPainting() {
    if (currentPaintingIndex === gridGameState.paintings.length - 1) {
        currentPaintingIndex = 0;
    } else {
        currentPaintingIndex++;
    }
    showCurrentPainting();
}

// 生成格子画观察界面
function generateGridObservationGrid() {
    // 重置当前画作索引
    currentPaintingIndex = 0;
    
    // 显示第一个画作
    showCurrentPainting();
}

// 显示格子画观察界面
function showGridObservationScreen() {
    // 增加10秒跑动时间
    gridGameState.runningTime += 10;
    gridGameState.isObserving = true;
    
    // 更新时间显示
    updateGridTimeDisplay();
    
    // 更新画作数量显示
document.getElementById('max-painting-number').textContent = gridGameState.paintings.length;
    
    // 生成观察界面
    generateGridObservationGrid();
    
    // 显示观察界面
    showScreen('grid-observation-screen');
}

// 格子画退出训练
function gridExitTraining() {
    if (confirm('确定要退出训练吗？未完成的题目将不会保存。')) {
        ReturnToMainMenu();
    }
}

// 格子画计时器
function startGridTimer() {
    if (window.gridTimer) {
        clearInterval(window.gridTimer);
    }
    
    updateGridTimeDisplay();
    
    window.gridTimer = setInterval(function() {
        updateGridTimeDisplay();
    }, 1000);
}

// 格子画结果上一幅画
function gridResultPrevPainting() {
    if (gridResultPaintingIndex === 0) {
        gridResultPaintingIndex = gridGameState.paintingCount - 1;
    } else {
        gridResultPaintingIndex--;
    }
    showGridResultPainting();
}

// 格子画结果下一幅画
function gridResultNextPainting() {
    if (gridResultPaintingIndex === gridGameState.paintingCount - 1) {
        gridResultPaintingIndex = 0;
    } else {
        gridResultPaintingIndex++;
    }
    showGridResultPainting();
}

// 显示格子画结果画作
function showGridResultPainting() {
    document.getElementById('grid-result-painting-counter').textContent = `画作 ${gridResultPaintingIndex + 1}/${gridGameState.paintings.length}`;
    
    const canvas = document.getElementById('grid-result-observation-board');
    const painting = gridGameState.paintings[gridResultPaintingIndex];
    if (canvas && painting) {
        // 动态设置canvas尺寸，使画布大小与观察区域大小成比例
        // 画布大小 = 画作画布尺寸 / 画作尺寸 * 观察区域大小
        const paintingCanvasSize = gridGameState.canvasSize || 20;
        const desiredCanvasSize = painting.originCellSize * paintingCanvasSize
        if (canvas.width !== desiredCanvasSize || canvas.height !== desiredCanvasSize) {
            canvas.width = desiredCanvasSize;
            canvas.height = desiredCanvasSize;
        }
    }
    
    drawGridResultBoard(canvas, painting);
}

// 生成格子画分享链接
function generateGridShareLink(totalTime, runningTime, seed) {
    // 获取正确题数和总题数
    const correctAnswers = gridGameState.answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = gridGameState.answers.length;
    
    // 按照宝石迷阵格式生成分享文字：我用了t秒完成了n道蒙德里安格子画（seed），正确m题！你也来试试吧~
    const shareMessage = `🎉我用了${totalTime}秒完成了${totalQuestions}道蒙德里安格子画（${seed}），正确${correctAnswers}题！你也来试试吧~💪`;
    document.getElementById('grid-share-message').textContent = shareMessage;
    
    const baseUrl = window.location.href.split('?')[0];
    const shareParams = new URLSearchParams();
    shareParams.append('canvasSize', gridGameState.canvasSize);
    shareParams.append('paintingCount', gridGameState.paintingCount);
    shareParams.append('regionSize', gridGameState.observationRegionSize);
    shareParams.append('seed', seed);
    shareParams.append('type', 'grid-painting');
    
    const shareLink = `🔗 ：${baseUrl}?${shareParams.toString()}`;
    document.getElementById('grid-share-link').value = shareLink;
}

// 生成格子画详细结果列表
function generateGridResultsList() {
    const resultsList = document.getElementById('grid-results-list');
    resultsList.innerHTML = '';
    
    gridGameState.answers.forEach((answer, index) => {
        const expandableItem = document.createElement('div');
        expandableItem.className = 'expandable-result-item';
        
        // 创建摘要部分
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'result-summary';
        
        let resultText = `第${index + 1}题：`;
        if (answer.userAnswer === null) {
            resultText += `未作答（正确答案：${answer.correctAnswer}）`;
        } else {
            resultText += `你的答案：${answer.userAnswer}，正确答案：${answer.correctAnswer}`;
        }
        
        if (answer.isCorrect) {
            resultText += ' ✓';
        } else if (answer.userAnswer !== null) {
            resultText += ' ✗';
        }
        
        const textSpan = document.createElement('span');
        textSpan.className = 'result-text';
        textSpan.textContent = resultText;
        
        const expandIcon = document.createElement('span');
        expandIcon.className = 'expand-icon';
        expandIcon.textContent = '▶';
        
        summaryDiv.appendChild(textSpan);
        summaryDiv.appendChild(expandIcon);
        
        // 创建展开内容部分
        const contentDiv = document.createElement('div');
        contentDiv.className = 'expand-content';
        contentDiv.style.display = 'none';
        
        // 创建题面画布
        const canvas = document.createElement('canvas');
        canvas.className = 'result-question-canvas';
        
        // 绘制题面，使用与实际画作一致的cellSize计算逻辑
        const ctx = canvas.getContext('2d');
        
        // 获取对应的画作，直接使用存储的CellSize值
        const painting = gridGameState.paintings[answer.paintingIndex];
        if (painting) {
            // 直接使用原画作存储的CellSize值，确保完全一致
            const cellSize = painting.originCellSize || 10; // 使用存储的CellSize值，如果不存在则使用默认值
            canvas.width = answer.regionSize * cellSize;
            canvas.height = answer.regionSize * cellSize;
            
            for (let i = 0; i < answer.regionSize; i++) {
                for (let j = 0; j < answer.regionSize; j++) {
                    const row = answer.startRow + i;
                    const col = answer.startCol + j;
                    if (row < painting.data.length && col < painting.data[0].length) {
                        const color = painting.data[row][col] || '#FFFFFF';
                        ctx.fillStyle = color;
                        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
        
        const questionInfo = document.createElement('p');
        questionInfo.textContent = `观察区域：${answer.regionSize}×${answer.regionSize} 格子，位置：(${answer.startRow}, ${answer.startCol})`;
        
        contentDiv.appendChild(canvas);
        contentDiv.appendChild(questionInfo);
        
        // 添加点击事件
        summaryDiv.addEventListener('click', function() {
            const isExpanded = contentDiv.style.display !== 'none';
            contentDiv.style.display = isExpanded ? 'none' : 'block';
            expandIcon.textContent = isExpanded ? '▶' : '▼';
        });
        
        expandableItem.appendChild(summaryDiv);
        expandableItem.appendChild(contentDiv);
        resultsList.appendChild(expandableItem);
    });
}

// 清空URL参数中的随机数种
function clearURLSeedParameter() {
    const seedInputs = [
        'random-seed',
        'grid-random-seed'
    ];
    
    const seedDisplayElements = [
        'seed-value',
        'grid-seed-value'
    ];
    
    // 清空所有输入框
    seedInputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.value = '';
        }
    });
    
    // 清空所有显示文本框
    seedDisplayElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '随机生成';
        }
    });

    const url = new URL(window.location);
    const urlParams = new URLSearchParams(url.search);
    
    // 清除旧的seed参数
    if (urlParams.has('seed')) {
        urlParams.delete('seed');
    }
    
    // 清除新的配置参数中的seed
    const configParam = urlParams.get('c');
    if (configParam) {
        try {
            const decodedConfig = atob(configParam);
            const config = JSON.parse(decodedConfig);
            
            // 移除配置中的seed相关字段
            delete config.s;
            delete config.seed;
            
            // 如果配置中还有其他字段，更新URL参数
            if (Object.keys(config).length > 0) {
                const newConfigString = JSON.stringify(config);
                const newEncodedConfig = btoa(newConfigString);
                urlParams.set('c', newEncodedConfig);
            } else {
                // 如果配置为空，删除整个c参数
                urlParams.delete('c');
            }
            
            url.search = urlParams.toString();
            window.history.replaceState({}, '', url);
        } catch (error) {
            console.warn('清除URL参数失败:', error);
        }
    } else if (urlParams.toString()) {
        // 如果没有c参数但有其他参数，直接更新URL
        url.search = urlParams.toString();
        window.history.replaceState({}, '', url);
    } else {
        // 如果没有参数，清除所有参数
        window.history.replaceState({}, '', window.location.pathname);
    }
}

// 格子画重新开始训练
function gridRestartTraining() {
    // 清除URL参数中的随机数种
    clearURLSeedParameter();
    showScreen('grid-setup-screen');
}

// 格子画返回主菜单
function gridReturnToMainMenu() {
    ReturnToMainMenu();
}

// 复制格子画分享链接
function gridCopyShareLink() {
    const shareLinkInput = document.getElementById('grid-share-link');
    const shareMessage = document.getElementById('grid-share-message');
    
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999);
    
    // 复制到剪贴板
    const textToCopy = `${shareMessage.textContent}\n${shareLinkInput.value}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('分享内容已复制到剪贴板！');
    }).catch(() => {
        // 备用方案
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('分享内容已复制到剪贴板！');
    });
}

// 格子画全局变量
let currentPaintingIndex = 0;
let gridResultPaintingIndex = 0;

// 初始化格子画游戏状态
function initGridGameState() {
    gridGameState = {
        paintings: [],           // 画作数组
        questions: [],          // 5个问题
        currentQuestion: 0,      // 当前题目索引
        answers: [],           // 用户答案
        startTime: 0,          // 开始时间
        endTime: 0,            // 结束时间
        questionStartTime: 0,  // 当前题目开始时间
        runningTime: 0,        // 跑动时间
        actualAnswerTime: 0,   // 实际答题时间
        seed: null,            // 随机数种
        isObserving: false,    // 是否在观察界面
        canvasSize: 20,        // 画布尺寸
        paintingCount: 10,     // 画作数量
        observationRegionSize: 5 // 观察区域大小
    };
    
    // 从URL参数读取观察区域大小
    gridGameState.observationRegionSize = getObservationRegionSize();
}

// 格子画提交全部答案
function gridSubmitAllAnswers() {
    const userAnswer = saveGridCurrentAnswer();
    
    if (userAnswer === null) {
        document.getElementById('grid-feedback').textContent = '请先输入当前题目的答案';
        document.getElementById('grid-feedback').className = 'feedback wrong';
        return;
    }
    
    // 检查是否所有题目都有答案
    const unansweredQuestions = gridGameState.questions.filter((_, index) => {
        const answer = gridGameState.answers.find(a => a.questionIndex === index);
        return !answer || answer.userAnswer === null;
    });
    
    if (unansweredQuestions.length > 0) {
        document.getElementById('grid-feedback').textContent = `还有${unansweredQuestions.length}道题未作答`;
        document.getElementById('grid-feedback').className = 'feedback wrong';
        return;
    }
    
    document.getElementById('grid-feedback').textContent = '✓ 答案已提交，正在计算结果...';
    document.getElementById('grid-feedback').className = 'feedback correct';
    
    // 重新显示当前题目
    showGridQuestion();
    
    // 记录结束时间
    gridGameState.endTime = Date.now();
    
    // 延迟后显示结果
    setTimeout(() => {
        showGridResults();
    }, 1000);
}

// 显示格子画结果
function showGridResults() {
    // 停止计时器
    if (window.gridTimer) {
        clearInterval(window.gridTimer);
    }
    
    // 计算总用时
    const totalTime = Math.floor((gridGameState.endTime - gridGameState.startTime) / 1000) + gridGameState.runningTime;
    
    // 计算正确率
    const correctAnswers = gridGameState.answers.filter(answer => answer.isCorrect).length;
    const accuracy = Math.round((correctAnswers / gridGameState.answers.length) * 100);
    
    // 更新结果界面
    document.getElementById('grid-total-time').textContent = totalTime;
    document.getElementById('grid-final-running-time').textContent = gridGameState.runningTime;
    document.getElementById('grid-final-seed').textContent = gridGameState.seed;
    
    // 生成分享链接
    generateGridShareLink(totalTime, gridGameState.runningTime, gridGameState.seed);
    
    // 生成详细结果
    generateGridResultsList();
    
    // 初始化结果界面画作显示
    gridResultPaintingIndex = 0;
    showGridResultPainting();
    
    // 显示结果界面
    showScreen('grid-result-screen');
}

// 更新格子画时间显示
function updateGridTimeDisplay() {
    if (!gridGameState.startTime) return;
    
    const elapsedTime = Math.floor((Date.now() - gridGameState.startTime) / 1000) + gridGameState.runningTime;
    
    const gameTimeElement = document.getElementById('grid-game-time');
    const obsTimeElement = document.getElementById('grid-obs-time');
    
    if (gameTimeElement) gameTimeElement.textContent = elapsedTime;
    if (obsTimeElement) obsTimeElement.textContent = elapsedTime;
    
    const runningTimeElement = document.getElementById('grid-running-time');
    const obsRunningTimeElement = document.getElementById('grid-obs-running-time');
    
    if (runningTimeElement) runningTimeElement.textContent = gridGameState.runningTime + '秒';
    if (obsRunningTimeElement) obsRunningTimeElement.textContent = gridGameState.runningTime + '秒';
}

// 从URL参数加载配置
function loadConfigFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        document.getElementById('random-seed').value = seedParam;
    }
    
    const boardSizeParam = urlParams.get('boardSize');
    if (boardSizeParam) {
        const boardSizeInput = document.getElementById('board-size');
        if (boardSizeInput) {
            boardSizeInput.value = boardSizeParam;
        }
    }
    
    const boardCountParam = urlParams.get('boardCount');
    if (boardCountParam) {
        const boardCountInput = document.getElementById('board-count');
        if (boardCountInput) {
            boardCountInput.value = boardCountParam;
        }
    }
    
    const playerParam = urlParams.get('player');
    if (playerParam) {
        // 玩家姓名输入框已删除，忽略此参数
    }
    
    const typeParam = urlParams.get('type');
    if (typeParam === 'observation') {
        // 如果是分享链接，直接进入训练设置界面
        showScreen('setup-screen');
        
        // 自动填充配置参数并开始训练
        setTimeout(() => {
            const seedInput = document.getElementById('random-seed');
            const boardSizeInput = document.getElementById('board-size');
            const boardCountInput = document.getElementById('board-count');
            
            // 如果URL中有参数，自动填充
            if (seedParam && seedInput) seedInput.value = seedParam;
            if (boardSizeParam && boardSizeInput) boardSizeInput.value = boardSizeParam;
            if (boardCountParam && boardCountInput) boardCountInput.value = boardCountParam;
            
            // 自动开始训练（可选，根据需求决定是否启用）
            // startTraining();
        }, 100);
    } else if (typeParam === 'grid-painting') {
        // 如果是格子画训练分享链接，直接进入格子画训练设置界面（不自动开始训练）
        showScreen('grid-setup-screen');
        
        // 自动填充格子画训练配置参数（不自动开始训练）
        setTimeout(() => {
            const seedInput = document.getElementById('grid-random-seed');
            const canvasSizeParam = urlParams.get('canvasSize');
            const paintingCountParam = urlParams.get('paintingCount');
            const observationRegionSizeParam = urlParams.get('regionSize');
            
            // 如果URL中有参数，自动填充
            if (seedParam && seedInput) seedInput.value = seedParam;
            if (canvasSizeParam) {
                const canvasSizeInput = document.getElementById('canvas-size');
                if (canvasSizeInput) canvasSizeInput.value = canvasSizeParam;
            }
            if (paintingCountParam) {
                const paintingCountInput = document.getElementById('painting-count');
                if (paintingCountInput) paintingCountInput.value = paintingCountParam;
            }
            if (observationRegionSizeParam) {
                const observationRegionSizeInput = document.getElementById('observation-region-size');
                if (observationRegionSizeInput) observationRegionSizeInput.value = observationRegionSizeParam;
            }
            
            // 不再自动开始训练，等待玩家手动点击"开始训练"
        }, 100);
    }
};

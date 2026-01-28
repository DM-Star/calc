// 宝石迷阵观察力训练 - JavaScript逻辑
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
    if (!typeParam || typeParam !== 'observation') {
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
    document.getElementById(screenId).classList.add('active');
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

// 绘制问题棋盘（5x5区域）
function drawQuestionBoard(region) {
    const canvas = document.getElementById('question-board');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellSize = 30;
    
    // 绘制每个宝石
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const gemType = region[i][j];
            drawGem(ctx, j * cellSize, i * cellSize, cellSize, gemType);
        }
    }
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
function drawQuestionBoardForResult(canvas, region) {
    const ctx = canvas.getContext('2d');
    const cellSize = 30;
    
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

// 复制分享链接
function copyShareLink() {
    const shareLinkInput = document.getElementById('share-link');
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(shareLinkInput.value);
        alert('分享链接已复制到剪贴板！');
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制链接');
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
    showScreen('setup-screen');
}

// 退出训练
function exitTraining() {
    if (confirm('确定要退出训练吗？未完成的题目将不会保存。')) {
        showScreen('main-menu');
    }
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
    }
}
let questions = [];
let currentQuestionIndex = 0;
let startTime = 0;
let questionStartTime = 0;
let results = [];
let currentPracticeType = '';
let currentSeed = null;
let actualSeedUsed = null; // 记录实际使用的随机数种

// 五子棋对战相关变量
let gomokuPeer = null;
let gomokuConn = null;
let gomokuRoomId = null;
let playerName = '';
let isHost = false;
let isHostIsBlack = false; // 记录主机是否为黑棋
let currentPlayer = 'black'; // 'black' 或 'white'
let gameBoard = [];
let gameStarted = false;
let gameOver = false; // 游戏是否结束的标志
let drawRequested = false; // 是否已发送和棋请求
let drawRequestPending = false; // 是否有待处理的和棋请求

// 设置随机数种
function setRandomSeed(seed) {
    if (seed && seed >= 1 && seed <= 999999) {
        currentSeed = seed;
        actualSeedUsed = seed;
        // 使用简单的伪随机数生成器
        Math.seed = seed;
        Math.random = function() {
            Math.seed = (Math.seed * 9301 + 49297) % 233280;
            return Math.seed / 233280;
        };
    } else {
        currentSeed = null;
        // 当用户没有设置数种时，使用系统随机数生成器
        // 但为了确保题目可重现，我们需要一个固定的数种
        actualSeedUsed = Math.floor(Math.random() * 999999) + 1;
        // 使用固定的伪随机数生成器，确保题目可重现
        Math.seed = actualSeedUsed;
        Math.random = function() {
            Math.seed = (Math.seed * 9301 + 49297) % 233280;
            return Math.seed / 233280;
        };
    }
}

// 获取当前随机数种
function getCurrentSeed() {
    return currentSeed;
}

// 保存随机数种到URL参数
function saveSeedToURL() {
    const url = new URL(window.location);
    if (actualSeedUsed) {
        url.searchParams.set('seed', actualSeedUsed.toString());
    } else {
        url.searchParams.delete('seed');
    }
    window.history.replaceState({}, '', url);
}

// 从URL参数加载随机数种
function loadSeedFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam) {
        const seed = parseInt(seedParam);
        if (seed >= 1 && seed <= 999999) {
            // 设置随机数种
            setRandomSeed(seed);
            // 更新所有界面的显示
            updateAllSeedDisplays(seed);
        }
    }
}

// 选择练习类型
function selectPractice(type) {
    currentPracticeType = type;
    
    if (type === 'decimal') {
        showScreen('decimal-setup');
    } else if (type === 'arithmetic') {
        showScreen('arithmetic-setup');
    } else if (type === 'comprehensive') {
        showScreen('comprehensive-setup');
    } else if (type === 'gomoku') {
        showScreen('gomoku-setup');
    }
}

// 生成随机十进制数
function generateDecimalNumbers(min, max, count) {
    const numbers = new Set();
    while (numbers.size < count) {
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        numbers.add(randomNum);
    }
    return Array.from(numbers);
}

// 生成四则运算题目
function generateArithmeticQuestions(min, max, count, operations) {
    const questions = [];
    
    while (questions.length < count) {
        // 提高除法题目的出现概率
        let operation;
        if (operations.includes('/') && Math.random() < 0.4) {
            // 40%的概率选择除法（如果用户选择了除法）
            operation = '/';
        } else {
            // 其他情况下随机选择运算符
            operation = operations[Math.floor(Math.random() * operations.length)];
        }
        
        let a, b, answer;
        
        switch (operation) {
            case '+':
                a = Math.floor(Math.random() * (max - min + 1)) + min;
                b = Math.floor(Math.random() * (max - min + 1)) + min;
                // 尽量避免加数为个位数
                if (a < 10 && b < 10) {
                    // 如果两个加数都是个位数，重新生成至少一个两位数
                    if (Math.random() < 0.5) {
                        a = Math.floor(Math.random() * (max - 10 + 1)) + 10;
                    } else {
                        b = Math.floor(Math.random() * (max - 10 + 1)) + 10;
                    }
                }
                answer = a + b;
                questions.push({
                    question: `${a} + ${b} = ?`,
                    answer: answer,
                    operation: '+'
                });
                break;
            case '-':
                a = Math.floor(Math.random() * (max - min + 1)) + min;
                b = Math.floor(Math.random() * (max - min + 1)) + min;
                // 确保结果为正数
                if (a < b) [a, b] = [b, a];
                
                // 避免差为1
                if (a - b === 1) {
                    // 如果差为1，调整b的值
                    b = Math.floor(Math.random() * (a - 2)) + 2;
                    // 确保调整后差不为1且结果为正数
                    if (a - b === 1) {
                        b = a - 2;
                    }
                }
                
                // 避免减数为1
                if (b === 1) {
                    b = Math.floor(Math.random() * (a - 2)) + 2;
                    // 确保调整后差不为1
                    if (a - b === 1) {
                        b = a - 2;
                    }
                }
                
                answer = a - b;
                questions.push({
                    question: `${a} - ${b} = ?`,
                    answer: answer,
                    operation: '-'
                });
                break;
            case '*':
                a = Math.floor(Math.random() * (max - min + 1)) + min;
                b = Math.floor(Math.random() * (max - min + 1)) + min;
                // 尽量避免乘数为1
                if (a === 1 || b === 1) {
                    if (a === 1) a = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                    if (b === 1) b = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                }
                answer = a * b;
                questions.push({
                    question: `${a} × ${b} = ?`,
                    answer: answer,
                    operation: '*'
                });
                break;
            case '/':
                // 确保除法结果为整数
                b = Math.floor(Math.random() * (max - min + 1)) + min;
                answer = Math.floor(Math.random() * (max - min + 1)) + min;
                
                // 尽量避免除数为1
                if (b === 1) {
                    b = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                }
                
                // 尽量避免答案为1
                if (answer === 1) {
                    answer = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                }
                
                a = b * answer;
                
                // 避免被除数为1
                if (a === 1) {
                    // 如果被除数为1，重新调整除数和商
                    b = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                    answer = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                    a = b * answer;
                }
                
                // 避免被除数为质数（确保有多个因数）
                if (isPrime(a)) {
                    // 如果被除数是质数，重新生成除数和商
                    b = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                    answer = Math.floor(Math.random() * (max - 2 + 1)) + 2;
                    a = b * answer;
                    
                    // 如果重新生成后还是质数，再次调整
                    if (isPrime(a)) {
                        // 确保被除数有多个因数，避免质数
                        b = Math.floor(Math.random() * (max - 3 + 1)) + 3;
                        answer = Math.floor(Math.random() * (max - 3 + 1)) + 3;
                        a = b * answer;
                    }
                }
                
                // 不再限制a在范围内，允许被除数超出用户设置的范围
                questions.push({
                    question: `${a} ÷ ${b} = ?`,
                    answer: answer,
                    operation: '/'
                });
                break;
        }
    }
    
    return questions;
}

// 生成综合四则运算题目
function generateComprehensiveQuestions(min, max, count, numCount, operations) {
    const questions = [];
    const maxAnswer = max * max; // 限制答案不超过范围的平方
    
    while (questions.length < count) {
        // 生成运算数
        const numbers = [];
        for (let i = 0; i < numCount; i++) {
            let num = Math.floor(Math.random() * (max - min + 1)) + min;
            // 避免生成1作为运算数（特别是可能作为除数的情况）
            if (num === 1) {
                num = Math.floor(Math.random() * (max - 2 + 1)) + 2;
            }
            numbers.push(num);
        }
        
        // 生成运算符
        const ops = [];
        for (let i = 0; i < numCount - 1; i++) {
            const op = operations[Math.floor(Math.random() * operations.length)];
            ops.push(op);
        }
        
        // 第一步：先构建表达式（可能包含括号）
        let expression = '';
        let hasParentheses = Math.random() < 0.6; // 60%的概率包含括号
        
        if (hasParentheses && numCount >= 3) {
            // 随机选择插入括号的位置
            const parenStart = Math.floor(Math.random() * (numCount - 2));
            
            for (let i = 0; i < numCount; i++) {
                if (i === parenStart) {
                    expression += '(';
                }
                expression += numbers[i];
                if (i === parenStart + 1) {
                    expression += ')';
                }
                if (i < numCount - 1) {
                    expression += ' ' + ops[i] + ' ';
                }
            }
        } else {
            // 无括号的表达式
            for (let i = 0; i < numCount; i++) {
                expression += numbers[i];
                if (i < numCount - 1) {
                    expression += ' ' + ops[i] + ' ';
                }
            }
        }
        
        // 第二步：对表达式中的每个除法运算进行合法性检查
        let expressionValid = true;
        
        // 分析表达式中的除法运算
        for (let i = 0; i < ops.length; i++) {
            if (ops[i] === '/') {
                // 计算除法运算的被除数（考虑括号影响）
                let dividend;
                if (hasParentheses && numCount >= 3) {
                    // 如果有括号，需要确定括号位置
                    const parenStart = Math.floor(Math.random() * (numCount - 2));
                    
                    if (i >= parenStart && i < parenStart + 1) {
                        // 如果除法在括号内，被除数是括号内的计算结果
                        // 构建括号内的表达式进行计算
                        let bracketExpression = '';
                        for (let j = parenStart; j <= i; j++) {
                            bracketExpression += numbers[j];
                            if (j < i) {
                                bracketExpression += ' ' + ops[j] + ' ';
                            }
                        }
                        dividend = eval(bracketExpression);
                    } else {
                        // 如果除法不在括号内，被除数是前面的运算结果
                        // 构建前面的表达式进行计算
                        let leftExpression = '';
                        for (let j = 0; j <= i; j++) {
                            leftExpression += numbers[j];
                            if (j < i) {
                                leftExpression += ' ' + ops[j] + ' ';
                            }
                        }
                        dividend = eval(leftExpression);
                    }
                } else {
                    // 如果无括号，被除数是前面的运算结果
                    // 构建前面的表达式进行计算
                    let leftExpression = '';
                    for (let j = 0; j <= i; j++) {
                        leftExpression += numbers[j];
                        if (j < i) {
                            leftExpression += ' ' + ops[j] + ' ';
                        }
                    }
                    dividend = eval(leftExpression);
                }
                
                const divisor = numbers[i + 1];
                
                // 检查除法合法性
                if (dividend % divisor !== 0 || dividend / divisor === 1 || dividend === 1 || isPrime(dividend)) {
                    // 除法不合法，调整除数
                    numbers[i + 1] = findDivisor(dividend, 2, max * max, true);
                    
                    // 重新构建表达式
                    expression = '';
                    if (hasParentheses && numCount >= 3) {
                        const newParenStart = Math.floor(Math.random() * (numCount - 2));
                        for (let j = 0; j < numCount; j++) {
                            if (j === newParenStart) {
                                expression += '(';
                            }
                            expression += numbers[j];
                            if (j === newParenStart + 1) {
                                expression += ')';
                            }
                            if (j < numCount - 1) {
                                expression += ' ' + ops[j] + ' ';
                            }
                        }
                    } else {
                        for (let j = 0; j < numCount; j++) {
                            expression += numbers[j];
                            if (j < numCount - 1) {
                                expression += ' ' + ops[j] + ' ';
                            }
                        }
                    }
                }
            }
        }
        
        // 计算表达式结果
        try {
            // 使用eval计算表达式，但先进行安全检查
            const safeExpression = expression.replace(/÷/g, '/').replace(/×/g, '*');
            const result = eval(safeExpression);
            
            // 确保结果为整数且为正数，并且不超过范围的平方
            if (Number.isInteger(result) && result > 0 && result <= maxAnswer) {
                questions.push({
                    question: expression + ' = ?',
                    answer: result,
                    operation: 'comprehensive'
                });
            }
        } catch (e) {
            // 如果计算出错，跳过这个题目
            continue;
        }
    }
    
    return questions;
}

// 辅助函数：寻找合适的除数（无范围限制版本）
function findDivisorNoLimit(dividend, avoidQuotientOne = false) {
    // 寻找dividend的因数，没有范围限制
    const divisors = [];
    
    // 遍历所有可能的因数（从2到dividend/2）
    for (let i = 2; i <= dividend / 2; i++) {
        if (dividend % i === 0) {
            // 如果要求避免商为1，检查商是否等于1
            if (avoidQuotientOne && dividend / i === 1) {
                continue; // 跳过商为1的情况
            }
            divisors.push(i);
        }
    }
    
    if (divisors.length > 0) {
        // 从可用的除数中随机选择一个
        return divisors[Math.floor(Math.random() * divisors.length)];
    } else {
        // 如果没有合适的除数，返回一个随机数（但可能无法整除）
        // 除数至少为2，避免除数为1
        let divisor = Math.floor(Math.random() * (dividend - 2)) + 2;
        return divisor;
    }
}

// 辅助函数：判断一个数是否为质数
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

// 十进制转二进制函数
function decimalToBinary(decimal) {
    return decimal.toString(2);
}

// 辅助函数：寻找合适的除数（有范围限制版本，保留用于其他场景）
function findDivisor(dividend, min, max, avoidQuotientOne = false) {
    // 寻找dividend的因数，确保在[min, max]范围内
    const divisors = [];
    for (let i = min; i <= max && i <= dividend; i++) {
        if (dividend % i === 0) {
            // 如果要求避免商为1，检查商是否等于1
            if (avoidQuotientOne && dividend / i === 1) {
                continue; // 跳过商为1的情况
            }
            divisors.push(i);
        }
    }
    
    if (divisors.length > 0) {
        // 从可用的除数中随机选择一个
        return divisors[Math.floor(Math.random() * divisors.length)];
    } else {
        // 如果没有合适的除数，返回一个随机数（但可能无法整除）
        let divisor = Math.floor(Math.random() * (max - min + 1)) + min;
        // 避免除数为1
        while (divisor === 1) {
            divisor = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return divisor;
    }
}

// 开始十进制转二进制
function startDecimalPractice() {
    const min = parseInt(document.getElementById('min-range').value);
    const max = parseInt(document.getElementById('max-range').value);
    
    if (min >= max) {
        alert('最小值必须小于最大值');
        return;
    }
    
    // 检查范围大小是否足够
    const rangeSize = max - min + 1;
    if (rangeSize < 10) {
        alert(`范围大小过小！当前范围只有${rangeSize}个数字，请确保范围至少包含10个不同的数字（最大值-最小值+1 ≥ 10）`);
        return;
    }
    
    // 获取并设置随机数种
    const seedInput = document.getElementById('decimal-random-seed');
    const seedValue = seedInput.value.trim();
    
    if (seedValue) {
        const seed = parseInt(seedValue);
        if (seed >= 1 && seed <= 999999) {
            setRandomSeed(seed);
            saveSeedToURL();
            // 更新所有界面的显示
            updateAllSeedDisplays(seed);
        } else {
            alert('随机数种必须在1-999999之间');
            return;
        }
    } else {
        // 如果没有输入数种，使用随机数种
        setRandomSeed(null);
        saveSeedToURL();
        // 更新所有界面的显示
        updateAllSeedDisplays(null);
    }

    questions = generateDecimalNumbers(min, max, 10);
    currentQuestionIndex = 0;
    results = [];
    startTime = Date.now();
    
    document.getElementById('practice-title').textContent = '十进制转二进制';
    showScreen('practice-screen');
    showQuestion();
}

// 开始四则运算练习
function startArithmeticPractice() {
    const min = parseInt(document.getElementById('arithmetic-min-range').value);
    const max = parseInt(document.getElementById('arithmetic-max-range').value);
    
    if (min >= max) {
        alert('最小值必须小于最大值');
        return;
    }

    // 获取并设置随机数种
    const seedInput = document.getElementById('arithmetic-random-seed');
    const seedValue = seedInput.value.trim();
    
    if (seedValue) {
        const seed = parseInt(seedValue);
        if (seed >= 1 && seed <= 999999) {
            setRandomSeed(seed);
            saveSeedToURL();
            // 更新当前界面显示
            document.getElementById('arithmetic-seed-value').textContent = seed;
        } else {
            alert('随机数种必须在1-999999之间');
            return;
        }
    } else {
        // 如果没有输入数种，使用随机数种
        setRandomSeed(null);
        saveSeedToURL();
        document.getElementById('arithmetic-seed-value').textContent = '随机生成';
    }

    const selectedOperations = Array.from(document.querySelectorAll('input[name="operation"]:checked'))
        .map(input => input.value);
    
    if (selectedOperations.length === 0) {
        alert('请至少选择一种运算类型');
        return;
    }

    questions = generateArithmeticQuestions(min, max, 10, selectedOperations);
    currentQuestionIndex = 0;
    results = [];
    startTime = Date.now();
    
    document.getElementById('practice-title').textContent = '整数四则运算练习';
    showScreen('practice-screen');
    showQuestion();
}

// 开始综合四则运算练习
function startComprehensivePractice() {
    const min = parseInt(document.getElementById('comprehensive-min-range').value);
    const max = parseInt(document.getElementById('comprehensive-max-range').value);
    const numCount = parseInt(document.getElementById('number-count').value);
    
    if (min >= max) {
        alert('最小值必须小于最大值');
        return;
    }

    if (numCount < 2 || numCount > 6) {
        alert('运算数数量必须在2-6之间');
        return;
    }

    // 获取并设置随机数种
    const seedInput = document.getElementById('comprehensive-random-seed');
    const seedValue = seedInput.value.trim();
    
    if (seedValue) {
        const seed = parseInt(seedValue);
        if (seed >= 1 && seed <= 999999) {
            setRandomSeed(seed);
            saveSeedToURL();
            // 更新当前界面显示
            document.getElementById('comprehensive-seed-value').textContent = seed;
        } else {
            alert('随机数种必须在1-999999之间');
            return;
        }
    } else {
        // 如果没有输入数种，使用随机数种
        setRandomSeed(null);
        saveSeedToURL();
        document.getElementById('comprehensive-seed-value').textContent = '随机生成';
    }

    const selectedOperations = Array.from(document.querySelectorAll('input[name="comprehensive-operation"]:checked'))
        .map(input => input.value);
    
    if (selectedOperations.length === 0) {
        alert('请至少选择一种运算类型');
        return;
    }

    questions = generateComprehensiveQuestions(min, max, 10, numCount, selectedOperations);
    currentQuestionIndex = 0;
    results = [];
    startTime = Date.now();
    
    document.getElementById('practice-title').textContent = '综合四则运算练习';
    showScreen('practice-screen');
    showQuestion();
}

// 跳过当前题目
function skipQuestion() {
    const skipButton = document.getElementById('skip-btn');
    
    // 防止快速重复点击：禁用按钮并设置冷却时间
    skipButton.disabled = true;
    skipButton.textContent = '跳过中...';
    
    setTimeout(() => {
        let questionData;
        if (currentPracticeType === 'decimal') {
            questionData = {
                question: questions[currentQuestionIndex],
                answer: decimalToBinary(questions[currentQuestionIndex])
            };
        } else {
            questionData = questions[currentQuestionIndex];
        }
        
        const questionTime = Math.round((Date.now() - questionStartTime) / 1000);
        
        results.push({
            question: currentPracticeType === 'decimal' ? questionData.question : questionData.question,
            time: questionTime,
            correct: false,
            userAnswer: '跳过',
            correctAnswer: questionData.answer,
            skipped: true
        });
        
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 500); // 500毫秒的冷却时间，防止误触
}

// 检查答案
function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim();
    const feedback = document.getElementById('feedback');
    const submitButton = document.querySelector('button[onclick="checkAnswer()"]');
    
    let correctAnswer;
    let isCorrect = false;
    
    if (currentPracticeType === 'decimal') {
        correctAnswer = decimalToBinary(questions[currentQuestionIndex]);
        isCorrect = userAnswer === correctAnswer;
    } else if (currentPracticeType === 'arithmetic' || currentPracticeType === 'comprehensive') {
        correctAnswer = questions[currentQuestionIndex].answer.toString();
        isCorrect = userAnswer === correctAnswer;
    }
    
    if (isCorrect) {
        // 禁用提交按钮，防止重复提交
        submitButton.disabled = true;
        
        // 记录答题时间
        const questionTime = Math.round((Date.now() - questionStartTime) / 1000);
        
        feedback.textContent = '✓ 正确！';
        feedback.className = 'feedback correct';
        
        const result = {
            question: currentPracticeType === 'decimal' ? questions[currentQuestionIndex] : questions[currentQuestionIndex].question,
            time: questionTime,
            correct: true,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer
        };
        
        results.push(result);
        
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion();
            } else {
                showResults();
            }
        }, 1000);
    } else {
        feedback.textContent = '✗ 错误！请重新输入正确的答案。';
        feedback.className = 'feedback wrong';
        // 答错时不记录时间，继续计时直到答对
    }
}

// 显示当前题目
function showQuestion() {
    // 清除所有可能存在的加载状态元素
    const existingLoading = document.querySelector('.loading');
    if (existingLoading) {
        existingLoading.remove();
    }
    
    let questionText = '';
    if (currentPracticeType === 'decimal') {
        const decimalNumber = questions[currentQuestionIndex];
        questionText = `将十进制数 <span id="decimal-number">${decimalNumber}</span> 转为二进制：`;
    } else if (currentPracticeType === 'arithmetic' || currentPracticeType === 'comprehensive') {
        questionText = questions[currentQuestionIndex].question;
    }
    
    document.getElementById('question-text').innerHTML = questionText;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    
    // 重新启用提交按钮
    const submitButton = document.querySelector('button[onclick="checkAnswer()"]');
    submitButton.disabled = false;
    
    // 为所有练习类型显示跳过按钮
    const skipButton = document.getElementById('skip-btn');
    skipButton.style.display = 'inline-block';
    skipButton.disabled = false;
    skipButton.textContent = '跳过此题';
    
    // 更新进度
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('progress-fill').style.width = ((currentQuestionIndex + 1) * 10) + '%';
    
    questionStartTime = Date.now();
}

// 显示结果
function showResults() {
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    // 显示随机数种信息
    let seedInfo = '';
    if (currentSeed) {
        seedInfo = ` | 随机数种：${currentSeed}`;
    } else {
        // 如果没有主动设置随机数种，显示实际使用的随机数种
        seedInfo = ` | 随机数种：${actualSeedUsed}`;
    }
    
    document.getElementById('total-time').innerHTML = `总用时：${totalTime}秒${seedInfo}`;
    
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    
    // 找出最快和最慢的题目
    let fastestIndex = -1;
    let slowestIndex = -1;
    let fastestTime = Infinity;
    let slowestTime = 0;
    
    results.forEach((result, index) => {
        if (result.time < fastestTime && result.correct && !result.skipped) {
            fastestTime = result.time;
            fastestIndex = index;
        }
        if (result.time > slowestTime && !result.skipped) {
            slowestTime = result.time;
            slowestIndex = index;
        }
    });
    
    // 显示每道题的结果
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        if (index === fastestIndex) {
            resultItem.classList.add('fastest');
        }
        if (index === slowestIndex) {
            resultItem.classList.add('slowest');
        }
        if (result.skipped) {
            resultItem.classList.add('skipped');
        }
        
        const status = result.correct ? '✓' : (result.skipped ? '⏭️' : '✗');
        const marker = index === fastestIndex ? ' (最快)' : 
                     index === slowestIndex ? ' (最慢)' : '';
        
        let questionDisplay;
        if (currentPracticeType === 'decimal') {
            questionDisplay = `十进制 ${result.question} → 二进制 ${result.correctAnswer}`;
        } else {
            questionDisplay = result.question.replace('?', result.correctAnswer);
        }
        
        let resultHTML = `
            第${index + 1}题：${questionDisplay} 
            - 用时：${result.time}秒 ${marker}
            - 状态：${status}
        `;
        
        if (result.skipped) {
            resultHTML += `- 正确答案：${result.correctAnswer}`;
        } else if (!result.correct) {
            resultHTML += `- 你的答案：${result.userAnswer}`;
        }
        
        resultItem.innerHTML = resultHTML;
        resultsList.appendChild(resultItem);
    });
    
    showScreen('result-screen');
}

// 退出练习
function exitPractice() {
    if (confirm('确定要退出当前练习吗？未完成的题目将不会保存。')) {
        // 重置所有练习相关变量
        questions = [];
        currentQuestionIndex = 0;
        results = [];
        startTime = 0;
        questionStartTime = 0;
        currentPracticeType = '';
        actualSeedUsed = null;
        
        // 返回主菜单
        showScreen('main-menu');
    }
}

// 重新开始练习
function restartPractice() {
    actualSeedUsed = null;
    
    // 清空随机数种输入框
    if (currentPracticeType === 'decimal') {
        document.getElementById('decimal-random-seed').value = '';
        document.getElementById('decimal-seed-value').textContent = '随机生成';
        showScreen('decimal-setup');
    } else if (currentPracticeType === 'arithmetic') {
        document.getElementById('arithmetic-random-seed').value = '';
        document.getElementById('arithmetic-seed-value').textContent = '随机生成';
        showScreen('arithmetic-setup');
    } else if (currentPracticeType === 'comprehensive') {
        document.getElementById('comprehensive-random-seed').value = '';
        document.getElementById('comprehensive-seed-value').textContent = '随机生成';
        showScreen('comprehensive-setup');
    }
    
    // 重置当前种子
    currentSeed = null;
}

// 切换界面显示
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // 如果切换到五子棋游戏界面，初始化游戏
    if (screenId === 'gomoku-game') {
        initGomokuGame();
    }
    
    // 更新当前随机数种显示
    updateSeedDisplay();
}

// 更新所有界面的随机数种显示
function updateAllSeedDisplays(seed) {
    const seedElements = [
        'decimal-seed-value',
        'arithmetic-seed-value', 
        'comprehensive-seed-value'
    ];
    
    seedElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            if (seed) {
                element.textContent = seed;
            } else {
                element.textContent = '随机生成';
            }
        }
    });
}

// 更新随机数种显示
function updateSeedDisplay() {
    // 根据当前显示的界面更新对应的数种显示
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        const screenId = activeScreen.id;
        let seedValueElement;
        
        if (screenId === 'decimal-setup') {
            seedValueElement = document.getElementById('decimal-seed-value');
        } else if (screenId === 'arithmetic-setup') {
            seedValueElement = document.getElementById('arithmetic-seed-value');
        } else if (screenId === 'comprehensive-setup') {
            seedValueElement = document.getElementById('comprehensive-seed-value');
        }
        
        if (seedValueElement) {
            if (currentSeed) {
                seedValueElement.textContent = currentSeed;
            } else {
                seedValueElement.textContent = '随机生成';
            }
        }
    }
}

// 改进的Peer连接设置
function setupPeerConnection(roomId = null) {
    try {
        // 清理之前的连接
        if (gomokuPeer) {
            gomokuPeer.destroy();
            gomokuPeer = null;
        }
        if (gomokuConn) {
            gomokuConn.close();
            gomokuConn = null;
        }
        
        // 关键修复：如果提供了房间号，直接作为new Peer的第一个参数
        if (roomId) {
            gomokuPeer = new Peer(roomId, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                debug: 3,
                config: {
                    iceServers: [
                        {
                          urls: "stun:stun.relay.metered.ca:80",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:80",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:80?transport=tcp",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:443",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turns:asia.relay.metered.ca:443?transport=tcp",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                    ],
                }
            });
        } else {
            // 如果没有提供房间号，使用随机ID（客户端加入房间）
            gomokuPeer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                debug: 3,
                config: {
                    iceServers: [
                        {
                          urls: "stun:stun.relay.metered.ca:80",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:80",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:80?transport=tcp",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turn:asia.relay.metered.ca:443",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                        {
                          urls: "turns:asia.relay.metered.ca:443?transport=tcp",
                          username: "de91692ac1ebe7ee458bdb3a",
                          credential: "bkpiRo//l3iGRYzm",
                        },
                    ],
                }
            });
        }
        
        gomokuPeer.on('open', function(id) {
            console.log('Peer连接已建立，ID:', id);
            updateRoomStatus('连接已建立，可以创建或加入房间');
        });
        
        gomokuPeer.on('connection', function(conn) {
            gomokuConn = conn;
            setupConnectionHandlers();
            
            // 关键修复：等待连接完全建立后再开始游戏
            gomokuConn.on('open', function() {
                // 对方加入房间
                updateRoomStatus('对方已加入房间，游戏开始！');
                startGameRandom(); // 随机分配棋色
            });
        });
        
        gomokuPeer.on('error', function(err) {
            console.error('Peer连接错误:', err);
            
            // 区分不同类型的错误
            let errorMessage = '连接错误: ';
            switch (err.type) {
                case 'peer-unavailable':
                    errorMessage += '对方不在线或房间不存在';
                    break;
                case 'network':
                    errorMessage += '网络连接失败';
                    break;
                case 'server-error':
                    errorMessage += '服务器错误，请稍后重试';
                    break;
                case 'socket-error':
                    errorMessage += 'Socket连接错误';
                    break;
                case 'socket-closed':
                    errorMessage += '连接已关闭';
                    break;
                default:
                    errorMessage += err.message;
            }
            
            updateRoomStatus(errorMessage);
            
            // 提供重连选项
            if (err.type !== 'socket-closed') {
                setTimeout(function() {
                    if (confirm('连接失败，是否重新连接？')) {
                        setupPeerConnection(roomId);
                    }
                }, 2000);
            }
        });
        
        // 连接断开处理
        gomokuPeer.on('disconnected', function() {
            console.log('Peer连接断开');
            updateRoomStatus('连接已断开');
        });
        
        gomokuPeer.on('close', function() {
            console.log('Peer连接关闭');
            updateRoomStatus('连接已关闭');
        });
        
    } catch (error) {
        console.error('Peer初始化错误:', error);
        updateRoomStatus('初始化错误: ' + error.message);
    }
}

// 生成6位随机房间号
function generateRoomCode() {
    // 6位数字+大写字母
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// 更新房间状态显示
function updateRoomStatus(message) {
    const statusElement = document.getElementById('room-info');
    if (statusElement) {
        statusElement.textContent = message;
        
        // 显示状态面板
        const statusPanel = document.getElementById('room-status');
        if (statusPanel) {
            statusPanel.style.display = 'block';
        }
    }
}

// 更新房间号显示
function updateRoomCodeDisplay(roomCode) {
    const roomCodeElement = document.getElementById('current-room-code');
    if (roomCodeElement) {
        roomCodeElement.textContent = roomCode;
        
        // 添加动画效果
        roomCodeElement.style.animation = 'none';
        setTimeout(() => {
            roomCodeElement.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
    }
}

// 复制房间号到剪贴板
function copyRoomCode() {
    const roomCode = gomokuRoomId;
    if (!roomCode) {
        showCopyFeedback('房间号未生成', 'error');
        return;
    }
    
    // 使用现代剪贴板API
    navigator.clipboard.writeText(roomCode).then(function() {
        showCopyFeedback('房间号已复制到剪贴板！', 'success');
        
        // 添加复制成功动画
        const copyBtn = document.querySelector('.room-info-panel button');
        if (copyBtn) {
            copyBtn.style.backgroundColor = 'rgba(255,255,255,0.3)';
            copyBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                copyBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
                copyBtn.style.transform = 'scale(1)';
            }, 200);
        }
    }).catch(function(err) {
        console.error('复制失败:', err);
        
        // 备用方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCopyFeedback('房间号已复制到剪贴板！', 'success');
        } catch (backupErr) {
            showCopyFeedback('复制失败，请手动复制房间号', 'error');
        }
        document.body.removeChild(textArea);
    });
}

// 显示复制反馈
function showCopyFeedback(message, type) {
    const feedbackElement = document.getElementById('copy-feedback');
    if (feedbackElement) {
        feedbackElement.textContent = message;
        feedbackElement.style.color = type === 'success' ? '#90EE90' : '#FFB6C1';
        
        // 3秒后清除反馈
        setTimeout(() => {
            feedbackElement.textContent = '';
        }, 3000);
    }
}

// 初始化五子棋游戏
function initGomokuGame() {
    // 初始化棋盘
    initBoard();
    
    // 设置棋盘点击事件
    setupBoardClick();
    
    // 更新玩家信息显示
    if (playerName) {
        document.getElementById('self-player-name').textContent = playerName;
        document.getElementById('opponent-player-name').textContent = isHost ? '等待玩家加入...' : '等待主机信息...';
    }
}

// 页面加载完成后初始化
window.addEventListener('load', function() {
    loadSeedFromURL();
    updateAllSeedDisplays(currentSeed);
    
    // 设置聊天输入框回车键发送
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // 延迟设置棋盘点击事件
    setTimeout(function() {
        setupBoardClick();
    }, 1000);
});

// 显示更新日志界面
function showUpdateLog() {
    showScreen('update-log-screen');
    loadUpdateLog();
}

// 显示更新日志界面
function loadUpdateLog() {
    // 现在使用iframe加载单独的update-log.html文件
    // 不需要额外的处理，iframe会自动加载内容
    console.log('更新日志界面已显示');
}

// ==================== 五子棋对战功能 ====================

// 改进的创建房间函数
function createGomokuRoom() {
    playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        alert('请输入您的姓名');
        return;
    }
    
    // 防止重复点击
    const createBtn = document.querySelector('button[onclick="createGomokuRoom()"]');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = '创建中...';
    }
    
    // 生成房间号
    gomokuRoomId = generateRoomCode();
    isHost = true;
    
    updateRoomStatus('正在创建房间...');
    
    // 清理之前的连接
    if (gomokuPeer) {
        gomokuPeer.destroy();
        gomokuPeer = null;
    }
    if (gomokuConn) {
        gomokuConn.close();
        gomokuConn = null;
    }
    
    try {
        // 使用房间号作为Peer ID来创建连接
        setupPeerConnection(gomokuRoomId);
        
        // 设置超时处理（10秒）
        const connectionTimeout = setTimeout(function() {
            if (!gomokuPeer || !gomokuPeer.id) {
                console.error('连接超时');
                updateRoomStatus('连接超时，请检查网络后重试');
                
                // 恢复按钮状态
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.textContent = '创建房间';
                }
                
                // 清理连接
                if (gomokuPeer) {
                    gomokuPeer.destroy();
                    gomokuPeer = null;
                }
            }
        }, 10000);
        
        // 等待Peer连接建立
        gomokuPeer.on('open', function(id) {
            clearTimeout(connectionTimeout);
            console.log('房间已创建，房间号:', id);
            updateRoomStatus(`房间已创建！房间号: ${gomokuRoomId}`);
            updateRoomCodeDisplay(gomokuRoomId);
            
            // 恢复按钮状态
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.textContent = '创建房间';
            }
            
            // 设置玩家信息
            document.getElementById('self-player-name').textContent = playerName;
            document.getElementById('self-player-symbol').textContent = '⚫';
            document.getElementById('opponent-player-name').textContent = '等待玩家加入...';
            document.getElementById('opponent-player-symbol').textContent = '⚪';
            
            // 显示游戏界面
            showScreen('gomoku-game');
            initGomokuGame();
            
            // 等待对方连接后再开始游戏（游戏开始逻辑在connection事件中处理）
        });
        
        // 关键修复：将connection事件监听器移到open事件监听器外部，避免重复绑定
        gomokuPeer.on('connection', function(conn) {
            gomokuConn = conn;
            setupConnectionHandlers();
            
            // 关键修复：等待连接完全建立后再发送欢迎消息
            gomokuConn.on('open', function() {
                console.log('对方已连接，发送欢迎消息');
                
                // 发送欢迎消息
                gomokuConn.send({
                    type: 'welcome',
                    message: '欢迎加入房间！',
                    playerName: playerName,
                    roomCode: gomokuRoomId
                });
                
                updateRoomStatus('对方已加入房间，游戏开始！');
                
                // 游戏已经在connection事件中开始，此处无需重复开始
            });
        });
        
        gomokuPeer.on('error', function(err) {
            clearTimeout(connectionTimeout);
            console.error('房间创建错误:', err);
            updateRoomStatus('房间创建失败: ' + err.message);
            
            // 恢复按钮状态
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.textContent = '创建房间';
            }
            
            // 提供重试选项
            setTimeout(function() {
                if (confirm('创建房间失败，是否重试？')) {
                    createGomokuRoom();
                }
            }, 1000);
        });
        
    } catch (error) {
        console.error('创建房间异常:', error);
        updateRoomStatus('创建房间异常: ' + error.message);
        
        // 恢复按钮状态
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = '创建房间';
        }
    }
}

// 改进的加入房间逻辑
function joinGomokuRoom() {
    playerName = document.getElementById('player-name').value.trim();
    gomokuRoomId = document.getElementById('room-code').value.trim();
    
    if (!playerName) {
        alert('请输入您的姓名');
        return;
    }
    
    if (!gomokuRoomId || gomokuRoomId.length !== 6) {
        alert('请输入6位房间号');
        return;
    }
    
    // 显示连接状态
    updateRoomStatus('正在连接房间...');
    
    isHost = false;
    
    // 使用房间号初始化Peer连接
    setupPeerConnection();
    
    // 等待Peer连接建立后再加入房间
    gomokuPeer.on('open', function(id) {
        console.log('Peer连接已建立，ID:', id);
        updateRoomStatus('正在连接到房间...');
        
        try {
            // 连接到主机（使用房间号作为目标Peer ID）
            gomokuConn = gomokuPeer.connect(gomokuRoomId, {
                reliable: true,
                serialization: 'json'
            });
            
            setupConnectionHandlers();
            
            // 连接超时处理（10秒）
            const connectionTimeout = setTimeout(function() {
                if (gomokuConn && !gomokuConn.open) {
                    console.error('连接超时，房间可能不存在或对方已离线');
                    updateRoomStatus('连接超时，房间可能不存在或对方已离线');
                    if (gomokuConn) {
                        gomokuConn.close();
                    }
                    
                    // 提供重试选项
                    setTimeout(function() {
                        if (confirm('连接超时，是否重试？')) {
                            joinGomokuRoom();
                        }
                    }, 1000);
                }
            }, 10000);
            
            // 关键修复：等待连接完全建立后再发送消息
            gomokuConn.on('open', function() {
                clearTimeout(connectionTimeout);
                console.log('成功连接到房间');
                updateRoomStatus('已成功加入房间！');
                updateRoomCodeDisplay(gomokuRoomId);
                
                // 关键修复：只有在连接完全建立后才发送消息
                gomokuConn.send({
                    type: 'join',
                    playerName: playerName,
                    roomCode: gomokuRoomId
                });
                
                // 设置玩家信息
                document.getElementById('self-player-name').textContent = playerName;
                document.getElementById('self-player-symbol').textContent = '⚪';
                document.getElementById('opponent-player-name').textContent = '等待主机信息...';
                document.getElementById('opponent-player-symbol').textContent = '⚫';
                
                // 显示游戏界面
                showScreen('gomoku-game');
                initGomokuGame();
                
                // 等待主机分配棋色（游戏开始逻辑在colorAssignment消息中处理）
            });
            
            gomokuConn.on('error', function(err) {
                clearTimeout(connectionTimeout);
                console.error('连接错误:', err);
                
                let errorMessage = '连接失败: ';
                if (err.type === 'peer-unavailable') {
                    errorMessage += '房间不存在或对方已离线';
                } else if (err.type === 'network') {
                    errorMessage += '网络连接错误，请检查网络';
                } else {
                    errorMessage += err.message;
                }
                
                updateRoomStatus(errorMessage);
                
                // 提供重试选项
                setTimeout(function() {
                    if (confirm('连接失败，是否重试？')) {
                        joinGomokuRoom();
                    }
                }, 1000);
            });
            
        } catch (error) {
            console.error('连接异常:', error);
            updateRoomStatus('连接异常: ' + error.message);
        }
    });
    
    gomokuPeer.on('error', function(err) {
        console.error('Peer连接错误:', err);
        updateRoomStatus('连接错误: ' + err.message);
    });
}



// 开始游戏
function startGame(isBlack) {
    gameStarted = true;
    currentPlayer = isBlack ? 'black' : 'white';
    
    // 更新回合显示
    updateTurnDisplay();
    
    // 设置对手信息 - 确保连接完全open后再发送
    if (gomokuConn && gomokuConn.open) {
        // 发送玩家信息给对手，包含游戏开始状态
        gomokuConn.send({
            type: 'playerInfo',
            playerName: playerName,
            isHost: isHost,
            gameStarted: true
        });
    } else if (gomokuConn) {
        // 如果连接存在但还没有open，等待open事件
        gomokuConn.on('open', function() {
            gomokuConn.send({
                type: 'playerInfo',
                playerName: playerName,
                isHost: isHost,
                gameStarted: true
            });
        });
    }
}

// 随机开始游戏（随机分配黑棋和白棋）
function startGameRandom() {
    // 检查游戏是否已经开始，避免重复开始
    if (gameStarted) {
        console.log('游戏已经开始，跳过重复的开始逻辑');
        return;
    }
    
    gameStarted = true;
    
    if (isHost) {
        // 只有主机决定棋色分配
        const isBlack = Math.random() < 0.5;
        
        // 设置主机是否为黑棋的标志
        isHostIsBlack = isBlack;
        
        // 确保黑棋先走
        currentPlayer = 'black';
        
        // 更新回合显示
        updateTurnDisplay();
        
        // 更新玩家棋色显示
        updatePlayerColorDisplay();
        
        // 发送棋色信息给客户端 - 确保连接完全open后再发送
        if (gomokuConn && gomokuConn.open) {
            gomokuConn.send({
                type: 'colorAssignment',
                playerName: playerName,
                isHost: isHost,
                isBlack: isBlack,
                currentPlayer: currentPlayer
            });
        } else if (gomokuConn) {
            // 如果连接存在但还没有open，等待open事件
            gomokuConn.on('open', function() {
                gomokuConn.send({
                    type: 'colorAssignment',
                    playerName: playerName,
                    isHost: isHost,
                    isBlack: isBlack,
                    currentPlayer: currentPlayer
                });
            });
        }
        
        console.log(`主机决定棋色分配：主机为${isBlack ? '黑棋' : '白棋'}, 黑棋先走`);
    } else {
        // 客户端等待主机分配棋色
        console.log('等待主机分配棋色...');
    }
}

// 更新回合显示
function updateTurnDisplay() {
    const turnElement = document.getElementById('current-turn');
    if (turnElement) {
        if (currentPlayer === 'black') {
            turnElement.textContent = '轮到黑棋（⚫）';
        } else {
            turnElement.textContent = '轮到白棋（⚪）';
        }
    }
    
    // 更新按钮状态
    updateButtonStates();
}

// 更新按钮状态
function updateButtonStates() {
    const surrenderBtn = document.querySelector('.action-btn.surrender');
    const drawBtn = document.querySelector('.action-btn.draw');
    
    if (surrenderBtn) {
        surrenderBtn.disabled = !gameStarted || gameOver;
    }
    
    if (drawBtn) {
        drawBtn.disabled = !gameStarted || gameOver || drawRequested;
    }
}

// 改进的棋盘点击事件设置函数
function setupBoardClick() {
    const canvas = document.getElementById('gomoku-board');
    if (!canvas) return;
    
    // 移除可能存在的旧事件监听器
    canvas.removeEventListener('click', handleBoardClick);
    
    // 添加新的事件监听器
    canvas.addEventListener('click', handleBoardClick);
    // 移动端触摸事件支持
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleBoardClick(e.touches[0]);
    });
}

// 独立的棋盘点击处理函数
function handleBoardClick(event) {
    if (!gameStarted) {
        return;
    }
    
    // 关键修复：正确的回合判断逻辑
    // 基于当前玩家的棋色判断是否轮到该玩家
    const myColor = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
    const isMyTurn = currentPlayer === myColor;
    
    if (!isMyTurn) {
        return;
    }
    
    // 关键修复：在函数内部获取canvas元素
    const canvas = document.getElementById('gomoku-board');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // 修复移动端点击位置计算：支持触摸事件
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        // 触摸事件
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        // 鼠标事件
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const cellSize = 30;
    const padding = 15;
    
    // 改进位置计算：使用更精确的坐标转换
    const col = Math.floor((x - padding + cellSize / 2) / cellSize);
    const row = Math.floor((y - padding + cellSize / 2) / cellSize);
    
    if (row >= 0 && row < 15 && col >= 0 && col < 15) {
        makeMove(row, col);
    }
}

// 执行移动
function makeMove(row, col) {
    if (gameBoard[row][col] !== '') {
        return; // 位置已有棋子
    }
    
    // 放置棋子
    gameBoard[row][col] = currentPlayer;
    drawBoard();
    
    // 发送移动信息给对手 - 确保连接完全open后再发送
    if (gomokuConn && gomokuConn.open) {
        gomokuConn.send({
            type: 'move',
            row: row,
            col: col,
            player: currentPlayer
        });
    } else if (gomokuConn) {
        // 如果连接存在但还没有open，等待open事件
        gomokuConn.on('open', function() {
            gomokuConn.send({
                type: 'move',
                row: row,
                col: col,
                player: currentPlayer
            });
        });
    }
    
    // 检查胜负
    if (checkWin(row, col)) {
        endGame(currentPlayer);
        return;
    }
    
    // 切换回合
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateTurnDisplay();
}

// 检查胜负
function checkWin(row, col) {
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 对角线
        [1, -1]  // 反对角线
    ];
    
    const currentColor = gameBoard[row][col];
    
    for (let [dx, dy] of directions) {
        let count = 1;
        
        // 正向检查
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
                gameBoard[newRow][newCol] === currentColor) {
                count++;
            } else {
                break;
            }
        }
        
        // 反向检查
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
                gameBoard[newRow][newCol] === currentColor) {
                count++;
            } else {
                break;
            }
        }
        
        if (count >= 5) {
            return true;
        }
    }
    
    return false;
}

// 检查游戏是否结束
function isGameOver() {
    return gameOver;
}

// 设置游戏结束状态
function setGameOver(over) {
    gameOver = over;
}

// 更新玩家棋色显示
function updatePlayerColorDisplay() {
    const selfSymbolElement = document.getElementById('self-player-symbol');
    const opponentSymbolElement = document.getElementById('opponent-player-symbol');
    
    if (selfSymbolElement && opponentSymbolElement) {
        // 根据实际棋色分配更新显示
        const myColor = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
        const opponentColor = (isHost ? !isHostIsBlack : isHostIsBlack) ? 'black' : 'white';
        
        selfSymbolElement.textContent = myColor === 'black' ? '⚫' : '⚪';
        opponentSymbolElement.textContent = opponentColor === 'black' ? '⚫' : '⚪';
        
        // 添加颜色说明
        const selfPlayerName = document.getElementById('self-player-name');
        const opponentPlayerName = document.getElementById('opponent-player-name');
        
        if (selfPlayerName) {
            selfPlayerName.textContent = `${playerName}（${myColor === 'black' ? '黑棋' : '白棋'}）`;
        }
        if (opponentPlayerName) {
            opponentPlayerName.textContent = `对方（${opponentColor === 'black' ? '黑棋' : '白棋'}）`;
        }
    }
}

// 结束游戏
function endGame(winner) {
    gameStarted = false;
    gameOver = true; // 设置游戏结束标志
    
    // 重置和棋状态
    drawRequested = false;
    drawRequestPending = false;
    
    let message = '';
    let statusText = '';
    
    if (winner === 'draw') {
        // 平局情况
        message = '游戏结束，双方和棋！';
        statusText = '游戏结束 - 双方和棋';
    } else {
        // 胜负情况
        // 正确判断获胜者名称：基于棋色分配而不是简单的主机/客户端假设
        const myColor = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
        const winnerName = winner === myColor ? playerName : '对方';
        
        message = `${winnerName}获胜！`;
        statusText = `游戏结束 - ${winnerName}获胜`;
    }
    
    alert(message);
    
    // 更新游戏状态显示
    const turnElement = document.getElementById('current-turn');
    if (turnElement) {
        turnElement.textContent = statusText;
    }
    
    // 更新按钮状态
    updateButtonStates();
}

// 重新开始游戏
function restartGomokuGame() {
    // 检查游戏是否正在进行中，如果是则不允许重新开始
    if (gameStarted && !gameOver) {
        alert('游戏正在进行中，请等待游戏结束后再重新开始！');
        return;
    }
    
    // 发送重启消息给对手 - 确保连接完全open后再发送
    if (gomokuConn && gomokuConn.open) {
        gomokuConn.send({
            type: 'restart'
        });
    } else if (gomokuConn) {
        // 如果连接存在但还没有open，等待open事件
        gomokuConn.on('open', function() {
            gomokuConn.send({
                type: 'restart'
            });
        });
    }
    restartGame();
}

// 重新开始游戏
function restartGame() {
    initBoard();
    gameStarted = true;
    gameOver = false; // 重置游戏结束标志
    drawRequested = false; // 重置和棋请求状态
    drawRequestPending = false; // 重置和棋请求待处理状态
    
    if (isHost) {
        // 只有主机决定棋色分配
        const isBlack = Math.random() < 0.5;
        currentPlayer = 'black'; // 黑棋先走
        isHostIsBlack = isBlack;
        
        updateTurnDisplay();
        
        // 更新玩家棋色显示
        updatePlayerColorDisplay();
        
        // 发送棋色信息给客户端 - 确保连接完全open后再发送
        if (gomokuConn && gomokuConn.open) {
            gomokuConn.send({
                type: 'colorAssignment',
                playerName: playerName,
                isHost: isHost,
                isBlack: isBlack,
                currentPlayer: currentPlayer
            });
        } else if (gomokuConn) {
            // 如果连接存在但还没有open，等待open事件
            gomokuConn.on('open', function() {
                gomokuConn.send({
                    type: 'colorAssignment',
                    playerName: playerName,
                    isHost: isHost,
                    isBlack: isBlack,
                    currentPlayer: currentPlayer
                });
            });
        }
        
        console.log(`重新开始游戏：主机为${isBlack ? '黑棋' : '白棋'}`);
    } else {
        // 客户端等待主机分配棋色
        console.log('等待主机重新分配棋色...');
    }
    
    // 清空聊天记录
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.innerHTML = '<div style="color: #666;">聊天区域 - 可以在这里与对手交流</div>';
    }
    
    // 更新按钮状态
    updateButtonStates();
}

// 退出游戏
function exitGomokuGame() {
    if (confirm('确定要退出游戏吗？')) {
        if (gomokuConn) {
            gomokuConn.close();
        }
        if (gomokuPeer) {
            gomokuPeer.destroy();
        }
        
        // 重置游戏状态
        gomokuPeer = null;
        gomokuConn = null;
        gomokuRoomId = null;
        gameStarted = false;
        
        // 重置房间号显示
        updateRoomCodeDisplay('等待连接...');
        
        showScreen('main-menu');
    }
}

// 认输功能
function surrenderGame() {
    if (!gameStarted || gameOver) {
        alert('游戏未开始或已结束，无法认输');
        return;
    }
    
    if (confirm('确定要认输吗？')) {
        // 确定对手的颜色
        const opponentColor = currentPlayer === 'black' ? 'white' : 'black';
        
        // 结束游戏，对手获胜
        endGame(opponentColor);
        
        // 如果是对战模式，发送认输消息给对手
        if (gomokuConn && gomokuConn.open) {
            gomokuConn.send({
                type: 'surrender',
                winner: opponentColor
            });
        }
    }
}

// 请求和棋功能
function requestDraw() {
    if (!gameStarted || gameOver) {
        alert('游戏未开始或已结束，无法请求和棋');
        return;
    }
    
    if (drawRequested) {
        alert('已经发送过和棋请求，请等待对方回应');
        return;
    }
    
    if (confirm('确定要请求和棋吗？')) {
        drawRequested = true;
        
        // 如果是对战模式，发送和棋请求给对手
        if (gomokuConn && gomokuConn.open) {
            gomokuConn.send({
                type: 'draw_request'
            });
        }
        
        alert('和棋请求已发送，等待对方回应');
    }
}

// 处理和棋请求
function handleDrawRequest() {
    if (!gameStarted || gameOver) {
        return;
    }
    
    drawRequestPending = true;
    
    try {
        // 使用setTimeout确保对话框在事件循环中正确弹出
        setTimeout(function() {
            const result = confirm('对方请求和棋，是否同意？\n\n点击"确定"同意和棋，游戏结束为平局\n点击"取消"拒绝和棋请求，游戏继续');
            
            if (result === true) {
                // 同意和棋，游戏结束为平局
                endGame('draw');
                
                // 通知对方同意和棋
                if (gomokuConn && gomokuConn.open) {
                    gomokuConn.send({
                        type: 'draw_accepted'
                    });
                }
            } else if (result === false) {
                // 用户明确拒绝和棋
                if (gomokuConn && gomokuConn.open) {
                    gomokuConn.send({
                        type: 'draw_rejected'
                    });
                }
                alert('已拒绝和棋请求，游戏继续');
            } else {
                // 对话框被阻止或关闭，给用户再次选择的机会
                const retryResult = confirm('和棋请求等待处理，是否重新选择？\n\n点击"确定"同意和棋\n点击"取消"拒绝和棋');
                
                if (retryResult === true) {
                    endGame('draw');
                    if (gomokuConn && gomokuConn.open) {
                        gomokuConn.send({
                            type: 'draw_accepted'
                        });
                    }
                } else {
                    if (gomokuConn && gomokuConn.open) {
                        gomokuConn.send({
                            type: 'draw_rejected'
                        });
                    }
                    alert('已拒绝和棋请求，游戏继续');
                }
            }
            
            drawRequestPending = false;
        }, 100);
    } catch (error) {
        console.error('处理和棋请求时出错:', error);
        // 出错时默认拒绝和棋，避免游戏卡住
        if (gomokuConn && gomokuConn.open) {
            gomokuConn.send({
                type: 'draw_rejected'
            });
        }
        alert('处理和棋请求时出错，已默认拒绝和棋请求');
        drawRequestPending = false;
    }
}

// 处理和棋回应
function handleDrawResponse(accepted) {
    if (accepted) {
        // 对方同意和棋，游戏结束为平局
        endGame('draw');
        alert('对方同意和棋，游戏结束为平局');
    } else {
        // 对方拒绝和棋
        alert('对方拒绝和棋请求，游戏继续');
        
        // 重置和棋请求状态，允许重新发送和棋请求
        drawRequested = false;
        
        // 更新按钮状态
        updateButtonStates();
    }
    
    // 确保状态重置（无论同意还是拒绝）
    drawRequested = false;
}

// 改进的聊天消息发送函数
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 关键修复：检查连接状态
    if (!gomokuConn || !gomokuConn.open) {
        alert('连接未建立，无法发送消息');
        return;
    }
    
    try {
        // 发送给对手
        gomokuConn.send({
            type: 'chat',
            message: message,
            playerName: playerName
        });
        
        // 显示自己的消息
        addChatMessage(playerName, message, false);
        
        input.value = '';
        
    } catch (error) {
        console.error('发送消息失败:', error);
        alert('发送消息失败，请检查连接状态');
    }
}

// 添加聊天消息
function addChatMessage(name, message, isOpponent) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.margin = '5px 0';
    messageDiv.style.padding = '5px 10px';
    messageDiv.style.borderRadius = '10px';
    messageDiv.style.maxWidth = '80%';
    messageDiv.style.wordWrap = 'break-word';
    
    if (isOpponent) {
        messageDiv.style.backgroundColor = '#e3f2fd';
        messageDiv.style.alignSelf = 'flex-start';
        messageDiv.innerHTML = `<strong>${name}:</strong> ${message}`;
    } else {
        messageDiv.style.backgroundColor = '#e8f5e8';
        messageDiv.style.alignSelf = 'flex-end';
        messageDiv.style.marginLeft = 'auto';
        messageDiv.innerHTML = `<strong>我:</strong> ${message}`;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 改进的连接处理器设置函数
function setupConnectionHandlers() {
    if (!gomokuConn) return;
    
    // 关键修复：防止重复绑定事件处理器
    if (gomokuConn._handlersSet) {
        return; // 如果已经设置过处理器，直接返回
    }
    
    gomokuConn._handlersSet = true; // 标记为已设置
    
    // 设置所有事件处理器
    gomokuConn.on('data', function(data) {
        handleGameMessage(data);
    });
    
    gomokuConn.on('open', function() {
        console.log('连接已建立');
        updateRoomStatus('连接已建立');
        
        // 关键修复：只有在连接完全建立后才发送消息
        if (isHost) {
            // 主机发送欢迎消息
            setTimeout(function() {
                if (gomokuConn && gomokuConn.open) {
                    gomokuConn.send({
                        type: 'welcome',
                        message: '欢迎加入房间！',
                        playerName: playerName,
                        roomCode: gomokuRoomId
                    });
                }
            }, 100);
        } else {
            // 客户端发送加入消息
            setTimeout(function() {
                if (gomokuConn && gomokuConn.open) {
                    gomokuConn.send({
                        type: 'join',
                        playerName: playerName,
                        roomCode: gomokuRoomId
                    });
                }
            }, 100);
        }
    });
    
    gomokuConn.on('close', function() {
        console.log('连接已关闭');
        updateRoomStatus('对方已断开连接');
        gameStarted = false;
        
        const turnElement = document.getElementById('current-turn');
        if (turnElement) {
            turnElement.textContent = '对方已断开连接';
        }
        
        // 清除处理器标记，允许重新连接时重新设置
        if (gomokuConn) {
            gomokuConn._handlersSet = false;
        }
        
        // 提供重连选项
        setTimeout(function() {
            if (confirm('对方已断开连接，是否重新加入房间？')) {
                if (isHost) {
                    createGomokuRoom();
                } else {
                    joinGomokuRoom();
                }
            }
        }, 1000);
    });
    
    gomokuConn.on('error', function(err) {
        console.error('连接错误:', err);
        updateRoomStatus('连接错误: ' + err.message);
    });
}

// 改进的游戏消息处理器
function handleGameMessage(data) {
    // 关键修复：检查连接状态
    if (!gomokuConn || !gomokuConn.open) {
        console.warn('连接未建立，忽略消息:', data);
        return;
    }
    
    console.log('收到消息:', data);
    
    // 关键修复：添加消息去重机制
    if (data._processed) {
        console.warn('消息已处理过，忽略重复消息:', data);
        return;
    }
    
    // 标记消息为已处理
    data._processed = true;
    
    switch (data.type) {
        case 'join':
            // 对方加入房间
            document.getElementById('opponent-player-name').textContent = data.playerName;
            updateRoomStatus(`${data.playerName}已加入房间，游戏开始！`);
            
            // 如果对方提供了房间号，确保显示一致
            if (data.roomCode && data.roomCode !== gomokuRoomId) {
                gomokuRoomId = data.roomCode;
                updateRoomCodeDisplay(gomokuRoomId);
            }
            
            // 游戏已经在连接建立时开始，此处无需重复开始
            break;
            
        case 'welcome':
            // 收到主机欢迎消息
            document.getElementById('opponent-player-name').textContent = data.playerName;
            updateRoomStatus(`已加入房间：${data.roomCode}`);
            
            // 确保房间号一致
            if (data.roomCode && data.roomCode !== gomokuRoomId) {
                gomokuRoomId = data.roomCode;
                updateRoomCodeDisplay(gomokuRoomId);
            }
            
            // 游戏已经在连接建立时开始，此处无需重复开始
            break;
            
        case 'move':
            // 处理对手移动
            handleOpponentMove(data.row, data.col);
            break;
            
        case 'chat':
            // 处理聊天消息
            addChatMessage(data.playerName, data.message, true);
            break;
            
        case 'playerInfo':
            // 接收对手信息
            document.getElementById('opponent-player-name').textContent = data.playerName;
            
            // 同步游戏开始状态
            if (data.gameStarted !== undefined) {
                gameStarted = data.gameStarted;
                console.log('游戏开始状态同步:', gameStarted);
            }
            break;
            
        case 'colorAssignment':
            // 接收棋色分配信息（只有主机会发送此消息）
            console.log('收到主机棋色分配信息:', data);
            
            if (data.isHost !== undefined && !isHost) {
                // 客户端根据主机的分配设置自己的棋色
                // 如果主机是黑棋，客户端就是白棋；如果主机是白棋，客户端就是黑棋
                isHostIsBlack = data.isBlack;
                
                // 设置当前玩家（黑棋先走）
                if (data.currentPlayer) {
                    currentPlayer = data.currentPlayer;
                }
                
                // 设置游戏开始状态
                gameStarted = true;
                
                // 更新回合显示
                updateTurnDisplay();
                
                // 更新玩家棋色显示
                updatePlayerColorDisplay();
                
                console.log(`棋色分配完成：主机为${data.isBlack ? '黑棋' : '白棋'}, 客户端为${data.isBlack ? '白棋' : '黑棋'}, 游戏开始状态: ${gameStarted}`);
            }
            break;
        case 'restart':
            // 重新开始游戏
            restartGame();
            break;
            
        case 'roomCode':
            // 关键修复：接收房间号信息
            if (data.roomCode) {
                gomokuRoomId = data.roomCode;
                updateRoomCodeDisplay(gomokuRoomId);
                updateRoomStatus(`已加入房间：${gomokuRoomId}`);
                
                // 更新对手信息
                if (data.playerName) {
                    document.getElementById('opponent-player-name').textContent = data.playerName;
                }
            }
            break;
            
        case 'surrender':
            // 对方认输，我方获胜
            console.log('对方认输，我方获胜');
            endGame(data.winner);
            break;
            
        case 'draw_request':
            // 对方请求和棋
            console.log('收到和棋请求');
            handleDrawRequest();
            break;
            
        case 'draw_accepted':
            // 对方同意和棋
            console.log('对方同意和棋');
            handleDrawResponse(true);
            break;
            
        case 'draw_rejected':
            // 对方拒绝和棋
            console.log('对方拒绝和棋');
            handleDrawResponse(false);
            break;
            
        default:
            console.warn('未知消息类型:', data.type);
    }
}

// 处理对手移动
function handleOpponentMove(row, col) {
    if (gameBoard[row][col] !== '') {
        return; // 位置已有棋子
    }
    
    // 放置对手的棋子
    const opponentColor = (isHost ? !isHostIsBlack : isHostIsBlack) ? 'black' : 'white';
    gameBoard[row][col] = opponentColor;
    drawBoard();
    
    // 检查胜负
    if (checkWin(row, col)) {
        endGame(opponentColor);
    } else {
        // 关键修复：正确切换回合
        // 对手下完后，轮到当前玩家
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        updateTurnDisplay();
    }
}

// 初始化棋盘
function initBoard() {
    gameBoard = [];
    for (let i = 0; i < 15; i++) {
        gameBoard[i] = [];
        for (let j = 0; j < 15; j++) {
            gameBoard[i][j] = ''; // 空位置
        }
    }
    
    // 绘制棋盘
    drawBoard();
}

// 绘制棋盘
function drawBoard() {
    const canvas = document.getElementById('gomoku-board');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制棋盘网格
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    const cellSize = 30;
    const padding = 15;
    
    // 绘制横线
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * cellSize);
        ctx.lineTo(padding + 14 * cellSize, padding + i * cellSize);
        ctx.stroke();
    }
    
    // 绘制竖线
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.moveTo(padding + i * cellSize, padding);
        ctx.lineTo(padding + i * cellSize, padding + 14 * cellSize);
        ctx.stroke();
    }
    
    // 绘制棋子
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (gameBoard[i][j] === 'black') {
                drawPiece(ctx, i, j, 'black');
            } else if (gameBoard[i][j] === 'white') {
                drawPiece(ctx, i, j, 'white');
            }
        }
    }
}

// 绘制棋子
function drawPiece(ctx, row, col, color) {
    const cellSize = 30;
    const padding = 15;
    
    ctx.beginPath();
    ctx.arc(
        padding + col * cellSize,
        padding + row * cellSize,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
    );
    
    if (color === 'black') {
        ctx.fillStyle = '#000';
    } else {
        ctx.fillStyle = '#f0f0f0'; // 使用浅灰色而不是纯白色，更容易看到
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    ctx.fill();
}

// 页面加载完成后初始化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 支持回车键提交答案
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const submitButton = document.querySelector('button[onclick="checkAnswer()"]');
                // 只有在按钮未被禁用时才允许回车提交
                if (submitButton && !submitButton.disabled) {
                    checkAnswer();
                }
            }
        });
    }
    
    // 页面加载时检查URL参数
    loadSeedFromURL();
    // 初始化所有界面的随机数种显示
    updateAllSeedDisplays(currentSeed);
});

// 页面加载完成后添加CSS动画
window.addEventListener('load', function() {
    // 添加脉冲动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .room-info-panel {
            transition: all 0.3s ease;
        }
        
        .room-info-panel:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
});

// 测试棋色分配逻辑
function testColorAssignment() {
    console.log('=== 测试棋色分配逻辑 ===');
    
    // 测试主机为黑棋的情况
    isHost = true;
    isHostIsBlack = true;
    currentPlayer = 'black';
    
    const myColorHostBlack = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
    const isMyTurnHostBlack = currentPlayer === myColorHostBlack;
    console.log(`主机为黑棋：我的颜色=${myColorHostBlack}, 是否轮到我=${isMyTurnHostBlack}`);
    
    // 测试主机为白棋的情况
    isHost = true;
    isHostIsBlack = false;
    currentPlayer = 'white';
    
    const myColorHostWhite = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
    const isMyTurnHostWhite = currentPlayer === myColorHostWhite;
    console.log(`主机为白棋：我的颜色=${myColorHostWhite}, 是否轮到我=${isMyTurnHostWhite}`);
    
    // 测试客户端为黑棋的情况
    isHost = false;
    isHostIsBlack = false; // 客户端为黑棋意味着主机为白棋
    currentPlayer = 'black';
    
    const myColorClientBlack = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
    const isMyTurnClientBlack = currentPlayer === myColorClientBlack;
    console.log(`客户端为黑棋：我的颜色=${myColorClientBlack}, 是否轮到我=${isMyTurnClientBlack}`);
    
    // 测试客户端为白棋的情况
    isHost = false;
    isHostIsBlack = true; // 客户端为白棋意味着主机为黑棋
    currentPlayer = 'white';
    
    const myColorClientWhite = (isHost ? isHostIsBlack : !isHostIsBlack) ? 'black' : 'white';
    const isMyTurnClientWhite = currentPlayer === myColorClientWhite;
    console.log(`客户端为白棋：我的颜色=${myColorClientWhite}, 是否轮到我=${isMyTurnClientWhite}`);
    
    console.log('=== 测试完成 ===');
}

// 添加连接状态检查函数
function checkConnectionStatus() {
    if (!gomokuPeer) {
        return 'Peer连接未初始化';
    }
    
    if (gomokuPeer.disconnected) {
        return 'Peer连接已断开';
    }
    
    if (gomokuPeer.id) {
        return `Peer连接正常 (ID: ${gomokuPeer.id.substring(0, 6)}...)`;
    }
    
    return 'Peer连接正在建立中...';
}

// 改进的Peer连接错误处理
function handlePeerError(error) {
    console.error('Peer连接错误:', error);
    
    let errorMessage = '连接错误: ';
    switch (error.type) {
        case 'peer-unavailable':
            errorMessage += '对方不在线或房间不存在';
            break;
        case 'network':
            errorMessage += '网络连接失败';
            break;
        case 'server-error':
            errorMessage += '服务器错误，请稍后重试';
            break;
        case 'socket-error':
            errorMessage += 'Socket连接错误';
            break;
        case 'socket-closed':
            errorMessage += '连接已关闭';
            break;
        default:
            errorMessage += error.message;
    }
    
    updateRoomStatus(errorMessage);
    
    // 提供重连选项
    if (error.type !== 'socket-closed') {
        setTimeout(function() {
            if (confirm('连接失败，是否重新连接？')) {
                reconnectPeer();
            }
        }, 2000);
    }
}

console.log('五子棋对战功能已修复并优化完成');
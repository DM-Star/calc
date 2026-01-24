let questions = [];
let currentQuestionIndex = 0;
let startTime = 0;
let questionStartTime = 0;
let results = [];
let currentPracticeType = '';
let currentSeed = null;
let actualSeedUsed = null; // 记录实际使用的随机数种

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

// 页面加载时检查URL参数
window.addEventListener('load', function() {
    loadSeedFromURL();
    // 初始化所有界面的随机数种显示
    updateAllSeedDisplays(currentSeed);
});

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
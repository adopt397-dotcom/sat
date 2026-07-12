// ============================================================
// calc-timer.js: 시계 + 계산기 (아이콘 토글 방식)
// ============================================================
(function() {
    'use strict';

    // ---------- CSS ----------
    const style = document.createElement('style');
    style.textContent = `
        #calcTimerContainer {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        }
        /* 아이콘 행 */
        .icon-row {
            display: flex;
            gap: 10px;
            background: rgba(26, 26, 46, 0.85);
            backdrop-filter: blur(10px);
            padding: 8px 14px;
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .icon-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.6rem;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 8px;
            transition: all 0.2s;
            line-height: 1;
        }
        .icon-btn:hover {
            background: rgba(245, 166, 35, 0.2);
            color: #f5a623;
        }
        .icon-btn.active {
            color: #f5a623;
        }

        /* 패널 공통 */
        .panel {
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 16px;
            min-width: 200px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            color: #fff;
            display: none;
            margin-top: 4px;
        }
        .panel.visible {
            display: block;
        }

        /* 시계 패널 */
        .clock-display {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 2px;
            color: #f5a623;
            text-align: center;
            font-variant-numeric: tabular-nums;
            padding: 4px 0;
        }

        /* 계산기 패널 */
        .calc-display {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 10px;
            text-align: right;
            font-size: 1.6rem;
            font-weight: 600;
            color: #fff;
            font-family: 'Courier New', monospace;
            min-height: 52px;
            word-break: break-all;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .calc-buttons {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
        }
        .calc-buttons button {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            color: #fff;
            font-size: 1.1rem;
            font-weight: 600;
            padding: 8px 4px;
            cursor: pointer;
            transition: all 0.15s;
            min-height: 40px;
        }
        .calc-buttons button:hover {
            background: rgba(245, 166, 35, 0.15);
            border-color: rgba(245, 166, 35, 0.3);
        }
        .calc-buttons button:active {
            transform: scale(0.95);
        }
        .calc-buttons button[data-calc="+"],
        .calc-buttons button[data-calc="-"],
        .calc-buttons button[data-calc="*"],
        .calc-buttons button[data-calc="/"],
        .calc-buttons button[data-calc="="] {
            color: #f5a623;
        }
        .calc-buttons button[data-calc="clear"],
        .calc-buttons button[data-calc="backspace"] {
            color: #ff6b6b;
        }
        .calc-buttons button[data-calc="sin"],
        .calc-buttons button[data-calc="cos"],
        .calc-buttons button[data-calc="tan"],
        .calc-buttons button[data-calc="log"],
        .calc-buttons button[data-calc="ln"],
        .calc-buttons button[data-calc="sqrt"],
        .calc-buttons button[data-calc="pi"],
        .calc-buttons button[data-calc="e"],
        .calc-buttons button[data-calc="^"],
        .calc-buttons button[data-calc="%"] {
            font-size: 0.85rem;
            color: #7ec8e3;
        }

        @media (max-width: 600px) {
            #calcTimerContainer {
                top: 10px;
                right: 10px;
                left: 10px;
            }
            .icon-row {
                justify-content: flex-end;
                padding: 6px 12px;
            }
            .icon-btn {
                font-size: 1.3rem;
            }
            .panel {
                min-width: unset;
                width: 100%;
                max-width: 360px;
            }
            .clock-display {
                font-size: 1.6rem;
            }
            .calc-display {
                font-size: 1.3rem;
                min-height: 42px;
                padding: 8px 12px;
            }
            .calc-buttons {
                gap: 4px;
            }
            .calc-buttons button {
                font-size: 0.9rem;
                padding: 6px 2px;
                min-height: 34px;
            }
        }
    `;
    document.head.appendChild(style);

    // ---------- HTML 구조 ----------
    const container = document.createElement('div');
    container.id = 'calcTimerContainer';
    container.innerHTML = `
        <!-- 아이콘 행 -->
        <div class="icon-row">
            <button class="icon-btn" id="clockIcon" title="시계">🕐</button>
            <button class="icon-btn" id="calcIcon" title="계산기">🔢</button>
        </div>

        <!-- 시계 패널 -->
        <div class="panel" id="clockPanel">
            <div class="clock-display" id="calcTimerDisplay">02:14:00</div>
        </div>

        <!-- 계산기 패널 -->
        <div class="panel" id="calcPanel">
            <div class="calc-display" id="calcDisplay">0</div>
            <div class="calc-buttons">
                <button data-calc="sin">sin</button>
                <button data-calc="cos">cos</button>
                <button data-calc="tan">tan</button>
                <button data-calc="log">log</button>
                <button data-calc="ln">ln</button>
                <button data-calc="sqrt">√</button>

                <button data-calc="7">7</button>
                <button data-calc="8">8</button>
                <button data-calc="9">9</button>
                <button data-calc="/">÷</button>
                <button data-calc="*">×</button>
                <button data-calc="backspace">⌫</button>

                <button data-calc="4">4</button>
                <button data-calc="5">5</button>
                <button data-calc="6">6</button>
                <button data-calc="-">−</button>
                <button data-calc="+">+</button>
                <button data-calc="clear">C</button>

                <button data-calc="1">1</button>
                <button data-calc="2">2</button>
                <button data-calc="3">3</button>
                <button data-calc="(">(</button>
                <button data-calc=")">)</button>
                <button data-calc="=">=</button>

                <button data-calc="0">0</button>
                <button data-calc=".">.</button>
                <button data-calc="pi">π</button>
                <button data-calc="e">e</button>
                <button data-calc="^">x^y</button>
                <button data-calc="%">%</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // ---------- DOM 요소 ----------
    const clockIcon = document.getElementById('clockIcon');
    const calcIcon = document.getElementById('calcIcon');
    const clockPanel = document.getElementById('clockPanel');
    const calcPanel = document.getElementById('calcPanel');
    const timerDisplay = document.getElementById('calcTimerDisplay');
    const calcDisplay = document.getElementById('calcDisplay');

    // ---------- 패널 토글 ----------
    let clockVisible = false;
    let calcVisible = false;

    clockIcon.addEventListener('click', () => {
        clockVisible = !clockVisible;
        clockPanel.classList.toggle('visible', clockVisible);
        clockIcon.classList.toggle('active', clockVisible);
        // 계산기 패널은 그대로 둠 (함께 닫히지 않음)
    });

    calcIcon.addEventListener('click', () => {
        calcVisible = !calcVisible;
        calcPanel.classList.toggle('visible', calcVisible);
        calcIcon.classList.toggle('active', calcVisible);
        // 시계 패널은 그대로 둠
    });

    // ---------- 시계 (타이머) ----------
    let timerSeconds = 134 * 60;
    let timerInterval = null;

    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return h + ':' + m + ':' + s;
    }

    function updateTimerDisplay() {
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timerSeconds);
        }
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }, 1000);
    }

    function resetTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerSeconds = 134 * 60;
        updateTimerDisplay();
    }

    // ---------- 계산기 ----------
    let calcExpression = '';

    function updateCalcDisplay() {
        calcDisplay.textContent = calcExpression || '0';
    }

    function handleCalcInput(value) {
        if (value === 'clear') {
            calcExpression = '';
            updateCalcDisplay();
            return;
        }
        if (value === 'backspace') {
            calcExpression = calcExpression.slice(0, -1);
            updateCalcDisplay();
            return;
        }
        if (value === '=') {
            try {
                let expr = calcExpression
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/π/g, 'Math.PI')
                    .replace(/e(?![xp])/g, 'Math.E')
                    .replace(/\^/g, '**');

                const result = Function('"use strict"; return (' + expr + ')')();
                calcExpression = String(result);
                updateCalcDisplay();
            } catch (e) {
                calcExpression = 'Error';
                updateCalcDisplay();
                setTimeout(() => {
                    calcExpression = '';
                    updateCalcDisplay();
                }, 1500);
            }
            return;
        }

        const funcMap = {
            'sin': 'sin(',
            'cos': 'cos(',
            'tan': 'tan(',
            'log': 'log(',
            'ln': 'ln(',
            'sqrt': 'sqrt(',
            'pi': 'π',
            'e': 'e'
        };

        if (funcMap[value]) {
            calcExpression += funcMap[value];
            updateCalcDisplay();
            return;
        }

        calcExpression += value;
        updateCalcDisplay();
    }

    // ---------- 계산기 이벤트 ----------
    document.querySelectorAll('[data-calc]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-calc');
            handleCalcInput(value);
        });
    });

    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key >= '0' && key <= '9') handleCalcInput(key);
        if (key === '.') handleCalcInput('.');
        if (key === '+') handleCalcInput('+');
        if (key === '-') handleCalcInput('-');
        if (key === '*') handleCalcInput('*');
        if (key === '/') handleCalcInput('/');
        if (key === 'Enter' || key === '=') handleCalcInput('=');
        if (key === 'Backspace') handleCalcInput('backspace');
        if (key === 'Escape') handleCalcInput('clear');
        if (key === '(') handleCalcInput('(');
        if (key === ')') handleCalcInput(')');
        if (key === '%') handleCalcInput('%');
    });

    // ---------- 초기화 ----------
    updateTimerDisplay();
    startTimer();

    window.calcTimer = {
        resetTimer,
        startTimer,
        timerSeconds,
        handleCalcInput
    };

    console.log('✅ calc-timer.js loaded (icon toggle)');
})();

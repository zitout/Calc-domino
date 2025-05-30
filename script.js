document.addEventListener('DOMContentLoaded', () => {
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const leftScoresList = document.getElementById('left-scores-list');
    const rightScoresList = document.getElementById('right-scores-list');
    const leftTotalDisplay = document.getElementById('left-total');
    const rightTotalDisplay = document.getElementById('right-total');

    const keypadOverlay = document.getElementById('score-keypad-overlay');
    const currentScoreInputDisplay = document.getElementById('current-score-input');
    const keypadButtons = document.querySelectorAll('#score-keypad-overlay .keypad button');
    const resetAllButton = document.getElementById('reset-all-scores');

    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerTextElement = document.getElementById('winner-text');
    const playAgainButton = document.getElementById('play-again-button');
    const confettiContainer = document.getElementById('confetti-container');

        let currentEditingSide = null;
    let currentEditingScoreElement = null;
    let currentKeypadInput = "";
    let gameActive = true;

    const WIN_SCORE = 100;

    let scores = {
        left: [],
        right: []
    };

    function loadScores() {
        const savedScores = localStorage.getItem('playerScores_calc_v1');
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }
        renderScores();
    }

    function saveScores() {
        localStorage.setItem('playerScores_calc_v1', JSON.stringify(scores));
    }

    function renderScores() {
        renderSideScores(leftScoresList, scores.left, leftTotalDisplay, 'left');
        renderSideScores(rightScoresList, scores.right, rightTotalDisplay, 'right');
        if (gameActive) {
            checkWinCondition();
        }
    }

    function renderSideScores(listElement, sideScoresArray, totalElement, side) {
        listElement.innerHTML = '';
        let total = 0;
        sideScoresArray.forEach((score, index) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.classList.add('score-item');
            scoreDiv.textContent = score;
            scoreDiv.dataset.index = index;
            scoreDiv.dataset.side = side;
            scoreDiv.addEventListener('click', handleScoreItemClick);
            listElement.appendChild(scoreDiv);
            total += Number(score);
        });
        totalElement.textContent = `المجموع: ${total}`;
    }

    function handleScoreItemClick(event) {
        if (!gameActive) return;
        event.stopPropagation();
        currentEditingScoreElement = event.target;
        currentEditingSide = event.target.dataset.side;
        currentKeypadInput = event.target.textContent;
        currentScoreInputDisplay.textContent = currentKeypadInput;
        keypadOverlay.style.display = 'flex';
    }

    [leftPanel, rightPanel].forEach(panel => {
        panel.addEventListener('click', (event) => {
            if (!gameActive) return;

            if (event.target.classList.contains('score-item')) {
                return;
            }

            currentEditingSide = panel.dataset.side;
            currentEditingScoreElement = null;
            currentKeypadInput = "";
            currentScoreInputDisplay.textContent = currentKeypadInput || "-";
            keypadOverlay.style.display = 'flex';
        });
    });

    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const keyValue = button.dataset.key;

            if (keyValue === 'confirm-score') {
                if (gameActive) { // معالجة النتيجة فقط إذا كانت اللعبة نشطة
                    if (currentKeypadInput.trim() !== "") { // والإدخال ليس فارغًا
                        const newScore = parseInt(currentKeypadInput);
                        if (!isNaN(newScore) && currentEditingSide) {
                            if (currentEditingScoreElement) {
                                const index = parseInt(currentEditingScoreElement.dataset.index);
                                scores[currentEditingSide][index] = newScore;
                            } else {
                                scores[currentEditingSide].push(newScore);
                            }
                            saveScores();
                            renderScores(); // سيتم استدعاء checkWinCondition هنا
                        }
                    }
                }
                closeKeypad(); // إغلاق لوحة المفاتيح دائمًا عند التأكيد
                return; // مهم: إيقاف المعالجة الإضافية لزر التأكيد
            }

            // لأي زر آخر، إذا لم تكن اللعبة نشطة، لا تفعل شيئًا
            if (!gameActive) {
                return;
            }

            // إذا كانت اللعبة نشطة والزر ليس 'confirm-score'
            if (keyValue === 'clear-digit') {
                currentKeypadInput = currentKeypadInput.slice(0, -1);
            } else { // زر رقم
                if (currentKeypadInput.length < 4) {
                    currentKeypadInput += keyValue;
                }
            }
            currentScoreInputDisplay.textContent = currentKeypadInput || "-";
        });
    });

    function closeKeypad() {
        keypadOverlay.style.display = 'none';
        currentKeypadInput = "";
        currentScoreInputDisplay.textContent = "-"; // إعادة تعيين شاشة الإدخال
        // إعادة تعيين متغيرات التحرير لضمان حالة نظيفة
        currentEditingSide = null;
        currentEditingScoreElement = null;
    }

    keypadOverlay.addEventListener('click', (e) => { if (e.target === keypadOverlay) closeKeypad(); });

    function resetGame() {
        scores.left = [];
        scores.right = [];
        gameActive = true;
        winnerOverlay.style.display = 'none';
        clearConfetti();
        saveScores();
        renderScores();
    }

    resetAllButton.addEventListener('click', () => {
        if (confirm("هل أنت متأكد أنك تريد مسح جميع النقاط والبدء من جديد؟")) {
            resetGame();
        }
    });

    playAgainButton.addEventListener('click', resetGame);

    function checkWinCondition() {
        if (!gameActive) return;

        let leftTotal = scores.left.reduce((sum, score) => sum + Number(score), 0);
        let rightTotal = scores.right.reduce((sum, score) => sum + Number(score), 0);

        let winnerMessage = "";
        let celebrationNeeded = false;

        if (leftTotal >= WIN_SCORE && leftTotal > rightTotal) {
            winnerMessage = "فريق الأبيض فاز!";
            celebrationNeeded = true;
        } else if (rightTotal >= WIN_SCORE && rightTotal > leftTotal) {
            winnerMessage = "فريق الأسود فاز!";
            celebrationNeeded = true;
        } else if (leftTotal >= WIN_SCORE && rightTotal >= WIN_SCORE && leftTotal === rightTotal && WIN_SCORE > 0) {
            winnerMessage = "تعادل والفريقان وصلا للهدف!";
            // لا احتفال بالقصاصات في حالة التعادل هذه
        }

        if (winnerMessage) {
            showWinnerScreen(winnerMessage, celebrationNeeded);
            gameActive = false;
        }
    }

    function showWinnerScreen(message, celebrate) {
        winnerTextElement.textContent = message;
        winnerOverlay.style.display = 'flex';
        if (celebrate) {
            launchConfetti();
        }
    }

    function launchConfetti() {
        clearConfetti();
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#ffffff', '#1abc9c'];
        const confettiCount = 120;
        for (let i = 0; i < confettiCount; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.classList.add('confetti');
            confettiPiece.style.left = (Math.random() * 100) + 'vw';
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const animationDuration = (Math.random() * 2 + 2.5);
            confettiPiece.style.animationDuration = animationDuration + 's';
            confettiPiece.style.animationDelay = (Math.random() * animationDuration * 0.5) + 's';

            const size = (Math.random() * 8 + 6) + 'px';
            confettiPiece.style.width = size;
            confettiPiece.style.height = size;

            if (Math.random() > 0.6) {
                confettiPiece.style.borderRadius = '50%';
            } else {
                confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
            confettiContainer.appendChild(confettiPiece);
        }
    }

    function clearConfetti() {
        confettiContainer.innerHTML = '';
    }

    loadScores();
});

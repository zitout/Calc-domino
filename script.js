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

    let currentEditingSide = null; 
    let currentEditingScoreElement = null; 
    let currentKeypadInput = "";

    const WIN_SCORE = 100; 

    let scores = {
        left: [],
        right: []
    };

    function loadScores() {
        const savedScores = localStorage.getItem('playerScores_v2'); // استخدمت مفتاحًا جديدًا لتجنب تداخل البيانات القديمة
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }
        renderScores();
    }

    function saveScores() {
        localStorage.setItem('playerScores_v2', JSON.stringify(scores));
    }

    function renderScores() {
        renderSideScores(leftScoresList, scores.left, leftTotalDisplay, 'left');
        renderSideScores(rightScoresList, scores.right, rightTotalDisplay, 'right');
        checkWinCondition();
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
            total += score; // تأكد أن score هو رقم
        });
        totalElement.textContent = `المجموع: ${total}`;
    }

    function handleScoreItemClick(event) {
        event.stopPropagation(); // مهم جدًا لمنع فتح لوحة المفاتيح لإضافة جديدة
        currentEditingScoreElement = event.target;
        currentEditingSide = event.target.dataset.side;
        currentKeypadInput = event.target.textContent; 
        currentScoreInputDisplay.textContent = currentKeypadInput;
        keypadOverlay.style.display = 'flex';
    }

        [leftPanel, rightPanel].forEach(panel => {
        panel.addEventListener('click', (event) => {
            // إذا كان الهدف الذي تم النقر عليه هو عنصر نقطة موجود (score-item)
            // فإن handleScoreItemClick قد تم استدعاؤه بالفعل وأوقف الانتشار،
            // أو إذا لم يوقف الانتشار، فإننا لا نريد فتح لوحة لإضافة جديدة.
            if (event.target.classList.contains('score-item')) {
                return; // لا تفعل شيئًا هنا، لأن تعديل النقطة يتم معالجته بشكل منفصل
            }

            // إذا وصل الكود إلى هنا، فهذا يعني أن النقر لم يكن على score-item
            // وبالتالي، هو نقرة على المساحة الفارغة للـ panel (أو على scores-list الفارغة)
            currentEditingSide = panel.dataset.side;
            currentEditingScoreElement = null; // إضافة جديدة
            currentKeypadInput = "";
            currentScoreInputDisplay.textContent = currentKeypadInput || "-";
            keypadOverlay.style.display = 'flex';
        });
    });

    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const keyValue = button.dataset.key;

            if (keyValue === 'confirm-score') {
                if (currentKeypadInput.trim() === "") {
                    // alert("الرجاء إدخال رقم."); // يمكنك تفعيل هذا
                    closeKeypad();
                    return;
                }
                const newScore = parseInt(currentKeypadInput);
                if (!isNaN(newScore) && currentEditingSide) {
                    if (currentEditingScoreElement) { 
                        const index = parseInt(currentEditingScoreElement.dataset.index);
                        scores[currentEditingSide][index] = newScore;
                    } else { 
                        scores[currentEditingSide].push(newScore);
                    }
                    saveScores();
                    renderScores();
                }
                closeKeypad();
            } else if (keyValue === 'clear-digit') {
                currentKeypadInput = currentKeypadInput.slice(0, -1);
            } else { 
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
        currentEditingSide = null;
        currentEditingScoreElement = null;
    }
    keypadOverlay.addEventListener('click', (e) => { if (e.target === keypadOverlay) closeKeypad(); });

    resetAllButton.addEventListener('click', () => {
        if (confirm("هل أنت متأكد أنك تريد مسح جميع النقاط؟")) {
            scores.left = [];
            scores.right = [];
            saveScores();
            renderScores();
        }
    });
    
    function checkWinCondition() {
        let leftTotal = scores.left.reduce((sum, score) => sum + score, 0);
        let rightTotal = scores.right.reduce((sum, score) => sum + score, 0);

        let message = "";
        if (leftTotal >= WIN_SCORE && leftTotal > rightTotal) {
            message = "الفريق الأيسر فاز!";
        } else if (rightTotal >= WIN_SCORE && rightTotal > leftTotal) {
            message = "الفريق الأيمن فاز!";
        } else if (leftTotal >= WIN_SCORE && rightTotal >= WIN_SCORE && leftTotal === rightTotal && WIN_SCORE > 0) {
             message = "تعادل والفريقان وصلا للهدف!";
        }
        // يمكنك عرض الرسالة بطريقة أفضل من alert إذا أردت
        if (message) {
            // setTimeout(() => alert(message), 100); // تأخير بسيط لضمان عرض النتيجة النهائية أولاً
        }
    }

    loadScores();
});

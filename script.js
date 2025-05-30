document.addEventListener('DOMContentLoaded', () => {
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const leftScoresList = document.getElementById('left-scores-list');
    const rightScoresList = document.getElementById('right-scores-list');
    const leftTotalDisplay = document.getElementById('left-total');
    const rightTotalDisplay = document.getElementById('right-total');
    const addScoreButtons = document.querySelectorAll('.add-score-area'); // أو استهداف Panels مباشرة

    const keypadOverlay = document.getElementById('score-keypad-overlay');
    const currentScoreInputDisplay = document.getElementById('current-score-input');
    const keypadButtons = document.querySelectorAll('#score-keypad-overlay .keypad button');
    const resetAllButton = document.getElementById('reset-all-scores');

    let currentEditingSide = null; // 'left' or 'right'
    let currentEditingScoreElement = null; // عنصر النقطة الذي يتم تعديله
    let currentKeypadInput = "";

    const WIN_SCORE = 100; // النتيجة المطلوبة للفوز

    let scores = {
        left: [],
        right: []
    };

    // --- تحميل البيانات من localStorage ---
    function loadScores() {
        const savedScores = localStorage.getItem('playerScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
        }
        renderScores();
    }

    // --- حفظ البيانات في localStorage ---
    function saveScores() {
        localStorage.setItem('playerScores', JSON.stringify(scores));
    }

    // --- عرض النقاط والمجموع ---
    function renderScores() {
        renderSideScores(leftScoresList, scores.left, leftTotalDisplay, 'left');
        renderSideScores(rightScoresList, scores.right, rightTotalDisplay, 'right');
        checkWinCondition();
    }

    function renderSideScores(listElement, sideScoresArray, totalElement, side) {
        listElement.innerHTML = ''; // مسح القائمة الحالية
        let total = 0;
        sideScoresArray.forEach((score, index) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.classList.add('score-item');
            scoreDiv.textContent = score;
            scoreDiv.dataset.index = index; // لتحديد العنصر عند التعديل
            scoreDiv.dataset.side = side;
            scoreDiv.addEventListener('click', handleScoreItemClick);
            listElement.appendChild(scoreDiv);
            total += score;
        });
        totalElement.textContent = `المجموع: ${total}`;
    }

    // --- معالجة النقر على عنصر نقطة (للتعديل) ---
    function handleScoreItemClick(event) {
        currentEditingScoreElement = event.target;
        currentEditingSide = event.target.dataset.side;
        currentKeypadInput = event.target.textContent; // تحميل النقطة الحالية في لوحة المفاتيح
        currentScoreInputDisplay.textContent = currentKeypadInput;
        keypadOverlay.style.display = 'flex';
    }

    // --- معالجة النقر على منطقة لإضافة نقطة جديدة ---
    addScoreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            currentEditingSide = e.target.dataset.side;
            currentEditingScoreElement = null; // لا يوجد تعديل، بل إضافة جديدة
            currentKeypadInput = "";
            currentScoreInputDisplay.textContent = "-";
            keypadOverlay.style.display = 'flex';
        });
    });
    // بدلاً من الزر، يمكن جعل الـ panel نفسه قابل للنقر إذا كان فارغًا
    // leftPanel.addEventListener('click', (e) => { if (e.target === leftPanel) handleAddClick('left'); });
    // rightPanel.addEventListener('click', (e) => { if (e.target === rightPanel) handleAddClick('right'); });


    // --- منطق لوحة الأرقام ---
    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const keyValue = button.dataset.key;

            if (keyValue === 'confirm-score') {
                const newScore = parseInt(currentKeypadInput);
                if (!isNaN(newScore) && currentEditingSide) {
                    if (currentEditingScoreElement) { // تعديل نقطة موجودة
                        const index = parseInt(currentEditingScoreElement.dataset.index);
                        scores[currentEditingSide][index] = newScore;
                    } else { // إضافة نقطة جديدة
                        scores[currentEditingSide].push(newScore);
                    }
                    saveScores();
                    renderScores();
                }
                closeKeypad();
            } else if (keyValue === 'clear-digit') {
                currentKeypadInput = currentKeypadInput.slice(0, -1);
            } else { // الأرقام 0-9
                if (currentKeypadInput.length < 4) { // حد أقصى لعدد خانات النقطة (مثلاً 9999)
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


    // --- زر المسح الكلي ---
    resetAllButton.addEventListener('click', () => {
        if (confirm("هل أنت متأكد أنك تريد مسح جميع النقاط؟")) {
            scores.left = [];
            scores.right = [];
            saveScores();
            renderScores();
        }
    });
    
    // --- التحقق من الفوز ---
    function checkWinCondition() {
        let leftTotal = scores.left.reduce((sum, score) => sum + score, 0);
        let rightTotal = scores.right.reduce((sum, score) => sum + score, 0);

        if (leftTotal >= WIN_SCORE && leftTotal > rightTotal) {
            alert("الفريق الأيسر فاز!");
            // يمكن إضافة تمييز بصري للفائز
        } else if (rightTotal >= WIN_SCORE && rightTotal > leftTotal) {
            alert("الفريق الأيمن فاز!");
        } else if (rightTotal >= WIN_SCORE && rightTotal === leftTotal && WIN_SCORE > 0) {
             alert("تعادل والفريقان وصلا للهدف!");
        }
    }

    // --- التحميل الأولي ---
    loadScores();
});

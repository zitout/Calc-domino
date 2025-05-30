document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // Game State
    let currentEditingSide = null;
    let currentEditingScoreElement = null;
    let currentKeypadInput = "";
    let gameActive = true;
    const WIN_SCORE = 100; // الهدف للفوز
    const MAX_INPUT_LENGTH = 4; // أقصى عدد للأرقام في الإدخال

    let scores = {
        left: [],
        right: []
    };

    // --- Local Storage ---
    const SCORES_STORAGE_KEY = 'playerScores_calc_v2'; // اسم جديد ومحسن

    function loadScores() {
        const savedScores = localStorage.getItem(SCORES_STORAGE_KEY);
        if (savedScores) {
            try {
                scores = JSON.parse(savedScores);
                if (!scores.left || !scores.right) { // Basic validation
                    throw new Error("Invalid scores format");
                }
            } catch (error) {
                console.error("Error loading scores from localStorage:", error);
                scores = { left: [], right: [] }; // Reset to default if error
            }
        }
        renderScores();
    }

    function saveScores() {
        localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
    }

    // --- Rendering ---
    function renderScores() {
        renderSideScores(leftScoresList, scores.left, leftTotalDisplay, 'left');
        renderSideScores(rightScoresList, scores.right, rightTotalDisplay, 'right');
        if (gameActive) {
            checkWinCondition();
        }
    }

    function renderSideScores(listElement, sideScoresArray, totalElement, side) {
        listElement.innerHTML = ''; // Clear previous scores
        let total = 0;
        sideScoresArray.forEach((score, index) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.classList.add('score-item');
            scoreDiv.textContent = score;
            scoreDiv.dataset.index = index;
            scoreDiv.dataset.side = side;
            scoreDiv.setAttribute('role', 'button'); // Make it behave like a button for a11y
            scoreDiv.setAttribute('tabindex', '0');  // Make it focusable
            scoreDiv.addEventListener('click', handleScoreItemClick);
            scoreDiv.addEventListener('keydown', (e) => { // Allow activation with Enter/Space
                if (e.key === 'Enter' || e.key === ' ') {
                    handleScoreItemClick(e);
                }
            });
            listElement.appendChild(scoreDiv);
            total += Number(score);
        });
        totalElement.textContent = `المجموع: ${total}`;
    }

    // --- Event Handlers ---
    function handleScoreItemClick(event) {
        if (!gameActive) return;
        event.stopPropagation();
        currentEditingScoreElement = event.target;
        currentEditingSide = event.target.dataset.side;
        currentKeypadInput = event.target.textContent;
        updateKeypadDisplay();
        openKeypad();
    }

    function openKeypadForNewScore(side) {
        if (!gameActive) return;
        currentEditingSide = side;
        currentEditingScoreElement = null; // Indicates a new score
        currentKeypadInput = "";
        updateKeypadDisplay();
        openKeypad();
    }

    leftPanel.addEventListener('click', (event) => {
        if (event.target === leftPanel || event.target === leftTotalDisplay) { // Click on panel background or total
             openKeypadForNewScore('left');
        }
    });
    rightPanel.addEventListener('click', (event) => {
        if (event.target === rightPanel || event.target === rightTotalDisplay) { // Click on panel background or total
            openKeypadForNewScore('right');
        }
    });


    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const keyValue = button.dataset.key;

            if (keyValue === 'confirm-score') {
                processScoreConfirmation();
                return;
            }
            
            // For other keys, only process if game is active
            if (!gameActive) return;

            if (keyValue === 'clear-digit') {
                currentKeypadInput = currentKeypadInput.slice(0, -1);
            } else if (currentKeypadInput.length < MAX_INPUT_LENGTH) {
                currentKeypadInput += keyValue;
            }
            updateKeypadDisplay();
        });
    });

    function processScoreConfirmation() {
        if (gameActive) { // Only add/edit if game is active
            const newScoreValue = currentKeypadInput.trim();
            if (newScoreValue === "") {
                 // If editing an existing score and it becomes empty, effectively delete it
                if (currentEditingScoreElement) {
                    const index = parseInt(currentEditingScoreElement.dataset.index);
                    scores[currentEditingSide].splice(index, 1); // Remove the item
                    saveScores();
                    renderScores(); // This will also check for win
                }
                // If adding a new score and it's empty, do nothing
            } else {
                const newScore = parseInt(newScoreValue);
                if (!isNaN(newScore) && currentEditingSide) {
                    if (currentEditingScoreElement) { // Editing existing score
                        const index = parseInt(currentEditingScoreElement.dataset.index);
                        scores[currentEditingSide][index] = newScore;
                    } else { // Adding new score
                        scores[currentEditingSide].push(newScore);
                    }
                    saveScores();
                    renderScores(); // This will also check for win
                }
            }
        }
        closeKeypad(); // Always close keypad on confirm
    }
    
    // Close keypad on overlay click or Escape key
    keypadOverlay.addEventListener('click', (e) => {
        if (e.target === keypadOverlay) closeKeypad();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !keypadOverlay.hidden) {
            closeKeypad();
        }
    });


    resetAllButton.addEventListener('click', () => {
        // Using a custom, more accessible confirmation dialog would be ideal,
        // but for simplicity, window.confirm is used.
        if (window.confirm("هل أنت متأكد أنك تريد مسح جميع النقاط والبدء من جديد؟")) {
            resetGame();
        }
    });

    playAgainButton.addEventListener('click', resetGame);

    // --- UI Control ---
    function openKeypad() {
        keypadOverlay.hidden = false;
        // Focus the first interactive element or the keypad itself for a11y
        // For simplicity, we won't implement full focus trap here
        // but focusing the display is a good start.
        currentScoreInputDisplay.focus(); // Or a specific button if preferred
    }

    function closeKeypad() {
        keypadOverlay.hidden = true;
        currentKeypadInput = ""; // Reset input after closing
        // Don't reset currentEditingSide/Element here, might be needed by win check
    }

    function updateKeypadDisplay() {
        currentScoreInputDisplay.textContent = currentKeypadInput;
        // No need for "|| '-'" if CSS handles empty state
    }

    function showWinnerScreen(message, celebrate) {
        winnerTextElement.textContent = message;
        winnerOverlay.hidden = false;
        winnerTextElement.focus(); // Focus on the message for screen readers
        if (celebrate) {
            launchConfetti();
        }
    }

    function hideWinnerScreen() {
        winnerOverlay.hidden = true;
        clearConfetti();
    }

    // --- Game Logic ---
    function resetGame() {
        scores.left = [];
        scores.right = [];
        gameActive = true;
        hideWinnerScreen();
        saveScores();
        renderScores();
    }

    function checkWinCondition() {
        if (!gameActive) return;

        const leftTotal = scores.left.reduce((sum, score) => sum + Number(score), 0);
        const rightTotal = scores.right.reduce((sum, score) => sum + Number(score), 0);

        let winnerMessage = "";
        let celebrationNeeded = false;

        if (WIN_SCORE > 0) { // Only check if there's a win score target
            if (leftTotal >= WIN_SCORE && leftTotal > rightTotal) {
                winnerMessage = "الفريق الأبيض فاز!";
                celebrationNeeded = true;
            } else if (rightTotal >= WIN_SCORE && rightTotal > leftTotal) {
                winnerMessage = "الفريق الأسود فاز!";
                celebrationNeeded = true;
            } else if (leftTotal >= WIN_SCORE && rightTotal >= WIN_SCORE && leftTotal === rightTotal) {
                winnerMessage = "تعادل والفريقان وصلا للهدف!";
                // No confetti for this type of tie, or make it configurable
            }
        }

        if (winnerMessage) {
            showWinnerScreen(winnerMessage, celebrationNeeded);
            gameActive = false;
        }
    }

    // --- Confetti (Mostly unchanged, minor detail) ---
    function launchConfetti() {
        clearConfetti();
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#ffffff', '#1abc9c', '#ff7f50', '#6a0dad'];
        const confettiCount = 150; // Slightly more confetti
        for (let i = 0; i < confettiCount; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.classList.add('confetti');
            confettiPiece.style.insetInlineStart = (Math.random() * 100) + 'vw'; // Logical property
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const animationDuration = (Math.random() * 2.5 + 2.5); // 2.5 to 5 seconds
            confettiPiece.style.animationDuration = `${animationDuration}s`;
            confettiPiece.style.animationDelay = `${(Math.random() * animationDuration * 0.6)}s`;
            
            const size = (Math.random() * 8 + 7) + 'px'; // 7px to 15px
            confettiPiece.style.width = size;
            confettiPiece.style.height = size;
            
            confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`; // Initial random rotation
            if (Math.random() > 0.5) { // Make some round, some square
                confettiPiece.style.borderRadius = '50%';
            }
            confettiContainer.appendChild(confettiPiece);
        }
    }

    function clearConfetti() {
        confettiContainer.innerHTML = '';
    }

    // --- Initialization ---
    loadScores(); // Load scores and render UI on page load
});

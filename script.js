// DOM element references

const gameClock = document.getElementById("gameClock");

const gamePeriod = document.getElementById("gamePeriod");

const toggleClock = document.getElementById("toggleClock");
const clockIcon = document.getElementById("clockIcon");
const clockButtonText = document.getElementById("clockButtonText");

const nextPeriod = document.getElementById("nextPeriod");

const scoreDisplayA = document.getElementById("scoreA");
const scoreDisplayB = document.getElementById("scoreB");

const scoreButtonsA = document.querySelectorAll("#teamA .score-button");
const scoreButtonsB = document.querySelectorAll("#teamB .score-button");

const undoScoreButton = document.getElementById("undoScore");

const newGameButton = document.getElementById("newGame");


// Game state variables

// Game durations in seconds (12-minute quarters, 5-minute overtime)
const quarterDuration = 12 * 60;
const overtimeDuration = 5 * 60;

let timeRemaining = quarterDuration;
let timerId = null;

let currentQuarter = 1;
let overtimePeriod = 0;

let scoreA = 0;
let scoreB = 0;

let lastScoreAction = null;

// Track whether the current period has started and whether the game has ended
let periodStarted = false;
let gameFinished = false;


// Function definitions

function updateClockDisplay() {

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    gameClock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function updatePeriodDisplay() {

    if (overtimePeriod === 0) {

        gamePeriod.textContent = `Quarter ${currentQuarter}`;

    } else if (overtimePeriod === 1) {

        gamePeriod.textContent = "OT";

    } else {

        gamePeriod.textContent = `${overtimePeriod} OT`;
    }
}


function updateClockButton() {

    toggleClock.disabled = gameFinished || timeRemaining === 0;

    if (timerId === null) {

        clockButtonText.textContent = "Start";

        clockIcon.innerHTML = `
            <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
        `;
    } else {

        clockButtonText.textContent = "Pause";

        clockIcon.innerHTML = `
            <rect x="14" y="3" width="5" height="18" rx="1"/>
            <rect x="5" y="3" width="5" height="18" rx="1"/>
        `;
    }
}


function updateNextPeriodButton() {

    nextPeriod.disabled = gameFinished || timeRemaining > 0;
}


function updateScoreButtons() {

    const scoringDisabled = !periodStarted || gameFinished || timeRemaining === 0;

    scoreButtonsA.forEach((button) => {

        button.disabled = scoringDisabled;
    });

    scoreButtonsB.forEach((button) => {

        button.disabled = scoringDisabled;
    });
}


function addPoints(event) {

    if (!periodStarted || gameFinished || timeRemaining === 0) {

        return;
    }

    const points = Number(event.currentTarget.dataset.points);
    const team = event.currentTarget.closest(".team");

    // Store the most recent scoring action so it can be undone
    lastScoreAction = {
        team: team.id,
        points: points
    };

    undoScoreButton.disabled = false;

    if (team.id === "teamA") {

        scoreA += points;
        scoreDisplayA.textContent = scoreA;

    } else {

        scoreB += points;
        scoreDisplayB.textContent = scoreB;
    }
}


function undoLastScore() {
    
    if (gameFinished) {

        return;
    }

    if (lastScoreAction === null) {

        return;
    }

    const { team, points } = lastScoreAction;

    if (team === "teamA") {

        scoreA -= points;
        scoreDisplayA.textContent = scoreA;

    } else {

        scoreB -= points;
        scoreDisplayB.textContent = scoreB;
    }

    lastScoreAction = null;
    undoScoreButton.disabled = true;

    // Finalise the game if Undo breaks a tie at the end of regulation or overtime
    if (currentQuarter === 4 && timeRemaining === 0 && scoreA !== scoreB) {

        gameFinished = true;
        gamePeriod.textContent = "FINAL";
    }

    updateClockButton();
    updateNextPeriodButton();
}


function resetScores() {

    scoreA = 0;
    scoreB = 0;
    scoreDisplayA.textContent = scoreA;
    scoreDisplayB.textContent = scoreB;
    lastScoreAction = null;
    undoScoreButton.disabled = true;
}


function newGame() {

    const gameHasProgress =
        periodStarted ||
        currentQuarter > 1 ||
        overtimePeriod > 0 ||
        scoreA > 0 ||
        scoreB > 0 ||
        gameFinished;

    // Ask for confirmation if the game has progressed
    if (gameHasProgress) {

        const confirmed = confirm(
            "Are you sure you want to start a new game? Current game progress will be lost."
        );

        if (!confirmed) {

            return;
        }
    }

    // Stop running clock
    clearInterval(timerId);
    timerId = null;

    // Reset game state
    currentQuarter = 1;
    overtimePeriod = 0;
    timeRemaining = quarterDuration;
    gameFinished = false;
    periodStarted = false;

    // Reset scores and clear previous scoring action
    resetScores();

    // Update the interface
    updateClockDisplay();
    updatePeriodDisplay();
    updateClockButton();
    updateNextPeriodButton();
    updateScoreButtons();
}

// Initial interface setup

updateClockDisplay();
updatePeriodDisplay();
updateNextPeriodButton();
updateScoreButtons();


// Event listeners

toggleClock.addEventListener("click", () => {

    if (gameFinished || timeRemaining === 0) {

        return;
    }

    if (timerId === null) {

        // Start the clock
        periodStarted = true;
        updateScoreButtons();

        timerId = setInterval(() => {

            if (timeRemaining > 0) {

                timeRemaining -= 1;
                updateClockDisplay();
            }

            if (timeRemaining === 0) {

                clearInterval(timerId);
                timerId = null;

                // End the game if regulation or overtime finishes without a tie
                if (currentQuarter === 4 && scoreA !== scoreB) {

                    gameFinished = true;
                    undoScoreButton.disabled = true;
                    gamePeriod.textContent = "FINAL";

                } else {

                    updatePeriodDisplay();
                }

                updateClockButton();
                updateNextPeriodButton();
                updateScoreButtons();
            }
        }, 1000);

    } else {

        // Pause the clock
        clearInterval(timerId);
        timerId = null;
    }

    updateClockButton();
});


scoreButtonsA.forEach((button) => {

    button.addEventListener("click", addPoints);
});


scoreButtonsB.forEach((button) => {

    button.addEventListener("click", addPoints);
});


nextPeriod.addEventListener("click", () => {

    if (gameFinished || timeRemaining > 0) {

        return;
    }

    if (currentQuarter < 4) {

        // Advance to the next quarter
        currentQuarter += 1;
        timeRemaining = quarterDuration;

    } else if (scoreA === scoreB) {

        // Advance to overtime
        overtimePeriod += 1;
        timeRemaining = overtimeDuration;

    } else {

        return;
    }

    // Reset state for the new period
    periodStarted = false;
    lastScoreAction = null;
    undoScoreButton.disabled = true;

    clearInterval(timerId);
    timerId = null;

    // Update the interface
    updateClockDisplay();
    updatePeriodDisplay();
    updateClockButton();
    updateNextPeriodButton();
    updateScoreButtons();
});


undoScoreButton.addEventListener("click", undoLastScore);


newGameButton.addEventListener("click", newGame);



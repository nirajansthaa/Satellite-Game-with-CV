// Combined Satellite Game JavaScript
// This file combines all JS functionality for the satellite game

// ============================================================================
// UTILITY FUNCTIONS AND SHARED VARIABLES
// ============================================================================

// Shared gesture detection functions
const LANDMARKS = {
    WRIST: 0,
    THUMB_TIP: 4,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_TIP: 16,
    PINKY_TIP: 20
};

// Detect pointing direction based on index finger relative to wrist
function detectPointingDirection(landmarks) {
    if (!landmarks || landmarks.length < 21) {
        return null;
    }

    const wrist = landmarks[LANDMARKS.WRIST];
    const indexTip = landmarks[LANDMARKS.INDEX_FINGER_TIP];

    if (!wrist || !indexTip) {
        return null;
    }

    const deltaX = indexTip.x - wrist.x;
    const deltaY = indexTip.y - wrist.y;
    const THRESHOLD_X = 0.08;
    const THRESHOLD_Y = 0.08;

    if (Math.abs(deltaX) > THRESHOLD_X && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            return 'right';
        } else {
            return 'left';
        }
    } else if (Math.abs(deltaY) > THRESHOLD_Y) {
        if (deltaY > 0) {
            return 'down';
        } else {
            return 'up';
        }
    }
    return null;
}

// Detect fist gesture
function detectFistGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) {
        return false;
    }

    const wrist = landmarks[LANDMARKS.WRIST];
    const fingertips = [
        landmarks[LANDMARKS.INDEX_FINGER_TIP],
        landmarks[LANDMARKS.MIDDLE_FINGER_TIP],
        landmarks[LANDMARKS.RING_FINGER_TIP],
        landmarks[LANDMARKS.PINKY_TIP]
    ];

    let closedFingers = 0;
    const FIST_THRESHOLD = 0.1;

    fingertips.forEach(tip => {
        if (tip) {
            const distance = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) + 
                Math.pow(tip.y - wrist.y, 2)
            );
            if (distance < FIST_THRESHOLD) {
                closedFingers++;
            }
        }
    });

    return closedFingers >= 3;
}

// ============================================================================
// STARTING PAGE FUNCTIONALITY
// ============================================================================
function initStartingPage() {
    if (!document.getElementById('start-btn')) return;
    
    // Function to show the info popup
    window.showInfoPopup = function() {
        document.getElementById('info-popup').style.display = 'block';
        document.getElementById('start-btn').style.display = 'none';
    };

    // Function to start the game
    window.startGame = function() {
        document.getElementById('info-popup').style.display = 'none';
        document.getElementById('start-btn').style.display = 'block';
        window.location.href = '/room_nav';
    };
}

// ============================================================================
// ROOM NAVIGATION FUNCTIONALITY (Part Collection Game)
// ============================================================================
function initRoomNavigation() {
    const player = document.getElementById('player');
    if (!player) return;

    let collectedParts = 0;
    const totalParts = 7;
    const satelliteParts = document.querySelectorAll('.satellite-part');
    const collectionArea = { top: 400, left: 100 };

    const room = document.querySelector('.room');
    const roomWidth = room.offsetWidth;
    const roomHeight = room.offsetHeight;
    const playerWidth = 50;
    const playerHeight = 50;

    let playerPosition = {
        top: (roomHeight - playerHeight) / 4,
        left: (roomWidth - playerWidth) / 2
    };

    let lastGestureTime = 0;
    const GESTURE_COOLDOWN = 500;

    function movePlayer(direction) {
        let nextTop = playerPosition.top;
        let nextLeft = playerPosition.left;
        const moveDistance = 50;

        switch(direction) {
            case 'up':
                nextTop -= moveDistance;
                break;
            case 'down':
                nextTop += moveDistance;
                break;
            case 'left':
                nextLeft -= moveDistance;
                break;
            case 'right':
                nextLeft += moveDistance;
                break;
        }

        if (nextTop >= 0 && nextTop <= roomHeight - playerHeight) {
            playerPosition.top = nextTop;
        }
        if (nextLeft >= 0 && nextLeft <= roomWidth - playerWidth) {
            playerPosition.left = nextLeft;
        }

        player.style.top = `${playerPosition.top}px`;
        player.style.left = `${playerPosition.left}px`;

        const moveSound = document.getElementById('move-sound');
        if (moveSound) {
            moveSound.play();
        }
    }

    function calculateDistance(part) {
        const partPosition = {
            top: part.offsetTop,
            left: part.offsetLeft
        };

        return Math.sqrt(
            Math.pow(playerPosition.top - partPosition.top, 2) +
            Math.pow(playerPosition.left - partPosition.left, 2)
        );
    }

    function collectPartIfClose(part, gestureData) {
        const partRect = part.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        const distanceX = Math.abs(partRect.left - playerRect.left);
        const distanceY = Math.abs(partRect.top - playerRect.top);

        if (distanceX < 50 && distanceY < 50 && gestureData.fist) {
            if (!part.classList.contains('collected')) {
                collectPart(part);
            }
        }
    }

    function collectPart(part) {
        part.classList.add('collected');
        part.style.opacity = '0.5';
        part.style.top = `${collectionArea.top}px`;
        part.style.left = `${collectionArea.left}px`;

        collectedParts++;
        const countElement = document.getElementById('collected-count');
        if (countElement) {
            countElement.textContent = `${collectedParts}/${totalParts}`;
        }

        const collectSound = document.getElementById('collect-sound');
        if (collectSound) {
            collectSound.play();
        }

        if (collectedParts === totalParts) {
            showCongratulatoryPopUp();
            showLearnButton();
        }
    }

    function showCongratulatoryPopUp() {
        const popUp = document.createElement('div');
        popUp.id = 'congratulations-popup';
        popUp.style.position = 'absolute';
        popUp.style.top = '40%';
        popUp.style.left = '50%';
        popUp.style.transform = 'translate(-50%, -50%)';
        popUp.style.padding = '40px';
        popUp.style.backgroundColor = 'rgba(41, 37, 37, 0.8)';
        popUp.style.color = 'white';
        popUp.style.textAlign = 'center';
        popUp.style.borderRadius = '20px';
        popUp.style.zIndex = '100';
        popUp.style.width = '1200px';
        popUp.style.height = '900px';
        popUp.style.boxSizing = 'border-box';

        const congratsImage = document.createElement('img');
        congratsImage.src = '/static/images/COngratulations.png';
        congratsImage.style.width = '300px';
        congratsImage.style.height = '300px';
        congratsImage.style.marginBottom = '40px';

        const congratsText = document.createElement('p');
        congratsText.textContent = 'Congratulations! All parts collected!';
        congratsText.style.fontSize = '40px';
        congratsText.style.fontWeight = 'bold';
        congratsText.style.marginBottom = '20px';

        const nextGameBtn = document.createElement('button');
        nextGameBtn.textContent = 'Move to Assemble Corner';
        nextGameBtn.style.marginTop = '90px';
        nextGameBtn.style.padding = '10px 20px';
        nextGameBtn.style.fontSize = '22px';
        nextGameBtn.style.position = 'absolute';
        nextGameBtn.style.top = '50%';
        nextGameBtn.style.left = '50%';
        nextGameBtn.style.transform = 'translate(-50%, -50%)';
        nextGameBtn.style.backgroundColor = '#28a745';
        nextGameBtn.style.color = 'white';
        nextGameBtn.style.border = 'none';
        nextGameBtn.style.cursor = 'pointer';
        nextGameBtn.style.borderRadius = '5px';

        nextGameBtn.addEventListener('click', () => {
            window.location.href = '/game';
        });

        popUp.appendChild(congratsImage);
        popUp.appendChild(congratsText);
        popUp.appendChild(nextGameBtn);
        document.body.appendChild(popUp);
    }

    function showLearnButton() {
        const learnButton = document.createElement('button');
        learnButton.id = 'learn-button';
        learnButton.textContent = 'Learn What You Collected';
        learnButton.style.position = 'absolute';
        learnButton.style.top = '70%';
        learnButton.style.left = '50%';
        learnButton.style.transform = 'translate(-50%, -50%)';
        learnButton.style.marginTop = '20px';
        learnButton.style.padding = '10px 20px';
        learnButton.style.fontSize = '22px';
        learnButton.style.backgroundColor = '#007bff';
        learnButton.style.color = 'white';
        learnButton.style.border = 'none';
        learnButton.style.cursor = 'pointer';
        learnButton.style.borderRadius = '5px';

        const popUp = document.getElementById('congratulations-popup');
        if (popUp) {
            popUp.appendChild(learnButton);
            learnButton.addEventListener('click', showPartsInfoModal);
        }
    }

    function showPartsInfoModal() {
        const modal = document.createElement('div');
        modal.id = 'parts-info-modal';
        modal.style.position = 'absolute';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.padding = '60px';
        modal.style.backgroundColor = 'rgba(173, 207, 230, 0.8)';
        modal.style.color = 'white';
        modal.style.textAlign = 'center';
        modal.style.borderRadius = '20px';
        modal.style.zIndex = '100';
        modal.style.width = '2900px';
        modal.style.height = '1050px';
        modal.style.boxSizing = 'border-box';

        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Satellite Parts Information';
        modalTitle.style.fontSize = '40px';
        modalTitle.style.color = 'black';

        const partsInfo = {
            antenna: {
                description: 'The antenna helps in communication with Earth. It sends and receives signals.',
                image: '/static/images/antenna_info.jpg'
            },
            battery: {
                description: 'The battery stores energy to power the satellite when it is not in direct sunlight.',
                image: '/static/images/battery_info.jpg'
            },
            satellite_body: {
                description: 'The satellite body is the core structure that houses all the critical components of the satellite.',
                image: '/static/images/body_info.jpg'
            },
            solarpanel: {
                description: 'Solar panels are critical for providing the energy needed for the satellite systems to operate.',
                image: '/static/images/solar_info.jpg'
            }
        };

        const partsList = document.createElement('ul');
        for (let partId in partsInfo) {
            const listItem = document.createElement('li');
            const partContainer = document.createElement('div');
            partContainer.style.display = 'flex';
            partContainer.style.alignItems = 'center';
            partContainer.style.marginBottom = '30px';

            const partImage = document.createElement('img');
            partImage.src = partsInfo[partId].image;
            partImage.style.width = '150px';
            partImage.style.height = 'auto';
            partImage.style.marginRight = '30px';

            const partDescription = document.createElement('p');
            partDescription.textContent = `${capitalizeFirstLetter(partId)}: ${partsInfo[partId].description}`;
            partDescription.style.fontSize = '35px';
            partDescription.style.lineHeight = '1.6';
            partDescription.style.color = 'black';

            partContainer.appendChild(partImage);
            partContainer.appendChild(partDescription);
            listItem.appendChild(partContainer);
            partsList.appendChild(listItem);
        }

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '30px';
        closeButton.style.padding = '15px 30px';
        closeButton.style.fontSize = '18px';
        closeButton.style.backgroundColor = '#dc3545';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.cursor = 'pointer';
        closeButton.style.borderRadius = '10px';

        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.appendChild(modalTitle);
        modal.appendChild(partsList);
        modal.appendChild(closeButton);
        document.body.appendChild(modal);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function applyGlowEffect() {
        satelliteParts.forEach(part => {
            const distance = calculateDistance(part);

            if (distance < 100) {
                part.classList.add('glowing');
                part.dataset.close = 'true';
            } else {
                part.classList.remove('glowing');
                delete part.dataset.close;
            }
        });
    }

    // Hand tracking for room navigation
    function updateHandTrackingRoomNav() {
        fetch("/cursor")
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;

                if (data.landmarks) {
                    const pointingDirection = detectPointingDirection(data.landmarks);
                    
                    if (pointingDirection) {
                        const currentTime = Date.now();
                        if (currentTime - lastGestureTime > GESTURE_COOLDOWN) {
                            movePlayer(pointingDirection);
                            lastGestureTime = currentTime;
                        }
                    }
                }

                const isFist = data.fist || (data.landmarks && detectFistGesture(data.landmarks));
                if (isFist) {
                    satelliteParts.forEach(part => {
                        collectPartIfClose(part, { fist: true });
                    });
                }
            })
            .catch(err => {
                console.error("Error fetching cursor data:", err);
            });

        requestAnimationFrame(updateHandTrackingRoomNav);
    }

    // Initialize room navigation
    player.style.top = `${playerPosition.top}px`;
    player.style.left = `${playerPosition.left}px`;
    updateHandTrackingRoomNav();
    setInterval(applyGlowEffect, 100);

    // Keyboard controls as backup
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                movePlayer('up');
                break;
            case 'ArrowDown':
            case 's':
                movePlayer('down');
                break;
            case 'ArrowLeft':
            case 'a':
                movePlayer('left');
                break;
            case 'ArrowRight':
            case 'd':
                movePlayer('right');
                break;
            case 'Enter':
                satelliteParts.forEach(part => {
                    if (part.dataset.close && !part.classList.contains('collected')) {
                        collectPart(part);
                    }
                });
                break;
        }
    });
}

// ============================================================================
// DRAG AND DROP ASSEMBLY GAME FUNCTIONALITY
// ============================================================================
function initDragAndDrop() {
    const cursor = document.getElementById("virtual-cursor");
    if (!cursor) return;

    const draggables = document.querySelectorAll(".draggable");
    let grabbedItem = null;

    function isCursorOverElement(cursorX, cursorY, element) {
        const rect = element.getBoundingClientRect();
        return (
            cursorX >= rect.left && cursorX <= rect.right &&
            cursorY >= rect.top && cursorY <= rect.bottom
        );
    }

    function updateCursor() {
        fetch("/cursor")
            .then(res => res.json())
            .then(data => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;

                const x = data.x * screenWidth;
                const y = data.y * screenHeight;

                cursor.style.left = `${x - cursor.offsetWidth / 2}px`;
                cursor.style.top = `${y - cursor.offsetHeight / 2}px`;

                const isPinching = data.pinch;

                if (isPinching && !grabbedItem) {
                    draggables.forEach(item => {
                        if (isCursorOverElement(x, y, item)) {
                            grabbedItem = item;
                            grabbedItem.style.position = 'absolute';
                            grabbedItem.style.zIndex = 1000;
                            grabbedItem.style.pointerEvents = 'none';
                        }
                    });
                    cursor.classList.add('hidden');
                }

                if (grabbedItem) {
                    if (isPinching) {
                        grabbedItem.style.left = `${x - grabbedItem.offsetWidth / 2}px`;
                        grabbedItem.style.top = `${y - grabbedItem.offsetHeight / 2}px`;
                    } else {
                        grabbedItem.style.pointerEvents = 'auto';
                        grabbedItem.style.position = 'absolute';
                        grabbedItem.style.left = `${x - grabbedItem.offsetWidth / 2}px`;
                        grabbedItem.style.top = `${y - grabbedItem.offsetHeight / 2}px`;
                        grabbedItem.classList.remove('grabbing');
                        grabbedItem = null;
                        cursor.classList.remove('hidden');
                    }
                }

                cursor.style.backgroundColor = isPinching ? 'green' : 'red';
            });

        requestAnimationFrame(updateCursor);
    }

    function scatterParts() {
        const gameArea = document.getElementById('game-area');
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;

        draggables.forEach(part => {
            const randomLeft = Math.random() * (gameAreaWidth - part.offsetWidth);
            const randomTop = Math.random() * (gameAreaHeight - part.offsetHeight);

            part.style.left = `${randomLeft}px`;
            part.style.top = `${randomTop}px`;
        });
    }

    updateCursor();
    window.addEventListener('load', scatterParts);
}

// ============================================================================
// SATELLITE LAUNCH FUNCTIONALITY
// ============================================================================
function initSatelliteLaunch() {
    const finishButton = document.getElementById("finish-button");
    if (!finishButton) return;

    const webcamContainer = document.getElementById("webcam-container");
    const launchVideoContainer = document.getElementById("launch-video-container");
    const launchVideo = document.getElementById("launch-video");

    finishButton.addEventListener("click", function() {
        if (webcamContainer) {
            webcamContainer.style.display = "none";
        }
        if (launchVideoContainer) {
            launchVideoContainer.style.display = "block";
        }
        if (launchVideo) {
            launchVideo.play();
        }
    });

    if (launchVideo) {
        launchVideo.addEventListener("ended", function() {
            launchVideoContainer.style.display = "none";
            window.location.href = "/satellite_destroy_game";
        });
    }
}

// ============================================================================
// SATELLITE LAUNCH GAME (Simple Movement)
// ============================================================================
function initSimpleSatelliteLaunch() {
    const satelliteImg = document.getElementById("satellite-img");
    if (!satelliteImg || !document.querySelector('.debris')) return;

    let satellitePosition = 0;
    const satelliteSpeed = 5;

    function startLaunchSequence() {
        const satellite = document.getElementById("satellite-img");
        satellite.style.transition = "transform 2s ease-in";
        satellite.style.transform = "translateY(-200vh)";
        setTimeout(function() {
            startSpacePhase();
        }, 2000);
    }

    function startSpacePhase() {
        document.addEventListener('keydown', function(event) {
            const satellite = document.getElementById("satellite-img");
            if (event.key === "ArrowRight") {
                satellitePosition += satelliteSpeed;
            } else if (event.key === "ArrowLeft") {
                satellitePosition -= satelliteSpeed;
            }
            satellite.style.left = satellitePosition + "px";
        });
        createDebris();
    }

    function createDebris() {
        const debris = document.createElement('div');
        debris.classList.add('debris');
        debris.style.top = `${Math.random() * window.innerHeight}px`;
        debris.style.left = `${Math.random() * window.innerWidth}px`;
        document.body.appendChild(debris);
    }

    startLaunchSequence();
}

// ============================================================================
// ASTEROID DODGE GAME FUNCTIONALITY
// ============================================================================
function initSatelliteDestroy() {
    const satellite = document.getElementById('satellite-img');
    if (!satellite || !document.getElementById('asteroids-container')) return;

    const laserContainer = document.getElementById('laser-container');
    const asteroidsContainer = document.getElementById('asteroids-container');
    const gameArea = document.getElementById('game-area');
    
    let gameAreaWidth = window.innerWidth;
    let gameAreaHeight = window.innerHeight;
    let backgroundMusic = null;
    let musicStarted = false;

    let score = 0;
    const TARGET_SCORE = 20;
    let gameWon = false;
    let gameOver = false;

    let satellitePosition = { 
        x: gameAreaWidth / 2, 
        y: gameAreaHeight - 150 
    };

    const moveDistance = 25;
    let lastMovementTime = 0;
    let lastShootTime = 0;
    const MOVEMENT_COOLDOWN = 300;
    const SHOOT_COOLDOWN = 400;

    function createScoreDisplay() {
        const existingScore = document.getElementById('score-display');
        if (existingScore) {
            existingScore.remove();
        }

        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'score-display';
        scoreDisplay.style.position = 'fixed';
        scoreDisplay.style.top = '20px';
        scoreDisplay.style.left = '20px';
        scoreDisplay.style.fontSize = '24px';
        scoreDisplay.style.fontWeight = 'bold';
        scoreDisplay.style.color = '#fff';
        scoreDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        scoreDisplay.style.zIndex = '2000';
        scoreDisplay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        scoreDisplay.style.padding = '10px';
        scoreDisplay.style.borderRadius = '5px';
        scoreDisplay.textContent = `Score: ${score}/${TARGET_SCORE}`;
        
        document.body.appendChild(scoreDisplay);
    }

    function updateScore() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}/${TARGET_SCORE}`;
        }
    }

    function createGameOverModal(isWin = false) {
        const existingModal = document.getElementById('game-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'game-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '3000';
        modal.style.flexDirection = 'column';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        modalContent.style.padding = '40px';
        modalContent.style.borderRadius = '20px';
        modalContent.style.textAlign = 'center';
        modalContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        modalContent.style.maxWidth = '400px';
        modalContent.style.width = '90%';

        const title = document.createElement('h2');
        title.textContent = isWin ? 'Congratulations!' : 'Game Over!';
        title.style.color = isWin ? '#4CAF50' : '#f44336';
        title.style.fontSize = '32px';
        title.style.marginBottom = '10px';
        modalContent.appendChild(title);

        const message = document.createElement('p');
        message.textContent = isWin ? 
            `You destroyed ${TARGET_SCORE} asteroids and saved the galaxy!` : 
            `You were hit by an asteroid! Final Score: ${score}/${TARGET_SCORE}`;
        message.style.fontSize = '18px';
        message.style.color = '#333';
        message.style.marginBottom = '30px';
        modalContent.appendChild(message);

        const restartButton = document.createElement('button');
        restartButton.textContent = isWin ? 'Play Again' : 'Restart Game';
        restartButton.style.fontSize = '20px';
        restartButton.style.padding = '12px 30px';
        restartButton.style.backgroundColor = '#2196F3';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '25px';
        restartButton.style.cursor = 'pointer';
        
        restartButton.onclick = () => {
            modal.remove();
            resetGame();
            startGame();
            updateHandTrackingDestroy();
        };
        
        modalContent.appendChild(restartButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    function resetGame() {
        gameOver = false;
        gameWon = false;
        score = 0;
        
        const allAsteroids = document.querySelectorAll('.asteroid');
        allAsteroids.forEach(asteroid => {
            if (asteroid.parentNode) {
                asteroid.parentNode.removeChild(asteroid);
            }
        });
        
        const allLasers = document.querySelectorAll('.laser');
        allLasers.forEach(laser => {
            if (laser.parentNode) {
                laser.parentNode.removeChild(laser);
            }
        });
        
        asteroidsContainer.innerHTML = '';
        laserContainer.innerHTML = '';
        
        const explosions = document.querySelectorAll('.explosion');
        explosions.forEach(explosion => explosion.remove());
        
        satellitePosition.x = gameAreaWidth / 2;
        satellitePosition.y = gameAreaHeight - 150;
        
        lastMovementTime = 0;
        lastShootTime = 0;
        
        initializeSatellite();
        updateScore();
    }

    function initializeSatellite() {
        satellite.style.position = 'absolute';
        satellite.style.left = satellitePosition.x + 'px';
        satellite.style.top = satellitePosition.y + 'px';
        satellite.style.width = '100px';
        satellite.style.height = '100px';
        satellite.style.zIndex = '999';
    }

    function startBackgroundMusic() {
        if (musicStarted) return;
        
        backgroundMusic = document.getElementById('background-music');
        
        if (!backgroundMusic) return;
        
        backgroundMusic.volume = 0.3;
        backgroundMusic.loop = true;
        
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                musicStarted = true;
            }).catch(e => {
                document.addEventListener('click', () => {
                    if (!musicStarted && backgroundMusic) {
                        backgroundMusic.play().then(() => {
                            musicStarted = true;
                        }).catch(e => console.error('Music failed:', e));
                    }
                }, { once: true });
            });
        }
    }

    function moveSatellite(direction) {
        if (gameOver || gameWon) return;
        
        let newX = satellitePosition.x;
        let newY = satellitePosition.y;
        
        switch(direction) {
            case 'left':
                newX -= moveDistance;
                break;
            case 'right':
                newX += moveDistance;
                break;
            case 'up':
                newY -= moveDistance;
                break;
            case 'down':
                newY += moveDistance;
                break;
        }
        
        const satelliteWidth = 100;
        const satelliteHeight = 100;
        
        if (newX >= 0 && newX <= gameAreaWidth - satelliteWidth) {
            satellitePosition.x = newX;
        }
        if (newY >= 0 && newY <= gameAreaHeight - satelliteHeight) {
            satellitePosition.y = newY;
        }
        
        satellite.style.left = satellitePosition.x + 'px';
        satellite.style.top = satellitePosition.y + 'px';
    }

    function updateSatellitePosition(handX, handY) {
        if (gameOver || gameWon) return;
        
        const newX = handX * gameAreaWidth;
        const newY = handY * gameAreaHeight;
        
        const satelliteWidth = 100;
        const satelliteHeight = 100;
        
        satellitePosition.x = Math.max(0, Math.min(newX - satelliteWidth/2, gameAreaWidth - satelliteWidth));
        satellitePosition.y = Math.max(0, Math.min(newY - satelliteHeight/2, gameAreaHeight - satelliteHeight));
        
        satellite.style.left = satellitePosition.x + 'px';
        satellite.style.top = satellitePosition.y + 'px';
    }

    function shootLaser() {
        if (gameOver || gameWon) return;
        
        const laser = document.createElement('div');
        laser.classList.add('laser');
        laser.style.position = 'absolute';
        laser.style.left = (satellitePosition.x + 50) + 'px';
        laser.style.top = satellitePosition.y + 'px';
        laser.style.height = '70px';
        laser.style.width = '16px';
        laser.style.backgroundColor = '#ff0000';
        laser.style.boxShadow = '0 0 10px #ff0000';
        laser.style.zIndex = '998';
        laserContainer.appendChild(laser);

        let laserY = satellitePosition.y;
        let laserDestroyed = false;
        
        function moveLaser() {
            if (gameOver || gameWon || laserDestroyed) {
                if (laserContainer.contains(laser)) {
                    laserContainer.removeChild(laser);
                }
                return;
            }
            
            laserY -= 15;
            laser.style.top = laserY + 'px';

            const asteroids = document.querySelectorAll('.asteroid');
            asteroids.forEach(asteroid => {
                if (laserDestroyed) return;
                
                const laserRect = laser.getBoundingClientRect();
                const asteroidRect = asteroid.getBoundingClientRect();
                
                if (laserRect.left < asteroidRect.right &&
                    laserRect.right > asteroidRect.left &&
                    laserRect.top < asteroidRect.bottom &&
                    laserRect.bottom > asteroidRect.top) {
                    
                    destroyAsteroid(asteroid);
                    laserDestroyed = true;
                    
                    if (laserContainer.contains(laser)) {
                        laserContainer.removeChild(laser);
                    }
                    
                    score++;
                    updateScore();
                    
                    if (score >= TARGET_SCORE) {
                        setTimeout(() => {
                            winGame();
                        }, 500);
                    }
                }
            });

            if (laserY < 0) {
                if (laserContainer.contains(laser)) {
                    laserContainer.removeChild(laser);
                }
                return;
            }

            if (!laserDestroyed) {
                requestAnimationFrame(moveLaser);
            }
        }

        moveLaser();
    }

    function destroyAsteroid(asteroid) {
        const asteroidRect = asteroid.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const explosionX = asteroidRect.left - gameAreaRect.left + (asteroidRect.width / 2);
        const explosionY = asteroidRect.top - gameAreaRect.top + (asteroidRect.height / 2);
        
        const explosion = document.createElement('img');
        explosion.src = '/static/images/boom.png';
        explosion.classList.add('explosion');
        explosion.style.position = 'absolute';
        explosion.style.left = (explosionX - 50) + 'px';
        explosion.style.top = (explosionY - 50) + 'px';
        explosion.style.width = '100px';
        explosion.style.height = '100px';
        explosion.style.zIndex = '1500';
        explosion.style.pointerEvents = 'none';
        explosion.style.animation = 'explode 0.6s ease-out forwards';
        
        gameArea.appendChild(explosion);
        
        if (asteroidsContainer.contains(asteroid)) {
            asteroidsContainer.removeChild(asteroid);
        }
        
        setTimeout(() => {
            if (gameArea.contains(explosion)) {
                gameArea.removeChild(explosion);
            }
        }, 600);
        
        const explosionSound = document.getElementById('explosion-sound');
        if (explosionSound) {
            explosionSound.currentTime = 0;
            explosionSound.play().catch(e => console.log('Could not play explosion sound'));
        }
    }

    function createAsteroid() {
        if (gameOver || gameWon) return;
        
        const asteroid = document.createElement('img');
        asteroid.classList.add('asteroid');
        asteroid.style.position = 'absolute';
        asteroid.style.top = '0px';
        asteroid.style.left = `${Math.random() * (gameAreaWidth - 150)}px`;

        const randomAsteroidImage = Math.random() > 0.5 ? 'asteroid1.png' : 'asteroid2.png';
        asteroid.src = `/static/images/${randomAsteroidImage}`;
        
        asteroid.style.width = '180px';
        asteroid.style.height = '180px';
        asteroid.style.zIndex = '1';
        asteroidsContainer.appendChild(asteroid);

        let asteroidY = 0;
        const fallSpeed = 3 + Math.random() * 4;
        let asteroidActive = true;

        function fall() {
            if (gameOver || gameWon || !asteroidActive) {
                if (asteroidsContainer.contains(asteroid)) {
                    asteroidsContainer.removeChild(asteroid);
                }
                return;
            }
            
            asteroidY += fallSpeed;
            asteroid.style.top = asteroidY + 'px';

            const asteroidX = parseInt(asteroid.style.left);
            const asteroidWidth = 180;
            const asteroidHeight = 180;
            const satelliteWidth = 100;
            const satelliteHeight = 100;
            const collisionMargin = 20;
            
            if (asteroidY + asteroidHeight - collisionMargin >= satellitePosition.y && 
                asteroidY + collisionMargin <= satellitePosition.y + satelliteHeight &&
                asteroidX + asteroidWidth - collisionMargin >= satellitePosition.x && 
                asteroidX + collisionMargin <= satellitePosition.x + satelliteWidth) {
                
                if (!gameOver && !gameWon) {
                    asteroidActive = false;
                    endGame();
                }
                return;
            }

            if (asteroidY > gameAreaHeight) {
                asteroidActive = false;
                if (asteroidsContainer.contains(asteroid)) {
                    asteroidsContainer.removeChild(asteroid);
                }
                return;
            }

            if (asteroidActive && !gameOver && !gameWon) {
                requestAnimationFrame(fall);
            }
        }

        fall();
    }

    function winGame() {
        if (gameWon) return;
        
        gameWon = true;
        gameOver = true;
        
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            musicStarted = false;
        }
        
        createGameOverModal(true);
    }

    function startGame() {
        gameOver = false;
        gameWon = false;
        
        initializeSatellite();
        createScoreDisplay();
        startBackgroundMusic();
        
        setTimeout(() => {
            if (!gameOver && !gameWon) {
                const asteroidInterval = setInterval(() => {
                    if (gameOver || gameWon) {
                        clearInterval(asteroidInterval);
                        return;
                    }
                    createAsteroid();
                }, 1500);
            }
        }, 500);
    }

    function endGame() {
        if (gameOver) return;
        
        gameOver = true;
        
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            musicStarted = false;
        }
        
        createGameOverModal(false);
    }

    function updateHandTrackingDestroy() {
        if (gameOver || gameWon) return;
        
        fetch("/cursor")
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (!data) return;

                const currentTime = Date.now();

                if (data.x !== undefined && data.y !== undefined) {
                    updateSatellitePosition(data.x, data.y);
                }

                if (data.fist) {
                    if (currentTime - lastShootTime > SHOOT_COOLDOWN) {
                        shootLaser();
                        lastShootTime = currentTime;
                    }
                }
            })
            .catch(err => {
                console.error("Error fetching cursor data:", err);
            });

        if (!gameOver && !gameWon) {
            requestAnimationFrame(updateHandTrackingDestroy);
        }
    }

    // Keyboard controls as backup
    document.addEventListener('keydown', (e) => {
        if (gameOver || gameWon) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                moveSatellite('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                moveSatellite('down');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                moveSatellite('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                moveSatellite('right');
                break;
            case ' ':
            case 'Enter':
                shootLaser();
                break;
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        gameAreaWidth = window.innerWidth;
        gameAreaHeight = window.innerHeight;
    });

    // Initialize the game
    setTimeout(() => {
        startGame();
        updateHandTrackingDestroy();
    }, 500);
}

// ============================================================================
// INITIALIZATION - DETECT PAGE AND INITIALIZE APPROPRIATE FUNCTIONALITY
// ============================================================================
function initializeGame() {
    // Initialize based on what elements exist on the page
    initStartingPage();           // Starting page functionality
    initRoomNavigation();         // Room navigation/collection game
    initDragAndDrop();           // Drag and drop assembly game  
    initSatelliteLaunch();       // Satellite launch video functionality
    initSimpleSatelliteLaunch(); // Simple satellite launch game
    initSatelliteDestroy();      // Asteroid dodge game
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGame);

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
    // DOMContentLoaded will fire
} else {
    // DOM is already loaded
    initializeGame();
}
const satellite = document.getElementById('satellite-img');
const laserContainer = document.getElementById('laser-container');
const asteroidsContainer = document.getElementById('asteroids-container');
const virtualCursor = document.getElementById('virtual-cursor');

// Game area boundaries
const gameArea = document.getElementById('game-area');
let gameAreaWidth = window.innerWidth;
let gameAreaHeight = window.innerHeight;
let backgroundMusic = null;
let musicStarted = false;

// Game state variables
let score = 0;
const TARGET_SCORE = 20;
let gameWon = false;

// Satellite position and movement
let satellitePosition = { 
    x: gameAreaWidth / 2, 
    y: gameAreaHeight - 150 
};

// Movement parameters
const moveDistance = 25; // How much to move per gesture
let lastMovementTime = 0;
let lastShootTime = 0;
const MOVEMENT_COOLDOWN = 300; // milliseconds
const SHOOT_COOLDOWN = 400; // milliseconds

let gameOver = false;

// MediaPipe hand landmark indices
const LANDMARKS = {
    WRIST: 0,
    THUMB_TIP: 4,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_TIP: 16,
    PINKY_TIP: 20
};

// Create and display score element
function createScoreDisplay() {
    // Remove existing score display if any
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

// Update score display
function updateScore() {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${score}/${TARGET_SCORE}`;
    }
}

// Create game over modal
function createGameOverModal(isWin = false) {
    // Remove existing modal if any
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

    if (isWin) {
        // Victory content
        const victoryImage = document.createElement('img');
        victoryImage.src = '/static/images/victory.png'; // Add your victory image
        victoryImage.style.width = '150px';
        victoryImage.style.height = '150px';
        victoryImage.style.marginBottom = '20px';
        victoryImage.onerror = () => {
            // If image doesn't exist, show text instead
            victoryImage.style.display = 'none';
            const victoryText = document.createElement('div');
            victoryText.textContent = '🎉 VICTORY! 🎉';
            victoryText.style.fontSize = '48px';
            victoryText.style.marginBottom = '20px';
            modalContent.insertBefore(victoryText, modalContent.firstChild);
        };
        modalContent.appendChild(victoryImage);

        const title = document.createElement('h2');
        title.textContent = 'Congratulations!';
        title.style.color = '#4CAF50';
        title.style.fontSize = '32px';
        title.style.marginBottom = '10px';
        modalContent.appendChild(title);

        const message = document.createElement('p');
        message.textContent = `You destroyed ${TARGET_SCORE} asteroids and saved the galaxy!`;
        message.style.fontSize = '18px';
        message.style.color = '#333';
        message.style.marginBottom = '30px';
        modalContent.appendChild(message);
    } else {
        // Game over content
        const gameOverImage = document.createElement('img');
        gameOverImage.src = '/static/images/game-over.png'; // Add your game over image
        gameOverImage.style.width = '150px';
        gameOverImage.style.height = '150px';
        gameOverImage.style.marginBottom = '20px';
        gameOverImage.onerror = () => {
            // If image doesn't exist, show text instead
            gameOverImage.style.display = 'none';
            const gameOverText = document.createElement('div');
            gameOverText.textContent = '💥 GAME OVER 💥';
            gameOverText.style.fontSize = '48px';
            gameOverText.style.marginBottom = '20px';
            modalContent.insertBefore(gameOverText, modalContent.firstChild);
        };
        modalContent.appendChild(gameOverImage);

        const title = document.createElement('h2');
        title.textContent = 'Game Over!';
        title.style.color = '#f44336';
        title.style.fontSize = '32px';
        title.style.marginBottom = '10px';
        modalContent.appendChild(title);

        const message = document.createElement('p');
        message.textContent = `You were hit by an asteroid! Final Score: ${score}/${TARGET_SCORE}`;
        message.style.fontSize = '18px';
        message.style.color = '#333';
        message.style.marginBottom = '30px';
        modalContent.appendChild(message);
    }

    // Restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = isWin ? 'Play Again' : 'Restart Game';
    restartButton.style.fontSize = '20px';
    restartButton.style.padding = '12px 30px';
    restartButton.style.backgroundColor = '#2196F3';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '25px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
    restartButton.style.transition = 'all 0.3s ease';
    
    restartButton.onmouseover = () => {
        restartButton.style.backgroundColor = '#1976D2';
        restartButton.style.transform = 'translateY(-2px)';
        restartButton.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
    };
    
    restartButton.onmouseout = () => {
        restartButton.style.backgroundColor = '#2196F3';
        restartButton.style.transform = 'translateY(0)';
        restartButton.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
    };
    
    restartButton.onclick = () => {
        console.log('Restart button clicked');
        modal.remove();
        resetGame();
        startGame();
        // Restart hand tracking
        updateHandTracking();
    };
    
    modalContent.appendChild(restartButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Reset game state
function resetGame() {
    console.log('Resetting game...');
    gameOver = false;
    gameWon = false;
    score = 0;
    
    // Clear all asteroids and lasers more thoroughly
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
    
    // Clear containers completely
    asteroidsContainer.innerHTML = '';
    laserContainer.innerHTML = '';
    
    // Remove any existing explosions
    const explosions = document.querySelectorAll('.explosion');
    explosions.forEach(explosion => explosion.remove());
    
    // Reset satellite position
    satellitePosition.x = gameAreaWidth / 2;
    satellitePosition.y = gameAreaHeight - 150;
    
    // Reset movement and shooting timers
    lastMovementTime = 0;
    lastShootTime = 0;
    
    // Update satellite visual position
    initializeSatellite();
    
    updateScore();
    console.log('Game reset complete. Score:', score);
}

// Initialize satellite position
function initializeSatellite() {
    satellite.style.position = 'absolute';
    satellite.style.left = satellitePosition.x + 'px';
    satellite.style.top = satellitePosition.y + 'px';
    satellite.style.width = '100px';
    satellite.style.height = '100px';
    satellite.style.zIndex = '999';
}

// Function to start music on user interaction
function startMusicOnInteraction() {
    if (!musicStarted && backgroundMusic) {
        backgroundMusic.play().then(() => {
            console.log('Background music started after user interaction');
            musicStarted = true;
        }).catch(e => {
            console.error('Failed to start music even after user interaction:', e);
        });
    }
}

function startBackgroundMusic() {
    if (musicStarted) return;
    
    backgroundMusic = document.getElementById('background-music');
    
    if (!backgroundMusic) {
        console.error('Background music element not found! Make sure you have an audio element with id="background-music"');
        return;
    }
    
    console.log('Background music element found, attempting to play...');
    
    // Set volume and loop
    backgroundMusic.volume = 0.3; // Adjust volume as needed
    backgroundMusic.loop = true; // Make sure it loops
    
    // Try to play immediately
    const playPromise = backgroundMusic.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('Background music started successfully');
            musicStarted = true;
        }).catch(e => {
            console.log('Could not auto-play background music:', e.message);
            console.log('Music will start on first user interaction');
            
            // Try to start music on first user interaction
            document.addEventListener('click', startMusicOnInteraction, { once: true });
            document.addEventListener('keydown', startMusicOnInteraction, { once: true });
        });
    }
}

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

    // Calculate direction vector from wrist to index finger tip
    const deltaX = indexTip.x - wrist.x;
    const deltaY = indexTip.y - wrist.y;

    // Thresholds for detecting pointing gestures
    const THRESHOLD_X = 0.08; // Horizontal pointing threshold
    const THRESHOLD_Y = 0.08; // Vertical pointing threshold

    // Determine pointing direction (prioritize stronger direction)
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

    return null; // No significant pointing gesture detected
}

// Move satellite based on direction
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
    
    // Keep satellite within game boundaries
    const satelliteWidth = 100;
    const satelliteHeight = 100;
    
    if (newX >= 0 && newX <= gameAreaWidth - satelliteWidth) {
        satellitePosition.x = newX;
    }
    if (newY >= 0 && newY <= gameAreaHeight - satelliteHeight) {
        satellitePosition.y = newY;
    }
    
    // Update satellite position
    satellite.style.left = satellitePosition.x + 'px';
    satellite.style.top = satellitePosition.y + 'px';
    
    console.log(`Satellite moved ${direction} to position: x=${satellitePosition.x}, y=${satellitePosition.y}`);
}

// Alternative: Direct position control using hand position
function updateSatellitePosition(handX, handY) {
    if (gameOver || gameWon) return;
    
    // Map hand position (0-1) to game area coordinates
    const newX = handX * gameAreaWidth;
    const newY = handY * gameAreaHeight;
    
    // Keep satellite within boundaries
    const satelliteWidth = 100;
    const satelliteHeight = 100;
    
    satellitePosition.x = Math.max(0, Math.min(newX - satelliteWidth/2, gameAreaWidth - satelliteWidth));
    satellitePosition.y = Math.max(0, Math.min(newY - satelliteHeight/2, gameAreaHeight - satelliteHeight));
    
    // Update satellite position
    satellite.style.left = satellitePosition.x + 'px';
    satellite.style.top = satellitePosition.y + 'px';
}

// Laser shooting logic
function shootLaser() {
    if (gameOver || gameWon) return;
    
    const laser = document.createElement('div');
    laser.classList.add('laser');
    laser.style.position = 'absolute';
    laser.style.left = (satellitePosition.x + 50) + 'px'; // Center of satellite
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
        
        laserY -= 15; // Speed of laser moving up
        laser.style.top = laserY + 'px';

        // Check collision with asteroids
        const asteroids = document.querySelectorAll('.asteroid');
        asteroids.forEach(asteroid => {
            if (laserDestroyed) return; // Skip if laser already destroyed
            
            const laserRect = laser.getBoundingClientRect();
            const asteroidRect = asteroid.getBoundingClientRect();
            
            // Check if laser hits asteroid
            if (laserRect.left < asteroidRect.right &&
                laserRect.right > asteroidRect.left &&
                laserRect.top < asteroidRect.bottom &&
                laserRect.bottom > asteroidRect.top) {
                
                // Collision detected - destroy both laser and asteroid
                destroyAsteroid(asteroid);
                laserDestroyed = true;
                
                if (laserContainer.contains(laser)) {
                    laserContainer.removeChild(laser);
                }
                
                // Increase score
                score++;
                updateScore();
                console.log(`Asteroid destroyed! Score: ${score}/${TARGET_SCORE}`);
                
                // Check for win condition
                if (score >= TARGET_SCORE) {
                    console.log('Target score reached! Triggering win...');
                    setTimeout(() => {
                        winGame();
                    }, 500); // Small delay to show the explosion
                }
            }
        });

        // Remove laser if it goes out of screen
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
    console.log("Laser shot!");
}

// Function to destroy asteroid and show explosion
function destroyAsteroid(asteroid) {
    const asteroidRect = asteroid.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Calculate position relative to game area
    const explosionX = asteroidRect.left - gameAreaRect.left + (asteroidRect.width / 2);
    const explosionY = asteroidRect.top - gameAreaRect.top + (asteroidRect.height / 2);
    
    // Create boom explosion effect
    const explosion = document.createElement('img');
    explosion.src = '/static/images/boom.png'; // Make sure you have boom.png in your images folder
    explosion.classList.add('explosion');
    explosion.style.position = 'absolute';
    explosion.style.left = (explosionX - 50) + 'px'; // Center the explosion (assuming 100px explosion size)
    explosion.style.top = (explosionY - 50) + 'px';
    explosion.style.width = '100px';
    explosion.style.height = '100px';
    explosion.style.zIndex = '1500';
    explosion.style.pointerEvents = 'none';
    
    // Add explosion animation
    explosion.style.animation = 'explode 0.6s ease-out forwards';
    
    gameArea.appendChild(explosion);
    
    // Remove asteroid immediately
    if (asteroidsContainer.contains(asteroid)) {
        asteroidsContainer.removeChild(asteroid);
    }
    
    // Remove explosion after animation
    setTimeout(() => {
        if (gameArea.contains(explosion)) {
            gameArea.removeChild(explosion);
        }
    }, 600); // Match animation duration
    
    // Play explosion sound if available
    const explosionSound = document.getElementById('explosion-sound');
    if (explosionSound) {
        explosionSound.currentTime = 0; // Reset sound to beginning
        explosionSound.play().catch(e => console.log('Could not play explosion sound'));
    }
}

function createAsteroid() {
    if (gameOver || gameWon) {
        console.log('Not creating asteroid - game state:', { gameOver, gameWon });
        return;
    }
    
    console.log('Creating new asteroid...');
    const asteroid = document.createElement('img');
    asteroid.classList.add('asteroid');
    asteroid.style.position = 'absolute';
    asteroid.style.top = '0px';
    asteroid.style.left = `${Math.random() * (gameAreaWidth - 150)}px`;

    // Randomly choose asteroid image
    const randomAsteroidImage = Math.random() > 0.5 ? 'asteroid1.png' : 'asteroid2.png';
    asteroid.src = `/static/images/${randomAsteroidImage}`;
    
    asteroid.style.width = '180px';
    asteroid.style.height = '180px';
    asteroid.style.zIndex = '1';
    asteroidsContainer.appendChild(asteroid);

    let asteroidY = 0;
    const fallSpeed = 3 + Math.random() * 4; // Random speed between 3-7
    let asteroidActive = true; // Track if this asteroid is still active

    function fall() {
        // Check if game is over or this specific asteroid should stop
        if (gameOver || gameWon || !asteroidActive) {
            console.log('Stopping asteroid fall - gameOver:', gameOver, 'gameWon:', gameWon, 'asteroidActive:', asteroidActive);
            if (asteroidsContainer.contains(asteroid)) {
                asteroidsContainer.removeChild(asteroid);
            }
            return;
        }
        
        asteroidY += fallSpeed;
        asteroid.style.top = asteroidY + 'px';

        // Check for collision with satellite
        const asteroidX = parseInt(asteroid.style.left);
        const asteroidWidth = 180; // Match the actual asteroid size
        const asteroidHeight = 180; // Match the actual asteroid size
        const satelliteWidth = 100;
        const satelliteHeight = 100;
        
        // Add some margin to make collision more forgiving
        const collisionMargin = 20;
        
        // More precise collision detection
        if (asteroidY + asteroidHeight - collisionMargin >= satellitePosition.y && 
            asteroidY + collisionMargin <= satellitePosition.y + satelliteHeight &&
            asteroidX + asteroidWidth - collisionMargin >= satellitePosition.x && 
            asteroidX + collisionMargin <= satellitePosition.x + satelliteWidth) {
            // Collision detected
            console.log('REAL Collision detected!', {
                asteroidX: asteroidX,
                asteroidY: asteroidY,
                satelliteX: satellitePosition.x,
                satelliteY: satellitePosition.y,
                gameOver: gameOver,
                gameWon: gameWon
            });
            
            // Only end game if it's actually running
            if (!gameOver && !gameWon) {
                asteroidActive = false;
                endGame();
            }
            return;
        }

        // Remove asteroid if it goes off screen
        if (asteroidY > gameAreaHeight) {
            console.log('Asteroid went off screen, removing...');
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

// Win game function
function winGame() {
    if (gameWon) return; // Prevent multiple calls
    
    gameWon = true;
    gameOver = true;
    console.log("Game won! Target score reached!");
    
    // Stop background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        musicStarted = false;
    }
    
    // Show victory modal
    createGameOverModal(true);
}

// Game control functions
function startGame() {
    console.log('Starting game... Current score:', score);
    
    // Ensure clean state
    gameOver = false;
    gameWon = false;
    
    initializeSatellite();
    createScoreDisplay();
    
    // Start background music when game starts
    startBackgroundMusic();
    
    // Small delay before creating asteroids to ensure clean start
    setTimeout(() => {
        if (!gameOver && !gameWon) {
            // Create asteroids at intervals
            const asteroidInterval = setInterval(() => {
                if (gameOver || gameWon) {
                    console.log('Stopping asteroid creation - gameOver:', gameOver, 'gameWon:', gameWon);
                    clearInterval(asteroidInterval);
                    return;
                }
                createAsteroid();
            }, 1500); // Create asteroid every 1.5 seconds
        }
    }, 500);
}

function endGame() {
    if (gameOver) return; // Prevent multiple calls
    
    gameOver = true;
    console.log("Game over! Hit by asteroid!");
    
    // Stop background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        musicStarted = false;
    }
    
    // Show game over modal
    createGameOverModal(false);
}

// Hand tracking update function
function updateHandTracking() {
    // Don't start hand tracking if game is over or won
    if (gameOver || gameWon) {
        console.log('Hand tracking stopped - gameOver:', gameOver, 'gameWon:', gameWon);
        return;
    }
    
    fetch("/cursor")
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (!data) {
                console.log("No cursor data received");
                return;
            }

            const currentTime = Date.now();

            // MOVEMENT CONTROL - Choose one of these methods:

            // Method 1: Use pointing gestures for discrete movement
            // if (data.landmarks) {
            //     const pointingDirection = detectPointingDirection(data.landmarks);
                
            //     if (pointingDirection) {
            //         if (currentTime - lastMovementTime > MOVEMENT_COOLDOWN) {
            //             console.log(`Hand pointing: ${pointingDirection} - Moving satellite`);
            //             moveSatellite(pointingDirection);
            //             lastMovementTime = currentTime;
            //         }
            //     }
            // }

            // Method 2: Use direct hand position for smooth movement (uncomment to use instead)
            
            if (data.x !== undefined && data.y !== undefined) {
                updateSatellitePosition(data.x, data.y);
            }

            // SHOOTING CONTROL - Use fist gesture to shoot lasers
            if (data.fist) {
                if (currentTime - lastShootTime > SHOOT_COOLDOWN) {
                    console.log("Fist detected - shooting laser!");
                    shootLaser();
                    lastShootTime = currentTime;
                }
            }

            // Alternative: Use pinch gesture for shooting (uncomment to use instead)
            /*
            if (data.pinch) {
                if (currentTime - lastShootTime > SHOOT_COOLDOWN) {
                    console.log("Pinch detected - shooting laser!");
                    shootLaser();
                    lastShootTime = currentTime;
                }
            }
            */
        })
        .catch(err => {
            console.error("Error fetching cursor data:", err);
        });

    // Continue hand tracking loop only if game is still active
    if (!gameOver && !gameWon) {
        requestAnimationFrame(updateHandTracking);
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
        case ' ': // Spacebar
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

// Start the game and hand tracking when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all elements are loaded
    setTimeout(() => {
        startGame();
        updateHandTracking();
    }, 500);
});

// Fallback: Start game immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // Do nothing, DOMContentLoaded will fire
} else {
    // DOM is already loaded
    setTimeout(() => {
        startGame();
        updateHandTracking();
    }, 500);
}
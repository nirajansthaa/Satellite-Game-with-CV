// Initialize the collected parts count
let collectedParts = 0;
const totalParts = 7;  // Total number of parts to collect

// Get the player and satellite parts
const player = document.getElementById('player');
const satelliteParts = document.querySelectorAll('.satellite-part');

// Set the collection area (we'll move the parts here)
const collectionArea = { top: 400, left: 100 }; // Example coordinates for collection area

// Get the room dimensions after the page loads
const room = document.querySelector('.room');
const roomWidth = room.offsetWidth;
const roomHeight = room.offsetHeight;

const playerWidth = 50;  // Player width (adjust according to your player image size)
const playerHeight = 50; // Player height (adjust according to your player image size)

// Set initial player position (center the player inside the room)
let playerPosition = {
  top: (roomHeight - playerHeight) / 4,  // Centered vertically
  left: (roomWidth - playerWidth) / 2   // Centered horizontally
};

let prevHandPosition = { x: 0, y: 0 }; // Store the previous hand position

// Function to move the player (consolidated version)
function movePlayer(direction) {
  let nextTop = playerPosition.top;
  let nextLeft = playerPosition.left;

  const moveDistance = 50; // Consistent move distance

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

  // Ensure the player stays within the bounds of the room (game area)
  if (nextTop >= 0 && nextTop <= roomHeight - playerHeight) {
    playerPosition.top = nextTop; // Update top position if within bounds
  }

  if (nextLeft >= 0 && nextLeft <= roomWidth - playerWidth) {
    playerPosition.left = nextLeft; // Update left position if within bounds
  }

  // Update the player position in CSS
  player.style.top = `${playerPosition.top}px`;
  player.style.left = `${playerPosition.left}px`;

  // Play sound when player moves (if sound element exists)
  const moveSound = document.getElementById('move-sound');
  if (moveSound) {
    moveSound.play();
  }

  console.log(`Player moved ${direction} to position: top=${playerPosition.top}, left=${playerPosition.left}`);
}

// Function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// MediaPipe hand landmark indices
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
        console.log("Insufficient landmark data for pointing detection");
        return null;
    }

    const wrist = landmarks[LANDMARKS.WRIST];
    const indexTip = landmarks[LANDMARKS.INDEX_FINGER_TIP];

    if (!wrist || !indexTip) {
        console.log("Missing wrist or index finger landmarks");
        return null;
    }

    // Calculate direction vector from wrist to index finger tip
    const deltaX = indexTip.x - wrist.x;
    const deltaY = indexTip.y - wrist.y;

    // Thresholds for detecting pointing gestures
    const THRESHOLD_X = 0.08; // Horizontal pointing threshold
    const THRESHOLD_Y = 0.08; // Vertical pointing threshold

    console.log(`Pointing deltas: deltaX=${deltaX.toFixed(3)}, deltaY=${deltaY.toFixed(3)}`);

    // Determine pointing direction (prioritize stronger direction)
    if (Math.abs(deltaX) > THRESHOLD_X && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            console.log("Detected: pointing right");
            return 'right';
        } else {
            console.log("Detected: pointing left");
            return 'left';
        }
    } else if (Math.abs(deltaY) > THRESHOLD_Y) {
        if (deltaY > 0) {
            console.log("Detected: pointing down");
            return 'down';
        } else {
            console.log("Detected: pointing up");
            return 'up';
        }
    }

    return null; // No significant pointing gesture detected
}

// Detect fist gesture (backup client-side detection)
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

    // Check if fingertips are close to wrist (indicating closed fist)
    let closedFingers = 0;
    const FIST_THRESHOLD = 0.1; // Distance threshold for closed fingers

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

    const isFist = closedFingers >= 3; // At least 3 fingers should be close to wrist
    if (isFist) {
        console.log("Detected: fist gesture");
        return true;
    }
    
    return false;
}

// Add gesture cooldown to prevent too rapid movements
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 500; // milliseconds

function updateHandTracking() {
    fetch("/cursor")
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Received cursor data:", data);
            
            // Check if we have valid data
            if (!data) {
                console.log("No cursor data received");
                return;
            }

            // Movement detection using pointing gestures
            if (data.landmarks) {
                const pointingDirection = detectPointingDirection(data.landmarks);
                
                if (pointingDirection) {
                    // Add cooldown to prevent too rapid movements
                    const currentTime = Date.now();
                    if (currentTime - lastGestureTime > GESTURE_COOLDOWN) {
                        console.log(`Moving player: ${pointingDirection}`);
                        movePlayer(pointingDirection);
                        lastGestureTime = currentTime;
                    }
                }
            }

            // Collection using fist gesture
            const isFist = data.fist || (data.landmarks && detectFistGesture(data.landmarks));
            if (isFist) {
                console.log("Fist detected - checking for parts to collect");
                satelliteParts.forEach(part => {
                    collectPartIfClose(part, { fist: true });
                });
            }
        })
        .catch(err => {
            console.error("Error fetching cursor data:", err);
        });

    requestAnimationFrame(updateHandTracking); // Continuously update hand tracking
}

// Start hand tracking and initialize the game
updateHandTracking();

// Set the player's initial position in CSS
player.style.top = `${playerPosition.top}px`;
player.style.left = `${playerPosition.left}px`;

// Function to calculate distance between the player and a part
function calculateDistance(part) {
  const partPosition = {
    top: part.offsetTop,
    left: part.offsetLeft
  };

  // Calculate Euclidean distance
  const distance = Math.sqrt(
    Math.pow(playerPosition.top - partPosition.top, 2) +
    Math.pow(playerPosition.left - partPosition.left, 2)
  );

  return distance;
}

// Fixed collectPartIfClose function for fist gesture
function collectPartIfClose(part, gestureData) {
    const partRect = part.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    // Calculate distance between player and part
    const distanceX = Math.abs(partRect.left - playerRect.left);
    const distanceY = Math.abs(partRect.top - playerRect.top);

    // If player is close to the part and fist gesture is detected, collect it
    if (distanceX < 50 && distanceY < 50 && gestureData.fist) {
        if (!part.classList.contains('collected')) {
            console.log("Collecting part with fist gesture!");
            collectPart(part);
        }
    }
}

// Function to handle collecting parts
function collectPart(part) {
  part.classList.add('collected');
  part.style.opacity = '0.5';  // Make the part look collected

  // Move the part to the collection area (example coordinates)
  part.style.top = `${collectionArea.top}px`;
  part.style.left = `${collectionArea.left}px`;

  // Update the collected parts count
  collectedParts++;
  const countElement = document.getElementById('collected-count');
  if (countElement) {
    countElement.textContent = `${collectedParts}/${totalParts}`;
  }

  // Play the collect sound
  const collectSound = document.getElementById('collect-sound');
  if (collectSound) {
    collectSound.play();
  }

  // If all parts are collected, show the pop-up and the next button
  if (collectedParts === totalParts) {
    showCongratulatoryPopUp(); 
    showLearnButton();
  }
}

function showLearnButton() {
  // Create the "Learn What You Collected" button dynamically
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
  
  // Add the button to the "Congratulations" pop-up or any other container
  const popUp = document.getElementById('congratulations-popup');
  if (popUp) {
    popUp.appendChild(learnButton);
    // Attach the event listener to the Learn button
    learnButton.addEventListener('click', showPartsInfoModal);
  }
}

// Function to show the "Congratulations" pop-up
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
  congratsImage.src = '/static/images/COngratulations.png'
  congratsImage.style.width = '300px';
  congratsImage.style.height = '300px' ;
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

// Function to apply glow effect when close to the player
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

// Call the applyGlowEffect function every 100ms to check proximity
setInterval(applyGlowEffect, 100);

// Event listener for keyboard input (WASD or Arrow Keys) - keep as backup
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
      // Collect parts that are close
      satelliteParts.forEach(part => {
        if (part.dataset.close && !part.classList.contains('collected')) {
          collectPart(part);
        }
      });
      break;
  }
});

// Function to show the "Learn What You Collected" modal
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

    // Define information about each satellite part
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
            description: 'Solar panels are critical for providing the energy needed for the satellite systems to operate. They convert sunlight into electricity using photovoltaic cells.',
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

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

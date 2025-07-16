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

// Set the player's initial position in CSS
player.style.top = `${playerPosition.top}px`;
player.style.left = `${playerPosition.left}px`;

// Function to move the player
function movePlayer(direction) {
  let nextTop = playerPosition.top;
  let nextLeft = playerPosition.left;

  switch(direction) {
    case 'up':
      nextTop -= 10;
      break;
    case 'down':
      nextTop += 10;
      break;
    case 'left':
      nextLeft -= 10;
      break;
    case 'right':
      nextLeft += 10;
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
}

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

// Function to handle collecting parts
function collectPart(part) {
  part.classList.add('collected');
  part.style.opacity = '0.5';  // Make the part look collected

  // Move the part to the collection area (example coordinates)
  part.style.top = `${collectionArea.top}px`;
  part.style.left = `${collectionArea.left}px`;

  // Update the collected parts count
  collectedParts++;
  document.getElementById('collected-count').textContent = `${collectedParts}/${totalParts}`;

  // If all parts are collected, show the pop-up and the next button
  if (collectedParts === totalParts) {
    showCongratulatoryPopUp();  // Show the pop-up with the "Congratulations" message
  }
}

// Function to show the "Congratulations" pop-up
function showCongratulatoryPopUp() {
  const popUp = document.createElement('div');
  popUp.id = 'congratulations-popup';
  popUp.style.position = 'absolute';
  popUp.style.top = '50%';
  popUp.style.left = '50%';
  popUp.style.transform = 'translate(-50%, -50%)';
  popUp.style.padding = '40px';
  popUp.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  popUp.style.color = 'white';
  popUp.style.textAlign = 'center';
  popUp.style.borderRadius = '20px';
  popUp.style.zIndex = '100';
  popUp.style.width = '800px';  
  popUp.style.height = '700px';
  popUp.style.boxSizing = 'border-box'; 

  const congratsImage = document.createElement('img');
  congratsImage.src = "{{ url_for('static', filename='images/Congratulations.png') }}"; 
  congratsImage.style.width = '200px';
  congratsImage.style.marginBottom = '20px';

  const congratsText = document.createElement('p');
  congratsText.textContent = 'Congratulations! All parts collected!';

  const nextGameBtn = document.createElement('button');
  nextGameBtn.textContent = 'Move to Assemble Corner';
  nextGameBtn.style.marginTop = '10px';
  nextGameBtn.style.padding = '10px 20px';
  nextGameBtn.style.fontSize = '16px';
  nextGameBtn.style.backgroundColor = '#28a745';
  nextGameBtn.style.color = 'white';
  nextGameBtn.style.border = 'none';
  nextGameBtn.style.cursor = 'pointer';
  nextGameBtn.style.borderRadius = '5px';

  nextGameBtn.addEventListener('click', () => {
    window.location.href = '/game';  // Redirect to the index page or move to next game
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
      part.dataset.close = 'true'; // Mark this part as being close
    } else {
      part.classList.remove('glowing');
      delete part.dataset.close; // Remove the "close" mark if not within range
    }

    // Add event listener for Enter key to collect the part if close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && part.dataset.close) {
        if (!part.classList.contains('collected')) {
          collectPart(part);
        }
      }
    });
  });
}

// Call the applyGlowEffect function every 100ms to check proximity
setInterval(applyGlowEffect, 100);

// Event listener for keyboard input (WASD or Arrow Keys)
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
  }
});

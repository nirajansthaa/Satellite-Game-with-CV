const satellite = document.getElementById('satellite-img');
const laserContainer = document.getElementById('laser-container');  // Laser container
const asteroidsContainer = document.getElementById('asteroids-container');  // Asteroids container
const virtualCursor = document.getElementById('virtual-cursor');  // Virtual cursor (hand image)

let satellitePosition = { x: window.innerWidth / 2, y: window.innerHeight - 100 }; // Initial position of satellite

function updateSatellitePosition(cursorX, cursorY) {
    // Directly set the satellite's position based on the right hand's position
    satellitePosition.x = cursorX * window.innerWidth;
    satellitePosition.y = cursorY * window.innerHeight;

    // Prevent the satellite from going off-screen by limiting the boundaries
    if (satellitePosition.x < 0) satellitePosition.x = 0;
    if (satellitePosition.x > window.innerWidth - 100) satellitePosition.x = window.innerWidth - 100;
    if (satellitePosition.y < 0) satellitePosition.y = 0;
    if (satellitePosition.y > window.innerHeight - 100) satellitePosition.y = window.innerHeight - 100;

    // Update the satellite's position immediately
    satellite.style.left = satellitePosition.x + "px";
    satellite.style.top = satellitePosition.y + "px";
}

function updateCursorPosition(cursorX, cursorY) {
    // Ensure cursor follows the finger with a slight delay to avoid jerky movement
    virtualCursor.style.left = `${cursorX - virtualCursor.offsetWidth / 2}px`;  // Center the cursor
    virtualCursor.style.top = `${cursorY - virtualCursor.offsetHeight / 2}px`;  // Center the cursor
}


// Laser shooting logic
function shootLaser() {
    const laser = document.createElement('div');
    laser.classList.add('laser');
    laser.style.position = 'absolute';
    laser.style.bottom = '100px';  // Start from the satellite's position
    laser.style.left = satellitePosition.x + 40 + 'px';  // Start from the middle of the satellite
    laser.style.height = '10px';
    laser.style.width = '3px';
    laser.style.backgroundColor = 'red';
    laserContainer.appendChild(laser);

    // Move laser upwards
    let laserPosition = 0;
    function moveLaser() {
        laserPosition += 10; // Speed of laser
        laser.style.bottom = `${100 + laserPosition}px`;

        // Remove laser if it goes out of screen
        if (laserPosition > window.innerHeight) {
            laserContainer.removeChild(laser);
        }

        requestAnimationFrame(moveLaser);
    }

    moveLaser();
}

// Asteroids falling function with image
function createAsteroid() {
    const asteroid = document.createElement('img');  // Create an <img> tag for the asteroid
    asteroid.classList.add('asteroid');
    asteroid.style.position = 'absolute';
    asteroid.style.top = '0px';
    asteroid.style.left = `${Math.random() * window.innerWidth}px`; // Random horizontal position

    // Randomly choose an asteroid image (either asteroid1 or asteroid2)
    const randomAsteroidImage = Math.random() > 0.5 ? 'asteroid1.png' : 'asteroid2.png';
    asteroid.src = `/static/images/${randomAsteroidImage}`;  // Dynamically generate the image path

    // Set the size of the asteroid
    asteroid.style.width = '150px'; // Set the width of the asteroid
    asteroid.style.height = '150px'; // Set the height of the asteroid
    asteroidsContainer.appendChild(asteroid);

    let asteroidPosition = 0;

    function fall() {
        asteroidPosition += 5; // Speed of falling
        asteroid.style.top = asteroidPosition + 'px';

        // Check for collision with the satellite
        if (asteroidPosition >= window.innerHeight - 120 && asteroidPosition <= window.innerHeight - 70) {
            const asteroidLeft = parseInt(asteroid.style.left);
            if (satellitePosition.x < asteroidLeft + 50 && satellitePosition.x + 100 > asteroidLeft) {
                // Collision detected
                endGame();
            }
        }

        // Remove asteroid if it goes off screen
        if (asteroidPosition > window.innerHeight) {
            asteroidsContainer.removeChild(asteroid);
        } else {
            requestAnimationFrame(fall);
        }
    }

    fall();
}

// Start the game loop with more asteroids
function startGame() {
    setInterval(createAsteroid, 1000); // Create a new asteroid every 1 second (faster than before)
}

function endGame() {
    gameOver = true;
    alert("Game Over! Collision with asteroid.");
    // Optionally redirect or reset game
    window.location.href = '/satellite_destroy_game'; // Redirect after 2 seconds
}

// Start the game
startGame();

function updateHandTracking() {
    fetch("/cursor")
        .then(res => res.json())
        .then(data => {
            // Check if the required data is available
            if (!data || !data.right_hand) {
                console.error("Right hand data is missing");
                return;
            }

            const rightHandX = data.right_hand.x * window.innerWidth; // Right hand X position mapped to screen width
            const rightHandY = data.right_hand.y * window.innerHeight; // Right hand Y position mapped to screen height

            // Update cursor position based on right hand movement
            updateCursorPosition(rightHandX, rightHandY);

            // You can add additional logic here to check for left hand pinch and shoot lasers if necessary
        })
        .catch(err => {
            console.error("Error fetching cursor data:", err);
        });

    requestAnimationFrame(updateHandTracking); // Continuously update hand tracking
}

// Start the hand tracking loop
updateHandTracking();



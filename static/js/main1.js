document.addEventListener('DOMContentLoaded', function () {
    // Namespace for all game logic
    const GameLogic = {
        collectedParts: 0,
        totalParts: 7,
        collectionArea: { top: 400, left: 100 },
        playerPosition: {
            top: 0,
            left: 0
        },
        prevHandPosition: { x: 0, y: 0 },
        satellitePosition: { x: window.innerWidth / 2, y: window.innerHeight - 100 }, // Satellite position
        satellite: document.getElementById('satellite-img'),
        laserContainer: document.getElementById('laser-container'),
        asteroidsContainer: document.getElementById('asteroids-container'),
        virtualCursor: document.getElementById('virtual-cursor'),
        player: document.getElementById('player'),
        room: document.querySelector('.room'),
        satelliteParts: document.querySelectorAll('.satellite-part'),
        roomWidth: 0,
        roomHeight: 0,
        playerWidth: 50,
        playerHeight: 50,
        moveDistance: 50,  // Distance player moves per update

        // Initialize elements
        initialize: function () {
            this.roomWidth = this.room.offsetWidth;
            this.roomHeight = this.room.offsetHeight;

            this.playerPosition.top = (this.roomHeight - this.playerHeight) / 4;
            this.playerPosition.left = (this.roomWidth - this.playerWidth) / 2;

            this.player.style.top = `${this.playerPosition.top}px`;
            this.player.style.left = `${this.playerPosition.left}px`;

            // Start the hand tracking loop and game loop
            this.updateHandTracking();
            this.startGameLoop();
            this.setupFinishButton();
        },

        // Move the player with hand gestures
        movePlayerWithHand: function (x, y) {
            // Calculate the difference in X and Y positions
            const deltaX = x - this.prevHandPosition.x;
            const deltaY = y - this.prevHandPosition.y;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    this.playerPosition.left += this.moveDistance;  // Move right
                } else {
                    this.playerPosition.left -= this.moveDistance;  // Move left
                }
            } else {
                if (deltaY > 0) {
                    this.playerPosition.top += this.moveDistance;  // Move down
                } else {
                    this.playerPosition.top -= this.moveDistance;  // Move up
                }
            }

            // Ensure the player stays within room boundaries
            if (this.playerPosition.left < 0) this.playerPosition.left = 0;
            if (this.playerPosition.left > this.roomWidth - this.playerWidth) this.playerPosition.left = this.roomWidth - this.playerWidth;
            if (this.playerPosition.top < 0) this.playerPosition.top = 0;
            if (this.playerPosition.top > this.roomHeight - this.playerHeight) this.playerPosition.top = this.roomHeight - this.playerHeight;

            this.player.style.top = `${this.playerPosition.top}px`;
            this.player.style.left = `${this.playerPosition.left}px`;

            this.prevHandPosition.x = x;
            this.prevHandPosition.y = y;
        },

        // Update hand tracking and collect parts
        updateHandTracking: function () {
            fetch("/cursor")
                .then(res => res.json())
                .then(data => {
                    if (!data || !data.right_hand) {
                        console.error("Right hand data is missing");
                        return;
                    }

                    const rightHandX = data.right_hand.x * window.innerWidth;
                    const rightHandY = data.right_hand.y * window.innerHeight;

                    this.movePlayerWithHand(rightHandX, rightHandY);
                    this.satelliteParts.forEach(part => this.collectPartIfClose(part, data));
                    this.updateCursorPosition(rightHandX, rightHandY);
                })
                .catch(err => console.error("Error fetching cursor data:", err));

            requestAnimationFrame(this.updateHandTracking.bind(this));
        },

        // Update cursor position based on hand movement
        updateCursorPosition: function (cursorX, cursorY) {
            this.virtualCursor.style.left = `${cursorX - this.virtualCursor.offsetWidth / 2}px`;
            this.virtualCursor.style.top = `${cursorY - this.virtualCursor.offsetHeight / 2}px`;
        },

        // Collect part logic
        collectPartIfClose: function (part, handData) {
            const partRect = part.getBoundingClientRect();
            const playerRect = this.player.getBoundingClientRect();
            const distanceX = Math.abs(partRect.left - playerRect.left);
            const distanceY = Math.abs(partRect.top - playerRect.top);

            if (distanceX < 50 && distanceY < 50 && this.detectFistGesture(handData)) {
                this.collectPart(part);
            }
        },

        // Detect fist gesture
        detectFistGesture: function (handData) {
            const thumb = handData.landmarks[mp_hands.HandLandmark.THUMB_TIP];
            const indexFinger = handData.landmarks[mp_hands.HandLandmark.INDEX_FINGER_TIP];
            const distance = Math.sqrt(Math.pow(thumb.x - indexFinger.x, 2) + Math.pow(thumb.y - indexFinger.y, 2));
            return distance < 0.05;
        },

        // Function to collect parts
        collectPart: function (part) {
            part.classList.add('collected');
            part.style.opacity = '0.5';
            part.style.top = `${this.collectionArea.top}px`;
            part.style.left = `${this.collectionArea.left}px`;

            this.collectedParts++;
            document.getElementById('collected-count').textContent = `${this.collectedParts}/${this.totalParts}`;

            const collectSound = document.getElementById('collect-sound');
            collectSound.play();

            if (this.collectedParts === this.totalParts) {
                this.showCongratulatoryPopUp();
                this.showLearnButton();
            }
        },

        // Function to show the "Congratulations" pop-up
        showCongratulatoryPopUp: function () {
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
                window.location.href = '/game';
            });

            popUp.appendChild(congratsImage);
            popUp.appendChild(congratsText);
            popUp.appendChild(nextGameBtn);
            document.body.appendChild(popUp);
        },

        // Add Learn button to the pop-up
        showLearnButton: function () {
            const learnButton = document.createElement('button');
            learnButton.textContent = 'Learn What You Collected';
            learnButton.addEventListener('click', this.showPartsInfoModal);
            document.body.appendChild(learnButton);
        },

        // Show part information modal
        showPartsInfoModal: function () {
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
        },

        // Helper function to capitalize the first letter of a string
        capitalizeFirstLetter: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        // Start the game loop with more asteroids and other logic
        startGameLoop: function () {
            this.createAsteroids();
            this.handleLaser();
        },

        // Handle laser shooting logic
        shootLaser: function () {
            const laser = document.createElement('div');
            laser.classList.add('laser');
            laser.style.position = 'absolute';
            laser.style.bottom = '100px';  // Start from the satellite's position
            laser.style.left = this.satellitePosition.x + 40 + 'px';  // Start from the middle of the satellite
            laser.style.height = '10px';
            laser.style.width = '3px';
            laser.style.backgroundColor = 'red';
            this.laserContainer.appendChild(laser);

            let laserPosition = 0;
            function moveLaser() {
                laserPosition += 10;
                laser.style.bottom = `${100 + laserPosition}px`;

                if (laserPosition > window.innerHeight) {
                    this.laserContainer.removeChild(laser);
                }

                requestAnimationFrame(moveLaser);
            }

            moveLaser();
        },

        // Asteroids falling function
        createAsteroids: function () {
            const asteroid = document.createElement('img');
            asteroid.classList.add('asteroid');
            asteroid.style.position = 'absolute';
            asteroid.style.top = '0px';
            asteroid.style.left = `${Math.random() * window.innerWidth}px`;

            const randomAsteroidImage = Math.random() > 0.5 ? 'asteroid1.png' : 'asteroid2.png';
            asteroid.src = `/static/images/${randomAsteroidImage}`;

            asteroid.style.width = '150px';
            asteroid.style.height = '150px';
            this.asteroidsContainer.appendChild(asteroid);

            let asteroidPosition = 0;
            function fall() {
                asteroidPosition += 5;
                asteroid.style.top = asteroidPosition + 'px';

                if (asteroidPosition >= window.innerHeight - 120 && asteroidPosition <= window.innerHeight - 70) {
                    const asteroidLeft = parseInt(asteroid.style.left);
                    if (this.satellitePosition.x < asteroidLeft + 50 && this.satellitePosition.x + 100 > asteroidLeft) {
                        this.endGame();
                    }
                }

                if (asteroidPosition > window.innerHeight) {
                    this.asteroidsContainer.removeChild(asteroid);
                } else {
                    requestAnimationFrame(fall);
                }
            }

            fall();
        },

        // End the game logic
        endGame: function () {
            alert("Game Over! Collision with asteroid.");
            window.location.href = '/satellite_destroy_game';
        },

        // Setup finish button click for video launch
        setupFinishButton: function () {
            const finishButton = document.getElementById("finish-button");
            const webcamContainer = document.getElementById("webcam-container");
            const launchVideoContainer = document.getElementById("launch-video-container");
            const launchVideo = document.getElementById("launch-video");

            finishButton.addEventListener("click", function () {
                webcamContainer.style.display = "none";
                launchVideoContainer.style.display = "block";
                launchVideo.play();
            });

            launchVideo.addEventListener("ended", function () {
                launchVideoContainer.style.display = "none";
                window.location.href = "/satellite_destroy_game";
            });
        },
    };

    // Initialize the game logic
    GameLogic.initialize();
});

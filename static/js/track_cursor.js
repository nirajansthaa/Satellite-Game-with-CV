const cursor = document.getElementById("virtual-cursor");
const draggables = document.querySelectorAll(".draggable");

let grabbedItem = null;

// Function to check if cursor is over an element
function isCursorOverElement(cursorX, cursorY, element) {
    const rect = element.getBoundingClientRect();
    return (
        cursorX >= rect.left && cursorX <= rect.right &&
        cursorY >= rect.top && cursorY <= rect.bottom
    );
}

function updateCursor() {
    fetch("/cursor") // Fetch hand-tracked cursor data (x, y, pinch)
        .then(res => res.json())
        .then(data => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // Map the normalized cursor data to screen coordinates
            const x = data.x * screenWidth;
            const y = data.y * screenHeight;

            // Move the virtual cursor (hand image) to the hand's position
            cursor.style.left = `${x - cursor.offsetWidth / 2}px`; // Center the cursor image
            cursor.style.top = `${y - cursor.offsetHeight / 2}px`; // Center the cursor image

            const isPinching = data.pinch;

            // If pinch is detected and no item is grabbed
            if (isPinching && !grabbedItem) {
                // Try to grab an item (dragging logic)
                draggables.forEach(item => {
                    if (isCursorOverElement(x, y, item)) {
                        grabbedItem = item;

                        // Ensure it’s absolutely positioned and on top during dragging
                        grabbedItem.style.position = 'absolute';
                        grabbedItem.style.zIndex = 1000; // Make sure it’s on top
                        grabbedItem.style.pointerEvents = 'none'; // Prevent interference during dragging
                    }
                });

                // Hide the virtual cursor when dragging
                cursor.classList.add('hidden');
            }

            if (grabbedItem) {
                // If pinching, move the part
                if (isPinching) {
                    // Move the dragged part directly under the cursor without any offset
                    grabbedItem.style.left = `${x - grabbedItem.offsetWidth / 2}px`;
                    grabbedItem.style.top = `${y - grabbedItem.offsetHeight / 2}px`;
                } else {
                    // Handle drop
                    grabbedItem.style.pointerEvents = 'auto'; // Re-enable interaction
                    grabbedItem.style.position = 'absolute';
                    grabbedItem.style.left = `${x - grabbedItem.offsetWidth / 2}px`;
                    grabbedItem.style.top = `${y - grabbedItem.offsetHeight / 2}px`;

                    // Reset the grabbed item
                    grabbedItem.classList.remove('grabbing'); // Remove grabbing class
                    grabbedItem = null;

                    // Show the virtual cursor again
                    cursor.classList.remove('hidden');
                }
            }

            cursor.style.backgroundColor = isPinching ? 'green' : 'red'; // Pinch detection feedback
        });

    requestAnimationFrame(updateCursor); // Continue fetching cursor data and updating cursor position
}

updateCursor();

function scatterParts() {
    const gameArea = document.getElementById('game-area');
    const gameAreaWidth = gameArea.offsetWidth;
    const gameAreaHeight = gameArea.offsetHeight;

    // Scatter each draggable part randomly
    draggables.forEach(part => {
        // Random left and top positions within the game area
        const randomLeft = Math.random() * (gameAreaWidth - part.offsetWidth); // Ensure it stays within the game area
        const randomTop = Math.random() * (gameAreaHeight - part.offsetHeight);

        // Set the random position for each part
        part.style.left = `${randomLeft}px`;
        part.style.top = `${randomTop}px`;
    });
}

// Call scatterParts when the page loads
window.onload = scatterParts;
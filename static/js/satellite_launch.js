// Get the Finish button and video container
const finishButton = document.getElementById("finish-button");
const webcamContainer = document.getElementById("webcam-container");  // Correct ID for webcam
const launchVideoContainer = document.getElementById("launch-video-container");  // Correct ID for video
const launchVideo = document.getElementById("launch-video");

// Handle the Finish button click
finishButton.addEventListener("click", function() {
    // Hide the webcam feed
    webcamContainer.style.display = "none";  // Hide webcam feed

    // Show the video container (satellite launch video)
    launchVideoContainer.style.display = "block"; // Show the video container
    launchVideo.play(); // Play the satellite launch video
});

// After the video ends, redirect to the new game page (satellite destruction game)
launchVideo.addEventListener("ended", function() {
    // Hide the video container when video ends
    launchVideoContainer.style.display = "none";

    // Redirect to the new page with the satellite destruction game
    window.location.href = "/satellite_destroy_game"; // New route in Flask
});

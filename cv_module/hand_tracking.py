import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ✅ Enhanced cursor state with landmarks
cursor_position = {
    "x": 0.5,  # normalized center
    "y": 0.5,
    "pinch": False,
    "landmarks": None,  # Add this for finger positions
    "fist": False       # Add this for fist detection
}

def get_cursor_position():
    return cursor_position

def detect_fist(landmarks):
    """Detect if hand is making a fist gesture"""
    # Get fingertip and pip (middle joint) positions for each finger
    fingers = [
        # Thumb (compare tip with previous joint)
        landmarks[mp_hands.HandLandmark.THUMB_TIP].y < landmarks[mp_hands.HandLandmark.THUMB_IP].y,
        # Index finger
        landmarks[mp_hands.HandLandmark.INDEX_FINGER_TIP].y > landmarks[mp_hands.HandLandmark.INDEX_FINGER_PIP].y,
        # Middle finger  
        landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_TIP].y > landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_PIP].y,
        # Ring finger
        landmarks[mp_hands.HandLandmark.RING_FINGER_TIP].y > landmarks[mp_hands.HandLandmark.RING_FINGER_PIP].y,
        # Pinky
        landmarks[mp_hands.HandLandmark.PINKY_TIP].y > landmarks[mp_hands.HandLandmark.PINKY_PIP].y
    ]
    
    # Fist detected if 4 or more fingers are down
    return sum(fingers) <= 1

def generate_video_feed():
    cap = cv2.VideoCapture(2)  # or 2 if that's your webcam

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        # Reset gesture flags
        cursor_position["pinch"] = False
        cursor_position["fist"] = False
        cursor_position["landmarks"] = None

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # ✅ Store landmarks for frontend use
                landmarks_list = []
                for landmark in hand_landmarks.landmark:
                    landmarks_list.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z
                    })
                cursor_position["landmarks"] = landmarks_list

                # ✅ Get normalized positions (0–1)
                index_finger = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                thumb = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]

                cursor_position["x"] = index_finger.x
                cursor_position["y"] = index_finger.y

                # Calculate pixel distance for pinch
                h, w, _ = frame.shape
                x1, y1 = int(index_finger.x * w), int(index_finger.y * h)
                x2, y2 = int(thumb.x * w), int(thumb.y * h)

                if ((x2 - x1)**2 + (y2 - y1)**2)**0.5 < 40:
                    cursor_position["pinch"] = True

                # ✅ Detect fist gesture
                cursor_position["fist"] = detect_fist(hand_landmarks.landmark)

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


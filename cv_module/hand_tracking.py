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

# ✅ Initialize cursor state
cursor_position = {
    "x": 0.5,  # normalized center
    "y": 0.5,
    "pinch": False
}

def get_cursor_position():
    return cursor_position

def generate_video_feed():
    cap = cv2.VideoCapture(2)  # or 2 if that's your webcam

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        # Don’t reset x/y — only pinch
        cursor_position["pinch"] = False

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

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

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

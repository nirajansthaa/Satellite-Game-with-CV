import cv2
import mediapipe as mp
from flask import Flask, render_template, Response, jsonify

app = Flask(__name__)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,  # Track up to 2 hands
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initial cursor and laser state
cursor_position = {
    "right_hand": {"x": 0.5, "y": 0.5, "pinch": False},  # Right hand controls satellite
    "left_hand": {"x": 0.5, "y": 0.5, "pinch": False},   # Left hand controls laser
}

def get_cursor_position():
    return cursor_position

def generate_video_feed():
    cap = cv2.VideoCapture(2)

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        # Reset pinch states
        cursor_position["right_hand"]["pinch"] = False
        cursor_position["left_hand"]["pinch"] = False

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                hand_type = results.multi_hand_landmarks.index(hand_landmarks)  # 0 for left hand, 1 for right hand
                hand_label = "right_hand" if hand_type == 1 else "left_hand"  # Determine if it's left or right hand
                
                # Get positions for index finger and thumb
                index_finger = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                thumb = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]

                cursor_position[hand_label]["x"] = index_finger.x
                cursor_position[hand_label]["y"] = index_finger.y

                # Check for pinch gesture
                h, w, _ = frame.shape
                x1, y1 = int(index_finger.x * w), int(index_finger.y * h)
                x2, y2 = int(thumb.x * w), int(thumb.y * h)

                if ((x2 - x1)**2 + (y2 - y1)**2)**0.5 < 40:
                    cursor_position[hand_label]["pinch"] = True

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/cursor')
def cursor():
    data = get_cursor_position()  # Fetch the hand tracking data
    print(f"Cursor Data: {data}")  # Log the data to verify its structure
    return jsonify(data)

@app.route('/video_feed')
def video_feed():
    return Response(generate_video_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)

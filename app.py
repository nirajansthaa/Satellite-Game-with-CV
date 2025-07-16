from flask import Flask, render_template, Response, jsonify
from cv_module.hand_tracking import generate_video_feed, get_cursor_position

app = Flask(__name__)

@app.route('/')
def start_page():
    return render_template('starting.html')

@app.route('/room_nav')
def room_nav():
    return render_template('room_nav.html')

@app.route('/game')
def index():
    return render_template('index.html')

@app.route('/satellite_destroy_game')
def satellite_destroy_game():
    return render_template('satellite_destroy_game.html') 

@app.route('/video_feed')
def video_feed():
    return Response(generate_video_feed(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/cursor')
def cursor():
    return jsonify(get_cursor_position())

if __name__ == '__main__':
    app.run(debug=True)



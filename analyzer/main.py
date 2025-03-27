import os
import cv2
import shutil
import numpy as np
from flask import (
    Flask,
    request,
    render_template,
    send_from_directory,
    Response,
    jsonify,
)
from werkzeug.utils import secure_filename
from video_processor import VideoProcessor

app = Flask(__name__)

# Configure upload and output directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(CURRENT_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(CURRENT_DIR, "output")
ALLOWED_EXTENSIONS = {"mp4", "avi", "mov"}

# Configure maximum file size (100MB)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER

# Define keypoint indices (based on MMPose human keypoint format)
LEFT_WRIST = 9
RIGHT_WRIST = 10
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW = 7
RIGHT_ELBOW = 8
LEFT_HIP = 11
RIGHT_HIP = 12
LEFT_KNEE = 13
RIGHT_KNEE = 14
LEFT_ANKLE = 15
RIGHT_ANKLE = 16


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def send_file_partial(path):
    """Support for range requests - important for video streaming."""
    range_header = request.headers.get("Range", None)
    if not range_header:
        return send_from_directory(app.config["OUTPUT_FOLDER"], os.path.basename(path))

    size = os.path.getsize(path)
    byte1, byte2 = 0, None

    m = range_header.replace("bytes=", "").split("-")
    byte1 = int(m[0])
    if len(m) > 1 and m[1].isdigit():
        byte2 = int(m[1])

    if byte2 is None:
        byte2 = size - 1

    length = byte2 - byte1 + 1

    with open(path, "rb") as f:
        f.seek(byte1)
        data = f.read(length)

    rv = Response(
        data,
        206,
        mimetype="video/mp4",
        content_type="video/mp4",
        direct_passthrough=True,
    )
    rv.headers.add("Content-Range", f"bytes {byte1}-{byte2}/{size}")
    rv.headers.add("Accept-Ranges", "bytes")
    return rv


@app.route("/")
def index():
    """Render the main page with the upload form."""
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload_videos():
    """Handle video upload and processing."""
    if "video1" not in request.files or "video2" not in request.files:
        return "No video files uploaded", 400

    video1 = request.files["video1"]
    video2 = request.files["video2"]

    if video1.filename == "" or video2.filename == "":
        return "No selected files", 400

    if not (allowed_file(video1.filename) and allowed_file(video2.filename)):
        return "Invalid file type", 400

    # Create directories if they don't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # Save uploaded files
    video1_filename = secure_filename(video1.filename)
    video2_filename = secure_filename(video2.filename)

    video1_path = os.path.join(UPLOAD_FOLDER, video1_filename)
    video2_path = os.path.join(UPLOAD_FOLDER, video2_filename)

    video1.save(video1_path)
    video2.save(video2_path)

    # Initialize video processor
    processor = VideoProcessor(device="cuda:0")

    # Process videos
    video1_name = os.path.splitext(video1_filename)[0]
    video2_name = os.path.splitext(video2_filename)[0]

    output_path1 = os.path.join(OUTPUT_FOLDER, f"{video1_name}_pose.mp4")
    temp_dir1 = os.path.join(OUTPUT_FOLDER, f"temp_{video1_name}")
    success1 = processor.process_video(video1_path, output_path1, temp_dir1)

    output_path2 = os.path.join(OUTPUT_FOLDER, f"{video2_name}_pose.mp4")
    temp_dir2 = os.path.join(OUTPUT_FOLDER, f"temp_{video2_name}")
    success2 = processor.process_video(video2_path, output_path2, temp_dir2)

    # Clean up
    shutil.rmtree(temp_dir1, ignore_errors=True)
    shutil.rmtree(temp_dir2, ignore_errors=True)
    os.remove(video1_path)
    os.remove(video2_path)

    if success1 and success2:
        return jsonify(
            {
                "status": "success",
                "message": "Videos processed successfully",
                "videos": [
                    {"name": f"{video1_name}_pose.mp4", "label": "Video 1"},
                    {"name": f"{video2_name}_pose.mp4", "label": "Video 2"},
                ],
            }
        )
    else:
        return jsonify({"status": "error", "message": "Error processing videos"}), 500


@app.route("/video/<filename>")
def serve_video(filename):
    """Serve video files with range request support."""
    path = os.path.join(app.config["OUTPUT_FOLDER"], filename)
    return send_file_partial(path)


@app.route("/moments/<video_name>")
def get_video_moments(video_name):
    """Get key moments for a video."""
    moments_file = os.path.join(
        OUTPUT_FOLDER, os.path.splitext(video_name)[0] + "_moments.json"
    )
    if os.path.exists(moments_file):
        with open(moments_file, "r") as f:
            import json

            moments = json.load(f)
        return jsonify(moments)
    return jsonify([])


@app.route("/balls/<video_name>")
def get_video_balls(video_name):
    """Get tennis ball detections for a video."""
    balls_file = os.path.join(
        OUTPUT_FOLDER, os.path.splitext(video_name)[0] + "_balls.json"
    )
    if os.path.exists(balls_file):
        with open(balls_file, "r") as f:
            import json

            balls = json.load(f)
        return jsonify(balls)
    return jsonify([])


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

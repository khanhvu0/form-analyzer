import os
import cv2
import mmcv
import shutil
from mmpose.apis import MMPoseInferencer
from flask import Flask, request, render_template, send_from_directory, url_for, Response
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure upload and output directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(CURRENT_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(CURRENT_DIR, 'output')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}

# Configure maximum file size (100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_video(video_path, output_path, inferencer, temp_dir):
    """Process a video and save results with pose estimation."""
    # Create temporary directory for output
    os.makedirs(temp_dir, exist_ok=True)
    
    print("Processing frames with MMPose...")
    # Process video using MMPoseInferencer with visualization output
    result_generator = inferencer(
        video_path,
        show=False,
        vis_out_dir=temp_dir,
        radius=4,  # Adjust keypoint circle size
        thickness=2  # Adjust skeleton line thickness
    )
    
    # Consume the generator to process all frames
    for _ in result_generator:
        pass

    # Look for the output video in temp_dir
    temp_files = os.listdir(temp_dir)
    vis_files = [f for f in temp_files if f.endswith('.mp4') or f.endswith('.avi')]
    
    if vis_files:
        # Take the first visualization file found
        temp_video_path = os.path.join(temp_dir, vis_files[0])
        
        # Re-encode the video with a web-compatible format using ffmpeg
        temp_output = os.path.join(temp_dir, 'web_compatible.mp4')
        ffmpeg_cmd = f'ffmpeg -i "{temp_video_path}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -y "{temp_output}"'
        os.system(ffmpeg_cmd)
        
        # Move the re-encoded video to final destination
        if os.path.exists(temp_output):
            shutil.move(temp_output, output_path)
            print(f"Saved processed video to: {output_path}")
            return True
        else:
            print(f"Error: Failed to re-encode video")
            return False
    else:
        print(f"Error: Could not find processed video in {temp_dir}")
        print(f"Files in temp_dir: {temp_files}")
        return False

@app.route('/')
def index():
    # Get list of processed videos
    processed_videos = []
    if os.path.exists(OUTPUT_FOLDER):
        processed_videos = [f for f in os.listdir(OUTPUT_FOLDER) if f.endswith('_pose.mp4')]
    return render_template('index.html', processed_videos=processed_videos)

@app.route('/upload', methods=['POST'])
def upload_videos():
    if 'video1' not in request.files or 'video2' not in request.files:
        return 'No video files uploaded', 400
    
    video1 = request.files['video1']
    video2 = request.files['video2']
    
    if video1.filename == '' or video2.filename == '':
        return 'No selected files', 400
    
    if not (allowed_file(video1.filename) and allowed_file(video2.filename)):
        return 'Invalid file type', 400

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

    # Initialize MMPoseInferencer
    inferencer = MMPoseInferencer('human', device='cuda:0')

    # Process videos
    video1_name = os.path.splitext(video1_filename)[0]
    video2_name = os.path.splitext(video2_filename)[0]
    
    output_path1 = os.path.join(OUTPUT_FOLDER, f"{video1_name}_pose.mp4")
    temp_dir1 = os.path.join(OUTPUT_FOLDER, f"temp_{video1_name}")
    success1 = process_video(video1_path, output_path1, inferencer, temp_dir1)

    output_path2 = os.path.join(OUTPUT_FOLDER, f"{video2_name}_pose.mp4")
    temp_dir2 = os.path.join(OUTPUT_FOLDER, f"temp_{video2_name}")
    success2 = process_video(video2_path, output_path2, inferencer, temp_dir2)

    # Clean up
    shutil.rmtree(temp_dir1, ignore_errors=True)
    shutil.rmtree(temp_dir2, ignore_errors=True)
    os.remove(video1_path)
    os.remove(video2_path)

    if success1 and success2:
        return 'Videos processed successfully', 200
    else:
        return 'Error processing videos', 500

def send_file_partial(path):
    """Support for range requests - important for video streaming"""
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_from_directory(app.config['OUTPUT_FOLDER'], os.path.basename(path))

    size = os.path.getsize(path)
    byte1, byte2 = 0, None

    m = range_header.replace('bytes=', '').split('-')
    byte1 = int(m[0])
    if len(m) > 1 and m[1].isdigit():
        byte2 = int(m[1])

    if byte2 is None:
        byte2 = size - 1
    
    length = byte2 - byte1 + 1

    with open(path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)

    rv = Response(data, 206, mimetype='video/mp4',
                 content_type='video/mp4',
                 direct_passthrough=True)
    rv.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{size}')
    rv.headers.add('Accept-Ranges', 'bytes')
    return rv

@app.route('/video/<filename>')
def serve_video(filename):
    path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    return send_file_partial(path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
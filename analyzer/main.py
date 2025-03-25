import os
import cv2
import mmcv
import shutil
import numpy as np
from mmpose.apis import MMPoseInferencer
from flask import Flask, request, render_template, send_from_directory, url_for, Response, jsonify
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

def detect_key_moments(keypoints_results):
    """Detect key moments of a tennis serve based on pose keypoints."""
    key_moments = []
    serve_phases = {
        'ball_release': False,
        'trophy': False,
        'racket_low': False,
        'impact': False,
        'follow_through': False
    }
    
    # Define keypoint indices (based on MMPose human keypoint format)
    LEFT_WRIST = 9
    RIGHT_WRIST = 10
    LEFT_SHOULDER = 5
    RIGHT_SHOULDER = 6
    LEFT_ELBOW = 7
    RIGHT_ELBOW = 8
    LEFT_HIP = 11
    RIGHT_HIP = 12
    
    # Helper function to calculate vertical position relative to shoulder
    def get_relative_height(point, shoulder):
        return shoulder[1] - point[1]  # Positive means above shoulder
    
    # Helper function to calculate horizontal position relative to shoulder
    def get_relative_forward_pos(point, shoulder):
        return point[0] - shoulder[0]  # Positive means in front
        
    for frame_idx, result in enumerate(keypoints_results):
        # Skip if no predictions
        if not result or 'predictions' not in result or not result['predictions']:
            continue
            
        # Get predictions for the first person
        predictions = result['predictions'][0]
        if not predictions:
            continue
            
        # Get keypoints of the first person detected
        person = predictions[0]
        if 'keypoints' not in person:
            continue
            
        # Convert keypoints to numpy array if it's not already
        keypoints = np.array(person['keypoints']) if isinstance(person['keypoints'], list) else person['keypoints']
        scores = person.get('keypoint_scores', None)
        
        # Skip if confidence is too low
        if scores is not None and np.mean(scores) < 0.3:  # Reduced confidence threshold
            continue
        
        # Get relevant keypoint coordinates
        left_wrist = keypoints[LEFT_WRIST][:2]
        right_wrist = keypoints[RIGHT_WRIST][:2]
        left_shoulder = keypoints[LEFT_SHOULDER][:2]
        right_shoulder = keypoints[RIGHT_SHOULDER][:2]
        left_elbow = keypoints[LEFT_ELBOW][:2]
        right_elbow = keypoints[RIGHT_ELBOW][:2]
        left_hip = keypoints[LEFT_HIP][:2]
        right_hip = keypoints[RIGHT_HIP][:2]
        
        # Calculate body measurements for relative scaling
        shoulder_width = np.linalg.norm(right_shoulder - left_shoulder)
        torso_height = np.linalg.norm(np.mean([right_shoulder, left_shoulder], axis=0) - 
                                    np.mean([right_hip, left_hip], axis=0))
        
        # Calculate relative positions
        left_wrist_height = get_relative_height(left_wrist, left_shoulder) / shoulder_width
        right_wrist_height = get_relative_height(right_wrist, right_shoulder) / shoulder_width
        right_wrist_forward = get_relative_forward_pos(right_wrist, right_shoulder) / shoulder_width
        hands_distance = np.linalg.norm(left_wrist - right_wrist) / shoulder_width
        
        timestamp = frame_idx / 30  # Assuming 30 fps
        
        # Ball Release: Left hand is raised and hands are separated
        if not serve_phases['ball_release'] and left_wrist_height > 0.3 and hands_distance > 0.8:
            serve_phases['ball_release'] = True
            key_moments.append({
                'frame': frame_idx,
                'timestamp': timestamp,
                'label': 'Ball Release',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
        
        # Trophy Position: Both hands are raised and close together, only after ball release
        elif serve_phases['ball_release'] and not serve_phases['trophy'] and \
             left_wrist_height > 0.5 and right_wrist_height > 0.5 and hands_distance < 0.5:
            serve_phases['trophy'] = True
            key_moments.append({
                'frame': frame_idx,
                'timestamp': timestamp,
                'label': 'Trophy Position',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
        
        # Racket Low Point: Right hand drops below shoulder during preparation, only after trophy
        elif serve_phases['trophy'] and not serve_phases['racket_low'] and \
             right_wrist_height < -0.3 and right_wrist_forward < -0.2:
            serve_phases['racket_low'] = True
            key_moments.append({
                'frame': frame_idx,
                'timestamp': timestamp,
                'label': 'Racket Low Point',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
        
        # Ball Impact: Right hand is high and moving upward, only after racket low
        elif serve_phases['racket_low'] and not serve_phases['impact'] and \
             right_wrist_height > 0.8:
            serve_phases['impact'] = True
            key_moments.append({
                'frame': frame_idx,
                'timestamp': timestamp,
                'label': 'Ball Impact',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
        
        # Follow Through: Right hand has moved forward and down, only after impact
        elif serve_phases['impact'] and not serve_phases['follow_through'] and \
             right_wrist_height < -0.2 and right_wrist_forward > 0.4:
            serve_phases['follow_through'] = True
            key_moments.append({
                'frame': frame_idx,
                'timestamp': timestamp,
                'label': 'Follow Through',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
    
    return key_moments

def process_video(video_path, output_path, inferencer, temp_dir):
    """Process a video and save results with pose estimation."""
    os.makedirs(temp_dir, exist_ok=True)
    
    print("Processing frames with MMPose...")
    result_generator = inferencer(
        video_path,
        show=False,
        vis_out_dir=temp_dir,
        radius=4,
        thickness=2
    )
    
    # Collect all results for key moment detection
    all_results = []
    for result in result_generator:
        all_results.append(result)
    
    # Detect key moments
    key_moments = detect_key_moments(all_results)
    print(f"Detected {len(key_moments)} key moments")
    
    # Look for the output video in temp_dir
    temp_files = os.listdir(temp_dir)
    vis_files = [f for f in temp_files if f.endswith('.mp4') or f.endswith('.avi')]
    
    if vis_files:
        temp_video_path = os.path.join(temp_dir, vis_files[0])
        
        # Add timestamp labels to the video
        cap = cv2.VideoCapture(temp_video_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create temporary file for labeled video
        temp_labeled = os.path.join(temp_dir, 'labeled.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(temp_labeled, fourcc, fps, (width, height))
        
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Add timestamp labels for key moments
            for moment in key_moments:
                if frame_idx == moment['frame']:
                    label = f"{moment['label']} (Conf: {moment['confidence']:.2f})"
                    cv2.putText(frame, label, 
                              (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                              1, (0, 255, 0), 2)
                    
            out.write(frame)
            frame_idx += 1
            
        cap.release()
        out.release()
        
        # Re-encode with web-compatible format
        temp_output = os.path.join(temp_dir, 'web_compatible.mp4')
        ffmpeg_cmd = f'ffmpeg -i "{temp_labeled}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -y "{temp_output}"'
        os.system(ffmpeg_cmd)
        
        # Move the re-encoded video to final destination
        if os.path.exists(temp_output):
            shutil.move(temp_output, output_path)
            # Save key moments data
            moments_file = os.path.splitext(output_path)[0] + '_moments.json'
            with open(moments_file, 'w') as f:
                import json
                json.dump(key_moments, f)
            print(f"Saved processed video to: {output_path}")
            return True
        else:
            print(f"Error: Failed to re-encode video")
            return False
    else:
        print(f"Error: Could not find processed video in {temp_dir}")
        print(f"Files in temp_dir: {temp_files}")
        return False

@app.route('/moments/<video_name>')
def get_video_moments(video_name):
    """Get key moments for a video"""
    moments_file = os.path.join(OUTPUT_FOLDER, os.path.splitext(video_name)[0] + '_moments.json')
    if os.path.exists(moments_file):
        with open(moments_file, 'r') as f:
            import json
            moments = json.load(f)
        return jsonify(moments)
    return jsonify([])

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
    
    # if not (allowed_file(video1.filename) and allowed_file(video2.filename)):
    #     return 'Invalid file type', 400

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
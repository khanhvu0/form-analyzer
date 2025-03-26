import os
import cv2
import mmcv
import shutil
import numpy as np
from mmpose.apis import MMPoseInferencer
from flask import Flask, request, render_template, send_from_directory, url_for, Response, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
# Import ultralytics for YOLO
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload and output directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(CURRENT_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(CURRENT_DIR, 'output')
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov'}

# Configure maximum file size (100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

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

def detect_key_moments(keypoints_results, ball_detections=None, fps=30):
    """Detect key moments of a tennis serve based on pose keypoints and ball detection."""
    key_moments = []
    serve_phases = {
        'start': False,
        'ball_release': False,
        'trophy': False,
        'racket_low': False,
        'impact': False,
        'follow_through': False
    }
    
    # Helper function to calculate vertical position relative to shoulder
    def get_relative_height(point, shoulder):
        return shoulder[1] - point[1]  # Positive means above shoulder
    
    # Helper function to calculate horizontal position relative to shoulder
    def get_relative_forward_pos(point, shoulder):
        return point[0] - shoulder[0]  # Positive means in front
    
    # First, analyze all frames to find max heights for comparison
    all_left_wrist_y = []
    all_right_wrist_y = []
    all_right_ankle_y = []
    valid_frames = []  # Track valid frame indices
    
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
        right_ankle = keypoints[RIGHT_ANKLE][:2]
        
        # Record y-positions (lower y value means higher position in the image)
        all_left_wrist_y.append(left_wrist[1])
        all_right_wrist_y.append(right_wrist[1])
        all_right_ankle_y.append(right_ankle[1])
        valid_frames.append(frame_idx)
    
    # Check if we have enough valid frames
    if len(valid_frames) < 10:
        print("WARNING: Too few valid frames detected. Key moment detection may fail.")
        return key_moments
    
    # Convert to numpy arrays for easier processing
    all_left_wrist_y = np.array(all_left_wrist_y)
    all_right_wrist_y = np.array(all_right_wrist_y)
    all_right_ankle_y = np.array(all_right_ankle_y)
    valid_frames = np.array(valid_frames)
    
    # Find the minimum y values (highest positions)
    min_left_wrist_y = np.min(all_left_wrist_y) if len(all_left_wrist_y) > 0 else 0
    min_right_wrist_y = np.min(all_right_wrist_y) if len(all_right_wrist_y) > 0 else 0
    min_right_ankle_y = np.min(all_right_ankle_y) if len(all_right_ankle_y) > 0 else 0
    
    # Find the corresponding frames for these peaks
    peak_left_wrist_frame = valid_frames[np.argmin(all_left_wrist_y)] if len(all_left_wrist_y) > 0 else 0
    peak_right_wrist_frame = valid_frames[np.argmin(all_right_wrist_y)] if len(all_right_wrist_y) > 0 else 0
    peak_right_ankle_frame = valid_frames[np.argmin(all_right_ankle_y)] if len(all_right_ankle_y) > 0 else 0
    
    print(f"Peak analysis - Left wrist peak at frame {peak_left_wrist_frame}, Right wrist peak at frame {peak_right_wrist_frame}, Right ankle peak at frame {peak_right_ankle_frame}")
    
    # Now process frames for key moments
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
        left_ankle = keypoints[LEFT_ANKLE][:2]
        right_ankle = keypoints[RIGHT_ANKLE][:2]
        
        # Calculate body measurements for relative scaling
        shoulder_width = np.linalg.norm(right_shoulder - left_shoulder)
        
        # Calculate relative positions
        left_wrist_height = get_relative_height(left_wrist, left_shoulder) / shoulder_width
        right_wrist_height = get_relative_height(right_wrist, right_shoulder) / shoulder_width
        right_wrist_forward = get_relative_forward_pos(right_wrist, right_shoulder) / shoulder_width
        
        timestamp = frame_idx / fps  # Using the actual fps instead of hardcoded 30
        
        # Start position: Hard-coded to frame 0
        if frame_idx == 0 and not serve_phases['start']:
            serve_phases['start'] = True
            key_moments.append({
                'frame': int(frame_idx),
                'timestamp': float(timestamp),
                'label': 'Start Position',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
        
        # Ball Release: When the ball leaves the left hand (needs ball detection data)
        elif serve_phases['start'] and not serve_phases['ball_release'] and ball_detections:
            # Find balls near the left wrist
            balls_near_left_wrist = []
            for ball in ball_detections:
                if ball['frame'] == frame_idx:
                    ball_x = (ball['bbox'][0] + ball['bbox'][2]) / 2
                    ball_y = (ball['bbox'][1] + ball['bbox'][3]) / 2
                    dist_to_left_wrist = np.sqrt((ball_x - left_wrist[0])**2 + (ball_y - left_wrist[1])**2)
                    # If ball is close to left wrist - use a larger threshold
                    if dist_to_left_wrist < shoulder_width * 1.0:  # Increased from 0.5 to 1.0
                        balls_near_left_wrist.append(ball)
            
            # If we previously had balls near the left wrist and now we don't
            if len(balls_near_left_wrist) == 0 and left_wrist_height > 0.2:  # Lowered from 0.3 to 0.2
                # Check if previous frames had balls near left wrist (check more frames back)
                prev_balls_near_left_wrist = []
                for ball in ball_detections:
                    # Check up to 5 frames back
                    if frame_idx - 5 <= ball['frame'] < frame_idx:
                        ball_x = (ball['bbox'][0] + ball['bbox'][2]) / 2
                        ball_y = (ball['bbox'][1] + ball['bbox'][3]) / 2
                        dist_to_left_wrist_prev = np.sqrt((ball_x - left_wrist[0])**2 + (ball_y - left_wrist[1])**2)
                        if dist_to_left_wrist_prev < shoulder_width * 1.0:  # Increased from 0.5 to 1.0
                            prev_balls_near_left_wrist.append(ball)
                
                if len(prev_balls_near_left_wrist) > 0:
                    serve_phases['ball_release'] = True
                    key_moments.append({
                        'frame': int(frame_idx),
                        'timestamp': float(timestamp),
                        'label': 'Ball Release',
                        'confidence': float(np.mean(scores)) if scores is not None else 1.0
                    })
                    print(f"Detected Ball Release at frame {frame_idx}, timestamp {timestamp:.2f}")
            
            # Fallback detection if ball tracking fails but left hand is high
            if not serve_phases['ball_release'] and frame_idx > 20 and left_wrist_height > 0.7:
                # If hand is clearly raised, assume ball release happened
                serve_phases['ball_release'] = True
                key_moments.append({
                    'frame': int(frame_idx),
                    'timestamp': float(timestamp),
                    'label': 'Ball Release (estimated)',
                    'confidence': 0.7
                })
                print(f"Estimated Ball Release at frame {frame_idx}, timestamp {timestamp:.2f}")
        
        # Trophy Position: Left hand at its highest point
        elif serve_phases['start'] and not serve_phases['trophy'] and \
             abs(left_wrist[1] - min_left_wrist_y) < 10:  # Increased from 5 to 10 pixels tolerance
            serve_phases['trophy'] = True
            key_moments.append({
                'frame': int(frame_idx),
                'timestamp': float(timestamp),
                'label': 'Trophy Position',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
            print(f"Detected Trophy Position at frame {frame_idx}, timestamp {timestamp:.2f}")
            
            # If we detect trophy position but missed ball release, add it retroactively
            if not serve_phases['ball_release']:
                serve_phases['ball_release'] = True
                # Look for a suitable frame before trophy position
                retroactive_frame = max(0, frame_idx - 10)  # 10 frames before trophy
                retroactive_timestamp = retroactive_frame / fps
                key_moments.append({
                    'frame': int(retroactive_frame),
                    'timestamp': float(retroactive_timestamp),
                    'label': 'Ball Release (inferred)',
                    'confidence': 0.6
                })
                print(f"Inferred Ball Release at frame {retroactive_frame}, timestamp {retroactive_timestamp:.2f}")
        
        # Ball Impact: Right hand at its highest point
        elif serve_phases['start'] and not serve_phases['impact'] and \
             abs(right_wrist[1] - min_right_wrist_y) < 10:  # Increased from 5 to 10 pixels tolerance
            serve_phases['impact'] = True
            key_moments.append({
                'frame': int(frame_idx),
                'timestamp': float(timestamp),
                'label': 'Ball Impact',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
            print(f"Detected Ball Impact at frame {frame_idx}, timestamp {timestamp:.2f}")
            
            # If we detect impact but missed trophy, add it retroactively
            if not serve_phases['trophy']:
                serve_phases['trophy'] = True
                # Look for a suitable frame before impact
                retroactive_frame = max(0, frame_idx - 15)  # 15 frames before impact
                retroactive_timestamp = retroactive_frame / fps
                key_moments.append({
                    'frame': int(retroactive_frame),
                    'timestamp': float(retroactive_timestamp),
                    'label': 'Trophy Position (inferred)',
                    'confidence': 0.6
                })
                print(f"Inferred Trophy Position at frame {retroactive_frame}, timestamp {retroactive_timestamp:.2f}")
        
        # Follow Through: Right foot (ankle) at its highest position
        elif serve_phases['start'] and not serve_phases['follow_through'] and \
             abs(right_ankle[1] - min_right_ankle_y) < 10:  # Increased from 5 to 10 pixels tolerance
            serve_phases['follow_through'] = True
            key_moments.append({
                'frame': int(frame_idx),
                'timestamp': float(timestamp),
                'label': 'Follow Through',
                'confidence': float(np.mean(scores)) if scores is not None else 1.0
            })
            print(f"Detected Follow Through at frame {frame_idx}, timestamp {timestamp:.2f}")
            
            # If we detect follow through but missed impact, add it retroactively
            if not serve_phases['impact']:
                serve_phases['impact'] = True
                # Look for a suitable frame before follow through
                retroactive_frame = max(0, frame_idx - 10)  # 10 frames before follow through
                retroactive_timestamp = retroactive_frame / fps
                key_moments.append({
                    'frame': int(retroactive_frame),
                    'timestamp': float(retroactive_timestamp),
                    'label': 'Ball Impact (inferred)',
                    'confidence': 0.6
                })
                print(f"Inferred Ball Impact at frame {retroactive_frame}, timestamp {retroactive_timestamp:.2f}")
    
    # Make sure we didn't miss any key moments by enforcing detection of peaks
    if not any(moment['label'] == 'Trophy Position' for moment in key_moments) and peak_left_wrist_frame > 0:
        # Use the frame with the highest left wrist position
        frame_idx = int(peak_left_wrist_frame)
        timestamp = float(frame_idx / fps)
        serve_phases['trophy'] = True
        key_moments.append({
            'frame': frame_idx,
            'timestamp': timestamp,
            'label': 'Trophy Position (peak)',
            'confidence': 0.8
        })
        print(f"Added peak-based Trophy Position at frame {frame_idx}, timestamp {timestamp:.2f}")
    
    if not any(moment['label'] == 'Ball Impact' for moment in key_moments) and peak_right_wrist_frame > 0:
        # Use the frame with the highest right wrist position
        frame_idx = int(peak_right_wrist_frame)
        timestamp = float(frame_idx / fps)
        serve_phases['impact'] = True
        key_moments.append({
            'frame': frame_idx,
            'timestamp': timestamp,
            'label': 'Ball Impact (peak)',
            'confidence': 0.8
        })
        print(f"Added peak-based Ball Impact at frame {frame_idx}, timestamp {timestamp:.2f}")
    
    if not any(moment['label'] == 'Follow Through' for moment in key_moments) and peak_right_ankle_frame > 0:
        # Use the frame with the highest right ankle position
        frame_idx = int(peak_right_ankle_frame)
        timestamp = float(frame_idx / fps)
        serve_phases['follow_through'] = True
        key_moments.append({
            'frame': frame_idx,
            'timestamp': timestamp,
            'label': 'Follow Through (peak)',
            'confidence': 0.8
        })
        print(f"Added peak-based Follow Through at frame {frame_idx}, timestamp {timestamp:.2f}")
    
    # Convert any NumPy types to standard Python types before returning
    for moment in key_moments:
        for key in moment:
            if isinstance(moment[key], np.integer):
                moment[key] = int(moment[key])
            elif isinstance(moment[key], np.floating):
                moment[key] = float(moment[key])
            elif isinstance(moment[key], np.ndarray):
                moment[key] = moment[key].tolist()
    
    return key_moments

def process_video(video_path, output_path, inferencer, temp_dir):
    """Process a video and save results with pose estimation and ball detection."""
    os.makedirs(temp_dir, exist_ok=True)
    
    # Get the actual video FPS
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:  # If FPS detection fails, fallback to default
        fps = 30
        print(f"Warning: Could not detect FPS, using default of {fps}")
    else:
        print(f"Detected video FPS: {fps}")
    cap.release()
    
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
    
    # Look for the output video in temp_dir
    temp_files = os.listdir(temp_dir)
    vis_files = [f for f in temp_files if f.endswith('.mp4') or f.endswith('.avi')]
    
    if vis_files:
        # Get pose visualization video
        temp_video_path = os.path.join(temp_dir, vis_files[0])
        
        # Load a pretrained YOLOv8 model for ball detection
        print("Processing tennis ball detection...")
        yolo_model = YOLO('yolov8n.pt')  # Use the nano model for speed
        
        # Track tennis balls (class 32 in COCO dataset)
        ball_results = yolo_model.track(source=video_path, save=False, classes=32, conf=0.3, tracker="bytetrack.yaml")
        
        # Process the combined results (pose + ball)
        cap_pose = cv2.VideoCapture(temp_video_path)
        cap_orig = cv2.VideoCapture(video_path)
        
        # Use the previously detected fps instead of reading it again
        width = int(cap_pose.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap_pose.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Create temporary file for combined video
        temp_combined = os.path.join(temp_dir, 'combined.mp4')
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(temp_combined, fourcc, fps, (width, height))
        
        # Collect ball detections
        ball_detections = []
        
        # Process frame by frame to collect ball detections first
        frame_idx = 0
        for ball_result in ball_results:
            # Read frame from original video (needed for synchronization)
            ret_orig, _ = cap_orig.read()
            
            if not ret_orig:
                break
                
            # Draw boxes for tennis balls
            if ball_result.boxes is not None and len(ball_result.boxes) > 0:
                boxes = ball_result.boxes.xyxy.cpu().numpy()
                track_ids = ball_result.boxes.id
                confs = ball_result.boxes.conf.cpu().numpy()
                
                for i, box in enumerate(boxes):
                    # Skip if not a tennis ball (class 32)
                    if ball_result.boxes.cls[i].item() != 32:
                        continue
                        
                    x1, y1, x2, y2 = box.astype(int)
                    track_id = int(track_ids[i].item()) if track_ids is not None else None
                    conf = confs[i]
                    
                    # Store detection - convert NumPy types to Python native types
                    ball_detections.append({
                        'frame': int(frame_idx),
                        'timestamp': float(frame_idx / fps),
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'track_id': track_id,
                        'confidence': float(conf)
                    })
            
            frame_idx += 1
        
        # Now that we have ball detections, detect key moments
        key_moments = detect_key_moments(all_results, ball_detections, fps=fps)  # Pass the fps
        print(f"Detected {len(key_moments)} key moments")
        
        # Convert all NumPy types to Python native types to ensure JSON serialization works
        for moment in key_moments:
            for key in moment:
                if isinstance(moment[key], np.integer):
                    moment[key] = int(moment[key])
                elif isinstance(moment[key], np.floating):
                    moment[key] = float(moment[key])
                elif isinstance(moment[key], np.ndarray):
                    moment[key] = moment[key].tolist()
        
        # Sort the key moments by frame index
        key_moments.sort(key=lambda x: x['frame'])
        
        # Print detected key moments for debugging
        if key_moments:
            print("Key Moments Summary:")
            for moment in key_moments:
                print(f"  {moment['label']} at frame {moment['frame']} (time: {moment['timestamp']:.2f}s, confidence: {moment['confidence']:.2f})")
        else:
            print("WARNING: No key moments detected!")
        
        # Reset video captures for visualization
        cap_pose.release()
        cap_orig.release()
        cap_pose = cv2.VideoCapture(temp_video_path)
        cap_orig = cv2.VideoCapture(video_path)
        
        # Process frame by frame for visualization
        frame_idx = 0
        for ball_result in ball_results:
            # Read frame from pose visualization
            ret_pose, frame_pose = cap_pose.read()
            # Read frame from original video (needed for synchronization)
            ret_orig, _ = cap_orig.read()
            
            if not ret_pose or not ret_orig:
                break
                
            # Add timestamp label at the top of each frame
            timestamp = frame_idx / fps
            cv2.putText(frame_pose, f"Frame: {frame_idx}, Time: {timestamp:.2f}s", 
                      (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 
                      0.5, (255, 255, 255), 1)
                
            # Add timestamp labels for key moments - display more prominently
            for moment in key_moments:
                if frame_idx == moment['frame']:
                    timestamp = frame_idx / fps
                    # Draw a background rectangle for better visibility
                    cv2.rectangle(frame_pose, (5, 25), (450, 65), (0, 0, 0), -1)
                    # Draw the label in two lines for better readability
                    cv2.putText(frame_pose, f"{moment['label']}", 
                              (10, 45), cv2.FONT_HERSHEY_SIMPLEX, 
                              0.8, (0, 255, 0), 2)
                    cv2.putText(frame_pose, f"Time: {timestamp:.2f}s, Conf: {moment['confidence']:.2f}", 
                              (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 
                              0.6, (0, 255, 0), 2)
            
            # Draw boxes for tennis balls
            if ball_result.boxes is not None and len(ball_result.boxes) > 0:
                boxes = ball_result.boxes.xyxy.cpu().numpy()
                track_ids = ball_result.boxes.id
                confs = ball_result.boxes.conf.cpu().numpy()
                
                for i, box in enumerate(boxes):
                    # Skip if not a tennis ball (class 32)
                    if ball_result.boxes.cls[i].item() != 32:
                        continue
                        
                    x1, y1, x2, y2 = box.astype(int)
                    track_id = int(track_ids[i].item()) if track_ids is not None else None
                    conf = confs[i]
                    
                    # Draw bounding box - more visible
                    cv2.rectangle(frame_pose, (x1, y1), (x2, y2), (0, 255, 255), 2)
                    
                    # Add label with confidence and track ID
                    label = f"Ball {track_id}: {conf:.2f}" if track_id is not None else f"Ball: {conf:.2f}"
                    cv2.putText(frame_pose, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            
            # Write combined frame
            out.write(frame_pose)
            frame_idx += 1
            
        cap_pose.release()
        cap_orig.release()
        out.release()
        
        print(f"Detected {len(ball_detections)} tennis ball instances")
        
        # Re-encode with web-compatible format
        temp_output = os.path.join(temp_dir, 'web_compatible.mp4')
        ffmpeg_cmd = f'ffmpeg -i "{temp_combined}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -y "{temp_output}"'
        os.system(ffmpeg_cmd)
        
        # Move the re-encoded video to final destination
        if os.path.exists(temp_output):
            shutil.move(temp_output, output_path)
            
            # Save key moments data
            moments_file = os.path.splitext(output_path)[0] + '_moments.json'
            with open(moments_file, 'w') as f:
                import json
                json.dump(key_moments, f)
                
            # Save ball detections data
            balls_file = os.path.splitext(output_path)[0] + '_balls.json'
            with open(balls_file, 'w') as f:
                import json
                # Convert any remaining NumPy types to Python native types
                clean_ball_detections = []
                for ball in ball_detections:
                    clean_ball = {}
                    for key, value in ball.items():
                        if isinstance(value, np.integer):
                            clean_ball[key] = int(value)
                        elif isinstance(value, np.floating):
                            clean_ball[key] = float(value)
                        elif isinstance(value, np.ndarray):
                            clean_ball[key] = value.tolist()
                        else:
                            clean_ball[key] = value
                    clean_ball_detections.append(clean_ball)
                
                json.dump(clean_ball_detections, f)
                
            print(f"Saved processed video to: {output_path}")
            return True
        else:
            print(f"Error: Failed to re-encode video")
            return False
    else:
        print(f"Error: Could not find processed video in {temp_dir}")
        print(f"Files in temp_dir: {temp_files}")
        return False

@app.route('/balls/<video_name>')
def get_video_balls(video_name):
    """Get tennis ball detections for a video"""
    balls_file = os.path.join(OUTPUT_FOLDER, os.path.splitext(video_name)[0] + '_balls.json')
    if os.path.exists(balls_file):
        with open(balls_file, 'r') as f:
            import json
            balls = json.load(f)
        return jsonify(balls)
    return jsonify([])

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
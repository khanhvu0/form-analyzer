import os
import cv2
import numpy as np
import shutil
from ultralytics import YOLO
from mmpose.apis import MMPoseInferencer
from key_moment_detector import detect_key_moments


class VideoProcessor:
    """A class to process videos for pose estimation, ball detection, and key moment detection."""

    def __init__(self, device="cuda:0"):
        """Initialize the video processor with required models."""
        self.device = device
        self.pose_inferencer = MMPoseInferencer("human", device=device)
        self.yolo_model = YOLO("yolov9e.pt")

    def get_video_fps(self, video_path):
        """Get the FPS of a video file."""
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30
            print(f"Warning: Could not detect FPS, using default of {fps}")
        else:
            print(f"Detected video FPS: {fps}")
        cap.release()
        return fps

    def get_video_info(self, video_path):
        """Get video information including width, height, and FPS."""
        cap = cv2.VideoCapture(video_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        cap.release()
        return width, height, fps

    def reencode_video(self, input_path, output_path):
        """Re-encode video to ensure compatibility."""
        print(f"Re-encoding video from {input_path} to {output_path}")
        
        # Try to use FFMPEG if available for better compatibility
        try:
            import subprocess
            ffmpeg_cmd = f'ffmpeg -i "{input_path}" -pix_fmt yuv420p -c:v libx264 -profile:v baseline -level 3.0 -preset medium -crf 23 -movflags +faststart -y "{output_path}"'
            print(f"Attempting to use FFMPEG: {ffmpeg_cmd}")
            result = subprocess.run(ffmpeg_cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("FFMPEG encoding completed successfully")
                return
            else:
                print(f"FFMPEG encoding failed: {result.stderr}")
                print("Falling back to OpenCV encoding...")
        except Exception as e:
            print(f"Error using FFMPEG: {str(e)}")
            print("Falling back to OpenCV encoding...")
        
        # Fallback to OpenCV encoding
        cap = cv2.VideoCapture(input_path)
        width, height, fps = self.get_video_info(input_path)
        
        # Try different codecs in order of preference
        codecs = ['mp4v', 'XVID']
        success = False
        
        for codec in codecs:
            try:
                print(f"Trying codec: {codec}")
                fourcc = cv2.VideoWriter_fourcc(*codec)
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                
                if out.isOpened():
                    # Process frames
                    frame_count = 0
                    while True:
                        ret, frame = cap.read()
                        if not ret:
                            break
                        out.write(frame)
                        frame_count += 1
                    
                    success = True
                    print(f"Successfully encoded {frame_count} frames using codec {codec}")
                    break
                else:
                    print(f"Could not open VideoWriter with codec {codec}")
            except Exception as e:
                print(f"Error with codec {codec}: {str(e)}")
            finally:
                if 'out' in locals() and out is not None:
                    out.release()
                
        cap.release()
        
        if success:
            print("Video re-encoding completed")
        else:
            print("WARNING: All encoding attempts failed")

    def detect_balls(self, video_path, fps, max_frames=None):
        """Detect tennis balls in the video."""
        print("Processing tennis ball detection...")
        
        # Get total frame count if max_frames is not specified
        if max_frames is None:
            cap = cv2.VideoCapture(video_path)
            max_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            print(f"Processing all {max_frames} frames for ball detection")
        
        ball_results = self.yolo_model.track(
            source=video_path,
            save=False,
            classes=32,  # Tennis ball class
            conf=0.25,   # Slightly lower threshold to catch more balls
            iou=0.45,    # Intersection over Union threshold
            max_det=10,  # Maximum detections per frame
            tracker="bytetrack.yaml",
            stream=True,  # Enable streaming mode
            verbose=False  # Disable progress messages
        )

        ball_detections = []
        frame_idx = 0

        for ball_result in ball_results:
            if frame_idx >= max_frames:
                break
                
            if ball_result.boxes is not None and len(ball_result.boxes) > 0:
                boxes = ball_result.boxes.xyxy.cpu().numpy()
                track_ids = ball_result.boxes.id
                confs = ball_result.boxes.conf.cpu().numpy()

                for i, box in enumerate(boxes):
                    if ball_result.boxes.cls[i].item() != 32:
                        continue

                    x1, y1, x2, y2 = box.astype(int)
                    track_id = (
                        int(track_ids[i].item()) if track_ids is not None else None
                    )
                    conf = confs[i]

                    ball_detections.append(
                        {
                            "frame": int(frame_idx),
                            "timestamp": float(frame_idx / fps),
                            "bbox": [int(x1), int(y1), int(x2), int(y2)],
                            "track_id": track_id,
                            "confidence": float(conf),
                        }
                    )

            frame_idx += 1
            
            # Print progress every 100 frames
            if frame_idx % 100 == 0:
                print(f"Processed {frame_idx}/{max_frames} frames for ball detection")

        print(f"Completed ball detection on {frame_idx} frames")
        return ball_detections

    def detect_rackets(self, video_path, fps, max_frames=None):
        """Detect tennis rackets in the video."""
        print("Processing racket detection...")
        
        # Get total frame count if max_frames is not specified
        if max_frames is None:
            cap = cv2.VideoCapture(video_path)
            max_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            print(f"Processing all {max_frames} frames for racket detection")
            
        racket_results = self.yolo_model.track(
            source=video_path,
            save=False,
            classes=38,  # Racket class
            conf=0.25,   # Slightly lower threshold to catch more rackets
            iou=0.45,    # Intersection over Union threshold
            max_det=10,  # Maximum detections per frame
            tracker="bytetrack.yaml",
            stream=True  # Enable streaming mode
        )

        racket_detections = []
        frame_idx = 0

        for racket_result in racket_results:
            if frame_idx >= max_frames:
                break
                
            if racket_result.boxes is not None and len(racket_result.boxes) > 0:
                boxes = racket_result.boxes.xyxy.cpu().numpy()
                track_ids = racket_result.boxes.id
                confs = racket_result.boxes.conf.cpu().numpy()

                for i, box in enumerate(boxes):
                    if racket_result.boxes.cls[i].item() != 38:
                        continue

                    x1, y1, x2, y2 = box.astype(int)
                    track_id = (
                        int(track_ids[i].item()) if track_ids is not None else None
                    )
                    conf = confs[i]

                    racket_detections.append(
                        {
                            "frame": int(frame_idx),
                            "timestamp": float(frame_idx / fps),
                            "bbox": [int(x1), int(y1), int(x2), int(y2)],
                            "track_id": track_id,
                            "confidence": float(conf),
                        }
                    )

            frame_idx += 1
            
            # Print progress every 100 frames
            if frame_idx % 100 == 0:
                print(f"Processed {frame_idx}/{max_frames} frames for racket detection")

        print(f"Completed racket detection on {frame_idx} frames")
        return racket_detections

    def process_video(self, video_path, output_path, temp_dir, orientation=0):
        """Process a video and save results with pose estimation, ball detection, and key moments."""
        try:
            os.makedirs(temp_dir, exist_ok=True)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Get video FPS
            fps = self.get_video_fps(video_path)
            
            # Handle video orientation if needed
            if orientation != 0:
                print(f"Rotating video by {orientation} degrees")
                rotated_video_path = os.path.join(temp_dir, "rotated_video.mp4")
                self.rotate_video(video_path, rotated_video_path, orientation)
                
                # Verify the rotated video is valid
                if not self.check_video_file(rotated_video_path):
                    print("Warning: Rotated video appears to be corrupted, attempting to fix...")
                    
                    # Try to fix NAL unit errors first (common after rotation)
                    temp_fixed_path = os.path.join(temp_dir, "rotated_fixed.mp4")
                    if self.fix_nal_errors(rotated_video_path, temp_fixed_path):
                        print("Successfully fixed NAL errors in rotated video")
                        if self.check_video_file(temp_fixed_path):
                            rotated_video_path = temp_fixed_path
                        else:
                            print("Warning: Fixed video still has issues, trying general re-encoding...")
                            temp_reencoded_path = os.path.join(temp_dir, "rotated_reencoded.mp4")
                            self.reencode_video(rotated_video_path, temp_reencoded_path)
                            if self.check_video_file(temp_reencoded_path):
                                rotated_video_path = temp_reencoded_path
                            else:
                                print("Warning: Could not fix rotated video, using original...")
                                rotated_video_path = video_path
                    else:
                        # Try general re-encoding as fallback
                        print("Warning: NAL error fixing failed, trying general re-encoding...")
                        temp_reencoded_path = os.path.join(temp_dir, "rotated_reencoded.mp4")
                        self.reencode_video(rotated_video_path, temp_reencoded_path)
                        if self.check_video_file(temp_reencoded_path):
                            rotated_video_path = temp_reencoded_path
                        else:
                            print("Warning: Could not fix rotated video, using original...")
                            rotated_video_path = video_path
                        
                video_path = rotated_video_path

            # Run pose detection
            print("Processing frames with MMPose...")
            try:
                result_generator = self.pose_inferencer(
                    video_path, show=False, vis_out_dir=temp_dir, radius=4, thickness=2
                )

                # Collect pose results
                pose_results = []
                for result in result_generator:
                    pose_results.append(result)
                
                # Count the actual results obtained
                actual_frame_count = len(pose_results)
                
                # Check cap frames vs processed frames
                cap = cv2.VideoCapture(video_path)
                expected_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.release()
                
                print(f"MMPose processed {actual_frame_count} frames out of {expected_frames} expected frames")
                
                # If we have significantly fewer frames than expected, try frame extraction
                if actual_frame_count < expected_frames * 0.9 and expected_frames > 10:
                    print(f"Warning: MMPose only processed {actual_frame_count}/{expected_frames} frames")
                    print("Trying frame-by-frame extraction method...")
                    
                    # Extract frames for direct processing
                    frame_paths, video_fps = self.extract_frames_for_mmpose(video_path, temp_dir)
                    
                    if len(frame_paths) > actual_frame_count:
                        print(f"Successfully extracted {len(frame_paths)} frames, reprocessing with MMPose...")
                        # Process extracted frames with MMPose
                        result_generator = self.pose_inferencer(
                            frame_paths, show=False, vis_out_dir=temp_dir, radius=4, thickness=2
                        )
                        
                        # Collect new pose results
                        pose_results = []
                        for result in result_generator:
                            pose_results.append(result)
                            
                        print(f"MMPose processed {len(pose_results)} frames using extraction method")
            except Exception as e:
                print(f"Error during MMPose processing: {str(e)}")
                print("Trying frame-by-frame extraction as fallback...")
                
                # Extract frames for direct processing
                frame_paths, video_fps = self.extract_frames_for_mmpose(video_path, temp_dir)
                
                if len(frame_paths) > 0:
                    print(f"Successfully extracted {len(frame_paths)} frames, processing with MMPose...")
                    # Process extracted frames with MMPose
                    result_generator = self.pose_inferencer(
                        frame_paths, show=False, vis_out_dir=temp_dir, radius=4, thickness=2
                    )
                    
                    # Collect pose results
                    pose_results = []
                    for result in result_generator:
                        pose_results.append(result)
                        
                    print(f"MMPose processed {len(pose_results)} frames using extraction fallback method")
                else:
                    print("Frame extraction failed, cannot proceed with pose estimation")
                    return False

            # Look for pose visualization video
            temp_files = os.listdir(temp_dir)
            vis_files = [f for f in temp_files if f.endswith((".mp4", ".avi"))]

            if not vis_files:
                print(f"Error: Could not find processed video in {temp_dir}")
                return False

            # Get pose visualization video path
            temp_video_path = os.path.join(temp_dir, vis_files[0])
            
            # Get total frame count for the video
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            print(f"Total frames in video: {total_frames}")
            
            # Detect balls and rackets
            ball_detections = self.detect_balls(video_path, fps, max_frames=total_frames)
            racket_detections = self.detect_rackets(video_path, fps, max_frames=total_frames)
            
            # Add detection boxes for debugging
            print("Adding ball and racket detection boxes for debugging...")
            debug_video_path = os.path.join(temp_dir, "debug_detections.mp4")
            
            # Use the original rotated video for adding detection boxes
            self._add_detection_boxes(video_path, debug_video_path, ball_detections, racket_detections, fps)
            
            # Create a temporary file for re-encoding
            temp_output = os.path.join(temp_dir, "temp_output.mp4")
            
            # Re-encode the video to ensure compatibility
            self.reencode_video(debug_video_path, temp_output)
            
            # Move the final output to the desired location
            shutil.move(temp_output, output_path)
            
            # Save results
            self._save_results(output_path, pose_results, ball_detections, racket_detections)
            
            # Clean up temporary files
            shutil.rmtree(temp_dir)
            
            return True
        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return False
            
    def rotate_video(self, input_path, output_path, angle):
        """Rotate a video by the specified angle in degrees."""
        try:
            # Try to use FFMPEG if available for better compatibility
            try:
                import subprocess
                
                # Map orientation angles to rotation values
                # 0: No rotation
                # 90: Rotate 90 degrees clockwise
                # 180: Rotate 180 degrees
                # 270: Rotate 90 degrees counterclockwise
                
                if angle == 0:
                    # No rotation needed
                    shutil.copy2(input_path, output_path)
                    return
                    
                # FFMPEG rotation filters
                rotation_filter = ""
                if angle == 90:
                    rotation_filter = "-vf transpose=1"
                elif angle == 180:
                    rotation_filter = "-vf transpose=2,transpose=2"
                elif angle == 270:
                    rotation_filter = "-vf transpose=2,transpose=2,transpose=2"
                else:
                    print(f"Unsupported rotation angle: {angle}")
                    shutil.copy2(input_path, output_path)
                    return
                
                # Use more robust encoding settings to ensure compatibility
                ffmpeg_cmd = f'ffmpeg -i "{input_path}" {rotation_filter} -pix_fmt yuv420p -c:v libx264 -profile:v baseline -level 3.0 -preset medium -crf 23 -movflags +faststart -y "{output_path}"'
                print(f"Rotating video with FFMPEG: {ffmpeg_cmd}")
                result = subprocess.run(ffmpeg_cmd, shell=True, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("FFMPEG rotation completed successfully")
                    return
                else:
                    print(f"FFMPEG rotation failed: {result.stderr}")
                    print("Falling back to OpenCV rotation...")
            except Exception as e:
                print(f"Error using FFMPEG: {str(e)}")
                print("Falling back to OpenCV rotation...")
            
            # Fallback to OpenCV rotation
            cap = cv2.VideoCapture(input_path)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            print(f"OpenCV rotation: Source video {width}x{height} at {fps}fps, {total_frames} frames")
            
            # Determine new dimensions after rotation
            if angle in [90, 270]:
                new_width, new_height = height, width
            else:
                new_width, new_height = width, height
                
            print(f"Output dimensions after rotation: {new_width}x{new_height}")
                
            # Try different codecs in order of preference
            codecs = ['avc1', 'H264', 'mp4v', 'XVID']
            success = False
            
            for codec in codecs:
                try:
                    print(f"Trying codec: {codec}")
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    
                    # Use temp file path to avoid writing partial files
                    temp_output = f"{output_path}.temp.mp4"
                    out = cv2.VideoWriter(temp_output, fourcc, fps, (new_width, new_height))
                    
                    if out.isOpened():
                        # Process frames
                        frame_count = 0
                        
                        # Reset cap to the beginning of the video
                        cap.release()
                        cap = cv2.VideoCapture(input_path)
                        
                        while True:
                            ret, frame = cap.read()
                            if not ret:
                                break
                                
                            # Rotate frame based on angle
                            if angle == 90:
                                rotated = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                            elif angle == 180:
                                rotated = cv2.rotate(frame, cv2.ROTATE_180)
                            elif angle == 270:
                                rotated = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
                            else:
                                rotated = frame
                                
                            # Write the frame
                            out.write(rotated)
                            frame_count += 1
                            
                            # Print progress for large videos
                            if frame_count % 30 == 0:
                                progress = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                                print(f"Rotated {frame_count}/{total_frames} frames ({progress:.1f}%)...")
                        
                        # Properly close the writer before renaming the file
                        out.release()
                        
                        # Verify frames were actually written
                        if frame_count > 0:
                            # Check if we processed at least 90% of expected frames
                            if total_frames > 0 and frame_count < (total_frames * 0.9):
                                print(f"Warning: Only processed {frame_count}/{total_frames} frames")
                            
                            # Replace the output file with the temp file
                            if os.path.exists(output_path):
                                os.remove(output_path)
                            os.rename(temp_output, output_path)
                            
                            success = True
                            print(f"Successfully rotated {frame_count} frames using codec {codec}")
                            break
                        else:
                            print(f"No frames were written using codec {codec}")
                            if os.path.exists(temp_output):
                                os.remove(temp_output)
                    else:
                        print(f"Could not open VideoWriter with codec {codec}")
                except Exception as e:
                    print(f"Error with codec {codec}: {str(e)}")
                    if os.path.exists(temp_output):
                        os.remove(temp_output)
                finally:
                    if 'out' in locals() and out is not None:
                        out.release()
                    
            cap.release()
            
            if success:
                print("Video rotation completed")
            else:
                print("Video rotation failed, using original video")
                shutil.copy2(input_path, output_path)
                
        except Exception as e:
            print(f"Error rotating video: {str(e)}")
            # Fallback to original video
            shutil.copy2(input_path, output_path)

    def _save_results(self, output_path, pose_results, ball_detections, racket_detections):
        """Save detection results to JSON files."""
        try:
            # Save pose results
            pose_file = os.path.splitext(output_path)[0] + "_pose.json"
            with open(pose_file, "w") as f:
                import json
                json.dump(pose_results, f)
            print(f"Saved pose results to: {pose_file}")

            # Save ball detections
            balls_file = os.path.splitext(output_path)[0] + "_balls.json"
            with open(balls_file, "w") as f:
                import json
                json.dump(ball_detections, f)
            print(f"Saved ball detections to: {balls_file}")
            
            # Save racket detections
            rackets_file = os.path.splitext(output_path)[0] + "_rackets.json"
            with open(rackets_file, "w") as f:
                import json
                json.dump(racket_detections, f)
            print(f"Saved racket detections to: {rackets_file}")
            
            # Verify the output video is valid and readable
            self.check_video_file(output_path)
        except Exception as e:
            print(f"Error saving results: {str(e)}")
            
    def check_video_file(self, video_path):
        """Check if a video file is valid and can be opened."""
        if not os.path.exists(video_path):
            print(f"Warning: Video file {video_path} does not exist")
            return False
            
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"Warning: Could not open video file {video_path}")
                return False
                
            # Try to read the first frame
            ret, _ = cap.read()
            if not ret:
                print(f"Warning: Could not read frames from {video_path}")
                return False
            
            # Check more thoroughly by reading multiple frames
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if frame_count > 0:
                # Try to read frames at different positions
                test_positions = [
                    0,  # Start
                    frame_count // 4,  # 25%
                    frame_count // 2,  # 50%
                    (3 * frame_count) // 4,  # 75%
                    frame_count - 1  # End
                ]
                
                for pos in test_positions:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, pos)
                    ret, _ = cap.read()
                    if not ret:
                        print(f"Warning: Could not read frame at position {pos}/{frame_count} from {video_path}")
                        return False
            
            # Get video properties
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            cap.release()
            
            print(f"Video validation - {video_path} is valid:")
            print(f"  Dimensions: {width}x{height}")
            print(f"  FPS: {fps}")
            print(f"  Frame count: {frame_count}")
            return True
        except Exception as e:
            print(f"Error validating video file {video_path}: {str(e)}")
            return False

    def _add_detection_boxes(self, input_path, output_path, ball_detections, racket_detections, fps):
        """Add detection boxes for tennis balls and rackets directly on the video frames for debugging."""
        cap = cv2.VideoCapture(input_path)
        width, height, _ = self.get_video_info(input_path)
        
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
        
        # Create frame lookup dictionaries for quick access
        ball_lookup = {}
        for ball in ball_detections:
            frame = ball["frame"]
            if frame not in ball_lookup:
                ball_lookup[frame] = []
            ball_lookup[frame].append(ball)
            
        racket_lookup = {}
        for racket in racket_detections:
            frame = racket["frame"]
            if frame not in racket_lookup:
                racket_lookup[frame] = []
            racket_lookup[frame].append(racket)
        
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Add ball detections for this frame
            if frame_idx in ball_lookup:
                for ball_detection in ball_lookup[frame_idx]:
                    x1, y1, x2, y2 = ball_detection["bbox"]
                    conf = ball_detection["confidence"]
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    
                    # Add label and confidence
                    label = f"Ball: {conf:.2f}"
                    cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            # Add racket detections for this frame
            if frame_idx in racket_lookup:
                for racket_detection in racket_lookup[frame_idx]:
                    x1, y1, x2, y2 = racket_detection["bbox"]
                    conf = racket_detection["confidence"]
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Add label and confidence
                    label = f"Racket: {conf:.2f}"
                    cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Add frame counter for debugging
            cv2.putText(frame, f"Frame: {frame_idx}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            out.write(frame)
            frame_idx += 1
        
        cap.release()
        out.release()
        print(f"Debugging visualization saved to: {output_path} with {frame_idx} frames processed")

    def fix_nal_errors(self, input_path, output_path):
        """Fix NAL unit errors in H264 videos by reencoding with stricter parameters."""
        try:
            import subprocess
            print(f"Attempting to fix NAL unit errors in {input_path}")
            
            # First pass: Decode to raw frames to avoid carrying over any NAL issues
            temp_yuv = f"{output_path}.temp.yuv"
            decode_cmd = f'ffmpeg -i "{input_path}" -f rawvideo -pix_fmt yuv420p -y "{temp_yuv}"'
            
            print(f"Decoding to raw format: {decode_cmd}")
            result1 = subprocess.run(decode_cmd, shell=True, capture_output=True, text=True)
            
            if result1.returncode != 0:
                print(f"Raw decoding failed: {result1.stderr}")
                print("Trying alternate method...")
                
                # Alternative approach: use a very strict H264 encoding
                strict_cmd = f'ffmpeg -i "{input_path}" -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -preset slow -crf 18 -movflags +faststart -y "{output_path}"'
                print(f"Reencoding with strict parameters: {strict_cmd}")
                result3 = subprocess.run(strict_cmd, shell=True, capture_output=True, text=True)
                
                if result3.returncode == 0:
                    print("Strict reencoding completed successfully")
                    if os.path.exists(temp_yuv):
                        os.remove(temp_yuv)
                    return True
                else:
                    print(f"Strict reencoding failed: {result3.stderr}")
                    return False
            
            # Second pass: Re-encode to H264 with strict parameters
            encode_cmd = f'ffmpeg -f rawvideo -pix_fmt yuv420p -s {self.get_video_info(input_path)[0]}x{self.get_video_info(input_path)[1]} -r {self.get_video_info(input_path)[2]} -i "{temp_yuv}" -c:v libx264 -profile:v baseline -level 3.0 -preset medium -crf 18 -movflags +faststart -y "{output_path}"'
            
            print(f"Reencoding from raw: {encode_cmd}")
            result2 = subprocess.run(encode_cmd, shell=True, capture_output=True, text=True)
            
            # Clean up temp file
            if os.path.exists(temp_yuv):
                os.remove(temp_yuv)
                
            if result2.returncode == 0:
                print("NAL error fixing completed successfully")
                return True
            else:
                print(f"Reencoding failed: {result2.stderr}")
                return False
                
        except Exception as e:
            print(f"Error fixing NAL units: {str(e)}")
            return False

    def extract_frames_for_mmpose(self, video_path, temp_dir):
        """
        Extract frames from a video and save as PNG for MMPose direct processing.
        This is a fallback method when normal video processing fails.
        Returns a list of frame paths.
        """
        print(f"Extracting frames from {video_path} for direct MMPose processing...")
        
        # Create frames directory
        frames_dir = os.path.join(temp_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"Extracting {total_frames} frames from {width}x{height} video at {fps}fps")
        
        # Extract frames
        frame_paths = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Save frame as PNG (lossless)
            frame_path = os.path.join(frames_dir, f"frame_{frame_count:06d}.png")
            cv2.imwrite(frame_path, frame)
            frame_paths.append(frame_path)
            
            frame_count += 1
            if frame_count % 30 == 0:
                progress = (frame_count / total_frames) * 100 if total_frames > 0 else 0
                print(f"Extracted {frame_count}/{total_frames} frames ({progress:.1f}%)...")
        
        cap.release()
        print(f"Successfully extracted {frame_count} frames to {frames_dir}")
        
        return frame_paths, fps

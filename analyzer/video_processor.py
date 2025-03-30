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
            ffmpeg_cmd = f'ffmpeg -i "{input_path}" -c:v libx264 -preset medium -crf 23 -y "{output_path}"'
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

    def detect_balls(self, video_path, fps):
        """Detect tennis balls in the video."""
        print("Processing tennis ball detection...")
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

        return ball_detections

    def detect_rackets(self, video_path, fps):
        """Detect tennis rackets in the video."""
        print("Processing racket detection...")
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

        return racket_detections

    def process_video(self, video_path, output_path, temp_dir):
        """Process a video and save results with pose estimation, ball detection, and key moments."""
        try:
            os.makedirs(temp_dir, exist_ok=True)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Get video FPS
            fps = self.get_video_fps(video_path)

            # Run pose detection
            print("Processing frames with MMPose...")
            result_generator = self.pose_inferencer(
                video_path, show=False, vis_out_dir=temp_dir, radius=4, thickness=2
            )

            # Collect pose results
            pose_results = []
            for result in result_generator:
                pose_results.append(result)

            # Look for pose visualization video
            temp_files = os.listdir(temp_dir)
            vis_files = [f for f in temp_files if f.endswith((".mp4", ".avi"))]

            if not vis_files:
                print(f"Error: Could not find processed video in {temp_dir}")
                return False

            # Get pose visualization video path
            temp_video_path = os.path.join(temp_dir, vis_files[0])
            
            # Detect balls and rackets
            ball_detections = self.detect_balls(video_path, fps)
            racket_detections = self.detect_rackets(video_path, fps)
            
            # Add detection boxes for debugging
            print("Adding ball and racket detection boxes for debugging...")
            debug_video_path = os.path.join(temp_dir, "debug_detections.mp4")
            self._add_detection_boxes(temp_video_path, debug_video_path, ball_detections, racket_detections, fps)
            
            # Create a temporary file for re-encoding
            temp_output = os.path.join(temp_dir, "temp_output.mp4")
            
            # Re-encode the video to ensure compatibility
            self.reencode_video(debug_video_path, temp_output)
            
            # Check if temp output is valid before copying
            if not self.check_video_file(temp_output):
                print("Warning: Re-encoded video may be invalid. Copying original file as fallback.")
                # Try to copy the original file as a fallback
                try:
                    shutil.copy2(temp_video_path, output_path)
                    print(f"Copied original visualization to: {output_path}")
                except Exception as e:
                    print(f"Error copying original file: {str(e)}")
                    return False
            else:
                # Copy the re-encoded video to the final output
                try:
                    shutil.copy2(temp_output, output_path)
                    print(f"Saved processed video to: {output_path}")
                except Exception as e:
                    print(f"Error copying re-encoded file: {str(e)}")
                    return False
                    
            # Set file permissions to ensure file is accessible
            try:
                import stat
                os.chmod(output_path, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IROTH)
                print(f"Set permissions for {output_path}")
            except Exception as e:
                print(f"Warning: Could not set file permissions: {str(e)}")

            # Clean up temporary files
            try:
                os.remove(temp_output)
            except:
                pass

            # Detect key moments
            key_moments = detect_key_moments(
                pose_results, ball_detections, racket_detections, fps=fps
            )

            # Save results
            self._save_results(output_path, key_moments, ball_detections)

            return True
        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return False

    def _save_results(self, output_path, key_moments, ball_detections):
        """Save detection results to JSON files."""
        try:
            # Save key moments
            moments_file = os.path.splitext(output_path)[0] + "_moments.json"
            with open(moments_file, "w") as f:
                import json
                json.dump(key_moments, f)
            print(f"Saved key moments to: {moments_file}")

            # Save ball detections
            balls_file = os.path.splitext(output_path)[0] + "_balls.json"
            with open(balls_file, "w") as f:
                import json
                json.dump(ball_detections, f)
            print(f"Saved ball detections to: {balls_file}")
            
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
                
            # Get video properties
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
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

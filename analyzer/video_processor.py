import os
import cv2
import numpy as np
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

    def detect_balls(self, video_path, fps):
        """Detect tennis balls in the video."""
        print("Processing tennis ball detection...")
        ball_results = self.yolo_model.track(
            source=video_path,
            save=False,
            classes=32,  # Tennis ball class
            conf=0.3,
            tracker="bytetrack.yaml",
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
            conf=0.3,
            tracker="bytetrack.yaml",
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
        os.makedirs(temp_dir, exist_ok=True)

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

        # Detect key moments
        key_moments = detect_key_moments(
            pose_results, ball_detections, racket_detections, fps=fps
        )

        # Save results
        self._save_results(output_path, key_moments, ball_detections)

        return True

    def _save_results(self, output_path, key_moments, ball_detections):
        """Save detection results to JSON files."""
        # Save key moments
        moments_file = os.path.splitext(output_path)[0] + "_moments.json"
        with open(moments_file, "w") as f:
            import json

            json.dump(key_moments, f)

        # Save ball detections
        balls_file = os.path.splitext(output_path)[0] + "_balls.json"
        with open(balls_file, "w") as f:
            import json

            json.dump(ball_detections, f)

#!/usr/bin/env python
"""
Test script for combined pose and tennis ball detection using MMPose and YOLOv8.
This can be used to quickly test if the ball and pose detection are working properly.
"""

import os
import argparse
import cv2
import numpy as np
import torch
from ultralytics import YOLO
from mmpose.apis import MMPoseInferencer

def main():
    parser = argparse.ArgumentParser(description='Test combined pose and tennis ball detection on a video')
    parser.add_argument('--input', type=str, required=True, help='Path to input video')
    parser.add_argument('--output', type=str, default='output_combined_detection.mp4', 
                        help='Path to output video')
    parser.add_argument('--conf', type=float, default=0.3,
                        help='Confidence threshold for ball detection')
    parser.add_argument('--device', type=str, default='cuda:0', 
                        help='Device to use (cuda device or "cpu")')
    parser.add_argument('--skip-pose', action='store_true',
                        help='Skip pose detection (only detect balls)')
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file {args.input} does not exist")
        return
    
    # Create temp directory
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    
    # Step 1: Pose Detection with MMPose
    pose_results = []
    pose_video_path = None
    
    if not args.skip_pose:
        print(f"Loading MMPose inferencer...")
        inferencer = MMPoseInferencer('human', device=args.device)
        
        print(f"Running pose detection on: {args.input}")
        result_generator = inferencer(
            args.input,
            show=False,
            vis_out_dir=temp_dir,
            radius=4,
            thickness=2
        )
        
        # Process results
        for result in result_generator:
            pose_results.append(result)
        
        # Look for output video
        temp_files = os.listdir(temp_dir)
        vis_files = [f for f in temp_files if f.endswith('.mp4') or f.endswith('.avi')]
        if vis_files:
            pose_video_path = os.path.join(temp_dir, vis_files[0])
        else:
            print("Warning: No pose visualization video found in temp dir")
            print(f"Files in temp_dir: {temp_files}")
    
    # Step 2: Tennis Ball Detection with YOLOv8
    print(f"Loading YOLOv8 model...")
    yolo_model = YOLO('yolov8n.pt')  # Use the nano model for speed
    
    print(f"Running ball detection on: {args.input}")
    print(f"Tennis ball is class 32 in COCO dataset")
    print(f"Using confidence threshold: {args.conf}")
    
    # Run inference with tracking
    ball_results = yolo_model.track(
        source=args.input,
        classes=32,  # Tennis ball class in COCO
        conf=args.conf,
        tracker="bytetrack.yaml",
        device=args.device,
        save=False
    )
    
    # Step 3: Combine results
    if pose_video_path:
        # Use pose video as base and add ball detections
        input_cap = cv2.VideoCapture(pose_video_path)
    else:
        # Use original video and only draw ball detections
        input_cap = cv2.VideoCapture(args.input)
    
    # Get video properties
    fps = int(input_cap.get(cv2.CAP_PROP_FPS))
    width = int(input_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(input_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(args.output, fourcc, fps, (width, height))
    
    # Process each frame
    total_ball_detections = 0
    ball_frames = 0
    frame_idx = 0
    
    # Open original video for synchronization
    orig_cap = cv2.VideoCapture(args.input)
    
    print(f"Creating combined video...")
    for ball_result in ball_results:
        # Read frame from pose video or original video
        ret, frame = input_cap.read()
        # Read frame from original video (for synchronization)
        ret_orig, _ = orig_cap.read()
        
        if not ret or not ret_orig:
            break
            
        # Draw boxes for tennis balls
        ball_count = 0
        if ball_result.boxes is not None and len(ball_result.boxes) > 0:
            boxes = ball_result.boxes.xyxy.cpu().numpy()
            track_ids = ball_result.boxes.id
            confs = ball_result.boxes.conf.cpu().numpy()
            
            for i, box in enumerate(boxes):
                # Skip if not a tennis ball (class 32)
                cls = ball_result.boxes.cls[i].item()
                if cls != 32:
                    continue
                    
                x1, y1, x2, y2 = box.astype(int)
                track_id = int(track_ids[i].item()) if track_ids is not None else None
                conf = confs[i]
                
                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                
                # Add label with confidence and track ID
                label = f"Ball {track_id}: {conf:.2f}" if track_id is not None else f"Ball: {conf:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
                
                ball_count += 1
        
        # Add frame info
        cv2.putText(frame, f"Frame: {frame_idx}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(frame, f"Balls: {ball_count}", (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Update statistics
        total_ball_detections += ball_count
        if ball_count > 0:
            ball_frames += 1
        
        # Write frame to output video
        out.write(frame)
        frame_idx += 1
        
        # Display progress every 10 frames
        if frame_idx % 10 == 0:
            print(f"Processed {frame_idx} frames, found {total_ball_detections} ball detections so far")
    
    input_cap.release()
    orig_cap.release()
    out.release()
    
    print(f"Processing complete!")
    print(f"Total frames: {frame_idx}")
    print(f"Total ball detections: {total_ball_detections}")
    print(f"Frames with ball detections: {ball_frames} ({ball_frames/frame_idx*100:.1f}%)")
    print(f"Output saved to: {args.output}")
    
    # Clean up temp directory
    if pose_video_path:
        try:
            os.remove(pose_video_path)
            os.rmdir(temp_dir)
        except:
            print(f"Note: Could not fully clean up temp directory: {temp_dir}")

if __name__ == "__main__":
    main() 
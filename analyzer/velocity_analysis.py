import numpy as np
import matplotlib.pyplot as plt
from mmpose.apis import MMPoseInferencer
import os
import cv2
import json


def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj


def get_video_fps(video_path):
    """Get the FPS of a video file."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    return fps


def calculate_velocity_and_acceleration(keypoints, fps):
    """
    Calculate velocity and acceleration of the right hand.
    Returns: time, velocity, acceleration
    """
    # Right wrist index in MMPose keypoints
    RIGHT_WRIST = 10

    # Extract right wrist positions
    positions = []
    for frame in keypoints:
        if frame and "predictions" in frame and frame["predictions"]:
            person = frame["predictions"][0][0]
            if "keypoints" in person:
                # Get x,y coordinates
                wrist_pos = person["keypoints"][RIGHT_WRIST][:2]
                positions.append(wrist_pos)
            else:
                positions.append(None)
        else:
            positions.append(None)

    # Convert to numpy array and handle None values
    positions = np.array(positions)
    valid_frames = ~np.isnan(positions[:, 0])
    positions = positions[valid_frames]

    # Calculate time points
    time = np.arange(len(positions)) / fps

    # Calculate velocity (first derivative of position)
    velocity = np.zeros_like(positions)
    velocity[1:] = (positions[1:] - positions[:-1]) * fps

    # Calculate acceleration (second derivative of position)
    acceleration = np.zeros_like(positions)
    acceleration[1:] = (velocity[1:] - velocity[:-1]) * fps

    return time, velocity, acceleration


def create_plots(time, velocity, acceleration, video_title, output_path):
    """Create and save velocity/acceleration plots."""
    plt.figure(figsize=(15, 10))

    # Plot velocity
    plt.subplot(2, 1, 1)
    plt.plot(time, velocity[:, 0], label="X velocity", color="blue")
    plt.plot(time, velocity[:, 1], label="Y velocity", color="red")
    plt.title(f"Right Hand Velocity - {video_title}")
    plt.xlabel("Time (seconds)")
    plt.ylabel("Velocity (pixels/second)")
    plt.legend()
    plt.grid(True)

    # Set x-axis ticks every 0.5 seconds
    max_time = np.ceil(time[-1])
    plt.xticks(np.arange(0, max_time + 0.5, 0.5))

    # Plot acceleration
    plt.subplot(2, 1, 2)
    plt.plot(time, acceleration[:, 0], label="X acceleration", color="blue")
    plt.plot(time, acceleration[:, 1], label="Y acceleration", color="red")
    plt.title(f"Right Hand Acceleration - {video_title}")
    plt.xlabel("Time (seconds)")
    plt.ylabel("Acceleration (pixels/second²)")
    plt.legend()
    plt.grid(True)

    # Set x-axis ticks every 0.5 seconds
    plt.xticks(np.arange(0, max_time + 0.5, 0.5))

    # Save plot
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def analyze_video(video_path, output_dir, json_path=None):
    """Analyze video and plot velocity/acceleration."""
    # Get video title and FPS
    video_title = os.path.splitext(os.path.basename(video_path))[0]
    fps = get_video_fps(video_path)

    # Check if we should load from JSON or run inference
    if json_path and os.path.exists(json_path):
        print(f"Loading keypoint data from {json_path}")
        with open(json_path, "r") as f:
            all_results = json.load(f)
    else:
        # Initialize MMPose and run inference
        inferencer = MMPoseInferencer("human", device="cuda:0")
        result_generator = inferencer(
            video_path, show=False, vis_out_dir=output_dir, radius=4, thickness=2
        )

        # Collect all results
        all_results = []
        for result in result_generator:
            all_results.append(result)

        # Save results to JSON if path provided
        if json_path:
            print(f"Saving keypoint data to {json_path}")
            # Convert numpy types to Python native types before saving
            json_safe_results = convert_numpy_types(all_results)
            with open(json_path, "w") as f:
                json.dump(json_safe_results, f)

    # Calculate velocity and acceleration
    time, velocity, acceleration = calculate_velocity_and_acceleration(all_results, fps)

    # Create and save plots
    plot_path = os.path.join(output_dir, "velocity_analysis.png")
    create_plots(time, velocity, acceleration, video_title, plot_path)

    print(f"Analysis complete. Plot saved to: {plot_path}")
    return plot_path


if __name__ == "__main__":
    # Example usage
    video_path = "fritz_test.mp4"  # Replace with your video path
    output_dir = "output"
    json_path = os.path.join(output_dir, "keypoints.json")
    os.makedirs(output_dir, exist_ok=True)

    analyze_video(video_path, output_dir, json_path)

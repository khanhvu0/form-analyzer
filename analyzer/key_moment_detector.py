import numpy as np

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


def calculate_ball_velocity(ball1, ball2, fps):
    """Calculate velocity between two ball detections."""
    if ball1["frame"] == ball2["frame"]:
        return np.array([0, 0])

    # Calculate time difference in seconds
    dt = (ball2["frame"] - ball1["frame"]) / fps

    # Calculate position difference
    pos1 = np.array(
        [
            (ball1["bbox"][0] + ball1["bbox"][2]) / 2,
            (ball1["bbox"][1] + ball1["bbox"][3]) / 2,
        ]
    )
    pos2 = np.array(
        [
            (ball2["bbox"][0] + ball2["bbox"][2]) / 2,
            (ball2["bbox"][1] + ball2["bbox"][3]) / 2,
        ]
    )

    # Calculate velocity (pixels per second)
    velocity = (pos2 - pos1) / dt
    return velocity


def detect_key_moments(
    keypoints_results, ball_detections=None, racket_detections=None, fps=30
):
    """Detect key moments of a tennis serve based on pose keypoints, ball and racket detection."""
    key_moments = []
    serve_phases = {
        "start": False,
        "ball_release": False,
        "trophy": False,
        "racket_low": False,
        "impact": False,
        "follow_through": False,
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
    valid_frames = []

    for frame_idx, result in enumerate(keypoints_results):
        # Skip if no predictions
        if not result or "predictions" not in result or not result["predictions"]:
            continue

        # Get predictions for the first person
        predictions = result["predictions"][0]
        if not predictions:
            continue

        # Get keypoints of the first person detected
        person = predictions[0]
        if "keypoints" not in person:
            continue

        # Convert keypoints to numpy array if it's not already
        keypoints = (
            np.array(person["keypoints"])
            if isinstance(person["keypoints"], list)
            else person["keypoints"]
        )
        scores = person.get("keypoint_scores", None)

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
    peak_left_wrist_frame = (
        valid_frames[np.argmin(all_left_wrist_y)] if len(all_left_wrist_y) > 0 else 0
    )
    peak_right_wrist_frame = (
        valid_frames[np.argmin(all_right_wrist_y)] if len(all_right_wrist_y) > 0 else 0
    )
    peak_right_ankle_frame = (
        valid_frames[np.argmin(all_right_ankle_y)] if len(all_right_ankle_y) > 0 else 0
    )

    print(
        f"Peak analysis - Left wrist peak at frame {peak_left_wrist_frame}, Right wrist peak at frame {peak_right_wrist_frame}, Right ankle peak at frame {peak_right_ankle_frame}"
    )

    # Track ball velocities for debugging
    ball_velocities = []

    # Now process frames for key moments
    for frame_idx, result in enumerate(keypoints_results):
        # Skip if no predictions
        if not result or "predictions" not in result or not result["predictions"]:
            continue

        # Get predictions for the first person
        predictions = result["predictions"][0]
        if not predictions:
            continue

        # Get keypoints of the first person detected
        person = predictions[0]
        if "keypoints" not in person:
            continue

        # Convert keypoints to numpy array if it's not already
        keypoints = (
            np.array(person["keypoints"])
            if isinstance(person["keypoints"], list)
            else person["keypoints"]
        )
        scores = person.get("keypoint_scores", None)

        # Skip if confidence is too low
        if scores is not None and np.mean(scores) < 0.3:  # Reduced confidence threshold
            continue

        # Get relevant keypoint coordinates
        left_wrist = keypoints[LEFT_WRIST][:2]
        right_wrist = keypoints[RIGHT_WRIST][:2]
        left_shoulder = keypoints[LEFT_SHOULDER][:2]
        right_shoulder = keypoints[RIGHT_SHOULDER][:2]

        # Calculate body measurements for relative scaling
        shoulder_width = np.linalg.norm(right_shoulder - left_shoulder)

        # Calculate relative positions
        left_wrist_height = (
            get_relative_height(left_wrist, left_shoulder) / shoulder_width
        )
        right_wrist_height = (
            get_relative_height(right_wrist, right_shoulder) / shoulder_width
        )

        timestamp = frame_idx / fps

        # Start position: Hard-coded to frame 0
        if frame_idx == 0 and not serve_phases["start"]:
            serve_phases["start"] = True
            key_moments.append(
                {
                    "frame": int(frame_idx),
                    "timestamp": float(timestamp),
                    "label": "Start Position",
                    "confidence": float(np.mean(scores)) if scores is not None else 1.0,
                }
            )

        # Ball Release: When the ball leaves the left hand (needs ball detection data)
        elif (
            serve_phases["start"]
            and not serve_phases["ball_release"]
            and ball_detections
        ):
            # Find balls near the left wrist
            balls_near_left_wrist = []
            for ball in ball_detections:
                if ball["frame"] == frame_idx:
                    ball_x = (ball["bbox"][0] + ball["bbox"][2]) / 2
                    ball_y = (ball["bbox"][1] + ball["bbox"][3]) / 2
                    dist_to_left_wrist = np.sqrt(
                        (ball_x - left_wrist[0]) ** 2 + (ball_y - left_wrist[1]) ** 2
                    )
                    if dist_to_left_wrist < shoulder_width * 1.0:
                        balls_near_left_wrist.append(ball)

            # If we previously had balls near the left wrist and now we don't
            if len(balls_near_left_wrist) == 0 and left_wrist_height > 0.2:
                # Check if previous frames had balls near left wrist
                prev_balls_near_left_wrist = []
                for ball in ball_detections:
                    if frame_idx - 5 <= ball["frame"] < frame_idx:
                        ball_x = (ball["bbox"][0] + ball["bbox"][2]) / 2
                        ball_y = (ball["bbox"][1] + ball["bbox"][3]) / 2
                        dist_to_left_wrist_prev = np.sqrt(
                            (ball_x - left_wrist[0]) ** 2
                            + (ball_y - left_wrist[1]) ** 2
                        )
                        if dist_to_left_wrist_prev < shoulder_width * 1.0:
                            prev_balls_near_left_wrist.append(ball)

                if len(prev_balls_near_left_wrist) > 0:
                    serve_phases["ball_release"] = True
                    key_moments.append(
                        {
                            "frame": int(frame_idx),
                            "timestamp": float(timestamp),
                            "label": "Ball Release",
                            "confidence": (
                                float(np.mean(scores)) if scores is not None else 1.0
                            ),
                        }
                    )
                    print(
                        f"Detected Ball Release at frame {frame_idx}, timestamp {timestamp:.2f}"
                    )

        # Trophy Position: Left hand at its highest point
        elif (
            serve_phases["ball_release"]
            and not serve_phases["trophy"]
            and abs(left_wrist[1] - min_left_wrist_y) < 10
        ):
            serve_phases["trophy"] = True
            key_moments.append(
                {
                    "frame": int(frame_idx),
                    "timestamp": float(timestamp),
                    "label": "Trophy Position",
                    "confidence": float(np.mean(scores)) if scores is not None else 1.0,
                }
            )
            print(
                f"Detected Trophy Position at frame {frame_idx}, timestamp {timestamp:.2f}"
            )

        # Racket Low Point: After trophy position, when racket is closest to right hand and at highest position
        elif (
            serve_phases["trophy"]
            and not serve_phases["racket_low"]
            and racket_detections
        ):
            rackets_in_frame = [r for r in racket_detections if r["frame"] == frame_idx]
            if rackets_in_frame:
                # Method 1: Find racket closest to right hand
                min_dist = float("inf")
                closest_racket = None
                for racket in rackets_in_frame:
                    racket_x = (racket["bbox"][0] + racket["bbox"][2]) / 2
                    racket_y = (racket["bbox"][1] + racket["bbox"][3]) / 2
                    dist_x = abs(racket_x - right_wrist[0])
                    dist_y = racket_y - right_wrist[1]
                    # Racket should be below right hand but close horizontally
                    if dist_y > 0 and dist_x < shoulder_width * 0.5:
                        if dist_x < min_dist:
                            min_dist = dist_x
                            closest_racket = racket

                # Method 2: Find racket at highest position
                max_height = float("-inf")
                highest_racket = None
                for racket in rackets_in_frame:
                    racket_y = (racket["bbox"][1] + racket["bbox"][3]) / 2
                    if racket_y < max_height:
                        max_height = racket_y
                        highest_racket = racket

                # Use either method that detects a racket
                detected_racket = None
                if closest_racket:
                    detected_racket = closest_racket
                    print(
                        f"Detected Racket Low Point using closest racket method at frame {frame_idx}"
                    )
                elif highest_racket:
                    detected_racket = highest_racket
                    print(
                        f"Detected Racket Low Point using highest position method at frame {frame_idx}"
                    )

                if detected_racket:
                    serve_phases["racket_low"] = True
                    key_moments.append(
                        {
                            "frame": int(frame_idx),
                            "timestamp": float(timestamp),
                            "label": "Racket Low Point",
                            "confidence": float(detected_racket["confidence"]),
                            "detection_method": (
                                "closest"
                                if detected_racket == closest_racket
                                else "highest"
                            ),
                            "racket_position": {
                                "x": float(
                                    (
                                        detected_racket["bbox"][0]
                                        + detected_racket["bbox"][2]
                                    )
                                    / 2
                                ),
                                "y": float(
                                    (
                                        detected_racket["bbox"][1]
                                        + detected_racket["bbox"][3]
                                    )
                                    / 2
                                ),
                            },
                            "right_hand_position": {
                                "x": float(right_wrist[0]),
                                "y": float(right_wrist[1]),
                            },
                        }
                    )
                    print(
                        f"Detected Racket Low Point at frame {frame_idx}, timestamp {timestamp:.2f}"
                    )

        # Ball Impact: Detect when racket is at its highest position
        elif (
            serve_phases["racket_low"]
            and not serve_phases["impact"]
            and racket_detections
        ):
            # Find the global highest racket position across all frames
            highest_racket_info = None
            highest_racket_y = float("inf")
            highest_racket_frame = None

            # Examine all racket detections
            for racket in racket_detections:
                # Calculate the midpoint of the racket bounding box
                racket_y = (racket["bbox"][1] + racket["bbox"][3]) / 2
                racket_x = (racket["bbox"][0] + racket["bbox"][2]) / 2
                
                # Only consider rackets that are close to the right wrist
                if racket_y < highest_racket_y:
                    highest_racket_y = racket_y
                    highest_racket_info = racket
                    highest_racket_frame = racket["frame"]

            # If we found the highest racket, mark it as the impact moment
            if highest_racket_info:
                # Update frame and timestamp to the peak
                impact_frame = highest_racket_frame
                impact_timestamp = impact_frame / fps

                # Calculate racket position
                racket_x = (
                    highest_racket_info["bbox"][0] + highest_racket_info["bbox"][2]
                ) / 2

                serve_phases["impact"] = True
                key_moments.append(
                    {
                        "frame": int(impact_frame),
                        "timestamp": float(impact_timestamp),
                        "label": "Ball Impact",
                        "confidence": float(highest_racket_info["confidence"]),
                        "racket_position": {
                            "x": float(racket_x),
                            "y": float(highest_racket_y),
                        },
                        "right_hand_position": {
                            "x": float(right_wrist[0]),
                            "y": float(right_wrist[1]),
                        },
                    }
                )
                print(
                    f"Detected Ball Impact at frame {impact_frame}, timestamp {impact_timestamp:.2f} (global highest racket)"
                )

        # Follow Through: Right foot (ankle) at its highest position
        elif (
            serve_phases["impact"]
            and not serve_phases["follow_through"]
            and abs(right_ankle[1] - min_right_ankle_y) < 10
        ):
            serve_phases["follow_through"] = True
            key_moments.append(
                {
                    "frame": int(frame_idx),
                    "timestamp": float(timestamp),
                    "label": "Follow Through",
                    "confidence": float(np.mean(scores)) if scores is not None else 1.0,
                }
            )
            print(
                f"Detected Follow Through at frame {frame_idx}, timestamp {timestamp:.2f}"
            )

    # Sort key moments by frame index
    key_moments.sort(key=lambda x: x["frame"])

    # Print ball velocities for debugging
    print("\nBall Velocities:")
    for vel in ball_velocities:
        print(f"Frame {vel['frame']} ({vel['timestamp']:.2f}s):")
        print(f"  Velocity: {vel['velocity']}")
        print(f"  Magnitude: {vel['magnitude']:.2f} pixels/second")

    return key_moments


# def detect_ball_impact(ball_detections, frame_idx, key_moments, scores, fps):
#     current_balls = [b for b in ball_detections if b["frame"] == frame_idx]
#     prev_balls = [
#         b for b in ball_detections if frame_idx - 3 <= b["frame"] < frame_idx
#     ]

#     if current_balls and prev_balls:
#         # Calculate velocities between consecutive detections
#         velocities = []
#         for i in range(len(prev_balls)):
#             for curr_ball in current_balls:
#                 if curr_ball["track_id"] == prev_balls[i]["track_id"]:
#                     velocity = calculate_ball_velocity(
#                         prev_balls[i], curr_ball, fps
#                     )
#                     velocities.append(velocity)
#                     # Store velocity for debugging
#                     ball_velocities.append(
#                         {
#                             "frame": frame_idx,
#                             "timestamp": timestamp,
#                             "velocity": velocity.tolist(),
#                             "magnitude": float(np.linalg.norm(velocity)),
#                         }
#                     )

#         if velocities:
#             # Calculate average velocity change
#             avg_velocity = np.mean(velocities, axis=0)
#             avg_velocity_magnitude = np.linalg.norm(avg_velocity)

#             # Define impact threshold (adjust based on testing)
#             IMPACT_THRESHOLD = 500  # pixels per second

#             # Check if velocity change indicates impact
#             if avg_velocity_magnitude > IMPACT_THRESHOLD:
#                 serve_phases["impact"] = True
#                 # Get the ball that caused the impact
#                 impact_ball = current_balls[
#                     0
#                 ]  # Use the first ball in current frame
#                 key_moments.append(
#                     {
#                         "frame": int(frame_idx),
#                         "timestamp": float(timestamp),
#                         "label": "Ball Impact",
#                         "confidence": (
#                             float(np.mean(scores))
#                             if scores is not None
#                             else 1.0
#                         ),
#                         "ball_position": {
#                             "x": float(
#                                 (
#                                     impact_ball["bbox"][0]
#                                     + impact_ball["bbox"][2]
#                                 )
#                                 / 2
#                             ),
#                             "y": float(
#                                 (
#                                     impact_ball["bbox"][1]
#                                     + impact_ball["bbox"][3]
#                                 )
#                                 / 2
#                             ),
#                         },
#                         "ball_velocity": {
#                             "vector": avg_velocity.tolist(),
#                             "magnitude": float(avg_velocity_magnitude),
#                         },
#                         "previous_velocities": [
#                             {
#                                 "frame": vel["frame"],
#                                 "timestamp": vel["timestamp"],
#                                 "velocity": vel["velocity"],
#                                 "magnitude": vel["magnitude"],
#                             }
#                             for vel in ball_velocities[
#                                 -3:
#                             ]  # Last 3 velocities before impact
#                         ],
#                     }
#                 )
#                 print(
#                     f"Detected Ball Impact at frame {frame_idx}, timestamp {timestamp:.2f}"
#                 )

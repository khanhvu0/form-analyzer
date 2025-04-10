import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity as RNTouchableOpacity, Modal } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');

export default function Analysis() {
  const { firstVideo, secondVideo } = useVideo();
  const firstVideoRef = useRef<Video>(null);
  const secondVideoRef = useRef<Video>(null);
  const firstProgressTrackRef = useRef<View>(null);
  const secondProgressTrackRef = useRef<View>(null);
  const [firstPosition, setFirstPosition] = useState(0);
  const [secondPosition, setSecondPosition] = useState(0);
  const [firstDuration, setFirstDuration] = useState(0);
  const [secondDuration, setSecondDuration] = useState(0);
  const [firstIsPaused, setFirstIsPaused] = useState(true);
  const [secondIsPaused, setSecondIsPaused] = useState(true);
  const [selectedKeypoint, setSelectedKeypoint] = useState<KeypointInfo | null>(null);

  interface KeypointInfo {
    frame: number;
    timestamp: number;
    label: string;
    confidence: number;
    position?: { x: number; y: number };
    videoIndex: number;
  }

  if (!firstVideo || !secondVideo) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideoText}>
          Both videos are required for comparison. Please upload both videos first.
        </Text>
      </View>
    );
  }

  const handleFirstVideoStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setFirstPosition(status.positionMillis);
      setFirstDuration(status.durationMillis || 0);
      setFirstIsPaused(!status.isPlaying);
    }
  };

  const handleSecondVideoStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setSecondPosition(status.positionMillis);
      setSecondDuration(status.durationMillis || 0);
      setSecondIsPaused(!status.isPlaying);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const stepVideoFrame = async (videoRef: React.RefObject<Video>, currentPosition: number, forward: boolean) => {
    if (videoRef.current) {
      // Move approximately 1/30th of a second (33ms) for a frame
      const frameTime = 33;
      const newPosition = forward ? 
        currentPosition + frameTime : 
        Math.max(0, currentPosition - frameTime);
      
      await videoRef.current.pauseAsync();
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const seekVideoPosition = (videoRef: React.RefObject<Video>, trackRef: React.RefObject<View>, event: any, totalDuration: number) => {
    if (videoRef.current && trackRef.current) {
      const { locationX } = event.nativeEvent;
      
      // Using measure to get width
      trackRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calculate the percentage of the width that was tapped
        const percentage = Math.min(Math.max(locationX / width, 0), 1);
        
        // Calculate the new position in milliseconds
        const newPosition = percentage * totalDuration;
        
        // Seek to the new position
        videoRef.current?.setPositionAsync(newPosition);
      });
    }
  };

  const handleKeypointPress = (keypoint: KeypointInfo) => {
    // Pause the video
    if (keypoint.videoIndex === 1) {
      firstVideoRef.current?.pauseAsync();
      // Seek to the keypoint timestamp
      firstVideoRef.current?.setPositionAsync(keypoint.timestamp * 1000);
    } else {
      secondVideoRef.current?.pauseAsync();
      // Seek to the keypoint timestamp
      secondVideoRef.current?.setPositionAsync(keypoint.timestamp * 1000);
    }
    
    // Show the popup
    setSelectedKeypoint(keypoint);
  };

  const renderKeypoints = (moments: any[], duration: number, videoIndex: number) => {
    if (!moments || !duration) return null;

    return moments.map((keypoint, index) => {
      // Calculate position as percentage of the progress bar
      const position = (keypoint.timestamp * 1000) / duration;
      
      // Get current video position
      const currentPosition = videoIndex === 1 ? firstPosition : secondPosition;
      const currentPositionPercent = currentPosition / duration;
      
      // Calculate the actual position of the keypoint relative to the progress bar
      const keypointPosition = Math.min(position, currentPositionPercent);
      
      return (
        <RNTouchableOpacity
          key={`keypoint-${videoIndex}-${index}`}
          style={[
            styles.keypointDot,
            { 
              left: `${keypointPosition * 100}%`,
              transform: [{ translateX: -8 }], // Center the dot (half of dot width)
            }
          ]}
          onPress={() => handleKeypointPress({
            ...keypoint,
            position: { x: position * 100, y: 0 },
            videoIndex
          })}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* First Video Section */}
      <View style={styles.videoSection}>
        <Video
          ref={firstVideoRef}
          source={{ uri: firstVideo.uri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handleFirstVideoStatus}
          isLooping={false}
        />
        
        <View style={styles.overlayControls}>
          {/* Video Label */}
          <Text style={styles.videoLabel}>Video 1</Text>
          
          {/* Play Button Overlay */}
          <View style={styles.playButtonOverlayContainer}>
            <RNTouchableOpacity
              style={styles.playButtonOverlay}
              onPress={() => {
                if (firstIsPaused) {
                  firstVideoRef.current?.playAsync();
                } else {
                  firstVideoRef.current?.pauseAsync();
                }
              }}
            >
              <MaterialIcons
                name={firstIsPaused ? "play-arrow" : "pause"}
                size={48}
                color="white"
              />
            </RNTouchableOpacity>
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatTime(firstPosition)}</Text>
            
            <View style={styles.progressContainer}>
              <RNTouchableOpacity 
                style={{ width: '100%' }}
                onPress={(event) => seekVideoPosition(firstVideoRef, firstProgressTrackRef, event, firstDuration)}
              >
                <View 
                  ref={firstProgressTrackRef}
                  style={styles.progressTrack}
                >
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(firstPosition / firstDuration) * 100}%` }
                    ]} 
                  />
                </View>
              </RNTouchableOpacity>
              
              {/* Keypoint dots for first video */}
              {renderKeypoints(firstVideo.moments, firstDuration, 1)}
            </View>
            
            <Text style={styles.timeText}>{formatTime(firstDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Second Video Section */}
      <View style={styles.videoSection}>
        <Video
          ref={secondVideoRef}
          source={{ uri: secondVideo.uri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handleSecondVideoStatus}
          isLooping={false}
        />
        
        <View style={styles.overlayControls}>
          {/* Video Label */}
          <Text style={styles.videoLabel}>Video 2</Text>
          
          {/* Play Button Overlay */}
          <View style={styles.playButtonOverlayContainer}>
            <RNTouchableOpacity
              style={styles.playButtonOverlay}
              onPress={() => {
                if (secondIsPaused) {
                  secondVideoRef.current?.playAsync();
                } else {
                  secondVideoRef.current?.pauseAsync();
                }
              }}
            >
              <MaterialIcons
                name={secondIsPaused ? "play-arrow" : "pause"}
                size={48}
                color="white"
              />
            </RNTouchableOpacity>
          </View>
          
          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatTime(secondPosition)}</Text>
            
            <View style={styles.progressContainer}>
              <RNTouchableOpacity 
                style={{ width: '100%' }}
                onPress={(event) => seekVideoPosition(secondVideoRef, secondProgressTrackRef, event, secondDuration)}
              >
                <View 
                  ref={secondProgressTrackRef}
                  style={styles.progressTrack}
                >
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(secondPosition / secondDuration) * 100}%` }
                    ]} 
                  />
                </View>
              </RNTouchableOpacity>
              
              {/* Keypoint dots for second video */}
              {renderKeypoints(secondVideo.moments, secondDuration, 2)}
            </View>
            
            <Text style={styles.timeText}>{formatTime(secondDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Keypoint Popup */}
      {selectedKeypoint && (
        <RNTouchableOpacity 
          style={styles.keypointPopupOverlay}
          activeOpacity={1}
          onPress={() => setSelectedKeypoint(null)}
        >
          <View style={styles.keypointPopup}>
            <Text style={styles.keypointLabel}>{selectedKeypoint.label}</Text>
            <Text style={styles.keypointDetail}>
              Confidence: {Math.round(selectedKeypoint.confidence * 100)}%
            </Text>
            <Text style={styles.keypointDetail}>
              Time: {formatTime(selectedKeypoint.timestamp * 1000)}
            </Text>
          </View>
        </RNTouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  noVideoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  videoSection: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: screenWidth,
    height: '100%',
  },
  overlayControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  videoLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playButtonOverlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  progressContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  keypointDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    top: '50%',
    marginTop: -8,
    zIndex: 10,
  },
  keypointPopupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  keypointPopup: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  keypointLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  keypointDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 
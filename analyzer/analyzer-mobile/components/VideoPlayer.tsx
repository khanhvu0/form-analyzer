import React, { useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoPlayerProps {
  uri: string;
}

/**
 * Simple video player with native controls
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ uri }) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  // Match the aspect ratio in the reference image (portrait/mobile style)
  const playerWidth = Math.min(screenWidth * 0.9, 400);
  const playerHeight = playerWidth * 1.78; // Approximately 9:16 aspect ratio
  
  // Format time display (MM:SS)
  const formatTime = (milliseconds: number = 0) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };
  
  // Get video filename to display at the top
  const videoFileName = uri.split('/').pop() || "";
  
  // Get position and duration
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 0;
  
  return (
    <View style={styles.container}>
      <Text style={styles.videoTitle}>{videoFileName}</Text>
      
      <View style={[styles.playerContainer, { width: playerWidth, height: playerHeight }]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            setStatus(status);
            setIsPlaying(status.isLoaded ? status.isPlaying : false);
          }}
        />
        
        {/* Control bar at bottom */}
        <View style={styles.controlsBar}>
          <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  playerContainer: {
    borderRadius: 0, // No rounded corners in the reference
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  playButton: {
    paddingRight: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VideoPlayer; 
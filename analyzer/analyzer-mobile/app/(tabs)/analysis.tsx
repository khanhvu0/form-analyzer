import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import { Video, ResizeMode } from 'expo-av';

export default function AnalysisScreen() {
  const { firstVideo, secondVideo } = useVideo();

  if (!firstVideo || !secondVideo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: firstVideo.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay={false}
          isLooping={false}
        />
        <Text style={styles.videoLabel}>Video 1</Text>
      </View>

      <View style={styles.videoContainer}>
        <Video
          source={{ uri: secondVideo.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay={false}
          isLooping={false}
        />
        <Text style={styles.videoLabel}>Video 2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 
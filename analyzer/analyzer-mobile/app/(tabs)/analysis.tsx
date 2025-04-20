import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

export default function AnalysisScreen() {
  const { firstVideo, secondVideo } = useVideo();
  const [activeTab, setActiveTab] = useState<'videos' | 'moments'>('videos');
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const firstVideoRef = useRef<Video>(null);
  const secondVideoRef = useRef<Video>(null);

  // Debug logs
  useEffect(() => {
    console.log('AnalysisScreen rendered with videos:');
    console.log('First video:', firstVideo);
    console.log('Second video:', secondVideo);
    console.log('First video moments:', firstVideo?.moments);
    console.log('Second video moments:', secondVideo?.moments);
  }, [firstVideo, secondVideo]);

  // Define key moments labels in the order they should appear
  const keyMomentLabels = [
    'Start Position',
    'Ball Release',
    'Trophy Position',
    'Racket Low Point',
    'Ball Impact',
    'Follow Through'
  ];

  // Function to find moment by label
  const findMomentByLabel = (video: any, label: string) => {
    if (!video || !video.moments) return null;
    const found = video.moments.find((m: any) => m.label === label) || null;
    console.log(`Finding moment "${label}" in ${video.label}:`, found);
    return found;
  };

  // Function to seek to specific frame/time
  const seekToMoment = async (moment: any) => {
    if (!moment) return;
    
    try {
      console.log(`Seeking to moment:`, moment);
      // Calculate milliseconds from seconds for expo-av
      const positionMillis = moment.timestamp * 1000;
      
      if (firstVideoRef.current) {
        await firstVideoRef.current.setPositionAsync(positionMillis);
      }
      
      if (secondVideoRef.current) {
        await secondVideoRef.current.setPositionAsync(positionMillis);
      }
    } catch (error) {
      console.error('Error seeking to moment:', error);
    }
  };

  // Effect to handle moment selection
  useEffect(() => {
    if (!selectedMoment) return;
    console.log('Selected moment changed to:', selectedMoment);
    
    const firstMoment = findMomentByLabel(firstVideo, selectedMoment);
    const secondMoment = findMomentByLabel(secondVideo, selectedMoment);
    
    if (firstMoment) {
      seekToMoment(firstMoment);
    }
    
    if (secondMoment) {
      seekToMoment(secondMoment);
    }
  }, [selectedMoment]);

  if (!firstVideo || !secondVideo) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="videocam-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No videos available</Text>
        <Text style={styles.emptySubText}>Please upload and process videos first</Text>
      </View>
    );
  }

  const renderVideoSection = () => {
    return (
      <View style={styles.videoSection}>
        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{firstVideo.label || 'Front View'}</Text>
          {firstVideo.processedUri ? (
            <Video
              ref={firstVideoRef}
              source={{ uri: firstVideo.processedUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          ) : (
            <Video
              ref={firstVideoRef}
              source={{ uri: firstVideo.uri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          )}
        </View>

        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{secondVideo.label || 'Side View'}</Text>
          {secondVideo.processedUri ? (
            <Video
              ref={secondVideoRef}
              source={{ uri: secondVideo.processedUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          ) : (
            <Video
              ref={secondVideoRef}
              source={{ uri: secondVideo.uri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          )}
        </View>
      </View>
    );
  };

  const renderMomentsSection = () => {
    // Add additional logging for easier debugging
    console.log('Rendering moments section');
    console.log('First video moments:', firstVideo?.moments);
    console.log('Second video moments:', secondVideo?.moments);
    
    // Check if moments data exists and is valid
    const hasMoments = 
      firstVideo?.moments && 
      Array.isArray(firstVideo.moments) && 
      secondVideo?.moments && 
      Array.isArray(secondVideo.moments);
    
    // Additional check if any moments actually exist in the arrays
    const hasAnyMoments = 
      hasMoments && 
      ((firstVideo.moments?.length ?? 0) > 0 || (secondVideo.moments?.length ?? 0) > 0);
      
    console.log('Has valid moments data structure:', hasMoments);
    console.log('Has any actual moments:', hasAnyMoments);
    
    if (!hasAnyMoments) {
      return (
        <View style={styles.emptyMomentsContainer}>
          <Text style={styles.emptyMomentsText}>No key moments available</Text>
          <Text style={styles.emptyMomentsSubText}>Process the videos to see key moments</Text>
        </View>
      );
    }

    return (
      <View style={styles.momentsContainer}>
        {/* Display Videos */}
        <View style={styles.keyMomentVideosContainer}>
          <View style={styles.keyMomentVideoContainer}>
            <Text style={styles.momentVideoLabel}>{firstVideo.label || 'Front View'}</Text>
            {firstVideo.processedUri ? (
              <Video
                ref={firstVideoRef}
                source={{ uri: firstVideo.processedUri }}
                style={styles.momentVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                isLooping={false}
              />
            ) : (
              <Video
                ref={firstVideoRef}
                source={{ uri: firstVideo.uri }}
                style={styles.momentVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                isLooping={false}
              />
            )}
          </View>
          
          <View style={styles.keyMomentVideoContainer}>
            <Text style={styles.momentVideoLabel}>{secondVideo.label || 'Side View'}</Text>
            {secondVideo.processedUri ? (
              <Video
                ref={secondVideoRef}
                source={{ uri: secondVideo.processedUri }}
                style={styles.momentVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                isLooping={false}
              />
            ) : (
              <Video
                ref={secondVideoRef}
                source={{ uri: secondVideo.uri }}
                style={styles.momentVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                isLooping={false}
              />
            )}
          </View>
        </View>

        {/* Key Moment Buttons */}
        <View style={styles.keyMomentButtonsContainer}>
          {keyMomentLabels.map((label) => {
            const firstMoment = findMomentByLabel(firstVideo, label);
            const secondMoment = findMomentByLabel(secondVideo, label);
            const isAvailable = firstMoment || secondMoment;
            const isSelected = selectedMoment === label;
            
            return (
              <TouchableOpacity 
                key={label}
                style={[
                  styles.keyMomentButton, 
                  isSelected && styles.selectedKeyMomentButton,
                  !isAvailable && styles.disabledKeyMomentButton
                ]}
                onPress={() => {
                  if (isAvailable) {
                    setSelectedMoment(label);
                  }
                }}
                disabled={!isAvailable}
              >
                <Text 
                  style={[
                    styles.keyMomentButtonText,
                    isSelected && styles.selectedKeyMomentButtonText,
                    !isAvailable && styles.disabledKeyMomentButtonText
                  ]}
                >
                  {label}
                </Text>
                {firstMoment && (
                  <Text style={styles.keyMomentTimestamp}>
                    {firstMoment.timestamp.toFixed(1)}s
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]} 
          onPress={() => setActiveTab('videos')}
        >
          <MaterialIcons 
            name="videocam" 
            size={24} 
            color={activeTab === 'videos' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
            Videos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'moments' && styles.activeTab]} 
          onPress={() => setActiveTab('moments')}
        >
          <MaterialIcons 
            name="timeline" 
            size={24} 
            color={activeTab === 'moments' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'moments' && styles.activeTabText]}>
            Key Moments
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'videos' ? renderVideoSection() : renderMomentsSection()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  videoSection: {
    flex: 1,
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
    zIndex: 10,
  },
  momentsContainer: {
    flex: 1,
  },
  emptyMomentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMomentsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  emptyMomentsSubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  momentsSection: {
    marginBottom: 24,
  },
  momentsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  momentItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  momentLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  momentConfidence: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  momentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  momentFrame: {
    fontSize: 14,
    color: '#666',
  },
  // New styles for key moments tab
  keyMomentVideosContainer: {
    flex: 2,
  },
  keyMomentVideoContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  momentVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  momentVideoLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
  },
  keyMomentButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  keyMomentButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectedKeyMomentButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  disabledKeyMomentButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.7,
  },
  keyMomentButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedKeyMomentButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  disabledKeyMomentButtonText: {
    color: '#999',
  },
  keyMomentTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  }
}); 
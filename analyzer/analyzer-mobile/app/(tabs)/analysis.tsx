import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideo, VideoData } from '../../context/VideoContext';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import KeyMomentsDisplay from '../../components/KeyMomentsDisplay';

export default function AnalysisScreen() {
  const { firstVideo, secondVideo } = useVideo();
  
  const [activeTab, setActiveTab] = useState<'videos' | 'moments'>('videos');

  const video1 = firstVideo;
  const video2 = secondVideo;

  if (!video1 || !video2) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="videocam-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No videos available</Text>
        <Text style={styles.emptySubText}>Please upload and process videos first</Text>
      </View>
    );
  }
  
  const renderVideoSection = () => {
    if (!video1 || !video2) return null;

    return (
      <View style={styles.videoSection}>
        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{video1.label || 'Video 1'}</Text>
          <Video
            source={{ uri: video1.processedUri || video1.uri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
            isLooping={false}
          />
        </View>

        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{video2.label || 'Video 2'}</Text>
          <Video
            source={{ uri: video2.processedUri || video2.uri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
            isLooping={false}
          />
        </View>
      </View>
    );
  };

  const renderMomentsSection = () => {
    if (!video1 || !video2) return null;

    if (!video1.moments || !video2.moments || video1.moments.length === 0 || video2.moments.length === 0) {
       return (
        <View style={styles.emptyMomentsContainer}>
          <Text style={styles.emptyMomentsText}>No key moments available</Text>
          <Text style={styles.emptyMomentsSubText}>Process the videos to generate key moments</Text>
        </View>
      );
    }

    return (
      <KeyMomentsDisplay 
        video1={video1}
        video2={video2}
      />
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
    textAlign: 'center',
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
    minHeight: 250, 
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
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
    textAlign: 'center',
  },
  emptyMomentsSubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
}); 
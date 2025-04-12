import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

export default function AnalysisScreen() {
  const { firstVideo, secondVideo } = useVideo();
  const [activeTab, setActiveTab] = useState<'videos' | 'moments'>('videos');

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
              source={{ uri: firstVideo.processedUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          ) : (
            <Video
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
              source={{ uri: secondVideo.processedUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
              isLooping={false}
            />
          ) : (
            <Video
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
    if (!firstVideo.moments || !secondVideo.moments) {
      return (
        <View style={styles.emptyMomentsContainer}>
          <Text style={styles.emptyMomentsText}>No key moments available</Text>
          <Text style={styles.emptyMomentsSubText}>Process the videos to see key moments</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.momentsContainer}>
        <View style={styles.momentsSection}>
          <Text style={styles.momentsTitle}>{firstVideo.label || 'Front View'} Key Moments</Text>
          {firstVideo.moments.map((moment, index) => (
            <View key={`front-${index}`} style={styles.momentItem}>
              <View style={styles.momentHeader}>
                <Text style={styles.momentLabel}>{moment.label}</Text>
                <Text style={styles.momentConfidence}>{(moment.confidence * 100).toFixed(1)}%</Text>
              </View>
              <Text style={styles.momentTime}>Time: {moment.timestamp.toFixed(1)}s</Text>
              <Text style={styles.momentFrame}>Frame: {moment.frame}</Text>
            </View>
          ))}
        </View>

        <View style={styles.momentsSection}>
          <Text style={styles.momentsTitle}>{secondVideo.label || 'Side View'} Key Moments</Text>
          {secondVideo.moments.map((moment, index) => (
            <View key={`side-${index}`} style={styles.momentItem}>
              <View style={styles.momentHeader}>
                <Text style={styles.momentLabel}>{moment.label}</Text>
                <Text style={styles.momentConfidence}>{(moment.confidence * 100).toFixed(1)}%</Text>
              </View>
              <Text style={styles.momentTime}>Time: {moment.timestamp.toFixed(1)}s</Text>
              <Text style={styles.momentFrame}>Frame: {moment.frame}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
    padding: 16,
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
}); 
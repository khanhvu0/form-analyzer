import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import VideoPlayer from '../../components/VideoPlayer';

export default function Analysis() {
  const { currentVideo } = useVideo();

  if (!currentVideo) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideoText}>
          No video selected. Please upload a video first.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.videoContainer}>
        <VideoPlayer uri={currentVideo.uri} />
      </View>
      <View style={styles.momentsContainer}>
        <Text style={styles.sectionTitle}>Key Moments</Text>
        {currentVideo.moments.map((moment, index) => (
          <View key={index} style={styles.momentCard}>
            <View style={styles.momentHeader}>
              <Text style={styles.momentLabel}>{moment.label}</Text>
              <View style={[
                styles.confidenceBadge,
                {
                  backgroundColor: moment.confidence > 0.7 ? '#22c55e' :
                    moment.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                }
              ]}>
                <Text style={styles.confidenceText}>
                  {(moment.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>
              Time: {moment.timestamp.toFixed(2)}s
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  noVideoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  videoContainer: {
    width: '100%',
  },
  momentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  momentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    color: '#1a1a1a',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
}); 
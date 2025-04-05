import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import VideoUpload from '../../components/VideoUpload';
import { useVideo } from '../../context/VideoContext';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Home() {
  const router = useRouter();
  const { setCurrentVideo } = useVideo();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: any[]) => {
    try {
      if (files.length === 0) {
        Alert.alert('Error', 'Please select a video file.');
        return;
      }

      const file = files[0];
      
      // Basic file validation
      if (!file.uri || !file.name) {
        Alert.alert('Error', 'Invalid file selected.');
        return;
      }

      setIsUploading(true);

      // Here you would typically upload the files to your backend
      // For now, we'll just simulate the upload and generate mock moments
      const mockMoments = Array.from({ length: 5 }, (_, i) => ({
        frame: Math.floor(Math.random() * 1000),
        timestamp: i * 30, // Every 30 seconds
        label: 'Serve',
        confidence: 0.85 + Math.random() * 0.15,
      }));

      // Update video context
      setCurrentVideo({
        uri: file.uri,
        moments: mockMoments,
      });

      // Navigate to analysis screen
      router.push('/analysis');
    } catch (error) {
      Alert.alert('Error', 'Failed to process video. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analyzer</Text>
        <Text style={styles.subtitle}>Upload a video to analyze your form</Text>
      </View>
      <View style={styles.uploadContainer}>
        <VideoUpload onUpload={handleUpload} isUploading={isUploading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  uploadContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

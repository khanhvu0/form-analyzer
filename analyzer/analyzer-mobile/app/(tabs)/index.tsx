import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import VideoUpload from '../../components/VideoUpload';
import { useVideo } from '../../context/VideoContext';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Home() {
  const router = useRouter();
  const { firstVideo, secondVideo, setFirstVideo, setSecondVideo } = useVideo();
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);
  const [firstFileName, setFirstFileName] = useState('');
  const [secondFileName, setSecondFileName] = useState('');

  const handleFirstVideoUpload = async (files: any[]) => {
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

      setIsUploading1(true);

      // Store the file name
      setFirstFileName(file.name);

      // Here you would typically upload the files to your backend
      // For now, we'll just simulate the upload and generate mock moments
      const mockMoments = Array.from({ length: 5 }, (_, i) => ({
        frame: Math.floor(Math.random() * 1000),
        timestamp: i * 30, // Every 30 seconds
        label: 'Serve',
        confidence: 0.85 + Math.random() * 0.15,
      }));

      // Update video context
      setFirstVideo({
        uri: file.uri,
        moments: mockMoments,
      });

      checkAndNavigate();
    } catch (error) {
      Alert.alert('Error', 'Failed to process video. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading1(false);
    }
  };

  const handleSecondVideoUpload = async (files: any[]) => {
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

      setIsUploading2(true);

      // Store the file name
      setSecondFileName(file.name);

      // Here you would typically upload the files to your backend
      // For now, we'll just simulate the upload and generate mock moments
      const mockMoments = Array.from({ length: 5 }, (_, i) => ({
        frame: Math.floor(Math.random() * 1000),
        timestamp: i * 30, // Every 30 seconds
        label: 'Serve',
        confidence: 0.85 + Math.random() * 0.15,
      }));

      // Update video context
      setSecondVideo({
        uri: file.uri,
        moments: mockMoments,
      });

      checkAndNavigate();
    } catch (error) {
      Alert.alert('Error', 'Failed to process video. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading2(false);
    }
  };

  const checkAndNavigate = () => {
    // Only navigate to analysis if both videos are uploaded
    if (firstVideo && secondVideo) {
      router.push('/analysis');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analyzer</Text>
        <Text style={styles.subtitle}>Upload two videos to compare your form</Text>
      </View>
      <View style={styles.uploadContainer}>
        <Text style={styles.uploadLabel}>First Video</Text>
        <VideoUpload 
          onUpload={handleFirstVideoUpload} 
          isUploading={isUploading1}
          isUploaded={!!firstVideo}
          fileName={firstFileName}
        />
        
        <Text style={[styles.uploadLabel, styles.secondLabel]}>Second Video</Text>
        <VideoUpload 
          onUpload={handleSecondVideoUpload} 
          isUploading={isUploading2}
          isUploaded={!!secondVideo}
          fileName={secondFileName}
        />
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
  },
  uploadLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  secondLabel: {
    marginTop: 20,
  },
});

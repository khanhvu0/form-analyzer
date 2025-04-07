import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import VideoUpload from '../../components/VideoUpload';
import VideoPlayer from '../../components/VideoPlayer';
import { useVideo } from '../../context/VideoContext';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function Home() {
  const router = useRouter();
  const { setCurrentVideo } = useVideo();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<{ uri: string; name: string } | null>(null);

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

      // Set the uploaded video for preview
      setUploadedVideo({
        uri: file.uri,
        name: file.name
      });
      
      setIsUploading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to process video. Please try again.');
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!uploadedVideo) return;
    
    // Generate mock moments as before
    const mockMoments = Array.from({ length: 5 }, (_, i) => ({
      frame: Math.floor(Math.random() * 1000),
      timestamp: i * 30, // Every 30 seconds
      label: 'Serve',
      confidence: 0.85 + Math.random() * 0.15,
    }));

    // Update video context
    setCurrentVideo({
      uri: uploadedVideo.uri,
      moments: mockMoments,
    });

    // Navigate to analysis screen
    router.push('/analysis');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analyzer</Text>
        <Text style={styles.subtitle}>Upload a video to analyze your form</Text>
      </View>
      
      <View style={styles.uploadContainer}>
        {!uploadedVideo ? (
          <VideoUpload onUpload={handleUpload} isUploading={isUploading} />
        ) : (
          <View style={styles.videoPreviewContainer}>
            <Text style={styles.videoTitle}>{uploadedVideo.name}</Text>
            
            <VideoPlayer uri={uploadedVideo.uri} />
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.changeButton]} 
                onPress={() => setUploadedVideo(null)}
              >
                <Text style={styles.buttonText}>Change Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.analyzeButton]} 
                onPress={handleAnalyze}
              >
                <Text style={styles.buttonText}>Analyze Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 30,
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
    padding: 20,
  },
  videoPreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  changeButton: {
    backgroundColor: '#6c757d',
  },
  analyzeButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import VideoUpload from '../../components/VideoUpload';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TabOneScreen() {
  const router = useRouter();
  const { 
    firstVideo, 
    secondVideo, 
    handleFirstVideoUpload, 
    handleSecondVideoUpload,
    handleRemoveFirstVideo,
    handleRemoveSecondVideo,
    isUploading1,
    isUploading2,
    processVideos,
    isProcessing
  } = useVideo();

  const canProcess = firstVideo && secondVideo && !isProcessing;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analyzer</Text>
        <Text style={styles.subtitle}>Upload two videos to compare your form and then go to the analysis page.</Text>
        <TouchableOpacity 
          style={styles.exampleButton}
          onPress={() => router.push('/example')}
        >
          <Text style={styles.exampleButtonText}>Show Example</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.uploadContainer}>
        <Text style={styles.uploadLabel}>First Video</Text>
        <VideoUpload 
          onUpload={handleFirstVideoUpload} 
          isUploading={isUploading1}
          isUploaded={!!firstVideo}
          onRemove={handleRemoveFirstVideo}
        />

        <Text style={[styles.uploadLabel, styles.secondLabel]}>Second Video</Text>
        <VideoUpload 
          onUpload={handleSecondVideoUpload} 
          isUploading={isUploading2}
          isUploaded={!!secondVideo}
          onRemove={handleRemoveSecondVideo}
        />

        {canProcess && (
          <TouchableOpacity 
            style={styles.processButton}
            onPress={processVideos}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={styles.processButtonText}>Process Videos</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.processingText}>Processing videos...</Text>
            <Text style={styles.processingSubText}>This may take a few minutes</Text>
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
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  exampleButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  exampleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadContainer: {
    padding: 20,
  },
  uploadLabel: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  secondLabel: {
    marginTop: 32,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 16,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
  },
  processingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  }
});

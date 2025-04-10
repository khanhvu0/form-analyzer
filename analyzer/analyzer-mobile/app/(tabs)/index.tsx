import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useVideo } from '../../context/VideoContext';
import VideoUpload from '../../components/VideoUpload';

export default function TabOneScreen() {
  const { 
    firstVideo, 
    secondVideo, 
    handleFirstVideoUpload, 
    handleSecondVideoUpload,
    handleRemoveFirstVideo,
    handleRemoveSecondVideo,
    isUploading1,
    isUploading2
  } = useVideo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Form Analyzer</Text>
        <Text style={styles.subtitle}>Upload two videos to compare your form and then go to the analysis page.</Text>
      </View>

      <View style={styles.uploadContainer}>
        <Text style={styles.uploadLabel}>First Video</Text>
        <VideoUpload 
          onUpload={handleFirstVideoUpload} 
          isUploading={isUploading1}
          isUploaded={!!firstVideo}
          fileName={firstVideo?.name}
          onRemove={handleRemoveFirstVideo}
        />

        <Text style={[styles.uploadLabel, styles.secondLabel]}>Second Video</Text>
        <VideoUpload 
          onUpload={handleSecondVideoUpload} 
          isUploading={isUploading2}
          isUploaded={!!secondVideo}
          fileName={secondVideo?.name}
          onRemove={handleRemoveSecondVideo}
        />
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
  }
});

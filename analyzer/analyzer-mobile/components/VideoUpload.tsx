import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions, VideoExportPreset, requestMediaLibraryPermissionsAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoUploadProps {
  onUpload: (files: Array<{ uri: string; name: string; type: string }>) => void;
  isUploading?: boolean;
  isUploaded?: boolean;
  onRemove?: () => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onUpload, 
  isUploading = false, 
  isUploaded = false,
  onRemove
}) => {
  console.log('VideoUpload rendering with props:', { onUpload, isUploading, isUploaded });

  const handleGalleryPick = async () => {
    console.log('handleGalleryPick called');
    try {
      const { status } = await requestMediaLibraryPermissionsAsync();
      console.log('Gallery permission status:', status);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
        videoExportPreset: VideoExportPreset.MediumQuality,
      });

      console.log('Gallery picker result:', result);
      if (result.canceled) {
        console.log('Gallery picker cancelled');
        return;
      }

      const files = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'video',
        type: 'video/mp4',
      }));

      console.log('Calling onUpload with files:', files);
      onUpload(files);
    } catch (err) {
      console.error('Error picking video:', err);
      Alert.alert('Error', 'Failed to pick video from gallery');
    }
  };

  const handleCameraRecord = async () => {
    try {
      const { status } = await requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
        return;
      }
      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Videos,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (result.canceled) {
        return;
      }

      const files = result.assets.map(asset => ({
        uri: asset.uri,
        name: `recorded-${new Date().getTime()}.mp4`,
        type: 'video/mp4',
      }));

      onUpload(files);
    } catch (err) {
      console.error('Error recording video:', err);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  // Display different UI based on the upload state
  if (isUploaded) {
    return (
      <View style={[styles.container, styles.uploadedContainer]}>
        <View style={styles.checkmarkCircle}>
          <MaterialIcons name="check" size={36} color="#fff" />
        </View>
        <Text style={styles.uploadedText}>
          Video Uploaded Successfully
        </Text>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={handleRemove}
        >
          <MaterialIcons name="delete" size={20} color="#d32f2f" />
          <Text style={styles.removeButtonText}>Remove Video</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Video</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleCameraRecord}
          disabled={isUploading}
        >
          <MaterialIcons name="videocam" size={32} color="#333" />
          <Text style={styles.optionText}>Record Video</Text>
          <Text style={styles.optionSubText}>Use your camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleGalleryPick}
          disabled={isUploading}
        >
          <MaterialIcons name="photo-library" size={32} color="#333" />
          <Text style={styles.optionText}>Select from Gallery</Text>
          <Text style={styles.optionSubText}>Choose existing video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    minHeight: 200,
    width: '100%',
  },
  uploadedContainer: {
    borderColor: '#4CAF50',
    borderStyle: 'solid',
    backgroundColor: '#f1f8e9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  optionSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#ffebee',
  },
  removeButtonText: {
    color: '#d32f2f',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default VideoUpload; 
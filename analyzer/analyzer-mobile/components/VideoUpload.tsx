import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoUploadProps {
  onUpload: (files: any[]) => void;
  isUploading?: boolean;
  isUploaded?: boolean;
  fileName?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onUpload, 
  isUploading = false, 
  isUploaded = false,
  fileName = ''
}) => {
  const handleFilePick = async () => {
    if (isUploaded) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        multiple: true,
      });

      if (result.canceled) {
        return;
      }

      const files = result.assets.map(file => ({
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      }));

      onUpload(files);
    } catch (err) {
      console.error('Error picking document:', err);
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
        {fileName ? (
          <Text style={styles.fileName}>{fileName}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleFilePick}
      disabled={isUploading}
    >
      <MaterialIcons name="cloud-upload" size={48} color="#666" />
      <Text style={styles.text}>
        {isUploading ? 'Uploading...' : 'Tap to upload videos'}
      </Text>
      <Text style={styles.subText}>
        Supported formats: MP4, MOV, AVI
      </Text>
    </TouchableOpacity>
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
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
  fileName: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    maxWidth: '100%',
  }
});

export default VideoUpload; 
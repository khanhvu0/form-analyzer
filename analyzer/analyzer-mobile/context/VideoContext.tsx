import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

interface VideoData {
  uri: string;
  name?: string;
  moments?: Array<{
    frame: number;
    timestamp: number;
    label: string;
    confidence: number;
  }>;
}

interface VideoContextType {
  firstVideo: VideoData | null;
  secondVideo: VideoData | null;
  isUploading1: boolean;
  isUploading2: boolean;
  handleFirstVideoUpload: (files: Array<{ uri: string; name: string; type: string }>) => void;
  handleSecondVideoUpload: (files: Array<{ uri: string; name: string; type: string }>) => void;
  handleRemoveFirstVideo: () => void;
  handleRemoveSecondVideo: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  console.log('VideoProvider initializing...');
  
  const [firstVideo, setFirstVideo] = useState<VideoData | null>(null);
  const [secondVideo, setSecondVideo] = useState<VideoData | null>(null);
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);

  const handleFirstVideoUpload = async (files: Array<{ uri: string; name: string; type: string }>) => {
    console.log('handleFirstVideoUpload called with files:', files);
    try {
      if (files.length === 0) {
        Alert.alert('Error', 'Please select a video file.');
        return;
      }

      const file = files[0];
      setIsUploading1(true);

      // Mock moments for now
      const mockMoments = Array.from({ length: 5 }, (_, i) => ({
        frame: Math.floor(Math.random() * 1000),
        timestamp: i * 30,
        label: 'Serve',
        confidence: 0.85 + Math.random() * 0.15,
      }));

      setFirstVideo({
        uri: file.uri,
        name: file.name,
        moments: mockMoments,
      });
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    } finally {
      setIsUploading1(false);
    }
  };

  const handleSecondVideoUpload = async (files: Array<{ uri: string; name: string; type: string }>) => {
    console.log('handleSecondVideoUpload called with files:', files);
    try {
      if (files.length === 0) {
        Alert.alert('Error', 'Please select a video file.');
        return;
      }

      const file = files[0];
      setIsUploading2(true);

      // Mock moments for now
      const mockMoments = Array.from({ length: 5 }, (_, i) => ({
        frame: Math.floor(Math.random() * 1000),
        timestamp: i * 30,
        label: 'Serve',
        confidence: 0.85 + Math.random() * 0.15,
      }));

      setSecondVideo({
        uri: file.uri,
        name: file.name,
        moments: mockMoments,
      });
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    } finally {
      setIsUploading2(false);
    }
  };

  const handleRemoveFirstVideo = () => {
    console.log('handleRemoveFirstVideo called');
    setFirstVideo(null);
  };

  const handleRemoveSecondVideo = () => {
    console.log('handleRemoveSecondVideo called');
    setSecondVideo(null);
  };

  const contextValue = {
    firstVideo,
    secondVideo,
    isUploading1,
    isUploading2,
    handleFirstVideoUpload,
    handleSecondVideoUpload,
    handleRemoveFirstVideo,
    handleRemoveSecondVideo,
  };

  console.log('VideoProvider rendering with context:', contextValue);

  return (
    <VideoContext.Provider value={contextValue}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    console.error('useVideo must be used within a VideoProvider');
    throw new Error('useVideo must be used within a VideoProvider');
  }
  console.log('useVideo hook called, returning context:', context);
  return context;
} 
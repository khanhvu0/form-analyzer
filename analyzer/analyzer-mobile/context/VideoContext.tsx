import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { uploadVideos, getProcessedVideoUrl, getVideoMoments, getVideoBalls } from '../services/api';

interface VideoData {
  uri: string;
  name?: string;
  processedUri?: string;
  label?: string;
  moments?: Array<{
    frame: number;
    timestamp: number;
    label: string;
    confidence: number;
  }>;
  balls?: any[];
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
  processVideos: () => Promise<void>;
  isProcessing: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  console.log('VideoProvider initializing...');
  
  const [firstVideo, setFirstVideo] = useState<VideoData | null>(null);
  const [secondVideo, setSecondVideo] = useState<VideoData | null>(null);
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFirstVideoUpload = async (files: Array<{ uri: string; name: string; type: string }>) => {
    console.log('handleFirstVideoUpload called with files:', files);
    try {
      if (files.length === 0) {
        Alert.alert('Error', 'Please select a video file.');
        return;
      }

      const file = files[0];
      setIsUploading1(true);

      setFirstVideo({
        uri: file.uri,
        name: file.name,
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

      setSecondVideo({
        uri: file.uri,
        name: file.name,
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

  const processVideos = async () => {
    if (!firstVideo || !secondVideo) {
      Alert.alert('Error', 'Please upload both videos before processing.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Starting video processing...');
      
      // Upload videos to the backend
      console.log('Uploading videos to backend...');
      const response = await uploadVideos(firstVideo.uri, secondVideo.uri);
      console.log('Upload response:', response);
      
      if (response.status === 'success') {
        // Update the videos with processed data
        const processedVideos = response.videos;
        console.log('Processed videos from response:', processedVideos);
        
        // Find the corresponding processed videos
        const firstProcessedVideo = processedVideos.find(v => v.label === 'Front View');
        const secondProcessedVideo = processedVideos.find(v => v.label === 'Side View');
        console.log('First processed video:', firstProcessedVideo);
        console.log('Second processed video:', secondProcessedVideo);
        
        if (firstProcessedVideo && secondProcessedVideo) {
          // Get the processed video URLs
          const firstProcessedUrl = getProcessedVideoUrl(firstProcessedVideo.name);
          const secondProcessedUrl = getProcessedVideoUrl(secondProcessedVideo.name);
          console.log('First processed URL:', firstProcessedUrl);
          console.log('Second processed URL:', secondProcessedUrl);
          
          // Fetch moments for both videos
          console.log('Fetching moments for first video...');
          const firstMoments = await getVideoMoments(firstProcessedVideo.name);
          console.log('First video moments:', firstMoments);
          
          console.log('Fetching moments for second video...');
          const secondMoments = await getVideoMoments(secondProcessedVideo.name);
          console.log('Second video moments:', secondMoments);
          
          // Fetch ball detections for both videos
          console.log('Fetching ball detections...');
          const firstBalls = await getVideoBalls(firstProcessedVideo.name);
          const secondBalls = await getVideoBalls(secondProcessedVideo.name);
          
          // Update the video data with processed information
          console.log('Updating first video with processed data...');
          setFirstVideo(prev => {
            const updated = {
              ...prev!,
              processedUri: firstProcessedUrl,
              label: firstProcessedVideo.label,
              moments: firstMoments.moments,
              balls: firstBalls,
            };
            console.log('Updated first video:', updated);
            return updated;
          });
          
          console.log('Updating second video with processed data...');
          setSecondVideo(prev => {
            const updated = {
              ...prev!,
              processedUri: secondProcessedUrl,
              label: secondProcessedVideo.label,
              moments: secondMoments.moments,
              balls: secondBalls,
            };
            console.log('Updated second video:', updated);
            return updated;
          });
          
          Alert.alert('Success', 'Videos processed successfully!');
        } else {
          throw new Error('Processed videos not found in response');
        }
      } else {
        throw new Error(response.message || 'Failed to process videos');
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process videos. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    processVideos,
    isProcessing,
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
import { getApiUrl } from '../config/api';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Video, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

interface VideoUploadResponse {
  status: string;
  message: string;
  videos: Array<{
    name: string;
    label: string;
  }>;
}

interface VideoMetadata {
  moments: Array<{
    frame: number;
    timestamp: number;
    label: string;
    confidence: number;
  }>;
}

/**
 * Gets video orientation metadata from a video file
 * @param videoUri Local URI of the video
 * @returns Promise with the video orientation metadata
 */
const getVideoOrientation = async (videoUri: string): Promise<number> => {
  try {
    console.log(`Getting orientation for video: ${videoUri}`);
    
    // For iOS, we'll use a simpler approach based on the file path
    // iOS videos are typically recorded in portrait mode (90 degrees)
    if (Platform.OS === 'ios') {
      console.log('iOS device detected, assuming portrait orientation (90 degrees)');
      return 90;
    }
    
    // For Android, we'll use a simpler approach for now
    // Since detecting orientation is causing "Cannot complete operation" errors
    console.log('Android device detected, using default orientation (0 degrees)');
    
    // Optionally try to determine orientation based on file path or metadata
    // Most Android videos are recorded in landscape mode by default
    try {
      const videoInfo = await FileSystem.getInfoAsync(videoUri);
      console.log(`Video file info: ${JSON.stringify(videoInfo)}`);
      
      // If using the camera on Android phones, videos are typically portrait
      // If it's from the gallery, it could be either
      // For now, we'll use a simple heuristic based on the file name
      if (videoUri.includes('PORTRAIT') || videoUri.includes('portrait')) {
        console.log('Detected portrait video based on filename');
        return 90;
      }
      
      // Default to landscape orientation
      return 0;
    } catch (e) {
      console.error('Error getting file info:', e);
      return 0;
    }
  } catch (error) {
    console.error('Error getting video orientation:', error);
    // Default to 0 (landscape) if we can't determine orientation
    return 0;
  }
};

/**
 * Uploads two videos to the backend for processing
 * @param video1Uri Local URI of the first video
 * @param video2Uri Local URI of the second video
 * @returns Promise with the upload response
 */
export const uploadVideos = async (
  video1Uri: string,
  video2Uri: string
): Promise<VideoUploadResponse> => {
  try {
    // Create form data for the upload
    const formData = new FormData();
    
    // For React Native, we need to handle the file URI differently
    // The file name needs to be extracted from the URI
    const video1Name = video1Uri.split('/').pop() || 'video1.mp4';
    const video2Name = video2Uri.split('/').pop() || 'video2.mp4';
    
    // Get video orientation metadata
    const video1Orientation = await getVideoOrientation(video1Uri);
    const video2Orientation = await getVideoOrientation(video2Uri);
    
    // Append the videos to the form data
    formData.append('video1', {
      uri: Platform.OS === 'ios' ? video1Uri.replace('file://', '') : video1Uri,
      name: video1Name,
      type: 'video/mp4',
    } as any);
    
    formData.append('video2', {
      uri: Platform.OS === 'ios' ? video2Uri.replace('file://', '') : video2Uri,
      name: video2Name,
      type: 'video/mp4',
    } as any);
    
    // Append orientation metadata
    formData.append('video1_orientation', video1Orientation.toString());
    formData.append('video2_orientation', video2Orientation.toString());
    
    // Make the API request
    const response = await fetch(getApiUrl('/upload'), {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload videos');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading videos:', error);
    throw error;
  }
};

/**
 * Gets the processed video URL
 * @param videoName Name of the processed video
 * @returns URL to the processed video
 */
export const getProcessedVideoUrl = (videoName: string): string => {
  return getApiUrl(`/video/${videoName}`);
};

/**
 * Gets the key moments for a video
 * @param videoName Name of the video
 * @returns Promise with the video metadata
 */
export const getVideoMoments = async (videoName: string): Promise<VideoMetadata> => {
  try {
    const response = await fetch(getApiUrl(`/moments/${videoName}`));
    
    if (!response.ok) {
      throw new Error('Failed to fetch video moments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching video moments:', error);
    throw error;
  }
};

/**
 * Gets the ball detections for a video
 * @param videoName Name of the video
 * @returns Promise with the ball detection data
 */
export const getVideoBalls = async (videoName: string): Promise<any> => {
  try {
    const response = await fetch(getApiUrl(`/balls/${videoName}`));
    
    if (!response.ok) {
      throw new Error('Failed to fetch ball detections');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ball detections:', error);
    throw error;
  }
}; 
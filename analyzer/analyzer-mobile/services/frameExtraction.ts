import { AVPlaybackStatus, Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';

/**
 * Extracts a frame from a video at a specific timestamp
 * Note: This is the best approach available with Expo's current capabilities.
 * For a real production app, a native module might provide better frame extraction.
 */
export const extractFrameAtTime = async (
  videoUri: string,
  timeInSeconds: number
): Promise<string | null> => {
  try {
    // Use VideoThumbnails API to generate a thumbnail at the specified time
    const { uri } = await VideoThumbnails.getThumbnailAsync(
      videoUri,
      {
        time: timeInSeconds * 1000, // Convert to milliseconds
        quality: 0.8,
      }
    );
    
    return uri;
  } catch (error) {
    console.error('Error extracting frame:', error);
    return null;
  }
};

/**
 * Extracts a frame from a video using a Video component reference
 * This approach is more efficient when you already have the video loaded,
 * as it doesn't need to decode the entire video again.
 */
export const extractFrameFromVideoRef = async (
  videoRef: React.RefObject<Video>,
  timeInSeconds: number
): Promise<void> => {
  if (!videoRef.current) return;
  
  try {
    // Seek to the specific time
    await videoRef.current.setPositionAsync(timeInSeconds * 1000);
    
    // A small delay to ensure the frame is loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real app, we would capture the frame here using a native module
    // For this example, we just return and let the component handle displaying the current frame
  } catch (error) {
    console.error('Error seeking to frame:', error);
  }
};

/**
 * A helper function to format a timestamp for display
 */
export const formatTimestamp = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 100);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}; 
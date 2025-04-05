import React, { createContext, useContext, useState } from 'react';

interface VideoContextType {
  currentVideo: {
    uri: string;
    moments: Array<{
      frame: number;
      timestamp: number;
      label: string;
      confidence: number;
    }>;
  } | null;
  setCurrentVideo: (video: VideoContextType['currentVideo']) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<VideoContextType['currentVideo']>(null);

  return (
    <VideoContext.Provider value={{ currentVideo, setCurrentVideo }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
} 
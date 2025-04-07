import React, { createContext, useContext, useState } from 'react';

interface VideoData {
  uri: string;
  moments: Array<{
    frame: number;
    timestamp: number;
    label: string;
    confidence: number;
  }>;
}

interface VideoContextType {
  firstVideo: VideoData | null;
  secondVideo: VideoData | null;
  setFirstVideo: (video: VideoData | null) => void;
  setSecondVideo: (video: VideoData | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [firstVideo, setFirstVideo] = useState<VideoData | null>(null);
  const [secondVideo, setSecondVideo] = useState<VideoData | null>(null);

  return (
    <VideoContext.Provider value={{ firstVideo, secondVideo, setFirstVideo, setSecondVideo }}>
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
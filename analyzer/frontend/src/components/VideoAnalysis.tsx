import React from 'react';
import VideoPlayer from './VideoPlayer';
import KeyMoments from './KeyMoments';

interface VideoAnalysisProps {
  video: {
    url: string;
    name: string;
    moments: any[];
  };
  currentTime: number;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onMomentClick: (timestamp: number) => void;
}

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
  video,
  currentTime,
  onProgress,
  onMomentClick,
}) => {
  return (
    <div className="card mb-6">
      <div className="p-6 pb-0">
        <VideoPlayer
          url={video.url}
          title={video.name}
          onProgress={onProgress}
        />
      </div>
      <div className="h-px bg-dark-700 my-6"></div>
      <div className="p-6 pt-0">
        <KeyMoments
          moments={video.moments}
          onMomentClick={onMomentClick}
        />
      </div>
    </div>
  );
};

export default VideoAnalysis; 
import React from "react";
import VideoPlayer from "./VideoPlayer";

interface VideoAnalysisProps {
  video: {
    url: string;
    name: string;
    label: string;
  };
}

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({ video }) => {
  return (
    <div className="card mb-6">
      <div className="p-6">
        <VideoPlayer
          url={video.url}
          videoName={video.name}
          label={video.label}
        />
      </div>
    </div>
  );
};

export default VideoAnalysis;

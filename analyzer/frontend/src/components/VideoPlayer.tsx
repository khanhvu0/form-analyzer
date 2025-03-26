import React from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography } from '@mui/material';

interface VideoPlayerProps {
  url: string;
  title: string;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onReady?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onProgress, onReady }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          '&::before': {
            content: '""',
            display: 'block',
            paddingTop: '56.25%', // 16:9 aspect ratio
          },
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          playing={false}
          onProgress={onProgress}
          onReady={onReady}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          config={{
            file: {
              attributes: {
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                },
              },
            },
          }}
          fallback={<div>Loading video...</div>}
        />
      </Box>
    </Box>
  );
};

export default VideoPlayer; 
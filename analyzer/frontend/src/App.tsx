import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Typography, Alert } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import VideoUpload from './components/VideoUpload';
import VideoAnalysis from './components/VideoAnalysis';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4D7EF7',
    },
    secondary: {
      main: '#7C4DFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

interface VideoData {
  url: string;
  name: string;
  moments: any[];
  balls: any[];
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      const processedVideos = await Promise.all(
        files.map(async (file) => {
          const videoUrl = URL.createObjectURL(file);
          
          const mockMoments = [
            {
              frame: 0,
              timestamp: 0,
              label: 'Start Position',
              confidence: 0.9
            },
            {
              frame: 30,
              timestamp: 1,
              label: 'Ball Release',
              confidence: 0.8
            },
            {
              frame: 60,
              timestamp: 2,
              label: 'Trophy Position',
              confidence: 0.85
            },
            {
              frame: 90,
              timestamp: 3,
              label: 'Ball Impact',
              confidence: 0.9
            },
            {
              frame: 120,
              timestamp: 4,
              label: 'Follow Through',
              confidence: 0.85
            }
          ];

          return {
            url: videoUrl,
            name: file.name,
            moments: mockMoments,
            balls: []
          };
        })
      );

      setVideos(prevVideos => [...prevVideos, ...processedVideos]);
    } catch (error) {
      console.error('Error processing videos:', error);
      setError('Error processing videos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleVideoProgress = useCallback((progress: { playedSeconds: number }) => {
    setCurrentTime(progress.playedSeconds);
  }, []);

  const handleMomentClick = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
  }, []);

  React.useEffect(() => {
    return () => {
      videos.forEach(video => {
        if (video.url.startsWith('blob:')) {
          URL.revokeObjectURL(video.url);
        }
      });
    };
  }, [videos]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" gutterBottom align="center" sx={{ mb: 4 }}>
            Tennis Form Analyzer
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <VideoUpload onUpload={handleUpload} isUploading={isUploading} />

          {videos.map((video, index) => (
            <VideoAnalysis
              key={index}
              video={video}
              currentTime={currentTime}
              onProgress={handleVideoProgress}
              onMomentClick={handleMomentClick}
            />
          ))}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;

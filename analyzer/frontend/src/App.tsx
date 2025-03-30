import React, { useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import VideoUpload from "./components/VideoUpload";
import VideoPlayer from "./components/VideoPlayer";

interface ProcessedVideo {
  name: string;
  label: string;
}

const App: React.FC = () => {
  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);

  const handleUpload = async (videos: File[]) => {
    try {
      const formData = new FormData();
      videos.forEach((video, index) => {
        formData.append(`video${index + 1}`, video);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload videos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        setProcessedVideos(data.videos);
      } else {
        throw new Error(data.message || "Error processing videos");
      }
    } catch (error) {
      console.error("Error uploading videos:", error);
      throw error;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Tennis Serve Analysis
        </Typography>

        <VideoUpload onUpload={handleUpload} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            mt: 2,
          }}
        >
          {processedVideos.map((video) => (
            <Box key={video.name}>
              <VideoPlayer
                url={`/api/video/${video.name}`}
                videoName={video.name}
                label={video.label}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default App;

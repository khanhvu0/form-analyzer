import React, { useState } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import VideoUpload from "./components/VideoUpload";
import VideoPlayer from "./components/VideoPlayer";

interface ProcessedVideo {
  name: string;
  label: string;
}

const App: React.FC = () => {
  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (
    video1: File,
    video2: File,
    orientation1: number,
    orientation2: number
  ) => {
    setIsLoading(true);
    setError(null);
    setProcessedVideos([]);
    try {
      const formData = new FormData();
      formData.append("video1", video1);
      formData.append("video2", video2);
      formData.append("video1_orientation", orientation1.toString());
      formData.append("video2_orientation", orientation2.toString());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to upload videos: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.status === "success") {
        setProcessedVideos(data.videos);
      } else {
        throw new Error(data.message || "Error processing videos");
      }
    } catch (err: any) {
      console.error("Error uploading videos:", err);
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowExample = () => {
    setError(null);
    setIsLoading(false);
    setProcessedVideos([
      { name: "example_khanh_pose.mp4", label: "Example 1 (Khanh)" },
      { name: "example_quan_pose.mp4", label: "Example 2 (Quan)" },
    ]);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Tennis Serve Analysis
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleShowExample}
            disabled={isLoading}
          >
            Show Example
          </Button>
        </Box>

        <VideoUpload
          onUpload={handleUpload}
          isLoading={isLoading}
          error={error}
        />

        {processedVideos.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mt: 4,
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
        )}
      </Box>
    </Container>
  );
};

export default App;

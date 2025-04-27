import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const VideoPreview = styled("div")({
  marginTop: "10px",
  maxWidth: "300px",
});

interface VideoUploadProps {
  onUpload: (
    video1: File,
    video2: File,
    orientation1: number,
    orientation2: number
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onUpload,
  isLoading,
  error,
}) => {
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleVideoPreview = (
    file: File | null,
    setPreview: (url: string | null) => void
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const video1 = formData.get("video1") as File;
    const video2 = formData.get("video2") as File;

    const orientation1 = 0;
    const orientation2 = 0;

    if (!video1 || !video2) {
      setFormError("Please select both videos");
      return;
    }

    onUpload(video1, video2, orientation1, orientation2);
  };

  return (
    <Box sx={{ border: "2px dashed #ccc", p: 3, mb: 3, borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Upload Videos
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <Typography component="label" htmlFor="video1">
            Video 1:
          </Typography>
          <input
            type="file"
            id="video1"
            name="video1"
            accept=".mp4,.avi,.mov"
            required
            onChange={(e) =>
              handleVideoPreview(e.target.files?.[0] || null, setPreview1)
            }
          />
          {preview1 && (
            <VideoPreview>
              <video
                controls
                style={{
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                src={preview1}
              />
            </VideoPreview>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography component="label" htmlFor="video2">
            Video 2:
          </Typography>
          <input
            type="file"
            id="video2"
            name="video2"
            accept=".mp4,.avi,.mov"
            required
            onChange={(e) =>
              handleVideoPreview(e.target.files?.[0] || null, setPreview2)
            }
          />
          {preview2 && (
            <VideoPreview>
              <video
                controls
                style={{
                  width: "100%",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
                src={preview2}
              />
            </VideoPreview>
          )}
        </Box>

        {formError && (
          <Alert severity="warning" sx={{ mt: 2, mb: 1 }}>
            {formError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Process Videos"}
          </Button>
        </Box>
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VideoUpload;

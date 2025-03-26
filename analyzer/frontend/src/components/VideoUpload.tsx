import React, { useCallback } from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface VideoUploadProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload, isUploading }) => {
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files).filter(file =>
        file.type.startsWith('video/')
      );
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []).filter(file =>
        file.type.startsWith('video/')
      );
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  return (
    <Card sx={{ width: '100%', mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.light',
            },
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('video-upload')?.click()}
        >
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop videos here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select files
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Supported formats: MP4, AVI, MOV
          </Typography>
        </Box>
        {isUploading && (
          <Typography variant="body2" color="primary" sx={{ mt: 2, textAlign: 'center' }}>
            Uploading videos...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUpload; 
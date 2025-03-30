import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button, Paper, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

interface KeyMoment {
  frame: number;
  timestamp: number;
  label: string;
  confidence: number;
  ball_position?: {
    x: number;
    y: number;
  };
  ball_velocity?: {
    vector: number[];
    magnitude: number;
  };
  previous_velocities?: Array<{
    frame: number;
    timestamp: number;
    velocity: number[];
    magnitude: number;
  }>;
}

interface VideoPlayerProps {
  url: string;
  label: string;
  videoName: string;
}

const Timeline = styled("div")({
  width: "100%",
  height: "40px",
  background: "#f0f0f0",
  position: "relative",
  margin: "10px 0",
  borderRadius: "4px",
});

const TimelineMarker = styled("div")({
  position: "absolute",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  cursor: "pointer",
  "&:hover": {
    transform: "translate(-50%, -50%) scale(1.2)",
  },
});

const KeyMomentMarker = styled(TimelineMarker)({
  background: "#4CAF50",
  "&:hover": {
    background: "#45a049",
  },
});

const Legend = styled("div")({
  display: "flex",
  alignItems: "center",
  marginBottom: "10px",
  fontSize: "0.9em",
});

const LegendItem = styled("div")({
  display: "flex",
  alignItems: "center",
  marginRight: "15px",
});

const LegendColor = styled("div")({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  marginRight: "5px",
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, label, videoName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const momentsResponse = await fetch(`/api/moments/${videoName}`);
        const moments = await momentsResponse.json();
        setKeyMoments(moments);
      } catch (error) {
        console.error("Error loading video data:", error);
      }
    };

    loadData();
  }, [videoName]);

  const handleMarkerClick = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>

      <Box sx={{ position: "relative", mb: 2 }}>
        <video
          ref={videoRef}
          controls
          style={{ width: "100%", maxWidth: "500px" }}
          src={url}
        />
        <IconButton
          onClick={togglePlayPause}
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
      </Box>

      <Legend>
        <LegendItem>
          <LegendColor sx={{ background: "#4CAF50" }} />
          <span>Key Moments</span>
        </LegendItem>
      </Legend>

      <Timeline>
        {keyMoments.map((moment) => (
          <KeyMomentMarker
            key={`${moment.frame}-${moment.label}`}
            style={{
              left: `${
                (moment.timestamp / (videoRef.current?.duration || 1)) * 100
              }%`,
            }}
            onClick={() => handleMarkerClick(moment.timestamp)}
            title={`${moment.label} at ${moment.timestamp.toFixed(1)}s`}
          />
        ))}
      </Timeline>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Key Moments
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {keyMoments.map((moment) => (
            <Button
              key={`${moment.frame}-${moment.label}`}
              variant="contained"
              size="small"
              onClick={() => handleMarkerClick(moment.timestamp)}
            >
              {moment.label}
            </Button>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default VideoPlayer;

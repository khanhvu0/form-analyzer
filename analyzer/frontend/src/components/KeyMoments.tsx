import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

interface KeyMoment {
  frame: number;
  timestamp: number;
  label: string;
  confidence: number;
}

interface KeyMomentsProps {
  moments: KeyMoment[];
  onMomentClick: (timestamp: number) => void;
}

const KeyMoments: React.FC<KeyMomentsProps> = ({ moments, onMomentClick }) => {
  // Sort moments in chronological order (newest first)
  const sortedMoments = moments.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Box sx={{ mt: 4, mb: 8 }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: 3,
          background: 'linear-gradient(130deg, #4D7EF7, #7C4DFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 600
        }}
      >
        Key Moments
      </Typography>
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)'
          },
          gap: { xs: 3, sm: 4 }
        }}
      >
        {sortedMoments.map((moment, index) => (
          <Paper
            key={index}
            onClick={() => onMomentClick(moment.timestamp)}
            sx={{
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-2px)',
                '&::after': {
                  opacity: 1,
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                padding: '1px',
                background: 'linear-gradient(130deg, rgba(77,126,247,0.2), rgba(124,77,255,0.2))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(130deg, rgba(77,126,247,0.1), rgba(124,77,255,0.1))',
                opacity: 0,
                transition: 'opacity 0.2s',
              },
            }}
          >
            <Box sx={{ 
              position: 'relative',
              zIndex: 1,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 3,
              gap: 2
            }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                }}
              >
                {moment.label}
              </Typography>
              <Chip
                label={`${(moment.confidence * 100).toFixed(0)}%`}
                color={moment.confidence > 0.7 ? 'success' : moment.confidence > 0.4 ? 'warning' : 'error'}
                size="small"
                sx={{
                  minWidth: '60px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  height: '24px',
                }}
              />
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                position: 'relative',
                zIndex: 1,
                color: 'text.secondary',
                letterSpacing: '-0.01em',
                mt: 'auto'
              }}
            >
              Time: {moment.timestamp.toFixed(2)}s
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default KeyMoments; 
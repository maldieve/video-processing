import React, { useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Checkbox, FormControlLabel, Grid, Slider, Typography } from '@mui/material';
import axios from 'axios';
import { StateContext } from './state';

const Overlay = () => {
  const { state, dispatch } = useContext(StateContext);
  const { mainVideoFile, overlayVideoFile, overlayPosition, overlaySize, muteOverlayAudio, scaleOverlayTime, downloadLink } = state;

  const onDropMain = (acceptedFiles) => {
    dispatch({ type: 'SET_MAIN_VIDEO_FILE', payload: acceptedFiles[0] });
  };

  const onDropOverlay = (acceptedFiles) => {
    dispatch({ type: 'SET_OVERLAY_VIDEO_FILE', payload: acceptedFiles[0] });
  };

  const { getRootProps: getRootPropsMain, getInputProps: getInputPropsMain } = useDropzone({
    onDrop: onDropMain,
    accept: 'video/*',
    multiple: false
  });

  const { getRootProps: getRootPropsOverlay, getInputProps: getInputPropsOverlay } = useDropzone({
    onDrop: onDropOverlay,
    accept: 'video/*',
    multiple: false
  });

  const handleOverlayPositionClick = (position) => {
    dispatch({ type: 'SET_OVERLAY_POSITION', payload: position });
  };

  const handleOverlaySubmit = async () => {
    const data = {
      main_video_filename: mainVideoFile.name,
      overlay_video_filename: overlayVideoFile.name,
      position: overlayPosition,
      size: overlaySize,
      mute_overlay_audio: muteOverlayAudio,
      scale_overlay_time: scaleOverlayTime
    };

    try {
      const response = await axios.post('http://localhost:5000/overlay', data);
      alert(`File created: ${response.data.result}`);
      dispatch({ type: 'SET_DOWNLOAD_LINK', payload: `http://localhost:5000/download/${response.data.result}` });
    } catch (error) {
      console.error('Error overlaying videos:', error);
      if (error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Overlay Video
      </Typography>
      <Box {...getRootPropsMain()} style={{ border: '2px dashed gray', padding: '20px', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
        <input {...getInputPropsMain()} />
        <p>Drag 'n' drop the main video file here, or click to select the file</p>
        {mainVideoFile && <Typography variant="body2">Selected: {mainVideoFile.name}</Typography>}
      </Box>
      <Box {...getRootPropsOverlay()} style={{ border: '2px dashed gray', padding: '20px', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
        <input {...getInputPropsOverlay()} />
        <p>Drag 'n' drop the overlay video file here, or click to select the file</p>
        {overlayVideoFile && <Typography variant="body2">Selected: {overlayVideoFile.name}</Typography>}
      </Box>
      <Typography variant="h6" gutterBottom>
        Select Overlay Position
      </Typography>
      <Grid container spacing={1} justifyContent="center" alignItems="center" style={{ maxWidth: 200, marginBottom: '20px' }}>
        {['top-left', 'top-center', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom-center', 'bottom-right'].map((position) => (
          <Grid item xs={4} key={position}>
            <Button
              variant={overlayPosition === position ? 'contained' : 'outlined'}
              onClick={() => handleOverlayPositionClick(position)}
              style={{ width: '100%' }}
            >
              {position.replace('-', ' ')}
            </Button>
          </Grid>
        ))}
      </Grid>
      <Typography variant="h6" gutterBottom>
        Overlay Size (% of Main Video)
      </Typography>
      <Slider
        value={overlaySize}
        onChange={(e, newValue) => dispatch({ type: 'SET_OVERLAY_SIZE', payload: newValue })}
        aria-labelledby="overlay-size-slider"
        min={10}
        max={100}
        valueLabelDisplay="auto"
        style={{ width: '80%', marginBottom: '20px' }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={muteOverlayAudio}
            onChange={(e) => dispatch({ type: 'SET_MUTE_OVERLAY_AUDIO', payload: e.target.checked })}
          />
        }
        label="Mute Overlay Audio"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={scaleOverlayTime}
            onChange={(e) => dispatch({ type: 'SET_SCALE_OVERLAY_TIME', payload: e.target.checked })}
          />
        }
        label="Scale Overlay Time"
      />
      <Button variant="contained" color="primary" onClick={handleOverlaySubmit} sx={{ mt: 2 }}>
        Process Overlay
      </Button>
      {downloadLink && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">Download Processed Video:</Typography>
          <Button variant="contained" color="secondary" href={downloadLink} download>
            Download
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Overlay;
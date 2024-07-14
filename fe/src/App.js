import React, { useContext, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Container, TextField, Button, Checkbox, FormControlLabel, Typography, Box, List, ListItem, ListItemText, IconButton, LinearProgress, Select, MenuItem, InputLabel, FormControl, ThemeProvider, createTheme, CssBaseline, Switch, FormGroup, Drawer, Divider, Slider, Grid } from '@mui/material';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import PictureInPictureIcon from '@mui/icons-material/PictureInPicture';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { StateContext } from './state';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const drawerWidth = 240;

function App() {
  const { state, dispatch } = useContext(StateContext);
  const { files, includeAudio, description, videoParams, progress, estimatedTimeLeft, theme, selectedFile, previewUrl, downloadLink, sidebarOpen, selectedFeature, mainVideoFile, overlayVideoFile, overlayPosition, overlaySize, muteOverlayAudio, scaleOverlayTime } = state;

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/progress');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch({ type: 'SET_PROGRESS', payload: data.progress });
      dispatch({ type: 'SET_ESTIMATED_TIME_LEFT', payload: data.estimated_time_left });
    };
    return () => {
      eventSource.close();
    };
  }, [dispatch]);

  const onDrop = (acceptedFiles) => {
    dispatch({ type: 'SET_FILES', payload: [...files, ...acceptedFiles] });

    if (acceptedFiles.length > 0) {
      evaluateFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'video/*',
    multiple: true
  });

  const evaluateFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const videoInfo = JSON.parse(response.data.info);
      const videoStream = videoInfo.streams.find(stream => stream.codec_type === 'video');
      if (videoStream) {
        dispatch({
          type: 'SET_VIDEO_PARAMS',
          payload: {
            frameRate: videoStream.avg_frame_rate,
            width: videoStream.width,
            height: videoStream.height
          }
        });
      }
    } catch (error) {
      console.error('Error evaluating file:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_VIDEO_PARAMS', payload: { [name]: value } });
  };

  const handleRemoveFile = (file) => {
    dispatch({ type: 'SET_FILES', payload: files.filter(f => f !== file) });
    if (file === selectedFile) {
      dispatch({ type: 'SET_SELECTED_FILE', payload: null });
      dispatch({ type: 'SET_PREVIEW_URL', payload: '' });
    }
  };

  const handleRemoveAllFiles = () => {
    dispatch({ type: 'SET_FILES', payload: [] });
    dispatch({ type: 'SET_SELECTED_FILE', payload: null });
    dispatch({ type: 'SET_PREVIEW_URL', payload: '' });
  };

  const handleSubmit = async () => {
    const fileNames = files.map(file => file.name);

    const data = {
      file_names: fileNames,
      include_audio: includeAudio,
      description,
      video_params: videoParams
    };

    console.log('Sending data to backend:', data);

    try {
      const response = await axios.post('http://localhost:5000/combine', data);
      console.log('Response from backend:', response.data);
      alert(`File created: ${response.data.result}`);
      dispatch({ type: 'SET_DOWNLOAD_LINK', payload: `http://localhost:5000/download/${response.data.result}` });
    } catch (error) {
      console.error('Error combining files:', error);
      if (error.response) {
        console.error('Backend response:', error.response.data);
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };

  const handleOverlaySubmit = async () => {
    const formData = new FormData();
    formData.append('main_video', mainVideoFile);
    formData.append('overlay_video', overlayVideoFile);
    formData.append('position', overlayPosition);
    formData.append('size', overlaySize);
    formData.append('mute_overlay_audio', muteOverlayAudio);
    formData.append('scale_overlay_time', scaleOverlayTime);

    console.log('Sending overlay data to backend:', formData);

    try {
      const response = await axios.post('http://localhost:5000/overlay', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Response from backend:', response.data);
      alert(`File created: ${response.data.result}`);
      dispatch({ type: 'SET_DOWNLOAD_LINK', payload: `http://localhost:5000/download/${response.data.result}` });
    } catch (error) {
      console.error('Error overlaying videos:', error);
      if (error.response) {
        console.error('Backend response:', error.response.data);
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
    localStorage.setItem('theme', newTheme);
  };

  const handleFileClick = (file) => {
    dispatch({ type: 'SET_SELECTED_FILE', payload: file });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Revoke the old preview URL
    }
    const newPreviewUrl = URL.createObjectURL(file);
    dispatch({ type: 'SET_PREVIEW_URL', payload: newPreviewUrl });
  };

  useEffect(() => {
    return () => {
      // Cleanup the preview URL when the component is unmounted
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !sidebarOpen });
  };

  const handleFeatureClick = (feature) => {
    dispatch({ type: 'SET_SELECTED_FEATURE', payload: feature });
  };

  const handleOverlayPositionClick = (position) => {
    dispatch({ type: 'SET_OVERLAY_POSITION', payload: position });
  };

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          open={sidebarOpen}
          sx={{
            width: sidebarOpen ? drawerWidth : 60,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? drawerWidth : 60,
              boxSizing: 'border-box',
              transition: 'width 0.3s',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
            <Typography variant="h6" noWrap>
              Features
            </Typography>
            <IconButton onClick={toggleSidebar}>
              <MenuIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            <ListItem button selected={selectedFeature === 'combine'} onClick={() => handleFeatureClick('combine')}>
              <BurstModeIcon />
              {sidebarOpen && <ListItemText primary="Combine" sx={{ marginLeft: 2 }} />}
            </ListItem>
            <ListItem button selected={selectedFeature === 'overlay'} onClick={() => handleFeatureClick('overlay')}>
              <PictureInPictureIcon />
              {sidebarOpen && <ListItemText primary="Overlay" sx={{ marginLeft: 2 }} />}
            </ListItem>
          </List>
        </Drawer>
        <Container sx={{ marginTop: 4 }}>
          {selectedFeature === 'combine' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
              <Typography variant="h4" gutterBottom>
                Video Processing
              </Typography>
              {progress > 0 && (
                <Box sx={{ width: '100%', mb: 4 }}>
                  <Typography variant="body1">Processing Progress:</Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2">Estimated Time Left: {formatTime(estimatedTimeLeft)}</Typography>
                </Box>
              )}
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={theme === 'dark'} onChange={handleThemeToggle} />}
                  label={`Toggle ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
                />
              </FormGroup>
              {videoParams.frameRate && (
                <Box>
                  <Typography variant="h6">Video Parameters:</Typography>
                  <TextField
                    label="Frame Rate"
                    variant="outlined"
                    name="frameRate"
                    value={videoParams.frameRate}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Width"
                    variant="outlined"
                    name="width"
                    value={videoParams.width}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Height"
                    variant="outlined"
                    name="height"
                    value={videoParams.height}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Codec</InputLabel>
                    <Select
                      name="codec"
                      value={videoParams.codec}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="libx264">libx264</MenuItem>
                      <MenuItem value="libx265">libx265</MenuItem>
                      <MenuItem value="mpeg4">mpeg4</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Bitrate"
                    variant="outlined"
                    name="bitrate"
                    value={videoParams.bitrate}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Box>
              )}
              <div {...getRootProps()} style={{ border: '2px dashed gray', padding: '20px', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
              <Box sx={{ display: 'flex', width: '100%' }}>
                <Box sx={{ width: '50%', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid gray', borderRadius: '4px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
                    <Typography variant="subtitle1">Files</Typography>
                    <Button variant="outlined" color="secondary" onClick={handleRemoveAllFiles}>
                      Remove All
                    </Button>
                  </Box>
                  <List>
                    {files.map(file => (
                      <ListItem key={file.path} button onClick={() => handleFileClick(file)} selected={file === selectedFile} secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleRemoveFile(file); }}>
                          <DeleteIcon />
                        </IconButton>
                      }>
                        <ListItemText primary={file.name} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box sx={{ width: '50%', padding: '10px' }}>
                  {selectedFile && (
                    <video key={selectedFile.name} width="100%" height="auto" controls>
                      <source src={previewUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeAudio}
                    onChange={(e) => dispatch({ type: 'SET_INCLUDE_AUDIO', payload: e.target.checked })}
                  />
                }
                label="Include Audio"
              />
              <TextField
                label="Description"
                variant="outlined"
                value={description}
                onChange={(e) => dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value })}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2 }}>
                Combine
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
          )}
          {selectedFeature === 'overlay' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
              <Typography variant="h4" gutterBottom>
                Overlay Video
              </Typography>
              {progress > 0 && (
                <Box sx={{ width: '100%', mb: 4 }}>
                  <Typography variant="body1">Processing Progress:</Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2">Estimated Time Left: {formatTime(estimatedTimeLeft)}</Typography>
                </Box>
              )}
              <Box {...getRootProps()} style={{ border: '2px dashed gray', padding: '20px', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                <input {...getInputProps()} onChange={(e) => dispatch({ type: 'SET_MAIN_VIDEO_FILE', payload: e.target.files[0] })} />
                <p>Drag 'n' drop the main video file here, or click to select the file</p>
              </Box>
              <Box {...getRootProps()} style={{ border: '2px dashed gray', padding: '20px', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                <input {...getInputProps()} onChange={(e) => dispatch({ type: 'SET_OVERLAY_VIDEO_FILE', payload: e.target.files[0] })} />
                <p>Drag 'n' drop the overlay video file here, or click to select the file</p>
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
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

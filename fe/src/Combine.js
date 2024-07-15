import React, { useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, InputLabel, List, ListItem, ListItemText, MenuItem, Select, Switch, TextField, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { StateContext } from './state';

const Combine = () => {
  const { state, dispatch } = useContext(StateContext);
  const { files, includeAudio, description, videoParams, selectedFile, previewUrl, downloadLink, theme } = state;

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
    dispatch({ type: 'SET_VIDEO_PARAMS', payload: { ...videoParams, [name]: value } });
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

  const handleFileClick = (file) => {
    dispatch({ type: 'SET_SELECTED_FILE', payload: file });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Revoke the old preview URL
    }
    const newPreviewUrl = URL.createObjectURL(file);
    dispatch({ type: 'SET_PREVIEW_URL', payload: newPreviewUrl });
  };

  const handleSubmit = async () => {
    const fileNames = files.map(file => file.name);

    const data = {
      file_names: fileNames,
      include_audio: includeAudio,
      description,
      video_params: videoParams
    };

    try {
      const response = await axios.post('http://localhost:5000/combine', data);
      alert(`File created: ${response.data.result}`);
      dispatch({ type: 'SET_DOWNLOAD_LINK', payload: `http://localhost:5000/download/${response.data.result}` });
    } catch (error) {
      console.error('Error combining files:', error);
      if (error.response) {
        alert(`Error: ${error.response.data.error}`);
      }
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
    localStorage.setItem('theme', newTheme);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Video Processing
      </Typography>
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
  );
};

export default Combine;
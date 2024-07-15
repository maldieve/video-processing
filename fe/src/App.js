import React, { useContext, useEffect } from 'react';
import { Container, Box, ThemeProvider, createTheme, CssBaseline, LinearProgress, Typography } from '@mui/material';
import { StateContext } from './state';
import Sidebar from './Sidebar';
import Combine from './Combine';
import Overlay from './Overlay';

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

function App() {
  const { state, dispatch } = useContext(StateContext);
  const { theme, selectedFeature, progress, estimatedTimeLeft } = state;

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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Container sx={{ marginTop: 4 }}>
          {progress > 0 && (
            <Box sx={{ width: '100%', mb: 4 }}>
              <Typography variant="body1">Processing Progress:</Typography>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2">Estimated Time Left: {formatTime(estimatedTimeLeft)}</Typography>
            </Box>
          )}
          {selectedFeature === 'combine' && <Combine />}
          {selectedFeature === 'overlay' && <Overlay />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
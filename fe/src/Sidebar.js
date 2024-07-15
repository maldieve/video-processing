import React, { useContext } from 'react';
import { Box, Drawer, IconButton, List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import PictureInPictureIcon from '@mui/icons-material/PictureInPicture';
import { StateContext } from './state';

const drawerWidth = 240;

const Sidebar = () => {
  const { state, dispatch } = useContext(StateContext);
  const { sidebarOpen, selectedFeature } = state;

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: !sidebarOpen });
  };

  const handleFeatureClick = (feature) => {
    dispatch({ type: 'SET_SELECTED_FEATURE', payload: feature });
  };

  return (
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
  );
};

export default Sidebar;
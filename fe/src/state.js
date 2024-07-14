import React, { createContext, useReducer } from 'react';

// Initial state
const initialState = {
  files: [],
  includeAudio: false,
  description: '',
  videoParams: {},
  progress: 0,
  estimatedTimeLeft: 0,
  theme: 'light',
  selectedFile: null,
  previewUrl: '',
  downloadLink: '',
  sidebarOpen: true,
  selectedFeature: 'combine',
  mainVideoFile: null,
  overlayVideoFile: null,
  overlayPosition: 'top-right',
  overlaySize: 25,
  muteOverlayAudio: false,
  scaleOverlayTime: false
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'SET_INCLUDE_AUDIO':
      return { ...state, includeAudio: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    case 'SET_VIDEO_PARAMS':
      return { ...state, videoParams: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_ESTIMATED_TIME_LEFT':
      return { ...state, estimatedTimeLeft: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SELECTED_FILE':
      return { ...state, selectedFile: action.payload };
    case 'SET_PREVIEW_URL':
      return { ...state, previewUrl: action.payload };
    case 'SET_DOWNLOAD_LINK':
      return { ...state, downloadLink: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_SELECTED_FEATURE':
      return { ...state, selectedFeature: action.payload };
    case 'SET_MAIN_VIDEO_FILE':
      return { ...state, mainVideoFile: action.payload };
    case 'SET_OVERLAY_VIDEO_FILE':
      return { ...state, overlayVideoFile: action.payload };
    case 'SET_OVERLAY_POSITION':
      return { ...state, overlayPosition: action.payload };
    case 'SET_OVERLAY_SIZE':
      return { ...state, overlaySize: action.payload };
    case 'SET_MUTE_OVERLAY_AUDIO':
      return { ...state, muteOverlayAudio: action.payload };
    case 'SET_SCALE_OVERLAY_TIME':
      return { ...state, scaleOverlayTime: action.payload };
    default:
      return state;
  }
};

// Create context
const StateContext = createContext();

// Context provider
const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export { StateContext, StateProvider, initialState, reducer };
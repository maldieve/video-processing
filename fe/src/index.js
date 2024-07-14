import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { StateProvider } from './state'; // import the StateProvider

ReactDOM.render(
  <StateProvider>
    <App />
  </StateProvider>,
  document.getElementById('root')
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/ui.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

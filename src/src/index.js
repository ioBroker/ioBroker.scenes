import React from 'react';
import { createRoot } from 'react-dom/client';
import * as serviceWorker from './serviceWorker';

import './index.css';
import App from './App';
import pack from '../package.json';

window.adapterName = 'scenes';
window.sentryDSN = 'https://89fc6260a1af4df68f9db767a603b7e5@sentry.iobroker.net/86';

console.log(`iobroker.${window.adapterName}@${pack.version}`);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

// Service worker works only with HTTPS and valid certificates, so do not enable it
serviceWorker.unregister();


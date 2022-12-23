import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import * as serviceWorker from './serviceWorker';

import './index.css';
import App from './App';
import pack from '../package.json';

import theme from '@iobroker/adapter-react-v5/Theme';
import Utils from '@iobroker/adapter-react-v5/Components/Utils';

window.adapterName = 'scenes';
window.sentryDSN = 'https://89fc6260a1af4df68f9db767a603b7e5@sentry.iobroker.net/86';

console.log('iobroker.' + window.adapterName + '@' + pack.version);
let themeName = Utils.getThemeName();

function build() {
    const container = document.getElementById('root');
    const root = createRoot(container);
    return root.render(<StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme(themeName)}>
            <App onThemeChange={_theme => {
                themeName = _theme;
                build();
            }} />
        </ThemeProvider>
    </StyledEngineProvider>);
}

build();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

// Service worker works only with HTTPS and valid certificates, so do not enable it
serviceWorker.unregister();


import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { MuiThemeProvider} from '@material-ui/core/styles';
import * as serviceWorker from './serviceWorker';

import './index.css';
import App from './App';
import { version } from '../package.json';

import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';

window.adapterName = 'scenes';

console.log('iobroker.' + window.adapterName + '@' + version);
let themeName = Utils.getThemeName();

function build() {
    return ReactDOM.render(<MuiThemeProvider theme={ theme(themeName) }>
        <App onThemeChange={_theme => {
            themeName = _theme;
            build();
        }}/>
    </MuiThemeProvider>, document.getElementById('root'));
}

// if not local development
if (window.location.host !== 'localhost:3000') {
    Sentry.init({
        dsn: 'https://89fc6260a1af4df68f9db767a603b7e5@sentry.iobroker.net/86',
        release: 'iobroker.' + window.adapterName + '@' + version,
        integrations: [
            new SentryIntegrations.Dedupe()
        ]
    });
}

build();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

// Service worker works only with HTTPS and valid certificates, so do not enable it
serviceWorker.unregister();


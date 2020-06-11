import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider} from '@material-ui/core/styles';
import * as serviceWorker from './serviceWorker';

import './index.css';
import App from './App';
import { version } from '../package.json';

import theme from '@iobroker/adapter-react/Theme';

console.log('iobroker.scenes@' + version);
let themeName = window.localStorage ? window.localStorage.getItem('App.themeName') || 'light' : 'light';

function build() {
    return ReactDOM.render(<MuiThemeProvider theme={ theme(themeName) }>
        <App onThemeChange={_theme => {
            themeName = _theme;
            build();
        }}/>
    </MuiThemeProvider>, document.getElementById('root'));
}

build();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

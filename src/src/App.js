import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import GenericApp from '@iobroker/adapter-react/GenericApp';
import Loader from '@iobroker/adapter-react/Components/Loader'

import I18n from '@iobroker/adapter-react/i18n';

const styles = theme => ({
    root: {},
    tabContent: {
        padding: 10,
        height: 'calc(100% - 64px - 48px - 20px)',
        overflow: 'auto'
    },
});

class App extends GenericApp {
    constructor(props) {
        const extendedProps = {};
        extendedProps.translations = {
            'en': require('./i18n/en'),
            'de': require('./i18n/de'),
            'ru': require('./i18n/ru'),
            'pt': require('./i18n/pt'),
            'nl': require('./i18n/nl'),
            'fr': require('./i18n/fr'),
            'it': require('./i18n/it'),
            'es': require('./i18n/es'),
            'pl': require('./i18n/pl'),
            'zh-cn': require('./i18n/zh-cn'),
        };
        extendedProps.doNotLoadAllObjects = true;
        extendedProps.adapterName = 'consumption';

        extendedProps.port = 8081;
        extendedProps.host = 'localhost';

        super(props, extendedProps);
    }

    render() {
        if (!this.state.loaded) {
            return (<Loader theme={this.state.themeType}/>);
        }

        return (
            <div className="App">
                <AppBar position="static">

                </AppBar>
                <div>
                    { I18n.t('Here is the main program! Just add the code.') }
                </div>

                {this.renderError()}
            </div>
        );
    }
}

export default withStyles(styles)(App);

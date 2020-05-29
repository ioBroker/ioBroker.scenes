import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import GenericApp from "@iobroker/adapter-react/GenericApp";
import Connection from "./components/Connection";
import SceneForm from "./components/SceneForm";
import SceneMembersForm from "./components/SceneMembersForm";
import Loader from '@iobroker/adapter-react/Components/Loader'
import { PROGRESS } from './components/Connection';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Switch from '@material-ui/core/Switch';

import I18n from '@iobroker/adapter-react/i18n';

const styles = theme => ({
    root: {},
    tabContent: {
        padding: 10,
        height: 'calc(100% - 64px - 48px - 20px)',
        overflow: 'auto'
    }
});

function getUrlQuery() {
    const parts = (window.location.search || '').replace(/^\?/, '').split('&');
    const query = {};
    parts.forEach(item => {
        const [name, val] = item.split('=');
        query[decodeURIComponent(name)] = val !== undefined ? decodeURIComponent(val) : true;
    });
    return query;
}

class App extends GenericApp {
    constructor(props) {
        super(props);
        this.translations = {
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

        // init translations
        I18n.setTranslations(this.translations);
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());
        this.adapterName = 'scenes';

        const query = getUrlQuery();

        this.port = query.port || (window.location.port === '3000' ? 8081 : window.location.port);
        this.host = query.host || window.location.hostname;

        window.iobForceHost = this.host;
    }

    componentDidMount() {
        this.socket = new Connection({
            name: this.adapterName,
            host: this.host,
            port: this.port || this.getPort(),
            onProgress: progress => {
                if (progress === PROGRESS.CONNECTING) {
                    this.setState({
                        connected: false
                    });
                } else if (progress === PROGRESS.READY) {
                    this.setState({
                        connected: true,
                        progress: 100
                    });
                } else {
                    this.setState({
                        connected: true,
                        progress: Math.round(PROGRESS.READY / progress * 100)
                    });
                }
            },
            onReady: async (objects, scripts) => {
                I18n.setLanguage(this.socket.systemLang);

                console.log(objects);
                console.log(scripts);
                const newState = {
                    lang: this.socket.systemLang,
                    ready: true,
                };

                try {
                    newState.systemConfig = await this.socket.getSystemConfig();
                } catch (error) {
                    console.log(error);
                }

                this.getScenes()
                    .then(scenes => {
                        newState.scenes = scenes;
                        console.log(scenes);
                        this.setState(newState);
                    });
            },
            //onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
            onObjectChange: (attr, value) => ()=>{console.log(attr); console.log(value);},
            onError: error => {
                console.error(error);
                this.showAlert(error, 'error');
            }
        });
    }

    getScenes() {
        return this.socket.getObjectView('scene.' + this.instance + '.', 'scene.' + this.instance + '.\u9999', 'state');
    }

    sceneSwitch = (event) => {
        this.state.scenes[event.target.name].common.enabled = event.target.checked;
        this.socket.setObject(event.target.name, this.state.scenes[event.target.name]);
        this.setState(this.state);
      };

    updateScene = (id, data) => {
        this.state.scenes[id] = data;
        this.socket.setObject(id, this.state.scenes[id]);
        this.setState(this.state);
      };

    render() {
        if (!this.state.ready) {
            return (<Loader theme={this.state.themeType}/>);
        }

        let component = this;


        return (
            <div className="App">
                <AppBar position="static">
                    <Tabs value={0}
                          onChange={(e, index) => this.selectTab(e.target.parentNode.dataset.name, index)}>
                        <Tab label={I18n.t('Scenes')} data-name="list"/>
                    </Tabs>
                </AppBar>
                <Grid container spacing={3}>
                    <Grid item xs={4}>
                    <Paper>
                    <div>
                        { Object.values(this.state.scenes).map((scene) => {
                            return <div key={scene._id} className={this.state.selected_scene == scene ? "selectedScene" : ""} onClick={()=>{
                                component.setState({selected_scene : scene});
                            }}>
                                <h2>{ scene._id} 
                                    <Switch
                                        checked={scene.common.enabled}
                                        onChange={component.sceneSwitch}
                                        name={scene._id}
                                    />
                                </h2>
                                <div>{ scene.common.desc }</div>
                            </div>
                        }) }
                    </div>
                    </Paper>
                    </Grid>
                    <Grid item xs={4}>
                    <Paper>{component.state.selected_scene ?
                        <SceneForm updateScene={this.updateScene} scene={component.state.selected_scene}/>
                    : ""}</Paper>
                    </Grid>
                    <Grid item xs={4}>
                    <Paper>{component.state.selected_scene ?
                        <SceneMembersForm updateScene={this.updateScene} scene={component.state.selected_scene}/>
                    : ""}</Paper>
                    </Grid>
                </Grid>
                {this.renderError()}
            </div>
        );
    }
}

export default withStyles(styles)(App);

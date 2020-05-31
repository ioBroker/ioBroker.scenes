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
import Container from '@material-ui/core/Container';
import clsx from 'clsx';
import Utils from '@iobroker/adapter-react/Components/Utils';
import I18n from '@iobroker/adapter-react/i18n';

const LEVEL_PADDING = 24;

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

                this.getData()
                .then(newState => {
                        newState.ready = true;
                        console.log(newState);
                        this.setState(newState);
                    });
            },
            //onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
            onObjectChange: (attr, value) => ()=>{console.log(attr); console.log(value);},
            onError: error => {
                console.error(error);
                this.showError(error);
            }
        });
    }

    getData() {
        return this.socket.getObjectView('scene.' + this.instance + '.', 'scene.' + this.instance + '.\u9999', 'state');
    }

    sceneSwitch = (event) => {
        this.state.scenes[event.target.name].common.enabled = event.target.checked;
        this.socket.setObject(event.target.name, this.state.scenes[event.target.name]);
        this.setState(this.state);
      };

      getFolder(root, folderId) {
        if (root.id === folderId) {
            return root;
        } else {
            return root.children.find(item =>
                item.type === 'folder' && item.id === folderId || (item.id.startsWith(folderId + '.') && this.getFolder(item, folderId)));
        }
    }

    buildTree(folders, scenes) {
        folders = folders || this.state.folders;
        scenes  = scenes  || this.state.scenes;

        const ids = Object.keys(scenes);
        const folderIDs = Object.keys(folders);

        // create missing folders
        ids.forEach(id => {
            const parts = id.split('.');
            let _id = parts[0] + '.' + parts[1];
            for (let i = 2; i < parts.length - 1; i++) {
                _id += '.' + parts[i];

                // add folder if not exists
                if (!folderIDs.includes(_id)) {
                    folders[_id] = {
                        type: 'folder',
                        common: {
                            name: parts[i],
                        },
                        native: {}
                    };
                    folderIDs.push(_id);
                }
            }
        });

        // collect children of all folders
        const root = {
            id: 'scene.0',
            children: [],
            type: 'folder'
        };

        Object.keys(folders).sort().forEach(id => {
            const parts = id.split('.');
            parts.pop();
            const parentId = parts.join('.');
            const f = this.getFolder(root, parentId);
            f.children.push({id, name: Utils.getObjectNameFromObj(folders[id], null, {language: I18n.getLanguage()}), type: 'folder', children: []});
        });
        Object.keys(scenes).sort().forEach(id => {
            const parts = id.split('.');
            const name = parts.pop();
            const parentId = parts.join('.');
            const f = this.getFolder(root, parentId);
            f.children.push({id, name: Utils.getObjectNameFromObj(scenes[id], null, {language: I18n.getLanguage()}), type: 'scene'});
        });

        return root;
    }

    getData() {
        let scenes;
        return this.socket.getObjectView('scene.' + this.instance + '.', 'scene.' + this.instance + '.\u9999', 'state')
            .then(_scenes => {
                scenes = _scenes;
                return {scenes, folders: [], tree: this.buildTree([], scenes)};
            });
    }

    addFolder(id) {
        const folders = JSON.parse(JSON.stringify(this.state.folders));
        folders[id] = {
            type: 'folder',
            common: {
                name: id.split('.').pop(),
            },
            native: {}
        };

        this.setState({folders, tree: this.buildTree(folders, null)});
    }

    deleteFolder(id) {
        const folders = JSON.parse(JSON.stringify(this.state.folders));
        if (folders[id]) {
            // find some children
            const sceneId = Object.keys(this.state.scenes).find(_id => _id.startsWith(id + '.'));
            if (sceneId) {
                // cannot delete, because still have children
                return this.showError(I18n.t('Cannot delete non-empty folder'));
            }

            delete folders[id];

            this.socket.delObject(id, () =>
                this.setState({folders, tree: this.buildTree(folders, null)}));
        }
    }

    deleteScript(id) {
        const scripts = JSON.parse(JSON.stringify(this.state.scripts));
        if (scripts[id]) {
            delete scripts[id];

            this.socket.delObject(id, () =>
                this.setState({scripts, tree: this.buildTree(null, scripts)}));
        }
    }

    renderTreeFolder(item, level) {
        return <div style={{paddingLeft: level * LEVEL_PADDING}} className={ this.props.classes.folderDiv }>
            { item.name }
        </div>;
    }

    renderTreeScene(item, level) {
        const scene = this.state.scenes[item.id];
        let component = this;

        return <div className={this.state.selectedScene == scene ? "selectedScene" : ""} style={{paddingLeft: level * LEVEL_PADDING}} key={scene._id} onClick={()=>{
            component.setState({selectedScene: scene});
        }}>
            <h2>{ scene._id }
                <Switch
                    checked={scene.common.enabled}
                    onChange={component.sceneSwitch}
                    name={scene._id}
                />
            </h2>
            <div>{ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) }</div>
            {scene.native.members.map(e=><div key={e.id}>{e.id}</div>)}
        </div>;
    }
    
    renderTreeItem(item, level) {
        if (level === undefined) {
            level = -1;
        }
        if (item.type === 'folder') {
            return [
                item.id !== 'scene.0' ? this.renderTreeFolder(item, level) : null,
                item.children.map(item => this.renderTreeItem(item, level + 1))
            ];
        } else {
            return this.renderTreeScene(item, level);
        }
    }

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
                <Container>
                <Grid container spacing={3}>
                    <Grid item xs={4}>
                    <Paper>
                    <div>
                        { null && Object.values(this.state.scenes).map((scene) => {
                            return <div key={scene._id} className={this.state.selectedScene == scene ? "selectedScene" : ""} onClick={()=>{
                                component.setState({selectedScene : scene});
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
                    {this.renderTreeItem(this.state.tree)}
                    </div>
                    </Paper>
                    </Grid>
                    <Grid item xs={4}>
                    <Paper>{component.state.selectedScene ?
                        <SceneForm key={component.state.selectedScene._id} updateScene={this.updateScene} scene={component.state.selectedScene}/>
                    : ""}</Paper>
                    </Grid>
                    <Grid item xs={4}>
                    <Paper>{component.state.selectedScene ?
                        <SceneMembersForm key={component.state.selectedScene._id} updateScene={this.updateScene} scene={component.state.selectedScene}/>
                    : ""}</Paper>
                    </Grid>
                </Grid>
                </Container>
                {this.renderError()}
            </div>
        );
    }
}

export default withStyles(styles)(App);

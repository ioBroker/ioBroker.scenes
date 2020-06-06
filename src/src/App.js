// Common
import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
 
// MaterialUi
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Switch from '@material-ui/core/Switch';
import Container from '@material-ui/core/Container';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import SearchIcon from '@material-ui/icons/Search';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

// Own
import {PROGRESS} from './components/Connection';
import Utils from '@iobroker/adapter-react/Components/Utils';
import GenericApp from '@iobroker/adapter-react/GenericApp';
import Connection from './components/Connection';
import SceneForm from './components/SceneForm';
import SceneMembersForm from './components/SceneMembersForm';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';
import clone from './utils/clone';

// icons
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {RiFolderAddLine as IconFolderAdd} from 'react-icons/ri';

const LEVEL_PADDING = 20;

const styles = theme => ({
    root: {},
    tabContent: {
        padding: 10,
        height: 'calc(100% - 64px - 48px - 20px)',
        overflow: 'auto'
    },
    textInput: {
        display: 'block',
    },
    width100: {
        width: '100%',
    },
    height: {
        height: '100%',
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingRight: '10px',
        width: '100%',
    },
    list: {
        width: '100%',
        padding: 0,
    },
    right: {
        float: 'right',
    },
    membersCell: {
        backgroundColor: '#ADD8E6',
        padding: '0px 10px',
        borderRadius: '4px',
        paddingBottom: '10px',
        minHeight: 'calc(100% - 40px)',
        marginBottom: '10px',
    },
    leftMenuItem: {
        display: 'block',
        borderRadius: 10,
    },
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
    state = {
        scenes: null,
        folders: null,
        search: null,
        selectedSceneId: null,
        addFolderDialog: null,
        addFolderDialogTitle: null,
        editFolderDialog: null,
        editFolderDialogTitle: null,
        ready: null,
        themeType: null,
        showSearch: null,
        instances: [],
    };

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
        if (!window.localStorage.getItem('closedFolders')) {
            window.localStorage.setItem('closedFolders', '{}');
        }

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

                const newState = {
                    lang: this.socket.systemLang,
                    ready: false,
                    selectedSceneId: window.localStorage.getItem('selectedSceneId') || '',
                };

                try {
                    newState.systemConfig = await this.socket.getSystemConfig();
                } catch (error) {
                    console.log(error);
                }

                this.socket.getAdapterInstances(this.adapterName)
                    .then(instances => {
                        newState.instances = instances.map(item => item._id);
                        this.setState(newState, () =>
                            this.refreshData());
                    });

            },
            //onObjectChange: (objects, scripts) => this.onObjectChange(objects, scripts),
            onObjectChange: (attr, value) => () => {
                console.log(attr);
                console.log(value);
            },
            onError: error => {
                console.error(error);
                this.showError(error);
            }
        });
    }

    sceneSwitch = (event) => {
        let scenes = clone(this.state.scenes);
        scenes[event.target.name].common.enabled = event.target.checked;
        this.socket.setObject(event.target.name, scenes[event.target.name]);
        this.setState({scenes: scenes});
    };

    buildTree(scenes) {
        scenes = Object.values(scenes);

        let folders = {subFolders: {}, scenes: {}, id: '', prefix: ''};

        // create missing folders
        scenes.forEach((scene) => {
            let id = scene._id;
            const parts = id.split('.');
            parts.shift();
            parts.shift();
            let currentFolder = folders;
            let prefix = '';
            for (let i = 0; i < parts.length - 1; i++) {
                if (prefix) {
                    prefix = prefix + '.';
                }
                prefix = prefix + parts[i];
                if (!currentFolder.subFolders[parts[i]]) {
                    currentFolder.subFolders[parts[i]] = {
                        subFolders: {}, 
                        scenes: {}, 
                        id: parts[i], 
                        prefix: prefix,
                        closed: JSON.parse(window.localStorage.getItem('closedFolders'))[prefix]
                    }
                }
                currentFolder = currentFolder.subFolders[parts[i]];
            }
            currentFolder.scenes[id] = scene;
        });

        return folders;
    }

    findFolder(parent, folder) {
        if (parent.prefix === folder.prefix) {
            return parent;
        }
        for (let index in parent.subFolders) {
            let result = this.findFolder(parent.subFolders[index], folder);
            if (result) {
                return result;
            }
        }
    }

    getData() {
        let scenes;
        return this.socket.getObjectView('scene.' + this.instance + '.', 'scene.' + this.instance + '.\u9999', 'state')
            .then(_scenes => {
                console.log(_scenes);
                scenes = _scenes;
                return {scenes, folders: this.buildTree(scenes)};
            });
    }

    refreshData(reasonSceneId) {
        if (reasonSceneId) {
            this.setState({changingScene: reasonSceneId});
        } else {
            this.setState({ready: false});
        }

        this.getData()
            .then(newState => {
                newState.ready = true;
                newState.changingScene = null;
                console.log(this.state);
                console.log(newState);
                this.setState(newState);
            });
    }

    addFolder(parentFolder, id) {
        let folders = clone(this.state.folders);
        let _parentFolder = this.findFolder(folders, parentFolder);
        _parentFolder.subFolders[id] = {
            scenes: {},
            subFolders: {},
            id: id,
            prefix: _parentFolder.prefix ? _parentFolder.prefix + '.' + id : id
        };
        this.setState({folders: folders});
    }

    addSceneToFolderPrefix = async (scene, folderPrefix, noRefresh) => {
        let oldId = scene._id;
        let sceneId = scene._id.split('.').pop();
        scene._id = 'scene.' + this.instance + '.' + folderPrefix + (folderPrefix ? '.' : '') + sceneId;
        if (!noRefresh) {
            this.setState({selectedSceneId: null});
        }
        await this.socket.delObject(oldId);
        await this.socket.setObject(scene._id, scene);
        if (!noRefresh) {
            this.refreshData();
            this.setState({selectedSceneId: scene._id});
        }
    };

    renameFolder = async (folder, newName) => {
        this.setState({selectedSceneId: null, ready: false});
        for (const k in folder.scenes) {
            let prefix = folder.prefix.split('.');
            prefix[prefix.length - 1] = newName;
            prefix.join('.');
            await this.addSceneToFolderPrefix(folder.scenes[k], prefix, true);
        }

        this.refreshData();
    };

    /*deleteFolder(folder) {
        if (Object.values(folder.scenes).length) {
            return this.showError(I18n.t('Cannot delete non-empty folder'));
        } else {
            //delete folder;
            this.setState(this.state);
        }
    }*/

    renderTreeScene = (item, level) => {
        const scene = this.state.scenes[item._id];
        let component = this;
        level = level || 0;

        if (this.state.search && !item.common.name.includes(this.state.search)) {
            return null;
        }

        return <ListItem
            style={ {paddingLeft: level * LEVEL_PADDING} }
            key={ item._id }
            selected={ this.state.selectedSceneId && this.state.selectedSceneId === scene._id }
            button
            onClick={ () => component.setState({selectedSceneId: scene._id}) }>
            <ListItemText
                primary={ scene.common.name }
                secondary={ scene.common.desc }
                />
            <ListItemSecondaryAction>
                <Switch
                    checked={ scene.common.enabled }
                    onChange={ component.sceneSwitch }
                    name={ scene._id }
                />
            </ListItemSecondaryAction>
        </ListItem>;
    };

    renderTree(parent, level) {
        let component = this;
        let result = [];
        level = level || 0;

        // Show folder item
        parent && parent.id && result.push(<ListItem
            key={ parent.id }
            className={ this.props.classes.width100 }
            style={ {paddingLeft: level * LEVEL_PADDING} }
        >
            { parent.id }
            {
                parent.id ?
                    <ListItemSecondaryAction>
                        <IconButton onClick={() => {
                            this.setState({addFolderDialog: parent, addFolderDialogTitle: ''});
                        }} title={ I18n.t('Create new folder') }><IconFolderAdd/></IconButton>

                        <IconButton onClick={() => {
                            this.setState({editFolderDialog: parent, editFolderDialogTitle: parent.id});
                        }} title={ I18n.t('Edit folder') }><IconEdit/></IconButton>

                        <IconButton onClick={() => {
                            let folders = clone(this.state.folders);
                            let _parent = component.findFolder(folders, parent);
                            _parent.closed = !_parent.closed;
                            
                            let closedFolders = JSON.parse(window.localStorage.getItem('closedFolders'));
                            closedFolders[_parent.prefix] = _parent.closed;
                            window.localStorage.setItem('closedFolders', JSON.stringify(closedFolders));

                            this.setState({folders: folders});
                        }} title={parent.closed ? I18n.t('Expand') : I18n.t('Collapse')}>
                            {parent.closed ? <IconExpand/> : <IconCollapse/>}
                        </IconButton>
                    </ListItemSecondaryAction>
                    : null
            }
        </ListItem>);

        if (parent && !parent.closed) {
            result.push(<ListItem
                key={ 'items_' + parent.id }
                className={ this.props.classes.width100 }>
                    <List
                        className={ this.props.classes.list }
                        classes={ {root: this.props.classes.leftMenuItem }}
                        style={ {paddingLeft: level * LEVEL_PADDING} }
                    >
                        { Object.values(parent.scenes).map(scene => this.renderTreeScene(scene, level)) }
                    </List>
                </ListItem>);

            result.push(Object.values(parent.subFolders).map(subFolder =>
                this.renderTree(subFolder, level + 1)));
        }

        return result;
    };

    createScene(name) {
        let template = {
            common: {
                name: '',
                type: 'boolean',
                role: 'scene.state',
                desc: '',
                enabled: true,
                read: true,
                write: true,
                def: false,
                engine: 'system.adapter.scenes.' + this.instance
            },
            native: {
                onTrue: {
                    trigger: {},
                    cron: null,
                    astro: null
                },
                onFalse: {
                    enabled: false,
                    trigger: {},
                    cron: null,
                    astro: null
                },
                members: []
            },
            type: 'state'
        };

        template.common.name = name;
        let id = 'scene.' + this.instance + '.' + template.common.name;

        this.setState({selectedSceneId: id, ready: false}, () =>
            this.socket.setObject(id, template)
                .then(() =>
                    this.refreshData()));
    };

    cloneScene(id) {
        let scene = clone(this.state.scenes[id]);
        scene._id = scene._id.split('.');
        scene._id.pop();
        scene._id.push(this.getNewSceneId());
        scene._id = scene._id.join('.');
        console.log(scene._id);
        scene.common.name = scene.common.name + ' clone';

        this.setState({ready: false, selectedSceneId: scene._id}, () =>
            this.socket.setObject(scene._id, scene)
                .then(() =>
                    this.refreshData()));
    };

    updateScene = (id, data) => {
        const scenes = clone(this.state.scenes);
        scenes[id] = data;

        this.socket.setObject(id, scenes[id])
            .then(() =>
                this.refreshData());
    };

    deleteScene = (id) => {
        this.socket.delObject(id)
            .then(() => {
                if (this.state.selectedSceneId === id) {
                    this.setState({selectedSceneId: null}, () =>
                        this.refreshData());
                } else {
                    this.refreshData();
                }
            });
    };

    getNewSceneId() {
        let newId = 0;

        for (const id in this.state.scenes) {
            let shortId = id.split('.').pop();
            let matches;
            if (matches = shortId.match(/^scene([0-9]+)$/)) {
                if (matches[1] >= parseInt(newId, 10)) {
                    newId = parseInt(matches[1]) + 1;
                }
            }
        }

        return 'scene' + newId;
    };

    dialogs() {
        let component = this;
        return <React.Fragment>
            <Dialog open={ !!this.state.addFolderDialog } onClose={() => {
                this.setState({addFolderDialog: null})
            }}>
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <Box component="p">
                    <TextField label={I18n.t('Title')} value={this.state.addFolderDialogTitle} onChange={(e) => {
                        this.setState({addFolderDialogTitle: e.target.value.replace(/[\][*,.;'"`<>\\?]/g, '')})
                    }}/>
                </Box>
                <Box component="p">
                    <Button variant="contained" onClick={() => {
                        component.addFolder(this.state.addFolderDialog, this.state.addFolderDialogTitle);
                        this.setState({addFolderDialog: null});
                    }} color="primary" autoFocus>
                        {I18n.t('Create')}
                    </Button>
                </Box>
            </Dialog>
            <Dialog open={ !!this.state.editFolderDialog } onClose={() => {
                this.setState({editFolderDialog: null})
            }}>
                <DialogTitle>{I18n.t('Edit folder')}</DialogTitle>
                <Box component="p">
                    <TextField label={I18n.t('Title')} value={this.state.editFolderDialogTitle} onChange={(e) => {
                        this.setState({editFolderDialogTitle: e.target.value.replace(/[\][*,.;'"`<>\\?]/g, '')})
                    }}/>
                </Box>
                <Box component="p">
                    <Button
                        variant="contained"
                        onClick={() => {
                            component.renameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle);
                            this.setState({editFolderDialog: null});
                        }}
                        color="primary"
                        autoFocus
                    >
                        { I18n.t('edit') }
                    </Button>
                </Box>
            </Dialog>
        </React.Fragment>;
    };

    render() {
        if (!this.state.ready) {
            return (<Loader theme={this.state.themeType}/>);
        }
        window.localStorage.setItem("selectedSceneId", this.state.selectedSceneId);

        let component = this;

        return (
            <div className="App">
                <Container className={this.props.classes.height}>
                    <Grid container spacing={3} className={this.props.classes.height}>
                        <Grid item xs={3} className={this.props.classes.height}>
                            <div className={clsx(this.props.classes.columnContainer, this.props.classes.height)}>
                                <div>
                                    <IconButton onClick={() => {
                                        this.createScene(this.getNewSceneId());
                                    }} title={I18n.t('Create new scene')}><IconAdd/></IconButton>

                                    <IconButton onClick={() => {
                                        this.setState({addFolderDialog: this.state.folders, addFolderDialogTitle: ''});
                                    }} title={I18n.t('Create new folder')}><IconFolderAdd/></IconButton>

                                    <span className={this.props.classes.right}>
                                        <IconButton onClick={() => {
                                            this.setState({showSearch: !component.state.showSearch})
                                        }}>
                                            <SearchIcon/>
                                        </IconButton>
                                    </span>
                                </div>
                                {this.state.showSearch ?
                                    <TextField value={ this.state.search } className={this.props.classes.textInput} onChange={e =>
                                        this.setState({search: e.target.value})}/>: null
                                }
                                { this.dialogs() }
                                <List className={this.props.classes.scroll}>
                                    { this.renderTree(this.state.folders) }
                                </List>
                            </div>
                        </Grid>
                        <Grid item xs={4} className={this.props.classes.height}>
                            <div className={this.props.classes.height}>
                                {component.state.selectedSceneId ?
                                    <SceneForm
                                        key={ component.state.selectedSceneId }
                                        deleteScene={this.deleteScene}
                                        cloneScene={this.cloneScene}
                                        updateScene={this.updateScene}
                                        scene={this.state.scenes[component.state.selectedSceneId]}
                                        socket={component.socket}
                                        addSceneToFolderPrefix={component.addSceneToFolderPrefix}
                                        folders={this.state.folders}
                                        instances={ this.state.instances }
                                    />
                                    : ''}
                            </div>
                        </Grid>
                        <Grid item xs={5} className={this.props.classes.height}>
                            <div className={this.props.classes.height}>
                                {component.state.selectedSceneId ?
                                    <div className={clsx(this.props.classes.membersCell, this.props.classes.height)}>
                                        <SceneMembersForm
                                            key={'selected' + component.state.selectedSceneId}
                                            updateScene={this.updateScene}
                                            scene={this.state.scenes[component.state.selectedSceneId]}
                                            socket={component.socket}
                                        />
                                    </div>
                                    : ''}
                            </div>
                        </Grid>
                    </Grid>
                </Container>
                { this.renderError() }
            </div>
        );
    }
}

export default withStyles(styles)(App);

// Common
import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import { withTheme } from '@material-ui/core/styles';

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
import CircularProgress from '@material-ui/core/CircularProgress';

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
import {MdClose as IconCancel} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';

const LEVEL_PADDING = 16;

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
    folderItem: {
        fontWeight: 'bold',
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
    buttonsContainer: {
        '& button': {
            margin: '0 ' + theme.spacing(1) + 'px',
        },
    },
    alignRight: {
        textAlign: 'right',
    },    list: {
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
    p: {
        margin: '1em 0',
    },
    changed: {
        position: 'relative',
        '&:after': {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: 6,
            background: '#FF0000',
            position: 'absolute',
            top: 5,
            right: 5,
        },
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
    state = {
        lang: '',
        ready: false,
        selectedSceneId: null,
        opened: [],
        scenes: {},
        folders: null,
        search: null,
        addFolderDialog: null,
        addFolderDialogTitle: null,
        editFolderDialog: null,
        editFolderDialogTitle: null,
        changingScene: '',
        themeType: null,
        showSearch: null,
        instances: [],
        selectedSceneChanged: false,
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
        this.selectedSceneData = '';
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

                let opened;
                try {
                    opened = JSON.parse(window.localStorage.getItem('Scenes.opened')) || [];
                } catch (e) {
                    opened = [];
                }

                const newState = {
                    lang: this.socket.systemLang,
                    ready: false,
                    selectedSceneId: window.localStorage.getItem('Scenes.selectedSceneId') || '',
                    opened,
                    scenes: {},
                    folders: null,
                    search: null,
                    addFolderDialog: null,
                    addFolderDialogTitle: null,
                    editFolderDialog: null,
                    editFolderDialogTitle: null,
                    changingScene: '',
                    themeType: null,
                    showSearch: null,
                    instances: [],
                    selectedSceneChanged: false,
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
                        prefix,
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

    refreshData(changingScene) {
        if (changingScene) {
            this.setState({changingScene});
        } else {
            this.setState({ready: false});
        }

        return this.getData()
            .then(newState => {
                newState.ready = true;
                newState.changingScene = '';
                newState.sceneChangeDialog = '';
                newState.selectedSceneChanged = false;
                this.selectedSceneData = '';

                if (!newState.scenes[this.state.selectedSceneId]) {
                    newState.selectedSceneId = Object.keys(newState.scenes).shift() || '';
                }
                this.setState(newState);
            });
    }

    addFolder(parentFolder, id) {
        let folders = clone(this.state.folders);
        let _parentFolder = this.findFolder(folders, parentFolder);

        let opened = JSON.parse(JSON.stringify(this.state.opened));

        _parentFolder.subFolders[id] = {
            scenes: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? _parentFolder.prefix + '.' + id : id
        };

        opened.push(id);

        this.setState({folders, opened});
    }

    addSceneToFolderPrefix = async (scene, folderPrefix, noRefresh) => {
        let oldId = scene._id;
        let sceneId = scene._id.split('.').pop();
        scene._id = 'scene.' + this.instance + '.' + folderPrefix + (folderPrefix ? '.' : '') + sceneId;

        await this.socket.delObject(oldId);
        await this.socket.setObject(scene._id, scene);

        if (!noRefresh) {
            await this.refreshData(sceneId);
            this.changeSelectedScene(scene._id);
        }
    };

    renameFolder = async (folder, newName) => {
        this.changeSelectedScene('');
        this.setState({changingScene: folder});

        for (const k in folder.scenes) {
            if (folder.scenes.hasOwnProperty(k)) {
                let prefix = folder.prefix.split('.');
                prefix[prefix.length - 1] = newName;
                prefix.join('.');
                await this.addSceneToFolderPrefix(folder.scenes[k], prefix, true);
            }
        }

        this.refreshData(folder);
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
        if (!scene || (this.state.search && !item.common.name.includes(this.state.search))) {
            return null;
        }

        let component = this;
        level = level || 0;

        const changed = this.state.selectedSceneId && this.state.selectedSceneId === scene._id && this.state.selectedSceneChanged;

        return <ListItem
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
            key={ item._id }
            selected={ this.state.selectedSceneId ? this.state.selectedSceneId === scene._id : false }
            button
            className={ changed ? this.props.classes.changed : ''}
            onClick={ () => this.changeSelectedScene(scene._id) }>
            <ListItemText
                primary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) }
                secondary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}, true) }
                />
            <ListItemSecondaryAction>
                {this.state.changingScene === scene._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <Switch
                        checked={scene.common.enabled}
                        onChange={component.sceneSwitch}
                        name={scene._id}
                    />
                }
            </ListItemSecondaryAction>
        </ListItem>;
    };

    renderTree(parent, level) {
        let result = [];
        level = level || 0;
        let opened = this.state.opened ? this.state.opened.includes(parent.prefix) : false;

        // Show folder item
        parent && parent.id && result.push(<ListItem
            key={ parent.prefix }
            className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
        >
            { parent.id }
            <ListItemSecondaryAction>
                <IconButton onClick={() => {
                    const opened = [...this.state.opened];
                    const pos = opened.indexOf(parent.prefix);
                    if (pos === -1) {
                        opened.push(parent.prefix);
                    } else {
                        opened.splice(pos, 1);
                    }

                    window.localStorage.setItem('Scenes.opened', JSON.stringify(opened));

                    this.setState({opened});
                }} title={ opened ? I18n.t('Expand') : I18n.t('Collapse')}>
                    { opened ? <IconExpand/> : <IconCollapse/>}
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>);

        if (parent && (opened || !parent.id)) { // root cannot be closed and have id === ''
            parent.id && result.push(<ListItem key={ 'keys_' + parent.prefix }>
                <ListItemSecondaryAction>
                    <IconButton
                        onClick={() => this.createScene(this.getNewSceneId(), parent.id) }
                        title={ I18n.t('Create new scene') }
                    ><IconAdd/></IconButton>
                    <IconButton
                        onClick={() => this.setState({addFolderDialog: parent, addFolderDialogTitle: ''})}
                        title={ I18n.t('Create new folder') }
                    ><IconFolderAdd/></IconButton>

                    <IconButton onClick={() => this.setState({editFolderDialog: parent, editFolderDialogTitle: parent.id})}
                                title={ I18n.t('Edit folder') }
                    ><IconEdit/></IconButton>
                </ListItemSecondaryAction>
            </ListItem>);
            // Add first scenes
            result.push(<ListItem
                key={ 'items_' + parent.prefix }
                className={ this.props.classes.width100 }>
                    <List
                        className={ this.props.classes.list }
                        classes={ {root: this.props.classes.leftMenuItem} }
                        style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
                    >
                        { Object.values(parent.scenes).map(scene => this.renderTreeScene(scene, level)) }
                    </List>
                </ListItem>);

            // add sub-folders
            result.push(Object.values(parent.subFolders).map(subFolder =>
                this.renderTree(subFolder, level + 1)));
        }

        return result;
    };

    createScene(name, parentId) {
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
        let id = 'scene.' + this.instance + '.' + (parentId ? parentId + '.' : '') + template.common.name;

        this.setState({changingScene: id}, () =>
            this.socket.setObject(id, template)
                .then(() => this.refreshData(id))
                .then(() => this.changeSelectedScene(id)));
    };

    cloneScene(id) {
        let scene = clone(this.state.scenes[id]);
        scene._id = scene._id.split('.');
        scene._id.pop();
        scene._id.push(this.getNewSceneId());
        scene._id = scene._id.join('.');
        scene.common.name = scene.common.name + ' ' + I18n.t('copy');

        this.setState({changingScene: scene._id}, () =>
            this.socket.setObject(scene._id, scene)
                .then(() => this.refreshData(scene._id))
                .then(() => this.changeSelectedScene( scene._id)));
    };

    updateScene = (id, data) => {
        if (data) {
            const scenes = clone(this.state.scenes);
            scenes[id] = data;

            return this.socket.setObject(id, scenes[id])
                .then(() => this.refreshData(id));
        } else {
            return Promise.resolve();
        }
    };

    deleteScene = (id) => {
        return this.socket.delObject(id)
            .then(() => {
                if (this.state.selectedSceneId === id) {
                    return this.refreshData(id)
                        .then(() => {
                            const ids = Object.keys(this.state.scenes);
                            // Find next scene
                            let nextId = ids.find(_id => _id > id) || '';
                            if (!nextId) {
                                // try prev scene
                                for (let i = ids.length - 1; i >= 0; i--) {
                                    if (ids[i] < id) {
                                        nextId = ids[i];
                                        break;
                                    }
                                }
                            }
                            if (!nextId && ids.length) {
                                nextId = ids.shift();
                            }

                            this.changeSelectedScene(nextId);
                        });
                } else {
                    return this.refreshData(id);
                }
            });
    };

    getNewSceneId() {
        let newId = 0;

        for (const id in this.state.scenes) {
            let shortId = id.split('.').pop();
            let matches = shortId.match(/^scene([0-9]+)$/);
            if (matches && parseInt(matches[1], 10) >= newId) {
                newId = parseInt(matches[1]) + 1;
            }
        }

        return 'scene' + newId;
    };

    setSelectedSceneChanged = (sceneId, newSceneData) => {
        this.selectedSceneData = JSON.stringify(newSceneData);
        let selectedSceneChanged = JSON.stringify(this.state.scenes[sceneId]) !== this.selectedSceneData;
        if (!selectedSceneChanged) {
            this.selectedSceneData = '';
        }

        if (selectedSceneChanged !== this.state.selectedSceneChanged) {
            this.setState({selectedSceneChanged});
        }
    };

    changeSelectedScene(newId, ignoreUnsaved, cb) {
        if (this.state.sceneChangeDialog !== newId) {
            if (this.state.selectedSceneChanged && !ignoreUnsaved) {
                this.confirmCb = cb;
                this.setState({sceneChangeDialog: this.state.selectedSceneId});
            } else {
                window.localStorage.setItem('Scenes.selectedSceneId', this.state.sceneChangeDialog);
                this.selectedSceneData = '';
                this.setState({
                    sceneChangeDialog: '',
                    selectedSceneId: newId,
                    selectedSceneChanged: false,
                }, () => cb && cb());
            }
        } else {
            cb && cb();
        }
    }

    dialogs() {
        let component = this;
        return <React.Fragment>
            <Dialog open={ !!this.state.addFolderDialog } onClose={() => {
                this.setState({addFolderDialog: null})
            }}>
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <Box className={this.props.classes.p}>
                    <TextField label={I18n.t('Title')} value={this.state.addFolderDialogTitle} onChange={(e) => {
                        this.setState({addFolderDialogTitle: e.target.value.replace(/[\][*,.;'"`<>\\?]/g, '')})
                    }}/>
                </Box>
                <Box className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.setState({addFolderDialog: null});
                    }}>
                        {I18n.t('Cancel')}
                    </Button>
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
                <Box className={this.props.classes.p}>
                    <TextField label={I18n.t('Title')} value={this.state.editFolderDialogTitle} onChange={(e) => {
                        this.setState({editFolderDialogTitle: e.target.value.replace(/[\][*,.;'"`<>\\?]/g, '')})
                    }}/>
                </Box>
                <Box className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.setState({editFolderDialog: null});
                    }}>
                        {I18n.t('Cancel')}
                    </Button>
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


            <Dialog
            open={ !!this.state.sceneChangeDialog }
            key="sceneChangeDialog"
            onClose={ () =>
                this.setState({sceneChangeDialog: ''}) }
            >
                <DialogTitle>{ I18n.t('Are you sure for cancel unsaved changes?') }</DialogTitle>
                <div className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.confirmCb = null; // cancel callback
                        this.setState({sceneChangeDialog: ''});
                    }}>
                        <IconCancel/> { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={e =>
                        this.changeSelectedScene(this.state.sceneChangeDialog, true, () => {
                            const cb = this.confirmCb;
                            this.confirmCb = null;
                            cb && cb();
                        }) }>
                        { I18n.t('Discard') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={e => {
                        // save scene
                        this.updateScene(this.state.selectedSceneId, this.selectedSceneData)
                            .then(() => this.changeSelectedScene(this.state.sceneChangeDialog, true, () => {
                                const cb = this.confirmCb;
                                this.confirmCb = null;
                                cb && cb();
                            }))
                    }}>
                        <IconSave/> { I18n.t('Save changes') }
                    </Button>
                </div>
            </Dialog>
        </React.Fragment>;
    };

    render() {
        if (!this.state.ready) {
            return (<Loader theme={ this.state.themeType }/>);
        }

        let component = this;

        return (
            <div className="App">
                <Container className={ this.props.classes.height }>
                    <Grid container spacing={ 3 } className={ this.props.classes.height } lg={ 12 }>
                        <Grid item xs={3} className={ this.props.classes.height }>
                            <div className={ clsx(this.props.classes.columnContainer, this.props.classes.height) }>
                                <div>
                                    <IconButton
                                        onClick={ () => this.createScene(this.getNewSceneId()) }
                                        title={ I18n.t('Create new scene') }
                                    ><IconAdd/></IconButton>

                                    <IconButton
                                        onClick={ () => this.setState({addFolderDialog: this.state.folders, addFolderDialogTitle: ''}) }
                                        title={ I18n.t('Create new folder') }
                                    ><IconFolderAdd/></IconButton>

                                    <span className={this.props.classes.right}>
                                        <IconButton onClick={() => this.setState({showSearch: !component.state.showSearch}) }>
                                            <SearchIcon/>
                                        </IconButton>
                                    </span>
                                </div>
                                {this.state.showSearch ?
                                    <TextField
                                        value={ this.state.search }
                                        className={ this.props.classes.textInput }
                                        onChange={ e => this.setState({search: e.target.value}) }/> : null
                                }
                                { this.dialogs() }
                                <List className={ this.props.classes.scroll }>
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
                                        setSelectedSceneChanged={this.setSelectedSceneChanged}
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
                                            setSelectedSceneChanged={this.setSelectedSceneChanged}
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

export default withStyles(styles)(withTheme(App));

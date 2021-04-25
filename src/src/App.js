// Common
import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import { withTheme } from '@material-ui/core/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import withWidth from "@material-ui/core/withWidth";

// MaterialUi
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import DialogActions from '@material-ui/core/DialogActions';
import Drawer from '@material-ui/core/Drawer';

// Own
import Utils from '@iobroker/adapter-react/Components/Utils';
import GenericApp from '@iobroker/adapter-react/GenericApp';
import Loader from '@iobroker/adapter-react/Components/Loader'
import I18n from '@iobroker/adapter-react/i18n';

import SceneForm from './components/SceneForm';
import SceneMembersForm from './components/SceneMembersForm';
import ExportImportDialog from './components/ExportImportDialog';
import ScenesList from './components/ScenesList';

// icons
import {MdClose as IconCancel} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdFileDownload as IconExport} from 'react-icons/md';
// import {MdFileUpload as IconImport} from 'react-icons/md';
import {FaClone as IconClone} from 'react-icons/fa';
import {FaBars as IconMenu} from 'react-icons/fa';

const MARGIN_MEMBERS = 20;

const styles = theme => ({
    root: {
        width: '100%',
        height: 'calc(100% + 4px)',
        backgroundColor: theme.palette.type === 'dark' ? '#000': '#fff',
        overflowX: 'hidden',
    },
    width100: {
        width: '100%',
    },
    noGutters: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    height: {
        height: '100%',
    },
    heightMinus2Toolbars: {
        height: 'calc(100% - 96px)',
    },
    heightMinusMargin: {
        height: 'calc(100% - ' + MARGIN_MEMBERS + 'px)',
    },
    fullWidthContainer: {
        maxWidth: 'inherit',
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 2,
        paddingRight: 2,
        overflow: 'hidden'
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    buttonsContainer1: {
        '& button': {
            margin: '0 ' + theme.spacing(1) + 'px',
        },
    },
    alignRight: {
        textAlign: 'right',
    },
    membersCell: {
        backgroundColor: theme.palette.type === 'dark' ? '#566770': '#ADD8E6',
        marginTop: MARGIN_MEMBERS,
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(2),
        paddingTop: 0,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,

        borderRadius: 4,
        height: 'calc(100% - ' + theme.spacing(1) + 'px)',
    },
    sceneTitle: {
        color: theme.palette.type === 'dark' ? '#FFF': '#000',
        flexGrow: 1,
        paddingLeft: theme.spacing(1),
    },
    sceneSubTitle: {
        fontSize: 'small',
        display: 'block'
    },
    toolbarButtons: {
        marginRight: theme.spacing(1),
    },
    settingsBackground: {
        background: theme.palette.type === 'dark' ? '#3a3a3a': '#eeeeee',
    },
    drawer: {
        overflow: 'hidden'
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

function getFolderPrefix(sceneId) {
    let result = sceneId.split('.');
    result.shift();
    result.shift();
    result.pop();
    result = result.join('.');
    return result;
}

class App extends GenericApp {
    constructor(props) {
        const extendedProps = {...props};
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

        super(props, extendedProps);

        const query = getUrlQuery();

        this.port = query.port || (window.location.port === '3000' ? 8081 : window.location.port);
        this.host = query.host || window.location.hostname;

        window.iobForceHost = this.host;
    }

    onConnectionReady() {
        const newState = {
            lang: this.socket.systemLang,
            ready: false,
            selectedSceneId: window.localStorage.getItem('Scenes.selectedSceneId') || '',
            scenes: {},
            folders: null,
            changingScene: '',
            instances: [],
            selectedSceneChanged: false,
            deleteDialog: null,
            selectedSceneData: null,
            exportDialog: false,
            importDialog: false,
            menuOpened: false,
        };

        this.socket.getSystemConfig()
            .then(systemConfig => {
                newState.systemConfig = systemConfig;

                return this.socket.getAdapterInstances(window.adapterName)
                    .then(instances => {
                        newState.instances = instances.map(item => item._id);
                        this.setState(newState, () =>
                            this.refreshData());
                    });
            })
            .catch(e => this.showError(e));
    }

    sceneSwitch(id) {
        let scenes = JSON.parse(JSON.stringify(this.state.scenes));

        if (id === this.state.selectedSceneId) {
            scenes[id] = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        }

        scenes[id].common.enabled = !scenes[id].common.enabled;

        return this.socket.setObject(id, scenes[id])
            .then(() => this.refreshData(id))
            .catch(e => this.showError(e));
    }

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
        return this.socket.getObjectView('scene.0.', 'scene.\u9999', 'state')
            .then(_scenes => {
                scenes = _scenes;
                return {scenes, folders: this.buildTree(scenes)};
            })
            .catch(e => this.showError(e));
    }

    refreshData(changingScene) {
        const that = this;
        return new Promise(resolve => {
            if (changingScene) {
                this.setState({changingScene}, () => resolve());
            } else {
                this.setState({ready: false}, () => resolve());
            }
        })
            .then(() => this.getData())
            .then(newState => {
                newState.ready = true;
                newState.changingScene = '';
                newState.selectedSceneChanged = false;

                // Fill missing data
                Object.keys(newState.scenes).forEach(id => {
                    const sceneObj = newState.scenes[id];
                    sceneObj.common = sceneObj.common || {};
                    sceneObj.native = sceneObj.native || {};

                    // rename attribute
                    if (sceneObj.native.burstIntervall !== undefined) {
                        sceneObj.native.burstInterval = sceneObj.native.burstIntervall;
                        delete sceneObj.native.burstIntervall;
                    }

                    sceneObj.native.burstInterval = parseInt(sceneObj.native.burstInterval || 0, 10);
                    sceneObj.native.onFalse = sceneObj.native.onFalse || {};
                    sceneObj.native.onTrue  = sceneObj.native.onTrue  || {};
                    sceneObj.native.onFalse.trigger = sceneObj.native.onFalse.trigger || {condition: '=='};
                    sceneObj.native.onTrue.trigger  = sceneObj.native.onTrue.trigger  || {condition: '=='};
                    sceneObj.native.members = sceneObj.native.members || [];
                    const members = sceneObj.native.members;
                    delete sceneObj.native.members;
                    sceneObj.native.members = members; // place it on the last place

                    delete sceneObj.from;
                    delete sceneObj.user;
                    delete sceneObj.ts;
                    delete sceneObj.acl;
                });

                if (!newState.scenes[this.state.selectedSceneId]) {
                    newState.selectedSceneId = Object.keys(newState.scenes).shift() || '';
                }

                if ((newState.selectedSceneId || that.state.selectedSceneId) &&
                    newState.scenes[newState.selectedSceneId || that.state.selectedSceneId]) {
                    newState.selectedSceneData = JSON.parse(JSON.stringify(newState.scenes[newState.selectedSceneId || that.state.selectedSceneId]));
                } else {
                    newState.selectedSceneData = null;
                }

                that.setState(newState);
            });
    }

    addFolder(parentFolder, id) {
        let folders = JSON.parse(JSON.stringify(this.state.folders));
        let _parentFolder = this.findFolder(folders, parentFolder);

        _parentFolder.subFolders[id] = {
            scenes: {},
            subFolders: {},
            id,
            prefix: _parentFolder.prefix ? _parentFolder.prefix + '.' + id : id
        };

        this.setState({folders});
    }

    addSceneToFolderPrefix = (scene, folderPrefix, noRefresh) => {
        let oldId = scene._id;
        let sceneId = scene._id.split('.').pop();
        scene._id = 'scene.0.' + folderPrefix + (folderPrefix ? '.' : '') + sceneId;

        return this.socket.delObject(oldId)
            .then(() => {
                console.log('Deleted ' + oldId);
                return this.socket.setObject(scene._id, scene)
            })
            .catch(e => this.showError(e))
            .then(() => {
                console.log('Set new ID: ' + scene._id);
                return !noRefresh && this.refreshData(sceneId)
                    .then(() => this.changeSelectedScene(scene._id))
                    .catch(e => this.showError(e));
            });
    };

    moveScript(oldId, newId) {
        const scene = this.state.scenes[oldId];
        if (this.state.selectedSceneId === oldId) {
            return this.setState({selectedSceneId: newId}, () => this.moveScript(oldId, newId));
        }

        scene._id = newId;

        return this.socket.delObject(oldId)
            .then(() => {
                console.log('Deleted ' + oldId);
                return this.socket.setObject(scene._id, scene)
            })
            .catch(e => this.showError(e))
            .then(() => {
                console.log('Set new ID: ' + scene._id);
                return this.refreshData(newId)
                    .then(() => this.changeSelectedScene(scene._id))
                    .catch(e => this.showError(e));
            });
    };

    renameFolder(folder, newName) {
        return new Promise(resolve => this.setState({changingScene: folder}, () => resolve()))
            .then(() => {
                let newSelectedId;

                let prefix = folder.prefix.split('.');
                prefix[prefix.length - 1] = newName;
                prefix = prefix.join('.');

                if (Object.keys(folder.scenes).find(id => id === this.state.selectedSceneId)) {
                    newSelectedId = 'scene.0.' + prefix + '.' + this.state.selectedSceneId.split('.').pop();
                }

                const promises = Object.keys(folder.scenes).map(sceneId =>
                    this.addSceneToFolderPrefix(folder.scenes[sceneId], prefix, true));

                return Promise.all(promises)
                    .then(() => this.refreshData(folder))
                    .then(() => newSelectedId && this.setState({selectedSceneId: newSelectedId}));
            });
    }

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
                engine: 'system.adapter.scenes.0'
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
                easy: true,
                members: []
            },
            type: 'state'
        };

        template.common.name = name;
        let id = 'scene.0.' + (parentId ? parentId + '.' : '') + template.common.name;

        this.setState({changingScene: id}, () =>
            this.socket.setObject(id, template)
                .then(() => this.refreshData(id))
                .then(() => this.changeSelectedScene(id))
                .catch(e => this.showError(e))
        );
    };

    cloneScene(id) {
        let scene = JSON.parse(JSON.stringify(this.state.scenes[id]));
        scene._id = scene._id.split('.');
        scene._id.pop();
        scene._id.push(this.getNewSceneId());
        scene._id = scene._id.join('.');
        scene.common.name = scene.common.name + ' ' + I18n.t('copy');

        this.setState({changingScene: scene._id}, () =>
            this.socket.setObject(scene._id, scene)
                .then(() => this.refreshData(scene._id))
                .then(() => this.changeSelectedScene(scene._id))
                .catch(e => this.showError(e))
        );
    };

    writeScene() {
        const scene = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        scene._id = this.state.selectedSceneId;

        const folder = getFolderPrefix(scene._id);
        const newId = 'scene.0.' + (folder ? folder + '.' : '') + scene.common.name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\./g, '_').replace(/\s/g, '_');

        if (scene._id !== newId) {
            // check if the scene name is unique
            if (Object.keys(this.state.scenes).find(id => id === newId)) {
                return this.showError(I18n.t('Name is not unique. Please change name before the save.'));
            }

            // delete first the old scene
            return this.socket.delObject(scene._id)
                .then(() => {
                    scene._id = newId;
                    return this.socket.setObject(scene._id, scene);
                })
                .then(() => this.refreshData(this.state.selectedSceneId))
                .then(() => this.changeSelectedScene(newId))
                .catch(e => this.showError(e));
        } else {
            return this.socket.setObject(this.state.selectedSceneId, scene)
                .then(() => this.refreshData(this.state.selectedSceneId))
                .catch(e => this.showError(e));
        }
    }

    updateScene(common, native, cb) {
        const scene = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        if (common) {
            scene.common = JSON.parse(JSON.stringify(common));
        }
        if (native) {
            const members = scene.native.members;
            scene.native = JSON.parse(JSON.stringify(native));
            scene.native.members = members;
        }

        let selectedSceneChanged = JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(scene);
        this.setState({selectedSceneChanged, selectedSceneData: scene}, () => cb && cb());
    };

    deleteScene(id) {
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

                            return this.changeSelectedScene(nextId);
                        });
                } else {
                    return this.refreshData(id);
                }
            })
            .catch(e => this.showError(e));
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

    updateSceneMembers(members, cb) {
        const scene = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        scene.native.members = JSON.parse(JSON.stringify(members));

        let selectedSceneChanged = JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(scene);
        this.setState({selectedSceneChanged, selectedSceneData: scene}, () => cb && cb());
    };

    changeSelectedScene(newId, ignoreUnsaved, cb) {
        return new Promise(resolve => {
            if (this.state.selectedSceneId !== newId) {
                if (this.state.selectedSceneChanged && !ignoreUnsaved) {
                    this.confirmCb = cb;
                    this.setState({sceneChangeDialog: newId}, () => resolve());
                } else {
                    window.localStorage.setItem('Scenes.selectedSceneId', newId);
                    this.setState({
                        selectedSceneData: this.state.scenes[newId] ? JSON.parse(JSON.stringify(this.state.scenes[newId])) : null,
                        sceneChangeDialog: '',
                        selectedSceneId: newId || '',
                        selectedSceneChanged: false,
                        menuOpened: false,
                    }, () => {
                        resolve();
                        cb && cb();
                    });
                }
            } else {
                resolve();
                cb && cb();
            }
        });
    }

    renderSceneChangeDialog() {
        const that = this;
        return this.state.sceneChangeDialog ? <Dialog
            open={ true }
            key="sceneChangeDialog"
            onClose={ () => this.setState({sceneChangeDialog: ''}) }>
                <DialogTitle>{ I18n.t('Are you sure for cancel unsaved changes?') }</DialogTitle>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={() => {
                        this.confirmCb = null; // cancel callback
                        this.setState({sceneChangeDialog: ''});
                    }}>
                        <IconCancel/> { I18n.t('Cancel') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={ () =>
                        this.changeSelectedScene(this.state.sceneChangeDialog, true, () => {
                            const cb = this.confirmCb;
                            this.confirmCb = null;
                            cb && cb();
                        })
                            .catch(() => console.log('ignore')) }>
                        { I18n.t('Discard') }
                    </Button>
                    <Button variant="contained" color="secondary" onClick={e => {
                        // save scene
                        this.writeScene()
                            .then(() => that.changeSelectedScene(that.state.sceneChangeDialog === 'empty' ? '' : that.state.sceneChangeDialog, true, () => {
                                const cb = this.confirmCb;
                                this.confirmCb = null;
                                cb && cb();
                            }))
                            .catch(() => console.log('ignore'))
                    }}>
                        <IconSave/> { I18n.t('Save changes') }
                    </Button>
                </DialogActions>
            </Dialog> : null;
    };

    renderDeleteDialog() {
        return this.state.deleteDialog ? <Dialog
            open={ true }
            key="deleteDialog"
            onClose={ () => this.setState({deleteDialog: false}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this scene?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteDialog: false}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={e =>
                        this.setState({deleteDialog: false}, () =>
                            this.deleteScene(this.state.selectedSceneId))
                    }
                >
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderExportImportDialog() {
        if (!this.state.exportDialog && !this.state.importDialog) {
            return null;
        }

        return <ExportImportDialog
            isImport={ !!this.state.importDialog }
            themeType={ this.state.themeType }
            onClose={ importedScene => {
                if (this.state.importDialog && importedScene) {
                    const scene = this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId];
                    importedScene.common._id = scene._id;
                    importedScene.common.name = scene.name || importedScene.common.name;
                    this.setState({selectedSceneData: importedScene,  importDialog: false});
                } else {
                    this.setState({exportDialog: false, importDialog: false})
                }
            } }
            sceneObj={ this.state.exportDialog ? this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId] : '' }
        />
    }

    renderSceneTopToolbar(showDrawer) {
        return <Toolbar variant="dense" key="topToolbar" classes={ {gutters: this.props.classes.noGutters} }>
            { this.props.width !== 'md' && this.props.width !== 'sm' && this.props.width !== 'xs' ? <Typography variant="h6" className={ this.props.classes.sceneTitle }>
                { I18n.t('Scene options') /*Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) */}
                <span className={this.props.classes.sceneSubTitle}>{ Utils.getObjectNameFromObj(this.state.scenes[this.state.selectedSceneId], null, {language: I18n.getLanguage()}, true) }</span>
            </Typography> : null }

            { showDrawer ? <IconButton aria-label="Open list" title={ I18n.t('Open list') } onClick={ () => this.setState({menuOpened: true}) }><IconMenu/></IconButton> : null }
            <IconButton aria-label="Clone" title={ I18n.t('Clone') } onClick={ () => this.cloneScene(this.state.selectedSceneId) }><IconClone/></IconButton>

            <IconButton aria-label="Delete" title={ I18n.t('Delete') } onClick={ () => this.setState({deleteDialog: true}) }><IconDelete/></IconButton>

            <IconButton aria-label="Export" title={ I18n.t('Export scene') } onClick={ () => this.setState({exportDialog: true}) }><IconExport/></IconButton>

            {/*<IconButton aria-label="Import" title={ I18n.t('Import scene') } onClick={ () => this.setState({importDialog: true}) }><IconImport/></IconButton>*/}
        </Toolbar>;
    }

    renderSceneBottomToolbar() {
        return <Toolbar variant="dense" key="bottomToolbar" classes={ {gutters: this.props.classes.noGutters} }>
            <div style={{flexGrow: 1}}/>
            { this.state.selectedSceneChanged ? <Button
                className={ this.props.classes.toolbarButtons }
                variant="contained"
                color="secondary"
                onClick={() => this.writeScene()}
            >
                { I18n.t('Save') }
            </Button> : null }

            { this.state.selectedSceneChanged ? <Button
                className={ this.props.classes.toolbarButtons }
                variant="contained"
                onClick={ () => this.refreshData(this.state.selectedSceneId) }
            >
                { I18n.t('Cancel') }
            </Button> : null }
        </Toolbar>;
    }

    renderDrawerContent() {
        return <ScenesList
            scenes={this.state.scenes}
            folders={this.state.folders}
            selectedSceneId={this.state.selectedSceneId}
            selectedSceneChanged={this.state.selectedSceneChanged}
            theme={this.state.theme}
            onSceneSelect={id =>
                this.changeSelectedScene(id)
                    .catch(() => console.log('ignore'))}
            onSceneEnableDisable={id => this.sceneSwitch(id)}
            onCreateFolder={(parent, id) => this.addFolder(parent, id)}
            onCreateScene={parentId => this.createScene(this.getNewSceneId(), parentId)}
            onRenameFolder={(folder, newId) => this.renameFolder(folder, newId)}
            onMoveScene={(oldId, newId) => this.moveScript(oldId, newId)}
            />;
    }

    renderSceneMembers(oneColumn) {
        return <SceneMembersForm
            key={ 'selected' + this.state.selectedSceneId }
            oneColumn={ oneColumn }
            showError={ e => this.showError(e) }
            updateSceneMembers={ (members, cb) => this.updateSceneMembers(members, cb) }
            selectedSceneChanged={ this.state.selectedSceneChanged }
            sceneEnabled={ this.state.selectedSceneData.common.enabled }
            members={ this.state.selectedSceneData.native.members }
            easy={ !!this.state.selectedSceneData.native.easy }
            socket={ this.socket }
            onFalseEnabled={ this.state.selectedSceneData.native.onFalse.enabled }
            virtualGroup={ this.state.selectedSceneData.native.virtualGroup }
			aggregation={ this.state.selectedSceneData.native.aggregation }
            sceneId={ this.state.selectedSceneId }
            engineId={ this.state.selectedSceneData.common.engine }
            intervalBetweenCommands={ this.state.selectedSceneData.native.burstInterval || 0 }
        />;
    }

    renderSceneSettings(oneColumn) {
        if (!this.state.selectedSceneData) {
            this.state.selectedSceneData = JSON.parse(JSON.stringify(this.state.scenes[this.state.selectedSceneId]));
        }

        return <SceneForm
            key={ this.state.selectedSceneId }
            showError={ e => this.showError(e) }
            oneColumn={ oneColumn }
            updateScene={ (common, native, cb) => this.updateScene(common, native, cb) }
            scene={ this.state.selectedSceneData }
            socket={ this.socket }
            instances={ this.state.instances }
        />;
    }

    renderInOneColumn() {
        return [
            <Drawer
                key="drawer"
                anchor="left"
                open={ this.state.menuOpened }
                onClose={() => this.setState({menuOpened: false}) }
                classes={ {paper: this.props.classes.drawer }}
            >
                { this.renderDrawerContent() }
            </Drawer>,
            this.renderSceneTopToolbar(true),
            this.state.selectedSceneId ? <div
                    key="main"
                    className={ this.props.classes.heightMinus2Toolbars }
                    style={{ overflowY: 'auto', overflowX: 'hidden'}}
                >
                    { this.renderSceneSettings(true) }
                    { this.renderSceneMembers(true) }
                </div> : null,
            this.renderSceneBottomToolbar(),
        ]
    }

    renderInMoreThanOneColumn() {
        const showDrawer = this.props.width === 'sm' || this.props.width === 'xs';

        return <Container className={ clsx(this.props.classes.height, this.props.classes.fullWidthContainer) }>
            <Grid container spacing={ 1 } className={ this.props.classes.height }>
                { showDrawer ?
                    <Drawer anchor="left" open={ this.state.menuOpened } onClose={() => this.setState({menuOpened: false}) }>
                        { this.renderDrawerContent() }
                    </Drawer> :
                    <Grid item xs={ 3 } className={ clsx(this.props.classes.columnContainer, this.props.classes.height) }>
                        { this.renderDrawerContent() }
                    </Grid>
                }
                { this.state.selectedSceneId && this.state.scenes[this.state.selectedSceneId] ?
                    <Grid item xs={ showDrawer ? 12 : 9 } className={ clsx(this.props.classes.height, this.props.classes.settingsBackground) }>
                        <Grid container spacing={ 1 } className={ clsx(this.props.classes.height, this.props.classes.settingsBackground) }>
                            <Grid item xs={ this.props.width === 'xs' ? 12 : 5 } className={ this.props.classes.heightMinus2Toolbars }>
                                { this.renderSceneTopToolbar(showDrawer) }
                                <div className={this.props.classes.height}>
                                    {this.state.selectedSceneId ? this.renderSceneSettings() : null}
                                </div>
                                { this.renderSceneBottomToolbar() }
                            </Grid>
                            <Grid item xs={ this.props.width === 'xs' ? 12 : 7 } className={ clsx(this.props.classes.height) }>
                                <div className={ clsx(this.props.classes.heightMinusMargin) }>
                                    { this.state.selectedSceneId ?
                                        <div className={ clsx(this.props.classes.membersCell, this.props.classes.height) }>
                                            { this.renderSceneMembers() }
                                        </div>
                                        : null}
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                    : null
                }
            </Grid>
        </Container>
    }

    render() {
        if (!this.state.ready) {
            return <MuiThemeProvider theme={ this.state.theme }>
                <Loader theme={ this.state.themeName }/>
            </MuiThemeProvider>;
        }

        const oneColumn = this.props.width === 'xs';

        return (
            <MuiThemeProvider theme={ this.state.theme }>
                <div className={ this.props.classes.root }>
                    { oneColumn ?
                        this.renderInOneColumn() :
                        this.renderInMoreThanOneColumn()
                    }

                    { this.renderSceneChangeDialog() }
                    { this.renderDeleteDialog() }
                    { this.renderExportImportDialog() }
                    { this.renderError() }
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withWidth()(withStyles(styles)(withTheme(App)));
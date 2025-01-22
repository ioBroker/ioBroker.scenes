// Common
import React from 'react';
import * as Sentry from '@sentry/browser';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import ReactSplit, { SplitDirection, GutterTheme } from '@devbookhq/splitter';

// MaterialUi
import {
    Grid,
    Typography,
    Container,
    IconButton,
    Dialog,
    DialogTitle,
    Button,
    Toolbar,
    DialogActions,
    Drawer,
    Box,
} from '@mui/material';

// Own
import { AdminConnection, I18n, Loader, Utils, withWidth, GenericApp } from '@iobroker/adapter-react-v5';

import SceneForm from './components/SceneForm';
import SceneMembersForm from './components/SceneMembersForm';
import ExportImportDialog from './components/ExportImportDialog';
import ScenesList from './components/ScenesList';

import enLang from './i18n/en';
import deLang from './i18n/de';
import ruLang from './i18n/ru';
import ptLang from './i18n/pt';
import nlLang from './i18n/nl';
import frLang from './i18n/fr';
import itLang from './i18n/it';
import esLang from './i18n/es';
import plLang from './i18n/pl';
import ukLang from './i18n/uk';
import zhLang from './i18n/zh-cn';

// icons
import {
    MdClose as IconCancel,
    MdSave as IconSave,
    MdDelete as IconDelete,
    MdCheck as IconCheck,
    MdFileDownload as IconExport,
    MdFileUpload as IconImport,
} from 'react-icons/md';
import { FaClone as IconClone, FaBars as IconMenu } from 'react-icons/fa';
import pack from '../package.json';

const MARGIN_MEMBERS = 20;

const styles = {
    root: theme => ({
        width: '100%',
        height: 'calc(100% + 4px)',
        backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#fff',
        overflowX: 'hidden',
    }),
    width100: {
        width: '100%',
    },
    noGutters: {
        pl: 0,
        pr: 0,
    },
    height: {
        height: '100%',
    },
    heightMinus2Toolbars: {
        height: 'calc(100% - 96px)',
    },
    heightMinusMargin: {
        height: `calc(100% - ${MARGIN_MEMBERS}px)`,
    },
    fullWidthContainer: {
        maxWidth: 'inherit',
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 2,
        paddingRight: 2,
        overflow: 'hidden',
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    alignRight: {
        textAlign: 'right',
    },
    membersCell: theme => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#566770' : '#ADD8E6',
        mt: `${MARGIN_MEMBERS}px`,
        mr: '8px',
        mb: '16px',
        pt: 0,
        pl: '10px',
        pr: '10px',
        pb: '10px',

        borderRadius: '4px',
        height: `calc(100% - ${theme.spacing(1)})`,
    }),
    sceneTitle: theme => ({
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
        flexGrow: 1,
        paddingLeft: theme.spacing(1),
    }),
    sceneSubTitle: {
        fontSize: 10,
        display: 'block',
        fontStyle: 'italic',
        marginTop: -7,
    },
    toolbarButtons: theme => ({
        marginRight: theme.spacing(1),
    }),
    settingsBackground: theme => ({
        background: theme.palette.mode === 'dark' ? '#3a3a3a' : '#eee',
    }),
    gutter: theme => ({
        background: theme.palette.mode === 'dark' ? '#3a3a3a !important' : '#eee !important',
        '& .__dbk__dragger': {
            background: theme.palette.mode === 'dark' ? 'white !important' : 'black !important',
        },
    }),
    drawer: {
        overflow: 'hidden',
    },
};

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
        const extendedProps = { ...props };
        extendedProps.translations = {
            en: enLang,
            de: deLang,
            ru: ruLang,
            pt: ptLang,
            nl: nlLang,
            fr: frLang,
            it: itLang,
            es: esLang,
            pl: plLang,
            uk: ukLang,
            'zh-cn': zhLang,
        };
        extendedProps.Connection = AdminConnection;

        super(props, extendedProps);

        const query = getUrlQuery();

        this.port = query.port || (window.location.port === '3000' ? 8081 : window.location.port);
        this.host = query.host || window.location.hostname;

        window.iobForceHost = this.host;
    }

    onConnectionReady() {
        let splitSizes = window.localStorage.getItem('Scenes.splitSizes');
        if (splitSizes) {
            try {
                splitSizes = JSON.parse(splitSizes);
            } catch (e) {
                // ignore
            }
        }
        splitSizes = splitSizes || [30, 70];

        let splitSizes2 = window.localStorage.getItem('Scenes.splitSizes2');
        if (splitSizes2) {
            try {
                splitSizes2 = JSON.parse(splitSizes2);
            } catch (e) {
                // ignore
            }
        }
        splitSizes2 = splitSizes2 || [40, 60];

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
            showImportWarning: null,
            splitSizes,
            splitSizes2,
        };

        this.socket
            .getSystemConfig()
            .then(systemConfig => {
                newState.systemConfig = systemConfig;

                return this.socket
                    .getAdapterInstances(window.adapterName)
                    .then(instances => {
                        const sentryEnabled =
                            systemConfig.common.diag !== 'none' &&
                            instances.find(item => !item.common.disableDataReporting);
                        newState.instances = instances.map(item => item._id);

                        // if not local development
                        if (window.sentryDSN && sentryEnabled && window.location.host !== 'localhost:3000') {
                            Sentry.init({
                                dsn: window.sentryDSN,
                                release: `iobroker.${window.adapterName}@${pack.version}`,
                                integrations: [Sentry.dedupeIntegration()],
                            });

                            // BF 2021.08.31: may be this is not required as executed in adapter-react
                            this.socket.getObject('system.meta.uuid').then(uuidObj => {
                                if (uuidObj && uuidObj.native && uuidObj.native.uuid) {
                                    const scope = Sentry.getCurrentScope();
                                    scope.setUser({ id: uuidObj.native.uuid });
                                }
                                this.setState(newState, () => this.refreshData());
                            });
                        } else {
                            this.setState(newState, () => this.refreshData());
                        }
                    })
                    .then(() => this.socket.subscribeObject('scene.0.*', this.onObjectChange));
            })
            .catch(e => this.showError(e));
    }

    onObjectChange = (id, obj) => {
        if (obj) {
            const members = obj.native?.members;
            // place members on the last place
            if (members) {
                delete obj.native.members;
                obj.native.members = members;
            }
        }

        if (
            !this.state.scenes[id] || // new
            (!obj && this.state.scenes[id]) || // deleted
            JSON.stringify(this.state.scenes[id].common) !== JSON.stringify(obj.common) || // changed
            JSON.stringify(this.state.scenes[id].native) !== JSON.stringify(obj.native) // changed
        ) {
            const scenes = JSON.parse(JSON.stringify(this.state.scenes));
            if (obj) {
                if (scenes[id]) {
                    scenes[id].common = obj.common;
                    scenes[id].native = obj.native;
                    scenes[id].ts = obj.ts;
                } else {
                    scenes[id] = {
                        common: obj.common,
                        native: obj.native,
                        type: obj.type,
                        _id: obj._id,
                        ts: obj.ts,
                    };
                }
            } else {
                delete scenes[id];
            }
            if (!obj && id === this.state.selectedSceneId) {
                this.setState({ scenes, folders: this.buildTree(scenes) });
                // select a first scene
                setTimeout(
                    _newSceneId => this.changeSelectedScene(_newSceneId),
                    100,
                    Object.keys(scenes).shift() || '',
                );
            } else if (id === this.state.selectedSceneId) {
                this.setState({ scenes, selectedSceneData: JSON.parse(JSON.stringify(scenes[id])) });
            } else {
                this.setState({ scenes, folders: this.buildTree(scenes) });
            }
        }
    };

    sceneSwitch(id) {
        let scenes = JSON.parse(JSON.stringify(this.state.scenes));

        if (id === this.state.selectedSceneId) {
            scenes[id] = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        }

        scenes[id].common.enabled = !scenes[id].common.enabled;

        return this.saveScene(id, scenes[id])
            .then(() => this.refreshData(id))
            .catch(e => this.showError(e));
    }

    buildTree(scenes) {
        scenes = Object.values(scenes);

        let folders = { subFolders: {}, scenes: {}, id: '', prefix: '' };

        // create missing folders
        scenes.forEach(scene => {
            let id = scene._id;
            const parts = id.split('.');
            parts.shift();
            parts.shift();
            let currentFolder = folders;
            let prefix = '';
            for (let i = 0; i < parts.length - 1; i++) {
                if (prefix) {
                    prefix = `${prefix}.`;
                }
                prefix = prefix + parts[i];
                if (!currentFolder.subFolders[parts[i]]) {
                    currentFolder.subFolders[parts[i]] = {
                        subFolders: {},
                        scenes: {},
                        id: parts[i],
                        prefix,
                    };
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
        return this.socket
            .getObjectViewSystem('state', 'scene.0.', 'scene.\u9999')
            .then(_scenes => {
                scenes = _scenes;
                return { scenes, folders: this.buildTree(scenes) };
            })
            .catch(e => this.showError(e));
    }

    refreshData(changingScene) {
        const that = this;
        const emptyFolders = this.state.folders ? this.collectEmptyFolders(this.state.folders) : [];

        return new Promise(resolve => {
            if (changingScene) {
                this.setState({ changingScene }, () => resolve());
            } else {
                this.setState({ ready: false }, () => resolve());
            }
        })
            .then(() => this.getData())
            .then(newState => {
                newState.ready = true;
                newState.changingScene = '';
                newState.selectedSceneChanged = false;

                // Fill missing data
                Object.keys(newState.scenes).forEach(id => {
                    const sceneObj = {
                        common: newState.scenes[id].common || {},
                        native: newState.scenes[id].native || {},
                        type: newState.scenes[id].type,
                        _id: id,
                        ts: newState.scenes[id].ts,
                    };

                    // rename attribute
                    if (sceneObj.native.burstIntervall !== undefined) {
                        sceneObj.native.burstInterval = sceneObj.native.burstIntervall;
                        delete sceneObj.native.burstIntervall;
                    }

                    sceneObj.native.burstInterval = parseInt(sceneObj.native.burstInterval || 0, 10);
                    sceneObj.native.onFalse = sceneObj.native.onFalse || {};
                    sceneObj.native.onTrue = sceneObj.native.onTrue || {};
                    sceneObj.native.onFalse.trigger = sceneObj.native.onFalse.trigger || { condition: '==' };
                    sceneObj.native.onTrue.trigger = sceneObj.native.onTrue.trigger || { condition: '==' };
                    sceneObj.native.members = sceneObj.native.members || [];
                    const members = sceneObj.native.members;
                    delete sceneObj.native.members;
                    // place it on the last place
                    sceneObj.native.members = members;
                    newState.scenes[id] = sceneObj;
                });

                if (!newState.scenes[this.state.selectedSceneId]) {
                    newState.selectedSceneId = Object.keys(newState.scenes).shift() || '';
                }

                if (
                    (newState.selectedSceneId || that.state.selectedSceneId) &&
                    newState.scenes[newState.selectedSceneId || that.state.selectedSceneId]
                ) {
                    newState.selectedSceneData = JSON.parse(
                        JSON.stringify(newState.scenes[newState.selectedSceneId || that.state.selectedSceneId]),
                    );
                } else {
                    newState.selectedSceneData = null;
                }

                // add empty folders
                if (emptyFolders?.length) {
                    emptyFolders.forEach(folder => {
                        let prefix = folder.prefix.split('.');
                        let parent = newState.folders;
                        for (let i = 0; i < prefix.length; i++) {
                            if (parent.subFolders[prefix[i]]) {
                                parent = parent.subFolders[prefix[i]];
                            } else {
                                parent.subFolders[prefix[i]] = {
                                    subFolders: {},
                                    scenes: {},
                                    id: prefix[i],
                                    prefix: prefix.slice(0, i + 1).join('.'),
                                };
                            }
                        }
                    });
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
            prefix: _parentFolder.prefix ? `${_parentFolder.prefix}.${id}` : id,
        };

        this.setState({ folders });
    }

    addSceneToFolderPrefix = (scene, folderPrefix, noRefresh) => {
        let oldId = scene._id;
        let sceneId = scene._id.split('.').pop();
        scene._id = `scene.0.${folderPrefix}${folderPrefix ? '.' : ''}${sceneId}`;

        return this.socket
            .delObject(oldId)
            .then(() => {
                console.log(`Deleted ${oldId}`);
                return this.saveScene(scene._id, scene);
            })
            .catch(e => this.showError(e))
            .then(() => {
                console.log(`Set new ID: ${scene._id}`);
                return (
                    !noRefresh &&
                    this.refreshData(sceneId)
                        .then(() => this.changeSelectedScene(scene._id))
                        .catch(e => this.showError(e))
                );
            });
    };

    moveScript(oldId, newId) {
        const scene = this.state.scenes[oldId];
        if (this.state.selectedSceneId === oldId) {
            return this.setState({ selectedSceneId: newId }, () => this.moveScript(oldId, newId));
        }

        const oldPrefix = getFolderPrefix(scene._id);
        const folders = JSON.parse(JSON.stringify(this.state.folders));
        const oldParentFolder = this.findFolder(folders, { prefix: oldPrefix });
        scene._id = newId;

        return this.socket
            .delObject(oldId)
            .then(() => {
                console.log(`Deleted ${oldId}`);
                return this.saveScene(scene._id, scene);
            })
            .catch(e => this.showError(e))
            .then(() => {
                console.log(`Set new ID: ${scene._id}`);
                // move the scene in state
                const scenes = JSON.parse(JSON.stringify(this.state.scenes));
                delete scenes[oldId];
                scenes[scene._id] = scene;
                // find parent folder
                const newPrefix = getFolderPrefix(scene._id);
                const newParentFolder = this.findFolder(folders, { prefix: newPrefix });
                if (newParentFolder && oldParentFolder) {
                    newParentFolder.scenes[scene._id] = scene;
                    delete oldParentFolder.scenes[oldId];
                }

                this.setState({ scenes, folders }, () =>
                    this.refreshData(newId)
                        .then(() => this.changeSelectedScene(scene._id))
                        .catch(e => this.showError(e)),
                );
            });
    }

    collectEmptyFolders(folders, result) {
        folders = folders || this.state.folders;
        result = result || [];
        if (!ScenesList.isFolderNotEmpty(folders)) {
            result.push(folders);
        }
        Object.keys(folders.subFolders).forEach(id => this.collectEmptyFolders(folders.subFolders[id], result));
        return result;
    }

    renameFolder(folder, newName) {
        return new Promise(resolve => this.setState({ changingScene: folder }, () => resolve())).then(() => {
            let newSelectedId;

            let prefix = folder.prefix.split('.');
            prefix[prefix.length - 1] = newName;
            prefix = prefix.join('.');

            if (Object.keys(folder.scenes).find(id => id === this.state.selectedSceneId)) {
                newSelectedId = `scene.0.${prefix}.${this.state.selectedSceneId.split('.').pop()}`;
            }

            const promises = Object.keys(folder.scenes).map(sceneId =>
                this.addSceneToFolderPrefix(folder.scenes[sceneId], prefix, true),
            );

            // collect empty folders, because they will disappear after reload from DB
            folder.id = newName;
            folder.prefix = prefix;

            return Promise.all(promises)
                .then(() => this.refreshData(folder))
                .then(() => newSelectedId && this.setState({ selectedSceneId: newSelectedId }));
        });
    }

    createScene(name, parentId) {
        let template = {
            common: {
                name: '',
                type: 'mixed', // because it can have value 'uncertain'
                role: 'scene.state',
                desc: '',
                enabled: true,
                read: true,
                write: true,
                def: false,
                engine: 'system.adapter.scenes.0',
            },
            native: {
                onTrue: {
                    trigger: {},
                    cron: null,
                    astro: null,
                },
                onFalse: {
                    enabled: false,
                    trigger: {},
                    cron: null,
                    astro: null,
                },
                easy: true,
                members: [],
            },
            type: 'state',
        };

        template.common.name = name;
        let id = `scene.0.${parentId ? `${parentId}.` : ''}${template.common.name}`;

        this.setState({ changingScene: id }, () =>
            this.saveScene(id, template)
                .then(() => this.refreshData(id))
                .then(() => this.changeSelectedScene(id))
                .catch(e => this.showError(e)),
        );
    }

    cloneScene(id) {
        let scene = JSON.parse(JSON.stringify(this.state.scenes[id]));
        scene._id = scene._id.split('.');
        scene._id.pop();
        scene._id.push(this.getNewSceneId());
        scene._id = scene._id.join('.');
        scene.common.name = `${scene.common.name} ${I18n.t('copy')}`;

        this.setState({ changingScene: scene._id }, () =>
            this.saveScene(scene._id, scene)
                .then(() => this.refreshData(scene._id))
                .then(() => this.changeSelectedScene(scene._id))
                .catch(e => this.showError(e)),
        );
    }

    async saveScene(sceneId, sceneObj) {
        if (sceneObj.ts) {
            const _sceneObj = JSON.parse(JSON.stringify(sceneObj));
            delete _sceneObj.ts;
            await this.socket.setObject(sceneId, _sceneObj);
        } else {
            await this.socket.setObject(sceneId, sceneObj);
        }
    }

    async writeScene() {
        const scene = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        scene._id = this.state.selectedSceneId;

        const folder = getFolderPrefix(scene._id);
        const newId = `scene.0.${folder ? `${folder}.` : ''}${scene.common.name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\./g, '_').replace(/\s/g, '_')}`;

        if (scene._id !== newId) {
            // check if the scene name is unique
            if (Object.keys(this.state.scenes).find(id => id === newId)) {
                return this.showError(I18n.t('Name is not unique. Please change name before the save.'));
            }

            // delete first the old scene
            try {
                await this.socket.delObject(scene._id);
                scene._id = newId;
                await this.saveScene(scene._id, scene);
                await this.refreshData(this.state.selectedSceneId);
                await this.changeSelectedScene(newId, true);
            } catch (e) {
                this.showError(e);
            }
        } else {
            try {
                await this.saveScene(this.state.selectedSceneId, scene);
                await this.refreshData(this.state.selectedSceneId);
            } catch (e) {
                this.showError(e);
            }
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

        let selectedSceneChanged =
            JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(scene);
        this.setState({ selectedSceneChanged, selectedSceneData: scene }, () => cb && cb());
    }

    async deleteScene(id) {
        try {
            await this.socket.delObject(id);
            if (this.state.selectedSceneId === id) {
                await this.refreshData(id);
                const ids = Object.keys(this.state.scenes);
                // Find the next scene
                let nextId = ids.find(_id => _id > id) || '';
                if (!nextId) {
                    // try a prev scene
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

                await this.changeSelectedScene(nextId);
            }

            await this.refreshData(id);
        } catch (e) {
            this.showError(e);
        }
    }

    getNewSceneId() {
        let newId = 0;

        for (const id in this.state.scenes) {
            let shortId = id.split('.').pop();
            let matches = shortId.match(/^scene([0-9]+)$/);
            if (matches && parseInt(matches[1], 10) >= newId) {
                newId = parseInt(matches[1]) + 1;
            }
        }

        return `scene${newId}`;
    }

    updateSceneMembers(members, cb) {
        const selectedSceneData = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        selectedSceneData.native.members = JSON.parse(JSON.stringify(members));

        let selectedSceneChanged =
            JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(selectedSceneData);
        this.setState({ selectedSceneChanged, selectedSceneData }, () => cb && cb());
    }

    changeSelectedScene(newId, ignoreUnsaved, cb) {
        return new Promise(resolve => {
            if (this.state.selectedSceneId !== newId) {
                if (this.state.selectedSceneChanged && !ignoreUnsaved) {
                    this.confirmCb = cb;
                    this.setState({ sceneChangeDialog: newId }, () => resolve());
                } else {
                    window.localStorage.setItem('Scenes.selectedSceneId', newId);
                    this.setState(
                        {
                            selectedSceneData: this.state.scenes[newId]
                                ? JSON.parse(JSON.stringify(this.state.scenes[newId]))
                                : null,
                            sceneChangeDialog: '',
                            selectedSceneId: newId || '',
                            selectedSceneChanged: false,
                            menuOpened: false,
                        },
                        () => {
                            resolve();
                            cb && cb();
                        },
                    );
                }
            } else {
                resolve();
                cb && cb();
            }
        });
    }

    renderSceneChangeDialog() {
        const that = this;
        return this.state.sceneChangeDialog ? (
            <Dialog
                open={!0}
                key="sceneChangeDialog"
                onClose={() => this.setState({ sceneChangeDialog: '' })}
            >
                <DialogTitle>{I18n.t('Are you sure for cancel unsaved changes?')}</DialogTitle>
                <DialogActions style={styles.alignRight}>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() =>
                            this.changeSelectedScene(this.state.sceneChangeDialog, true, () => {
                                const cb = this.confirmCb;
                                this.confirmCb = null;
                                cb && cb();
                            }).catch(() => console.log('ignore'))
                        }
                    >
                        {I18n.t('Discard')}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={() =>
                            // save scene
                            this.writeScene()
                                .then(() =>
                                    that.changeSelectedScene(
                                        that.state.sceneChangeDialog === 'empty' ? '' : that.state.sceneChangeDialog,
                                        true,
                                        () => {
                                            const cb = this.confirmCb;
                                            this.confirmCb = null;
                                            cb && cb();
                                        },
                                    ),
                                )
                                .catch(() => console.log('ignore'))
                        }
                        startIcon={<IconSave />}
                    >
                        {I18n.t('Save changes')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() => {
                            this.confirmCb = null; // cancel callback
                            this.setState({ sceneChangeDialog: '' });
                        }}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    renderDeleteDialog() {
        return this.state.deleteDialog ? (
            <Dialog
                open={!0}
                key="deleteDialog"
                onClose={() => this.setState({ deleteDialog: false })}
            >
                <DialogTitle>{I18n.t('Are you sure for delete this scene?')}</DialogTitle>
                <DialogActions style={styles.alignRight}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() =>
                            this.setState({ deleteDialog: false }, () => this.deleteScene(this.state.selectedSceneId))
                        }
                        startIcon={<IconDelete />}
                    >
                        {I18n.t('Delete')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        autoFocus
                        onClick={() => this.setState({ deleteDialog: false })}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    renderExportImportDialog() {
        if (!this.state.exportDialog && !this.state.importDialog) {
            return null;
        }

        return (
            <ExportImportDialog
                isImport={!!this.state.importDialog}
                themeType={this.state.themeType}
                onClose={importedScene => {
                    if (this.state.importDialog && importedScene) {
                        const scene = this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId];
                        // if inability changed
                        if ((importedScene.common.enabled !== false) !== (scene.common.enabled !== false)) {
                            const scenes = JSON.parse(JSON.stringify(this.state.scenes));
                            scenes[this.state.selectedSceneId].common.enabled = importedScene.common.enabled !== false;
                            this.saveScene(this.state.selectedSceneId, scenes[this.state.selectedSceneId]).catch(e =>
                                this.showError(e),
                            );
                            this.setState({ scenes });
                        }
                        scene.common.enabled = importedScene.common.enabled !== false;
                        scene.common.engine = importedScene.common.engine;
                        if (!scene.common.engine || !this.state.instances.includes(scene.common.engine)) {
                            scene.common.engine = this.state.instances[0];
                        }
                        scene.native = importedScene.native;
                        this.updateScene(scene.common, scene.native, () => this.setState({ importDialog: false }));
                    } else {
                        this.setState({ exportDialog: false, importDialog: false });
                    }
                }}
                sceneObj={
                    this.state.exportDialog
                        ? this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId]
                        : null
                }
            />
        );
    }

    renderImportWarningDialog() {
        return this.state.showImportWarning ? (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showImportWarning: null })}
            >
                <DialogTitle>{I18n.t('Some of the scenes already exists')}</DialogTitle>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={async () => {
                            const importedScenes = this.state.showImportWarning;
                            const ids = Object.keys(importedScenes);
                            for (let s = 0; s < ids.length; s++) {
                                // if exists
                                if (this.state.scenes[ids[s]]) {
                                    // find a unique name
                                    let newId = ids[s];
                                    while (this.state.scenes[newId]) {
                                        newId += '_import';
                                    }
                                    importedScenes[ids[s]].common.name = newId.split('.').pop();
                                    await this.saveScene(newId, importedScenes[ids[s]]);
                                } else {
                                    await this.saveScene(ids[s], importedScenes[ids[s]]);
                                }
                            }
                            this.setState({ showImportWarning: null });
                            await this.refreshData();
                        }}
                    >
                        {I18n.t('Change names')}
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        autoFocus
                        onClick={async () => {
                            const importedScenes = this.state.showImportWarning;
                            const ids = Object.keys(importedScenes);
                            for (let s = 0; s < ids.length; s++) {
                                await this.saveScene(ids[s], importedScenes[ids[s]]);
                            }
                            this.setState({ showImportWarning: null });
                            this.refreshData();
                        }}
                        startIcon={<IconSave />}
                    >
                        {I18n.t('Overwrite existing')}
                    </Button>
                    <Button
                        variant="contained"
                        color="grey"
                        onClick={() => this.setState({ showImportWarning: null })}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;
    }

    async importScenes(importedScenes) {
        // check if all scenes are unique
        const ids = Object.keys(this.state.scenes);
        if (ids.find(id => importedScenes[id])) {
            this.setState({ showImportWarning: importedScenes });
        } else {
            const ids = Object.keys(importedScenes);
            for (let s = 0; s < ids.length; s++) {
                await this.saveScene(ids[s], importedScenes[ids[s]]);
            }
            await this.refreshData();
        }
    }

    renderSceneTopToolbar(showDrawer) {
        return (
            <Toolbar
                variant="dense"
                key="topToolbar"
                sx={{ '& .MuiToolbar-gutters': styles.noGutters }}
            >
                {this.props.width !== 'md' && this.props.width !== 'sm' && this.props.width !== 'xs' ? (
                    <Typography
                        variant="h6"
                        sx={styles.sceneTitle}
                    >
                        {
                            I18n.t(
                                'Scene options',
                            ) /*Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) */
                        }
                        <span style={styles.sceneSubTitle}>
                            {Utils.getObjectNameFromObj(
                                this.state.scenes[this.state.selectedSceneId],
                                null,
                                { language: I18n.getLanguage() },
                                true,
                            )}
                        </span>
                    </Typography>
                ) : null}

                {showDrawer ? (
                    <IconButton
                        aria-label="Open list"
                        title={I18n.t('Open list')}
                        onClick={() => this.setState({ menuOpened: true })}
                    >
                        <IconMenu />
                    </IconButton>
                ) : null}
                <IconButton
                    aria-label="Clone"
                    title={I18n.t('Clone')}
                    onClick={() => this.cloneScene(this.state.selectedSceneId)}
                >
                    <IconClone />
                </IconButton>

                <IconButton
                    aria-label="Delete"
                    title={I18n.t('Delete')}
                    onClick={() => this.setState({ deleteDialog: true })}
                >
                    <IconDelete />
                </IconButton>

                <IconButton
                    aria-label="Export"
                    title={I18n.t('Export scene')}
                    onClick={() => this.setState({ exportDialog: true })}
                >
                    <IconExport />
                </IconButton>

                <IconButton
                    aria-label="Import"
                    title={I18n.t('Import scene')}
                    onClick={() => this.setState({ importDialog: true })}
                >
                    <IconImport />
                </IconButton>
            </Toolbar>
        );
    }

    renderSceneBottomToolbar() {
        return (
            <Toolbar
                variant="dense"
                key="bottomToolbar"
                sx={{ '& .MuiToolbar-gutters': styles.noGutters }}
            >
                <div style={{ flexGrow: 1 }} />
                {this.state.selectedSceneChanged ? (
                    <Button
                        sx={styles.toolbarButtons}
                        variant="contained"
                        color="secondary"
                        onClick={() => this.writeScene()}
                        startIcon={<IconCheck />}
                    >
                        {I18n.t('Save')}
                    </Button>
                ) : null}

                {this.state.selectedSceneChanged ? (
                    <Button
                        color="grey"
                        sx={styles.toolbarButtons}
                        variant="contained"
                        startIcon={<IconCancel />}
                        onClick={() => this.refreshData(this.state.selectedSceneId)}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                ) : null}
            </Toolbar>
        );
    }

    renderDrawerContent(showDrawer) {
        return (
            <ScenesList
                themeType={this.state.themeType}
                scenes={this.state.scenes}
                folders={this.state.folders}
                selectedSceneId={this.state.selectedSceneId}
                selectedSceneChanged={this.state.selectedSceneChanged}
                theme={this.state.theme}
                showDrawer={showDrawer}
                onScenesImport={importedScenes => this.importScenes(importedScenes)}
                onSceneSelect={id => this.changeSelectedScene(id).catch(() => console.log('ignore'))}
                onSceneEnableDisable={id => this.sceneSwitch(id)}
                onCreateFolder={(parent, id) => this.addFolder(parent, id)}
                onCreateScene={parentId => this.createScene(this.getNewSceneId(), parentId)}
                onRenameFolder={(folder, newId) => this.renameFolder(folder, newId)}
                onMoveScene={(oldId, newId) => this.moveScript(oldId, newId)}
                version={pack.version}
            />
        );
    }

    renderSceneMembers(oneColumn) {
        return (
            <SceneMembersForm
                key={`selected${this.state.selectedSceneId}`}
                oneColumn={oneColumn}
                showError={e => this.showError(e)}
                updateSceneMembers={(members, cb) => this.updateSceneMembers(members, cb)}
                selectedSceneChanged={this.state.selectedSceneChanged}
                sceneEnabled={this.state.selectedSceneData.common.enabled}
                ts={this.state.selectedSceneData.ts || 0}
                members={this.state.selectedSceneData.native.members}
                easy={!!this.state.selectedSceneData.native.easy}
                socket={this.socket}
                onFalseEnabled={this.state.selectedSceneData.native.onFalse.enabled}
                virtualGroup={this.state.selectedSceneData.native.virtualGroup}
                aggregation={this.state.selectedSceneData.native.aggregation}
                sceneId={this.state.selectedSceneId}
                engineId={this.state.selectedSceneData.common.engine}
                intervalBetweenCommands={this.state.selectedSceneData.native.burstInterval || 0}
                theme={this.state.theme}
            />
        );
    }

    renderSceneSettings(oneColumn) {
        if (!this.state.selectedSceneData) {
            this.state.selectedSceneData = JSON.parse(JSON.stringify(this.state.scenes[this.state.selectedSceneId]));
        }

        return (
            <SceneForm
                key={this.state.selectedSceneId}
                showError={e => this.showError(e)}
                oneColumn={oneColumn}
                updateScene={(common, native, cb) => this.updateScene(common, native, cb)}
                scene={this.state.selectedSceneData}
                socket={this.socket}
                instances={this.state.instances}
                theme={this.state.theme}
            />
        );
    }

    renderInOneColumn() {
        return [
            <Drawer
                key="drawer"
                anchor="left"
                open={this.state.menuOpened}
                onClose={() => this.setState({ menuOpened: false })}
                sx={{ '& .MuiDrawer-paper': styles.drawer }}
            >
                {this.renderDrawerContent(true)}
            </Drawer>,
            this.renderSceneTopToolbar(true),
            this.state.selectedSceneId ? (
                <div
                    key="main"
                    style={{
                        ...styles.heightMinus2Toolbars,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: 8,
                        height: 'calc(100% - 112px)',
                    }}
                >
                    {this.renderSceneSettings(true)}
                    {this.renderSceneMembers(true)}
                </div>
            ) : null,
            this.renderSceneBottomToolbar(),
        ];
    }

    renderInMoreThanOneColumn() {
        const showDrawer = this.props.width === 'sm';

        if (showDrawer) {
            const renderedScene =
                this.state.selectedSceneId && this.state.scenes[this.state.selectedSceneId] ? (
                    <Grid
                        container
                        spacing={1}
                        sx={Utils.getStyle(this.state.theme, styles.height, styles.settingsBackground)}
                    >
                        <Grid
                            item
                            xs={this.props.width === 'xs' ? 12 : 5}
                            style={styles.heightMinus2Toolbars}
                        >
                            {this.renderSceneTopToolbar(true)}
                            <div style={{ ...styles.height, paddingLeft: 8 }}>
                                {this.state.selectedSceneId ? this.renderSceneSettings() : null}
                            </div>
                            {this.renderSceneBottomToolbar()}
                        </Grid>
                        <Grid
                            item
                            xs={this.props.width === 'xs' ? 12 : 7}
                            style={styles.height}
                        >
                            <div style={styles.heightMinusMargin}>
                                <Box
                                    component="div"
                                    sx={Utils.getStyle(this.state.theme, styles.membersCell, styles.height)}
                                >
                                    {this.renderSceneMembers()}
                                </Box>
                            </div>
                        </Grid>
                    </Grid>
                ) : null;

            return (
                <Container style={{ ...styles.height, ...styles.fullWidthContainer }}>
                    <Grid
                        container
                        spacing={1}
                        style={styles.height}
                    >
                        <Drawer
                            anchor="left"
                            open={this.state.menuOpened}
                            onClose={() => this.setState({ menuOpened: false })}
                        >
                            {this.renderDrawerContent(true)}
                        </Drawer>
                        {this.state.selectedSceneId && this.state.scenes[this.state.selectedSceneId] ? (
                            <Grid
                                item
                                xs={12}
                                sx={Utils.getStyle(this.state.theme, styles.height, styles.settingsBackground)}
                            >
                                {renderedScene}
                            </Grid>
                        ) : null}
                    </Grid>
                </Container>
            );
        }

        const renderedScene =
            this.state.selectedSceneId && this.state.scenes[this.state.selectedSceneId] ? (
                <ReactSplit
                    direction={SplitDirection.Horizontal}
                    initialSizes={this.state.splitSizes2}
                    minWidths={[400, 350]}
                    onResizeFinished={(gutterIdx, splitSizes2) => {
                        this.setState({ splitSizes2 });
                        window.localStorage.setItem('Scenes.splitSizes2', JSON.stringify(splitSizes2));
                    }}
                    theme={this.state.themeName === 'dark' ? GutterTheme.Dark : GutterTheme.Light}
                    gutterClassName={this.state.themeName === 'dark' ? `Dark visGutter` : `Light visGutter`}
                >
                    <div style={styles.heightMinus2Toolbars}>
                        {this.renderSceneTopToolbar(false)}
                        <div style={{ ...styles.height, paddingLeft: 8, paddingRight: 8 }}>
                            {this.state.selectedSceneId ? this.renderSceneSettings() : null}
                        </div>
                        {this.renderSceneBottomToolbar()}
                    </div>
                    <Box style={styles.heightMinusMargin}>
                        <Box
                            component="div"
                            sx={Utils.getStyle(this.state.theme, styles.membersCell, styles.height)}
                        >
                            {this.renderSceneMembers()}
                        </Box>
                    </Box>
                </ReactSplit>
            ) : null;

        return (
            <ReactSplit
                direction={SplitDirection.Horizontal}
                initialSizes={this.state.splitSizes}
                minWidths={[290, 450]}
                onResizeFinished={(gutterIdx, splitSizes) => {
                    this.setState({ splitSizes });
                    window.localStorage.setItem('Scenes.splitSizes', JSON.stringify(splitSizes));
                }}
                theme={this.state.themeName === 'dark' ? GutterTheme.Dark : GutterTheme.Light}
                gutterClassName={this.state.themeName === 'dark' ? 'Dark visGutter' : 'Light visGutter'}
            >
                <div style={{ ...styles.columnContainer, ...styles.height }}>{this.renderDrawerContent(false)}</div>
                {this.state.selectedSceneId && this.state.scenes[this.state.selectedSceneId] ? (
                    <Box
                        component="div"
                        sx={Utils.getStyle(this.state.theme, styles.height, styles.settingsBackground)}
                    >
                        {renderedScene}
                    </Box>
                ) : (
                    <div />
                )}
            </ReactSplit>
        );
    }

    render() {
        if (!this.state.ready) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeName={this.state.themeName} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        const oneColumn = this.props.width === 'xs';

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box
                        component="div"
                        sx={styles.root}
                    >
                        {oneColumn ? this.renderInOneColumn() : this.renderInMoreThanOneColumn()}
                        {this.renderSceneChangeDialog()}
                        {this.renderDeleteDialog()}
                        {this.renderExportImportDialog()}
                        {this.renderImportWarningDialog()}
                        {this.renderError()}
                    </Box>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default withWidth()(App);

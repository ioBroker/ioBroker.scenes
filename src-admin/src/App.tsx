// Common
import React from 'react';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import ReactSplit, { SplitDirection } from '@devbookhq/splitter';

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
import {
    AdminConnection,
    I18n,
    Loader,
    Utils,
    withWidth,
    GenericApp,
    type IobTheme,
    type GenericAppState,
} from '@iobroker/adapter-react-v5';

import SceneForm from './components/SceneForm';
import SceneMembersForm from './components/SceneMembersForm';
import ExportImportDialog from './components/ExportImportDialog';
import ScenesList, { type SceneFolder } from './components/ScenesList';

import enLang from './i18n/en.json';
import deLang from './i18n/de.json';
import ruLang from './i18n/ru.json';
import ptLang from './i18n/pt.json';
import nlLang from './i18n/nl.json';
import frLang from './i18n/fr.json';
import itLang from './i18n/it.json';
import esLang from './i18n/es.json';
import plLang from './i18n/pl.json';
import ukLang from './i18n/uk.json';
import zhLang from './i18n/zh-cn.json';

declare global {
    interface Window {
        sentryDSN: string;
        adapterName: string | undefined;
    }
}

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
import type { GenericAppProps } from '@iobroker/adapter-react-v5/build/types';
import type { SceneCommon, SceneConfig, SceneMember, SceneObject } from './types';

const MARGIN_MEMBERS = 20;

const styles: Record<string, any> = {
    root: (theme: IobTheme): React.CSSProperties => ({
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
    membersCell: (theme: IobTheme): any => ({
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
    sceneTitle: (theme: IobTheme): any => ({
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
        flexGrow: 1,
        pl: 1,
    }),
    sceneSubTitle: {
        fontSize: 10,
        display: 'block',
        fontStyle: 'italic',
        marginTop: -7,
    },
    toolbarButtons: {
        marginRight: 8,
    },
    settingsBackground: (theme: IobTheme): React.CSSProperties => ({
        background: theme.palette.mode === 'dark' ? '#3a3a3a' : '#eee',
    }),
    gutter: (theme: IobTheme): any => ({
        background: theme.palette.mode === 'dark' ? '#3a3a3a !important' : '#eee !important',
        '& .__dbk__dragger': {
            background: theme.palette.mode === 'dark' ? 'white !important' : 'black !important',
        },
    }),
    drawer: {
        overflow: 'hidden',
    },
};

function getFolderPrefix(sceneId: string): string {
    const result = sceneId.split('.');
    result.shift();
    result.shift();
    result.pop();
    return result.join('.');
}

interface AppProps extends GenericAppProps {
    width: string;
}

interface AppState extends GenericAppState {
    lang: ioBroker.Languages;
    ready: boolean;
    selectedSceneId: string;
    scenes: Record<string, SceneObject>;
    folders: SceneFolder | null;
    changingScene: SceneFolder | string;
    instances: string[];
    selectedSceneChanged: boolean;
    deleteDialog: boolean;
    selectedSceneData: SceneObject | null;
    exportDialog: boolean;
    importDialog: boolean;
    menuOpened: boolean;
    showImportWarning: Record<string, SceneObject> | null;
    splitSizes: [number, number];
    splitSizes2: [number, number];
    systemConfig: ioBroker.SystemConfigObject;
    sceneChangeDialog: string;
}

class App extends GenericApp<AppProps, AppState> {
    private confirmCb: null | (() => void) = null;
    constructor(props: AppProps) {
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
        // @ts-expect-error fix later
        extendedProps.Connection = AdminConnection;
        extendedProps.sentryDSN = window.sentryDSN;

        super(props, extendedProps);
    }

    onConnectionReady(): void {
        const splitSizesStr = window.localStorage.getItem('Scenes.splitSizes');
        let splitSizes: [number, number] = [30, 70];
        if (splitSizesStr) {
            try {
                splitSizes = JSON.parse(splitSizesStr);
            } catch {
                // ignore
            }
        }
        splitSizes = splitSizes || [30, 70];

        const splitSizesStr2 = window.localStorage.getItem('Scenes.splitSizes2');
        let splitSizes2: [number, number] = [30, 70];
        if (splitSizesStr2) {
            try {
                splitSizes2 = JSON.parse(splitSizesStr2);
            } catch {
                // ignore
            }
        }
        splitSizes2 = splitSizes2 || [40, 60];

        const newState: Partial<AppState> = {
            lang: this.socket.systemLang,
            ready: false,
            selectedSceneId: window.localStorage.getItem('Scenes.selectedSceneId') || '',
            scenes: {},
            folders: null,
            changingScene: '',
            instances: [],
            selectedSceneChanged: false,
            deleteDialog: false,
            selectedSceneData: null,
            exportDialog: false,
            importDialog: false,
            menuOpened: false,
            showImportWarning: null,
            sceneChangeDialog: '',
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
                        newState.instances = instances.map(item => item._id);

                        this.setState(newState as AppState, () => this.refreshData());
                    })
                    .then(() => this.socket.subscribeObject('scene.0.*', this.onObjectChange));
            })
            .catch(e => this.showError(e));
    }

    onObjectChange = (id: string, obj: ioBroker.StateObject | null | undefined): void => {
        if (obj) {
            const members = (obj.native as SceneConfig)?.members;
            // place members on the last place
            if (members) {
                delete obj.native.members;
                obj.native.members = members;
            }
        }

        if (
            !this.state.scenes[id] || // new
            (!obj && this.state.scenes[id]) || // deleted
            JSON.stringify(this.state.scenes[id].common) !== JSON.stringify(obj?.common) || // changed
            JSON.stringify(this.state.scenes[id].native) !== JSON.stringify(obj?.native) // changed
        ) {
            const scenes: Record<string, SceneObject> = JSON.parse(JSON.stringify(this.state.scenes));
            if (obj) {
                if (scenes[id]) {
                    scenes[id].common = obj.common as SceneCommon;
                    scenes[id].native = obj.native as SceneConfig;
                    scenes[id].ts = obj.ts;
                } else {
                    scenes[id] = {
                        common: obj.common as SceneCommon,
                        native: obj.native as SceneConfig,
                        type: obj.type,
                        _id: obj._id,
                        ts: obj.ts,
                    };
                }
            } else {
                delete scenes[id];
            }
            if (!obj && id === this.state.selectedSceneId) {
                this.setState({ scenes, folders: App.buildTree(scenes) });
                // select a first scene
                setTimeout(
                    _newSceneId => this.changeSelectedScene(_newSceneId),
                    100,
                    Object.keys(scenes).shift() || '',
                );
            } else if (id === this.state.selectedSceneId) {
                this.setState({ scenes, selectedSceneData: JSON.parse(JSON.stringify(scenes[id])) });
            } else {
                this.setState({ scenes, folders: App.buildTree(scenes) });
            }
        }
    };

    async sceneSwitch(id: string): Promise<void> {
        const scenes: Record<string, SceneObject> = JSON.parse(JSON.stringify(this.state.scenes));

        if (id === this.state.selectedSceneId) {
            scenes[id] = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        }

        scenes[id].common.enabled = !scenes[id].common.enabled;

        try {
            await this.saveScene(id, scenes[id]);
            await this.refreshData(id);
        } catch (e) {
            return this.showError(e);
        }
    }

    static buildTree(scenesObj: Record<string, SceneObject>): SceneFolder {
        const scenes: SceneObject[] = Object.values(scenesObj);

        const folders: SceneFolder = { subFolders: {}, scenes: {}, id: '', prefix: '' };

        // create missing folders
        scenes.forEach(scene => {
            const id = scene._id;
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

    findFolder(parent: SceneFolder, folder: SceneFolder): SceneFolder | null {
        if (parent.prefix === folder.prefix) {
            return parent;
        }
        for (const index in parent.subFolders) {
            const result = this.findFolder(parent.subFolders[index], folder);
            if (result) {
                return result;
            }
        }

        return null;
    }

    async getData(): Promise<Partial<AppState>> {
        try {
            const scenes: Record<string, SceneObject> = (await this.socket.getObjectViewSystem(
                'state',
                'scene.',
                'scene.\u9999',
            )) as Record<string, SceneObject>;
            return { scenes, folders: App.buildTree(scenes) };
        } catch (e) {
            this.showError(e);
            return {};
        }
    }

    async refreshData(changingScene?: SceneFolder | string): Promise<void> {
        const emptyFolders = this.state.folders ? this.collectEmptyFolders(this.state.folders) : [];

        await new Promise<void>(resolve => {
            if (changingScene) {
                this.setState({ changingScene }, () => resolve());
            } else {
                this.setState({ ready: false }, () => resolve());
            }
        });

        const newState = await this.getData();
        newState.ready = true;
        newState.changingScene = '';
        newState.selectedSceneChanged = false;
        newState.scenes = newState.scenes || {};

        // Fill missing data
        const keys = Object.keys(newState.scenes);
        for (const id of keys) {
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

            sceneObj.native.burstInterval = parseInt(sceneObj.native.burstInterval as unknown as string, 10) || 0;
            sceneObj.native.onFalse = sceneObj.native.onFalse || {};
            sceneObj.native.onTrue = sceneObj.native.onTrue || {};
            sceneObj.native.onFalse.trigger = sceneObj.native.onFalse.trigger || { condition: '==' };
            sceneObj.native.onTrue.trigger = sceneObj.native.onTrue.trigger || { condition: '==' };
            sceneObj.native.members = sceneObj.native.members || [];
            const members = sceneObj.native.members;
            // @ts-expect-error we do not need it
            delete sceneObj.native.members;
            // place it on the last place
            sceneObj.native.members = members;
            newState.scenes[id] = sceneObj;
        }

        if (!newState.scenes[this.state.selectedSceneId]) {
            newState.selectedSceneId = Object.keys(newState.scenes).shift() || '';
        }

        const selectedSceneId = newState.selectedSceneId || this.state.selectedSceneId;
        if (selectedSceneId && newState.scenes[selectedSceneId]) {
            newState.selectedSceneData = JSON.parse(JSON.stringify(newState.scenes[selectedSceneId]));
        } else {
            newState.selectedSceneData = null;
        }

        // add empty folders
        if (emptyFolders?.length) {
            emptyFolders.forEach(folder => {
                const prefix = folder.prefix.split('.');
                let parent = newState.folders;
                if (parent) {
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
                }
            });
        }

        this.setState(newState as AppState);
    }

    addFolder(parentFolder: SceneFolder, id: string): void {
        const folders: SceneFolder = JSON.parse(JSON.stringify(this.state.folders));
        const _parentFolder = this.findFolder(folders, parentFolder);

        if (_parentFolder) {
            _parentFolder.subFolders[id] = {
                scenes: {},
                subFolders: {},
                id,
                prefix: _parentFolder.prefix ? `${_parentFolder.prefix}.${id}` : id,
            };
        }

        this.setState({ folders });
    }

    async addSceneToFolderPrefix(scene: SceneObject, folderPrefix: string, noRefresh: boolean): Promise<void> {
        const oldId = scene._id;
        const sceneId = scene._id.split('.').pop();
        scene._id = `scene.0.${folderPrefix}${folderPrefix ? '.' : ''}${sceneId}`;

        try {
            await this.socket.delObject(oldId);
            console.log(`Deleted ${oldId}`);
            await this.saveScene(scene._id, scene);
        } catch (e) {
            this.showError(e);
        }

        console.log(`Set new ID: ${scene._id}`);

        if (!noRefresh) {
            try {
                await this.refreshData(sceneId);
                await this.changeSelectedScene(scene._id);
            } catch (e) {
                this.showError(e);
            }
        }
    }

    moveScript(oldId: string, newId: string): void {
        const scene = this.state.scenes[oldId];
        if (this.state.selectedSceneId === oldId) {
            this.setState({ selectedSceneId: newId }, () => this.moveScript(oldId, newId));
            return;
        }

        const oldPrefix = getFolderPrefix(scene._id);
        const folders: SceneFolder = JSON.parse(JSON.stringify(this.state.folders));
        const oldParentFolder = this.findFolder(folders, { prefix: oldPrefix } as SceneFolder);
        scene._id = newId;

        void this.socket
            .delObject(oldId)
            .then(() => {
                console.log(`Deleted ${oldId}`);
                return this.saveScene(scene._id, scene);
            })
            .catch(e => this.showError(e))
            .then(() => {
                console.log(`Set new ID: ${scene._id}`);
                // move the scene in state
                const scenes: Record<string, SceneObject> = JSON.parse(JSON.stringify(this.state.scenes));
                delete scenes[oldId];
                scenes[scene._id] = scene;
                // find parent folder
                const newPrefix = getFolderPrefix(scene._id);
                const newParentFolder = this.findFolder(folders, { prefix: newPrefix } as SceneFolder);
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

    collectEmptyFolders(folders: SceneFolder, result?: SceneFolder[]): SceneFolder[] {
        folders = folders || this.state.folders;
        result = result || [];
        if (!ScenesList.isFolderNotEmpty(folders)) {
            result.push(folders);
        }
        Object.keys(folders.subFolders).forEach(id => this.collectEmptyFolders(folders.subFolders[id], result));
        return result;
    }

    async renameFolder(folder: SceneFolder, newName: string): Promise<void> {
        await new Promise<void>(resolve => this.setState({ changingScene: folder }, () => resolve()));
        let newSelectedId: string;

        const prefixArr = folder.prefix.split('.');
        prefixArr[prefixArr.length - 1] = newName;
        const prefix = prefixArr.join('.');

        if (Object.keys(folder.scenes).find(id => id === this.state.selectedSceneId)) {
            newSelectedId = `scene.0.${prefix}.${this.state.selectedSceneId.split('.').pop()}`;
        }

        const promises = Object.keys(folder.scenes).map(sceneId =>
            this.addSceneToFolderPrefix(folder.scenes[sceneId], prefix, true),
        );

        // collect empty folders, because they will disappear after reload from DB
        folder.id = newName;
        folder.prefix = prefix;

        await Promise.all(promises)
            .then(() => this.refreshData(folder))
            .then(() => newSelectedId && this.setState({ selectedSceneId: newSelectedId }));
    }

    createScene(name: string, parentId: string | undefined): void {
        const native: SceneConfig = {
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
        };

        const id = `scene.0.${parentId ? `${parentId}.` : ''}${name}`;

        const template: SceneObject = {
            _id: id,
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
            native,
            type: 'state',
        };

        template.common.name = name;

        this.setState({ changingScene: id }, () =>
            this.saveScene(id, template)
                .then(() => this.refreshData(id))
                .then(() => this.changeSelectedScene(id))
                .catch(e => this.showError(e)),
        );
    }

    cloneScene(id: string): void {
        const scene: SceneObject = JSON.parse(JSON.stringify(this.state.scenes[id]));
        const parts = scene._id.split('.');
        parts.pop();
        parts.push(this.getNewSceneId());
        scene._id = parts.join('.');
        const name =
            typeof scene.common.name === 'object'
                ? scene.common.name[I18n.getLanguage()] || scene.common.name.en || ''
                : scene.common.name || '';

        scene.common.name = `${name} ${I18n.t('copy')}`;

        this.setState({ changingScene: scene._id }, () =>
            this.saveScene(scene._id, scene)
                .then(() => this.refreshData(scene._id))
                .then(() => this.changeSelectedScene(scene._id))
                .catch(e => this.showError(e)),
        );
    }

    async saveScene(sceneId: string, sceneObj: SceneObject): Promise<void> {
        if (sceneObj.ts) {
            const _sceneObj: SceneObject = JSON.parse(JSON.stringify(sceneObj));
            delete _sceneObj.ts;
            await this.socket.setObject(sceneId, _sceneObj);
        } else {
            await this.socket.setObject(sceneId, sceneObj);
        }
    }

    async writeScene(): Promise<void> {
        const scene: SceneObject = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        scene._id = this.state.selectedSceneId;

        const folder = getFolderPrefix(scene._id);
        const name =
            typeof scene.common.name === 'object'
                ? scene.common.name[I18n.getLanguage()] || scene.common.name.en || ''
                : scene.common.name || '';
        const newId = `scene.0.${folder ? `${folder}.` : ''}${name.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\./g, '_').replace(/\s/g, '_')}`;

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

    updateScene(common: ioBroker.StateCommon | undefined, native: SceneConfig | undefined, cb?: () => void): void {
        const scene: SceneObject = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        if (common) {
            scene.common = JSON.parse(JSON.stringify(common));
        }
        if (native) {
            const members = (scene.native as SceneConfig).members;
            scene.native = JSON.parse(JSON.stringify(native));
            scene.native.members = members;
        }

        const selectedSceneChanged =
            JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(scene);
        this.setState({ selectedSceneChanged, selectedSceneData: scene }, () => cb && cb());
    }

    async deleteScene(id: string): Promise<void> {
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
                    nextId = ids.shift() || '';
                }

                await this.changeSelectedScene(nextId);
            }

            await this.refreshData(id);
        } catch (e) {
            this.showError(e);
        }
    }

    getNewSceneId(): string {
        let newId = 0;

        for (const id in this.state.scenes) {
            const shortId = id.split('.').pop() || '';
            const matches = shortId.match(/^scene([0-9]+)$/);
            if (matches && parseInt(matches[1], 10) >= newId) {
                newId = parseInt(matches[1]) + 1;
            }
        }

        return `scene${newId}`;
    }

    updateSceneMembers(members: SceneMember[], cb?: () => void): void {
        const selectedSceneData: SceneObject = JSON.parse(JSON.stringify(this.state.selectedSceneData));
        selectedSceneData.native.members = JSON.parse(JSON.stringify(members));

        const selectedSceneChanged =
            JSON.stringify(this.state.scenes[this.state.selectedSceneId]) !== JSON.stringify(selectedSceneData);
        this.setState({ selectedSceneChanged, selectedSceneData }, () => cb && cb());
    }

    changeSelectedScene(newId: string, ignoreUnsaved?: boolean, cb?: () => void): Promise<void> {
        return new Promise(resolve => {
            if (this.state.selectedSceneId !== newId) {
                if (this.state.selectedSceneChanged && !ignoreUnsaved) {
                    this.confirmCb = cb || null;
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

    renderSceneChangeDialog(): React.JSX.Element | null {
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
                            // save a scene
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

    renderDeleteDialog(): React.JSX.Element | null {
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

    renderExportImportDialog(): React.JSX.Element | null {
        if (!this.state.exportDialog && !this.state.importDialog) {
            return null;
        }

        return (
            <ExportImportDialog
                isImport={this.state.importDialog}
                themeType={this.state.themeType}
                onClose={(_ignore, importedScene: SceneObject): void => {
                    if (this.state.importDialog && importedScene) {
                        const scene = this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId];
                        // if inability changed
                        if ((importedScene.common.enabled !== false) !== (scene.common.enabled !== false)) {
                            const scenes: Record<string, SceneObject> = JSON.parse(JSON.stringify(this.state.scenes));
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
                        this.updateScene(scene.common, scene.native as SceneConfig, () =>
                            this.setState({ importDialog: false }),
                        );
                    } else {
                        this.setState({ exportDialog: false, importDialog: false });
                    }
                }}
                sceneObj={
                    this.state.exportDialog
                        ? this.state.selectedSceneData || this.state.scenes[this.state.selectedSceneId]
                        : undefined
                }
            />
        );
    }

    renderImportWarningDialog(): React.JSX.Element | null {
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
                            const importedScenes = this.state.showImportWarning!;
                            const ids = Object.keys(importedScenes);
                            for (let s = 0; s < ids.length; s++) {
                                // if exists
                                if (this.state.scenes[ids[s]]) {
                                    // find a unique name
                                    let newId = ids[s];
                                    while (this.state.scenes[newId]) {
                                        newId += '_import';
                                    }
                                    importedScenes[ids[s]].common.name = newId.split('.').pop() || '';
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
                            const importedScenes = this.state.showImportWarning!;
                            const ids = Object.keys(importedScenes);
                            for (let s = 0; s < ids.length; s++) {
                                await this.saveScene(ids[s], importedScenes[ids[s]]);
                            }
                            this.setState({ showImportWarning: null });
                            void this.refreshData();
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

    async importScenes(importedScenes: Record<string, SceneObject>): Promise<void> {
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

    renderSceneTopToolbar(showDrawer: boolean): React.JSX.Element {
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

    renderSceneBottomToolbar(): React.JSX.Element {
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

    renderDrawerContent(showDrawer: boolean): React.JSX.Element {
        return (
            <ScenesList
                themeType={this.state.themeType}
                scenes={this.state.scenes}
                folders={this.state.folders || ({} as SceneFolder)}
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

    renderSceneMembers(oneColumn?: boolean): React.JSX.Element | null {
        if (!this.state.selectedSceneData) {
            return null;
        }
        return (
            <SceneMembersForm
                key={`selected${this.state.selectedSceneId}`}
                oneColumn={!!oneColumn}
                showError={e => this.showError(e.toString())}
                updateSceneMembers={(members, cb) => this.updateSceneMembers(members, cb)}
                selectedSceneChanged={this.state.selectedSceneChanged}
                sceneEnabled={this.state.selectedSceneData.common.enabled}
                ts={this.state.selectedSceneData.ts || 0}
                members={this.state.selectedSceneData.native.members}
                easy={!!this.state.selectedSceneData.native.easy}
                socket={this.socket}
                onFalseEnabled={!!this.state.selectedSceneData.native.onFalse.enabled}
                virtualGroup={!!this.state.selectedSceneData.native.virtualGroup}
                aggregation={!!this.state.selectedSceneData.native.aggregation}
                sceneId={this.state.selectedSceneId}
                engineId={this.state.selectedSceneData.common.engine}
                intervalBetweenCommands={this.state.selectedSceneData.native.burstInterval || 0}
                theme={this.state.theme}
            />
        );
    }

    renderSceneSettings(oneColumn?: boolean): React.JSX.Element | null {
        if (!this.state.selectedSceneData) {
            return null;
        }

        return (
            <SceneForm
                key={this.state.selectedSceneId}
                showError={e => this.showError(e)}
                oneColumn={!!oneColumn}
                updateScene={(common?: SceneCommon, native?: SceneConfig, cb?: () => void): void =>
                    this.updateScene(common, native, cb)
                }
                scene={this.state.selectedSceneData}
                socket={this.socket}
                instances={this.state.instances}
                theme={this.state.theme}
            />
        );
    }

    renderInOneColumn(): (React.JSX.Element | null)[] {
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

    renderInMoreThanOneColumn(): React.JSX.Element {
        const _width: 'xs' | 'sm' | 'lg' | 'xl' | 'md' = this.props.width as 'xs' | 'sm' | 'lg' | 'xl' | 'md';
        const isXs = _width === 'xs';
        const showDrawer = _width === 'sm';

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
                            xs={isXs ? 12 : 5}
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
                            xs={isXs ? 12 : 7}
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
                    onResizeFinished={(_gutterIdx, splitSizes2: [number, number]): void => {
                        this.setState({ splitSizes2 });
                        window.localStorage.setItem('Scenes.splitSizes2', JSON.stringify(splitSizes2));
                    }}
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
                onResizeFinished={(_gutterIdx, splitSizes: [number, number]): void => {
                    this.setState({ splitSizes });
                    window.localStorage.setItem('Scenes.splitSizes', JSON.stringify(splitSizes));
                }}
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

    render(): React.JSX.Element {
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

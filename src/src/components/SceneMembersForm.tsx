import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';

import {
    TextField,
    Switch,
    Button,
    Checkbox,
    IconButton,
    Box,
    Grid,
    FormControlLabel,
    Paper,
    Dialog,
    DialogTitle,
    Toolbar,
    Typography,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    DialogActions,
    DialogContent,
} from '@mui/material';

// own components
import {
    I18n,
    Utils,
    SelectID as DialogSelectID,
    Message as MessageDialog,
    type IobTheme,
    type AdminConnection,
} from '@iobroker/adapter-react-v5';

// icons
import {
    AccessTime as IconClock,
    Delete as IconDelete,
    Add as IconAdd,
    PlayArrow as IconPlay,
    Close as IconCancel,
    ExpandMore as IconExpandAll,
    ExpandLess as IconCollapseAll,
    Menu as IconList,
    AddBox as IconAddBox,
    Save,
} from '@mui/icons-material';
import { FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';

import EnumsSelector from './EnumsSelector';
import type { SceneEnumsValue, SceneMember } from '../types';

const TRUE_COLOR = '#90ee90';
const FALSE_COLOR = '#ff9999';
const TRUE_DARK_COLOR = '#528952';
const FALSE_DARK_COLOR = '#774747';
const UNCERTAIN_COLOR = '#bfb7be';

const styles: Record<string, any> = {
    memberTrueFalse: {
        borderRadius: 10,
        padding: `2px 8px`,
        fontSize: 'initial',
        fontWeight: 'initial',
        margin: `0 8px`,
        textAlign: 'right',
        whiteSpace: 'nowrap',
        maxWidth: 300,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    memberTrue: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
    }),
    memberFalse: {
        backgroundColor: 'pink',
    },
    memberUncertain: {
        color: '#FFF',
        backgroundColor: '#808080',
    },
    memberCard: {
        padding: 4,
        margin: `8px 0`,
    },
    memberFolder: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    right: {
        float: 'right',
    },
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingRight: 8,
        width: '100%',
    },
    height: {
        height: '100%',
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    alignRight: {
        textAlign: 'right',
    },
    buttonsContainer: {
        '& button': {
            margin: `0 8px`,
        },
    },
    p: {
        margin: `8px 0`,
    },
    pTrue: (theme: IobTheme): any => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#002502' : '#90ee90',
        p: '4px',
    }),
    pFalse: (theme: IobTheme): any => ({
        p: '4px',
        backgroundColor: theme.palette.mode === 'dark' ? '#332100' : '#eec590',
    }),
    guttersZero: {
        padding: 0,
    },
    sceneTitle: (theme: IobTheme): React.CSSProperties => ({
        flexGrow: 1,
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
    }),
    sceneSubTitle: {
        fontSize: 'small',
        borderRadius: '10px',
        padding: `2px 8px`,
        display: 'inline-flex',
        alignItems: 'center',
    },
    sceneTrue: (theme: IobTheme): React.CSSProperties => ({
        background: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
    }),
    sceneFalse: (theme: IobTheme): React.CSSProperties => ({
        background: theme.palette.mode === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
    }),
    sceneUncertain: {
        background: UNCERTAIN_COLOR,
    },
    btnTestTrue: (theme: IobTheme): any => ({
        background: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
        mr: '8px',
        mb: '4px',
    }),
    btnTestFalse: (theme: IobTheme): any => ({
        background: theme.palette.mode === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
        mb: '4px',
    }),
    btnExpandAll: {
        float: 'right',
    },
    btnCollapseAll: {
        float: 'right',
    },
    smallOnTrueFalse: {
        fontSize: 'small',
        textAlign: 'right',
        width: '100%',
        display: 'inline-block',
    },
    stateValueTrue: {
        color: '#60a060',
        fontWeight: 'bold',
    },
    stateValueFalse: {
        color: '#c15454',
        fontWeight: 'bold',
    },
    changed: {
        position: 'relative',
        '&:after': {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: '6px',
            background: '#FF0000',
            position: 'absolute',
            top: 5,
            right: 5,
        },
    },
    memberDesc: {
        display: 'inline-block',
        fontSize: 10,
        fontStyle: 'italic',
        marginLeft: 50,
    },
    memberTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 50,
    },
    memberToolbar: {
        width: '100%',
        position: 'relative',
        minHeight: 72,
    },
    memberButtons: {
        textAlign: 'right',
        position: 'absolute',
        top: 2,
        right: 2,
    },
    width100WithButton: {
        width: 'calc(100% - 48px)',
    },
    width100: {
        width: '100%',
    },
    testButtons: {
        minHeight: 48,
    },
    setValue: {
        width: `calc(70% - ${70 + 8}px)`,
        minWidth: 100,
        marginRight: 8,
    },
    setTolerance: {
        width: `calc(30% - ${70 + 8}px)`,
        minWidth: 100,
        marginRight: 8,
    },
    disabled: {
        opacity: 0.3,
    },
    instanceNotActive: {
        marginLeft: 8,
        fontSize: 10,
        fontStyle: 'italic',
        color: '#FF0000',
    },
    fromId: {
        marginTop: 8,
    },
    smallClearBtn: {
        width: 32,
        height: 32,
    },
    ackTrue: {
        marginLeft: 100,
    },
    enumTitle: (theme: IobTheme): React.CSSProperties => ({
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        padding: '1px 4px 3px 4px',
        borderRadius: '5px',
    }),
};

interface SceneMembersFormProps {
    members: SceneMember[];
    socket: AdminConnection;
    sceneId: string;
    ts: number;
    onFalseEnabled: boolean;
    virtualGroup: boolean;
    aggregation: boolean;
    sceneEnabled: boolean;
    selectedSceneChanged: boolean;
    engineId: string;
    theme: IobTheme;
    showError: (error: string | Error) => void;
    updateSceneMembers: (members: SceneMember[], cb?: () => void) => void;
    easy: boolean;
    oneColumn: boolean;
    intervalBetweenCommands: number;
}

interface SceneMembersFormState {
    states: Record<string, ioBroker.StateValue | null>;
    openedMembers: (string | number)[];
    objectTypes: Record<string, ioBroker.CommonType>;
    objectNames: Record<string, string>;
    members: SceneMember[];
    ts: number;
    easy: boolean;
    writeSceneState: string;
    deleteDialog: string | number | null;
    onFalseEnabled: boolean;
    virtualGroup: boolean;
    aggregation: boolean;
    sceneEnabled: boolean;
    selectedSceneChanged: boolean;
    engineId: string;
    suppressDeleteConfirm: boolean;
    showSelectValueIdDialog: 'true' | 'false' | null;
    showSelectValueIdDialogFor: number | null;
    showAddEnumsDialog: true | number | null;
    showDialog: boolean;
    askTrueFalse: boolean;
    message: string;
}

class SceneMembersForm extends React.Component<SceneMembersFormProps, SceneMembersFormState> {
    static enums: Record<string, ioBroker.EnumObject> | null = null;

    static objects = null;

    private engineId: string;

    private readonly cacheEnumsState: (
        | { realIds: string[]; type: 'boolean' | 'number' | 'string'; ids: string }
        | true
    )[];

    private readonly delButtonRef: React.RefObject<any>;

    constructor(props: SceneMembersFormProps) {
        super(props);

        const openedMembersStr = window.localStorage.getItem('Scenes.openedMembers') || '[]';
        let openedMembers: (string | number)[];
        try {
            openedMembers = JSON.parse(openedMembersStr);
        } catch {
            openedMembers = [];
        }

        this.state = {
            states: {},
            openedMembers,
            objectTypes: {},
            objectNames: {},
            members: JSON.parse(JSON.stringify(props.members)),
            ts: props.ts,
            easy: props.easy,
            writeSceneState: '',
            deleteDialog: null,
            onFalseEnabled: props.onFalseEnabled,
            virtualGroup: props.virtualGroup,
            aggregation: props.aggregation,
            sceneEnabled: props.sceneEnabled,
            selectedSceneChanged: props.selectedSceneChanged,
            engineId: props.engineId,
            suppressDeleteConfirm: false,
            showSelectValueIdDialog: null,
            showSelectValueIdDialogFor: null,
            showAddEnumsDialog: null,
            showDialog: false,
            askTrueFalse: false,
            message: '',
        };

        this.delButtonRef = React.createRef();

        this.engineId = this.state.engineId;

        this.cacheEnumsState = [];

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    async componentDidMount(): Promise<void> {
        if (!SceneMembersForm.enums) {
            try {
                SceneMembersForm.enums = await this.props.socket.getEnums();
            } catch (e) {
                this.props.showError(e);
            }
        }

        const newState = await this.readObjects();
        this.setState(newState as SceneMembersFormState, async () => {
            // subscribe on scene state
            await this.props.socket.subscribeState(this.props.sceneId, this.memberStateChange);
            if (this.state.engineId) {
                await this.props.socket.subscribeState(`${this.state.engineId}.alive`, this.memberStateChange);
            }

            // subscribe on all states
            this.state.members.forEach(
                member => member.id && this.props.socket.subscribeState(member.id, this.memberStateChange),
            );
        });
    }

    componentWillUnmount(): void {
        this.props.socket.unsubscribeState(this.props.sceneId, this.memberStateChange);
        if (this.state.engineId) {
            this.props.socket.unsubscribeState(`${this.state.engineId}.alive`, this.memberStateChange);
        }

        this.state.members.forEach((member, i) => {
            if (member.id) {
                this.props.socket.unsubscribeState(member.id, this.memberStateChange);
            } else if (member.enums && typeof this.cacheEnumsState[i] === 'object') {
                this.cacheEnumsState[i]?.realIds?.forEach(id =>
                    this.props.socket.unsubscribeState(id, this.memberStateChange),
                );
            }
        });
    }

    static getDerivedStateFromProps(
        props: SceneMembersFormProps,
        state: SceneMembersFormState,
    ): Partial<SceneMembersFormState> | null {
        const newState: Partial<SceneMembersFormState> = {};
        let changed = false;

        if (props.onFalseEnabled !== state.onFalseEnabled) {
            newState.onFalseEnabled = props.onFalseEnabled;
            changed = true;
        }
        if (props.virtualGroup !== state.virtualGroup) {
            newState.virtualGroup = props.virtualGroup;
            changed = true;
        }
        if (props.aggregation !== state.aggregation) {
            newState.aggregation = props.aggregation;
            changed = true;
        }
        if (props.selectedSceneChanged !== state.selectedSceneChanged) {
            newState.selectedSceneChanged = props.selectedSceneChanged;
            changed = true;
        }
        if (props.sceneEnabled !== state.sceneEnabled) {
            newState.sceneEnabled = props.sceneEnabled;
            changed = true;
        }
        if (props.engineId !== state.engineId) {
            newState.engineId = props.engineId;
            changed = true;
        }
        if (props.easy !== state.easy) {
            newState.easy = props.easy;
            changed = true;
        }
        if (props.ts !== state.ts) {
            newState.ts = props.ts;
            newState.members = JSON.parse(JSON.stringify(props.members));
            changed = true;
        }

        return changed ? newState : null;
    }

    onDragEnd(result: DropResult): void {
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
        const [removed] = members.splice(result.source.index, 1);
        members.splice(result.destination.index, 0, removed);

        this.setStateWithParent({ members });
    }

    async readObjects(): Promise<Partial<SceneMembersFormState>> {
        if (this.state.members) {
            const objectTypes: Record<string, ioBroker.CommonType> = {};
            const objectNames: Record<string, string> = {};
            try {
                for (let m = 0; m < this.state.members.length; m++) {
                    const member = this.state.members[m];
                    const obj: ioBroker.StateObject | null | undefined = member.id
                        ? ((await this.props.socket.getObject(member.id)) as ioBroker.StateObject | null | undefined)
                        : null;
                    if (obj?.common?.type) {
                        objectTypes[obj._id] = obj.common.type;
                        objectNames[obj._id] = Utils.getObjectNameFromObj(
                            obj,
                            null,
                            { language: I18n.getLanguage() },
                            false,
                        );
                    }
                }
            } catch (e) {
                this.props.showError(e);
            }
            return { objectTypes, objectNames };
        }

        return {};
    }

    memberStateChange = (id: string, state: ioBroker.State | null | undefined): void => {
        const val = state ? state.val : null;
        if (this.state.states[id] === val && (this.state.objectTypes[id] || val === null || val === undefined)) {
            return;
        }
        const states: Record<string, ioBroker.StateValue | null> = JSON.parse(JSON.stringify(this.state.states));
        states[id] = val;
        const objectTypes: Record<string, ioBroker.CommonType> = JSON.parse(JSON.stringify(this.state.objectTypes));

        if (!objectTypes[id] && states[id] !== null && states[id] !== undefined) {
            objectTypes[id] = typeof states[id] as ioBroker.CommonType;
        }

        if (objectTypes[id] === 'boolean') {
            if (states[id] === 'true') {
                states[id] = true;
            }
            if (states[id] === 'false') {
                states[id] = false;
            }
        } else if (objectTypes[id] === 'number') {
            states[id] = states[id] === null ? null : parseFloat(states[id] as string);
        }

        this.setState({ states, objectTypes });
    };

    createSceneMembersWithIDs = (ids: string[]): void => {
        this.setState({ showDialog: false }, async () => {
            if (ids.length) {
                const openedMembers = [...this.state.openedMembers];
                const objectTypes: Record<string, ioBroker.CommonType> = JSON.parse(
                    JSON.stringify(this.state.objectTypes),
                );
                const objectNames: Record<string, string> = JSON.parse(JSON.stringify(this.state.objectNames));
                const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                try {
                    for (let i = 0; i < ids.length; i++) {
                        const id = ids[i];
                        const obj = await this.props.socket.getObject(id);
                        if (!obj) {
                            continue;
                        }

                        const template: SceneMember = {
                            id,
                            setIfTrue: null,
                            setIfFalse: null,
                            stopAllDelays: true,
                            desc: null,
                            disabled: false,
                            delay: 0,
                        };

                        if (obj) {
                            objectNames[obj._id] = Utils.getObjectNameFromObj(
                                obj,
                                null,
                                { language: I18n.getLanguage() },
                                true,
                            );
                        }

                        if (obj?.common?.type) {
                            objectTypes[id] = obj.common.type;

                            if (objectTypes[id] === 'boolean') {
                                template.setIfTrue = true;
                                if (this.state.onFalseEnabled) {
                                    template.setIfFalse = false;
                                }
                            }
                        }

                        members.push(template);

                        // open added state
                        openedMembers.push(id);
                    }

                    this.setStateWithParent({ objectTypes, objectNames, members, openedMembers }, async () => {
                        // Subscribe on all new members
                        for (let i = 0; i < ids.length; i++) {
                            await this.props.socket.subscribeState(ids[i], this.memberStateChange);
                        }
                    });
                } catch (e) {
                    this.props.showError(e);
                }
            } else {
                // Show alert
                this.props.showError(I18n.t('Unknown error!'));
            }
        });
    };

    createSceneMembersWithEnums = (enums: SceneEnumsValue): void => {
        this.setState({ showDialog: false }, () => {
            if (enums) {
                const openedMembers = [...this.state.openedMembers];
                const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));

                try {
                    const template: SceneMember = {
                        enums,
                        setIfTrue: null,
                        setIfFalse: null,
                        stopAllDelays: true,
                        desc: null,
                        disabled: false,
                        delay: 0,
                    };

                    // open added state
                    openedMembers.push(members.length);

                    members.push(template);

                    this.setStateWithParent({ members, openedMembers });
                } catch (e) {
                    this.props.showError(e);
                }
            }
        });
    };

    deleteSceneMember(id: string | number): void {
        const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));

        if (typeof id === 'number') {
            members.splice(id, 1);
        } else {
            for (let i = 0; i < members.length; i++) {
                if (members[i].id === id) {
                    members.splice(i, 1);
                }
            }
        }

        this.setStateWithParent({ members, deleteDialog: null }, () => {
            if (typeof id === 'string') {
                this.props.socket.unsubscribeState(id, this.memberStateChange);
            }
        });
    }

    setStateWithParent(newState: Partial<SceneMembersFormState>, cb?: () => void): void {
        const that = this;
        this.setState(newState as SceneMembersFormState, () => this.props.updateSceneMembers(that.state.members, cb));
    }

    renderSelectIdDialog(): React.JSX.Element | null {
        return this.state.showDialog ? (
            <DialogSelectID
                imagePrefix="../.."
                key="selectDialogMembers"
                socket={this.props.socket}
                dialogName="memberEdit"
                multiSelect
                title={I18n.t('Select for ')}
                selected=""
                onOk={(_id: string | string[]): void => {
                    let id: string[];
                    if (Array.isArray(_id)) {
                        id = _id;
                    } else {
                        id = [_id];
                    }
                    this.createSceneMembersWithIDs(id);
                }}
                onClose={() => this.setState({ showDialog: false })}
                theme={this.props.theme}
            />
        ) : null;
    }

    renderSelectEnumsDialog(): React.JSX.Element | null {
        if (this.state.showAddEnumsDialog === null) {
            return null;
        }

        return (
            <EnumsSelector
                key="selectDialogEnums"
                showError={this.props.showError}
                onClose={enums => {
                    if (enums) {
                        if (this.state.showAddEnumsDialog === true) {
                            this.createSceneMembersWithEnums(enums);
                        } else {
                            const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                            members[this.state.showAddEnumsDialog!].enums = enums;
                            this.setStateWithParent({ members });
                        }
                    }

                    this.setState({ showAddEnumsDialog: null });
                }}
                edit={this.state.showAddEnumsDialog !== true}
                socket={this.props.socket}
                value={
                    this.state.showAddEnumsDialog === true
                        ? null
                        : this.state.members[this.state.showAddEnumsDialog].enums || null
                }
                theme={this.props.theme}
            />
        );
    }

    componentDidUpdate(): void {
        this.state.deleteDialog !== null &&
            setTimeout(() => {
                if (this.delButtonRef.current) {
                    this.delButtonRef.current.focus();
                }
            }, 50);
    }

    renderDeleteDialog(): React.JSX.Element | null {
        if (this.state.deleteDialog === null) {
            return null;
        }

        return (
            <Dialog
                open={!0}
                key="deleteDialog"
                onClose={() => this.setState({ deleteDialog: null })}
            >
                <DialogTitle>{I18n.t('Are you sure for delete this state?')}</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.state.suppressDeleteConfirm}
                                onChange={() =>
                                    this.setState({ suppressDeleteConfirm: !this.state.suppressDeleteConfirm })
                                }
                            />
                        }
                        label={I18n.t('Suppress confirmation for next 5 minutes')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="secondary"
                        ref={this.delButtonRef}
                        onClick={() => {
                            if (this.state.suppressDeleteConfirm) {
                                window.localStorage.setItem('scenes.suppressDeleteConfirm', Date.now().toString());
                            }
                            this.deleteSceneMember(this.state.deleteDialog!);
                        }}
                        startIcon={<IconDelete />}
                    >
                        {I18n.t('Delete')}
                    </Button>
                    <Button
                        color="grey"
                        autoFocus
                        variant="contained"
                        onClick={() => this.setState({ deleteDialog: null })}
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    renderSelectStateIdDialog(): React.JSX.Element | null {
        if (!this.state.showSelectValueIdDialog) {
            return null;
        }
        let setValue: string | undefined | boolean | null | number;
        if (this.state.showSelectValueIdDialog === 'true') {
            setValue = this.state.members[this.state.showSelectValueIdDialogFor!].setIfTrue;
        } else {
            setValue = this.state.members[this.state.showSelectValueIdDialogFor!].setIfFalse;
        }
        const m = typeof setValue === 'string' && setValue.match(/^{{([^}]*)}}$/);
        if (m) {
            setValue = m[1];
        }

        return (
            <DialogSelectID
                imagePrefix="../.."
                key="selectDialogMember"
                socket={this.props.socket}
                dialogName="memberEdit"
                multiSelect={false}
                title={I18n.t('Select for ') + (this.state.showSelectValueIdDialog === 'true' ? 'TRUE' : 'FALSE')}
                selected={setValue as string}
                onOk={id => {
                    if (id) {
                        const index = this.state.showSelectValueIdDialogFor!;
                        const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                        if (this.state.showSelectValueIdDialog === 'true') {
                            members[index].setIfTrue = `{{${id}}}`;
                        } else {
                            members[index].setIfFalse = `{{${id}}}`;
                        }

                        this.setState({ showSelectValueIdDialog: null, showSelectValueIdDialogFor: null }, () =>
                            this.setStateWithParent({ members }),
                        );
                    }
                }}
                theme={this.props.theme}
                onClose={() => this.setState({ showSelectValueIdDialog: null, showSelectValueIdDialogFor: null })}
            />
        );
    }

    renderSetValue(index: number, member: SceneMember, onFalseEnabled: boolean, isTrue: boolean): React.JSX.Element {
        let labelSetValue;
        let labelTolerance;
        let setValue;
        let setValueTolerance;
        if (isTrue) {
            setValue = member.setIfTrue;
        } else {
            setValue = member.setIfFalse;
        }

        const m = typeof setValue === 'string' && setValue.match(/^{{([^}]*)}}$/);
        let fromState = false;
        if (m) {
            setValue = m[1];
            fromState = true;
        }

        if (isTrue) {
            if (fromState) {
                labelSetValue = onFalseEnabled ? I18n.t('From ID by TRUE') : I18n.t('From ID');
            } else {
                labelSetValue = onFalseEnabled ? I18n.t('Setpoint by TRUE') : I18n.t('Setpoint');
            }
            labelTolerance = onFalseEnabled ? I18n.t('Tolerance by TRUE') : I18n.t('Tolerance');
            setValueTolerance = member.setIfTrueTolerance;
        } else {
            labelSetValue = fromState ? I18n.t('From ID by FALSE') : I18n.t('Setpoint by FALSE');
            labelTolerance = I18n.t('Tolerance by FALSE');
            setValueTolerance = member.setIfFalseTolerance;
        }

        const type = member.id ? this.state.objectTypes[member.id] : member.enums!.type || 'boolean';

        return (
            <Box
                sx={Utils.getStyle(
                    this.props.theme,
                    styles.p,
                    this.state.onFalseEnabled ? (isTrue ? styles.pTrue : styles.pFalse) : undefined,
                )}
            >
                {!this.state.easy || fromState ? (
                    <FormControlLabel
                        style={styles.fromId}
                        control={
                            <Switch
                                checked={fromState}
                                onChange={e => {
                                    const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                    if (e.target.checked) {
                                        if (isTrue) {
                                            members[index].setIfTrue = '{{}}';
                                        } else {
                                            members[index].setIfFalse = '{{}}';
                                        }
                                    } else {
                                        if (isTrue) {
                                            members[index].setIfTrue = null;
                                        } else {
                                            members[index].setIfFalse = null;
                                        }
                                    }
                                    this.setStateWithParent({ members });
                                }}
                            />
                        }
                        label={I18n.t('From ID')}
                    />
                ) : null}
                {!fromState && type === 'boolean' ? (
                    <FormControl
                        style={styles.setValue}
                        variant="standard"
                    >
                        <InputLabel>{labelSetValue}</InputLabel>
                        <Select
                            variant="standard"
                            value={
                                setValue === true || setValue === 'true'
                                    ? 'true'
                                    : setValue === false || setValue === 'false'
                                      ? 'false'
                                      : 'null'
                            }
                            onChange={e => {
                                const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                if (isTrue) {
                                    members[index].setIfTrue =
                                        e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                                } else {
                                    members[index].setIfFalse =
                                        e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                                }

                                this.setStateWithParent({ members });
                            }}
                        >
                            <MenuItem value="false">FALSE</MenuItem>
                            <MenuItem value="true">TRUE</MenuItem>
                            <MenuItem value="null">{I18n.t('NOT CHANGE')}</MenuItem>
                        </Select>
                    </FormControl>
                ) : (
                    <>
                        {fromState ? (
                            <TextField
                                variant="standard"
                                fullWidth
                                label={labelSetValue}
                                value={setValue || ''}
                                slotProps={{
                                    htmlInput: {
                                        readOnly: true,
                                    },
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        readOnly: true,
                                        endAdornment: (
                                            <IconButton
                                                style={styles.smallClearBtn}
                                                size="small"
                                                onClick={() =>
                                                    this.setState({
                                                        showSelectValueIdDialog: isTrue ? 'true' : 'false',
                                                        showSelectValueIdDialogFor: index,
                                                    })
                                                }
                                            >
                                                <IconList />
                                            </IconButton>
                                        ),
                                    },
                                }}
                                style={styles.setValue}
                            />
                        ) : (
                            <TextField
                                variant="standard"
                                fullWidth
                                label={labelSetValue}
                                value={setValue === undefined || setValue === null ? '' : setValue}
                                style={styles.setValue}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        endAdornment: setValue ? (
                                            <IconButton
                                                size="small"
                                                style={styles.smallClearBtn}
                                                onClick={() => {
                                                    const members: SceneMember[] = JSON.parse(
                                                        JSON.stringify(this.state.members),
                                                    );
                                                    if (isTrue) {
                                                        members[index].setIfTrue = null;
                                                    } else {
                                                        members[index].setIfFalse = null;
                                                    }
                                                    this.setStateWithParent({ members });
                                                }}
                                            >
                                                <IconCancel />
                                            </IconButton>
                                        ) : undefined,
                                    },
                                }}
                                onChange={e => {
                                    const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                    if (type === 'number' && e.target.value !== '') {
                                        if (isTrue) {
                                            members[index].setIfTrue = parseFloat(e.target.value.replace(',', '.'));
                                            if (isNaN(members[index].setIfTrue)) {
                                                members[index].setIfTrue = null;
                                            }
                                        } else {
                                            members[index].setIfFalse = parseFloat(e.target.value.replace(',', '.'));
                                            if (isNaN(members[index].setIfFalse)) {
                                                members[index].setIfFalse = null;
                                            }
                                        }
                                    } else if (isTrue) {
                                        members[index].setIfTrue = e.target.value;
                                    } else {
                                        members[index].setIfFalse = e.target.value;
                                    }

                                    this.setStateWithParent({ members });
                                }}
                            />
                        )}

                        {!this.state.easy && type !== 'boolean' ? (
                            <TextField
                                variant="standard"
                                label={`± ${labelTolerance}`}
                                value={
                                    setValueTolerance === undefined || setValueTolerance === null
                                        ? ''
                                        : setValueTolerance
                                }
                                title={I18n.t('Absolute value, not percent')}
                                style={styles.setTolerance}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        endAdornment: setValueTolerance ? (
                                            <IconButton
                                                size="small"
                                                style={styles.smallClearBtn}
                                                onClick={() => {
                                                    const members: SceneMember[] = JSON.parse(
                                                        JSON.stringify(this.state.members),
                                                    );
                                                    if (isTrue) {
                                                        members[index].setIfTrueTolerance = null;
                                                    } else {
                                                        members[index].setIfFalseTolerance = null;
                                                    }
                                                    this.setStateWithParent({ members });
                                                }}
                                            >
                                                <IconCancel />
                                            </IconButton>
                                        ) : undefined,
                                    },
                                }}
                                onChange={e => {
                                    const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                    if (isTrue) {
                                        members[index].setIfTrueTolerance =
                                            e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.'));
                                        if (isNaN(members[index].setIfTrueTolerance as number)) {
                                            members[index].setIfTrueTolerance = null;
                                        }
                                    } else {
                                        members[index].setIfFalseTolerance =
                                            e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.'));
                                        if (isNaN(members[index].setIfFalseTolerance as number)) {
                                            members[index].setIfFalseTolerance = null;
                                        }
                                    }
                                    this.setStateWithParent({ members });
                                }}
                            />
                        ) : null}
                    </>
                )}
                {!this.state.easy && !fromState && (
                    <FormControlLabel
                        label={I18n.t('Write with ack=true')}
                        style={styles.ackTrue}
                        control={
                            <Checkbox
                                checked={!!member.ackTrue}
                                onChange={e => {
                                    const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                    members[index].ackTrue = e.target.checked;
                                    this.setStateWithParent({ members });
                                }}
                            />
                        }
                    />
                )}
            </Box>
        );
    }

    static getObjectName(id: string, obj: ioBroker.Object | null | undefined): string {
        return obj ? Utils.getObjectNameFromObj(obj, null, { language: I18n.getLanguage() }, false) : id;
    }

    static getAllEnumIds(enumsSettings?: SceneEnumsValue): string[] {
        const ids: string[] = [];
        if (!SceneMembersForm.enums) {
            return ids;
        }
        enumsSettings?.rooms.forEach((roomId: string): void => {
            const members = SceneMembersForm.enums?.[roomId].common.members;
            if (members) {
                for (let r = 0; r < members.length; r++) {
                    if (!ids.includes(members[r])) {
                        ids.push(members[r]);
                    }
                }
            }
        });
        if (!enumsSettings?.rooms.length) {
            enumsSettings?.funcs.forEach(funcId => {
                const members = SceneMembersForm.enums?.[funcId].common.members;
                if (members) {
                    for (let r = 0; r < members.length; r++) {
                        if (!ids.includes(members[r])) {
                            ids.push(members[r]);
                        }
                    }
                }
            });
        } else if (enumsSettings.funcs.length) {
            for (let i = ids.length - 1; i >= 0; i--) {
                const id = ids[i];
                // find this id in all functions
                if (
                    !enumsSettings.funcs.find(funcId => SceneMembersForm.enums?.[funcId].common.members?.includes(id))
                ) {
                    ids.splice(i, 1);
                }
            }
        }
        enumsSettings?.others.forEach(enumId => {
            const members = SceneMembersForm.enums?.[enumId].common.members;
            if (members) {
                for (let r = 0; r < members.length; r++) {
                    if (!ids.includes(members[r])) {
                        ids.push(members[r]);
                    }
                }
            }
        });
        if (enumsSettings?.exclude) {
            for (let e = 0; e < enumsSettings.exclude.length; e++) {
                const index = ids.indexOf(enumsSettings.exclude[e]);
                if (index !== -1) {
                    ids.splice(index, 1);
                }
            }
        }
        ids.sort();
        return ids;
    }

    getTitleForEnums(index: number): React.JSX.Element {
        const enumsSettings = this.state.members[index].enums;
        let title = '';
        if (enumsSettings?.rooms?.length) {
            title += enumsSettings.rooms
                .map(id => SceneMembersForm.getObjectName(id, SceneMembersForm.enums?.[id]))
                .join(', ');
            if (enumsSettings.funcs?.length) {
                title += ` 🗗 ${enumsSettings.funcs.map(id => SceneMembersForm.getObjectName(id, SceneMembersForm.enums?.[id])).join(', ')}`;
            }
        } else if (enumsSettings?.funcs?.length) {
            title += enumsSettings.funcs
                .map(id => SceneMembersForm.getObjectName(id, SceneMembersForm.enums?.[id]))
                .join(', ');
        }

        if (enumsSettings?.others?.length) {
            title += ` + ${enumsSettings.others.map(id => SceneMembersForm.getObjectName(id, SceneMembersForm.enums?.[id])).join(', ')}`;
        }
        if (enumsSettings?.exclude?.length) {
            title += ` - ${enumsSettings.exclude.length} ${I18n.t('state(s)')}`;
        }

        if (this.cacheEnumsState[index]) {
            if (this.cacheEnumsState[index] === true) {
                title += ` ... - ${enumsSettings?.type || 'boolean'}`;
            } else {
                title += ` [${this.cacheEnumsState[index].realIds.length}] - ${enumsSettings?.type || 'boolean'}`;
            }
        }

        return (
            <Box
                component="span"
                sx={styles.enumTitle}
            >
                {title}✎
            </Box>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getEnumsState(index: number): ioBroker.StateValue | 'uncertain' | null {
        const enumsSettings = this.state.members[index].enums;
        const ids = SceneMembersForm.getAllEnumIds(enumsSettings);
        let realIds: string[] = [];
        if (
            !this.cacheEnumsState[index] ||
            (this.cacheEnumsState[index] as { type: ioBroker.CommonType; ids: string }).ids !== JSON.stringify(ids) ||
            (this.cacheEnumsState[index] as { type: ioBroker.CommonType; ids: string }).type !== enumsSettings?.type
        ) {
            if (this.cacheEnumsState[index] === true) {
                return null;
            }
            this.cacheEnumsState[index] = true;
            setTimeout(async () => {
                for (let i = 0; i < ids.length; i++) {
                    const obj: ioBroker.StateObject | null | undefined = (await this.props.socket.getObject(ids[i])) as
                        | ioBroker.StateObject
                        | null
                        | undefined;
                    if (!obj) {
                        continue;
                    }
                    if (obj.type !== 'state') {
                        if (obj.type === 'channel' || obj.type === 'device' || obj.type === 'folder') {
                            // try to use types detector to find the control state
                            const controlId = await EnumsSelector.findControlState(
                                obj,
                                enumsSettings?.type || 'boolean',
                                this.props.socket,
                            );
                            if (!controlId) {
                                console.warn(
                                    `Cannot find control state of type "${enumsSettings?.type || 'boolean'}" for "${obj.type}" ${ids[i]}`,
                                );
                                continue;
                            }
                            realIds.includes(controlId) || realIds.push(controlId);
                        } else {
                            console.warn(`Cannot find control state for ${ids[i]} as it is not device or channel`);
                        }
                    } else {
                        realIds.includes(ids[i]) || realIds.push(ids[i]);
                    }
                }

                if (this.cacheEnumsState[index] !== true) {
                    const oldIds = JSON.parse(this.cacheEnumsState[index].ids);
                    // unsubscribe unused IDs
                    for (let i = 0; i < oldIds.length; i++) {
                        if (!realIds.includes(oldIds[i])) {
                            this.props.socket.unsubscribeState(oldIds[i], this.memberStateChange);
                        }
                    }
                    // subscribe on new IDs
                    for (let i = 0; i < realIds.length; i++) {
                        if (!oldIds.includes(realIds[i])) {
                            await this.props.socket.subscribeState(realIds[i], this.memberStateChange);
                        }
                    }
                } else {
                    for (let i = 0; i < realIds.length; i++) {
                        await this.props.socket.subscribeState(realIds[i], this.memberStateChange);
                    }
                }
                this.cacheEnumsState[index] = {
                    ids: JSON.stringify(ids),
                    realIds,
                    type: enumsSettings?.type || 'boolean',
                };
                this.forceUpdate();
            }, 200);
        } else if (typeof this.cacheEnumsState[index] === 'object') {
            realIds = this.cacheEnumsState[index].realIds;
        }

        if (!realIds?.length) {
            return null;
        }
        if (!enumsSettings?.type || enumsSettings.type === 'boolean' || enumsSettings.type === 'string') {
            const val = this.state.states[realIds[0]];
            for (let i = 1; i < realIds.length; i++) {
                if (this.state.states[realIds[i]] !== val) {
                    return 'uncertain';
                }
            }
            return val;
        }

        const val = this.state.states[realIds[0]];
        for (let i = 1; i < realIds.length; i++) {
            if (this.state.states[realIds[i]] !== val) {
                return 'uncertain';
            }
        }
        return val;
    }

    renderMember(member: SceneMember, index: number): React.JSX.Element {
        let value: React.JSX.Element | null = null;
        if (member.id && this.state.states[member.id] !== undefined && this.state.states[member.id] !== null) {
            let _valStr: string =
                this.state.states[member.id] === null ? 'null' : this.state.states[member.id]!.toString();

            if (_valStr === 'true') {
                _valStr = 'TRUE';
            } else if (_valStr === 'false') {
                _valStr = 'FALSE';
            }

            let setIfTrue = 0;
            if (member.setIfTrueTolerance) {
                if (member.setIfTrue && typeof member.setIfTrue === 'string') {
                    if (member.setIfTrue.startsWith('{{')) {
                        const m = member.setIfTrue.match(/^{{([^}]*)}}$/);
                        if (m && this.state.states[m[1]] !== undefined && this.state.states[m[1]] !== null) {
                            setIfTrue = parseFloat(this.state.states[m[1]] as string);
                        } else {
                            setIfTrue = 0;
                        }
                    } else {
                        setIfTrue = parseFloat(member.setIfTrue);
                    }
                } else if (typeof member.setIfTrue === 'number') {
                    setIfTrue = member.setIfTrue;
                }
            }
            let setIfFalse = 0;
            if (member.setIfFalseTolerance) {
                if (member.setIfFalse && typeof member.setIfFalse === 'string') {
                    if (member.setIfFalse.startsWith('{{')) {
                        const m = member.setIfFalse.match(/^{{([^}]*)}}$/);
                        if (m && this.state.states[m[1]] !== undefined && this.state.states[m[1]] !== null) {
                            setIfFalse = parseFloat(this.state.states[m[1]] as string);
                        } else {
                            setIfFalse = 0;
                        }
                    } else {
                        setIfFalse = parseFloat(member.setIfFalse);
                    }
                } else if (typeof member.setIfFalse === 'number') {
                    setIfFalse = member.setIfFalse;
                }
            }

            // TODO if member.setIfTrue.startsWith('{{') => read value from state
            if (
                member.setIfTrueTolerance &&
                Math.abs((this.state.states[member.id] as number) - setIfTrue) <= member.setIfTrueTolerance
            ) {
                value = (
                    <Box
                        component="div"
                        title={I18n.t('Actual state value')}
                        sx={Utils.getStyle(this.props.theme, styles.memberTrueFalse, styles.memberTrue)}
                    >
                        {_valStr}
                    </Box>
                );
            } else if (this.state.states[member.id] === member.setIfTrue) {
                value = (
                    <Box
                        component="div"
                        title={I18n.t('Actual state value')}
                        sx={Utils.getStyle(this.props.theme, styles.memberTrueFalse, styles.memberTrue)}
                    >
                        {_valStr}
                    </Box>
                );
            } else if (
                member.setIfFalse !== undefined &&
                member.setIfFalseTolerance &&
                Math.abs((this.state.states[member.id] as number) - setIfFalse) <= member.setIfFalseTolerance
            ) {
                value = (
                    <Box
                        component="div"
                        title={I18n.t('Actual state value')}
                        sx={Utils.getStyle(this.props.theme, styles.memberTrueFalse, styles.memberFalse)}
                    >
                        {_valStr}
                    </Box>
                );
            } else if (member.setIfFalse !== undefined && this.state.states[member.id] === member.setIfFalse) {
                value = (
                    <Box
                        component="div"
                        title={I18n.t('Actual state value')}
                        sx={Utils.getStyle(this.props.theme, styles.memberTrueFalse, styles.memberFalse)}
                    >
                        {_valStr}
                    </Box>
                );
            } else {
                value = (
                    <div
                        title={I18n.t('Actual state value')}
                        style={{ ...styles.memberTrueFalse, ...styles.memberUncertain }}
                    >
                        {_valStr}
                    </div>
                );
            }
        } else if (member.enums) {
            let _valStr = this.getEnumsState(index);
            if (_valStr === true) {
                _valStr = 'TRUE';
            } else if (_valStr === false) {
                _valStr = 'FALSE';
            } else if (_valStr === 'uncertain') {
                _valStr = I18n.t('uncertain');
            }

            value = (
                <div
                    title={I18n.t('Combined state of all states in category')}
                    style={styles.memberTrueFalse}
                >
                    {_valStr}
                </div>
            );
        }

        const opened = member.id
            ? this.state.openedMembers.includes(member.id)
            : this.state.openedMembers.includes(index);
        const onFalseEnabled = !this.state.virtualGroup && this.state.onFalseEnabled;
        let setIfTrueVisible = true;

        let setIfTrue = member.setIfTrue;
        if (setIfTrue === undefined || setIfTrue === null) {
            setIfTrue = '';
            setIfTrueVisible = false;
        } else {
            if (setIfTrue === true) {
                setIfTrue = 'TRUE';
            } else if (setIfTrue === false) {
                setIfTrue = 'FALSE';
            } else {
                if (member.setIfTrueTolerance) {
                    setIfTrue = `${setIfTrue}±${member.setIfTrueTolerance}`;
                } else {
                    setIfTrue = setIfTrue.toString();
                }
            }
        }

        const varType = member.id ? this.state.objectTypes[member.id] : member.enums?.type || 'boolean';

        if (onFalseEnabled && setIfTrueVisible && setIfTrue === '' && (varType === 'number' || varType === 'boolean')) {
            setIfTrueVisible = false;
        }

        let setIfFalse = member.setIfFalse;
        let setIfFalseVisible = onFalseEnabled;
        if (setIfFalse === undefined || setIfFalse === null) {
            setIfFalse = '';
            setIfFalseVisible = false;
        } else {
            if (setIfFalse === true) {
                setIfFalse = 'TRUE';
            } else if (setIfFalse === false) {
                setIfFalse = 'FALSE';
            } else {
                if (member.setIfFalseTolerance) {
                    setIfFalse = `${setIfFalse}±${member.setIfFalseTolerance}`;
                } else {
                    setIfFalse = setIfFalse.toString();
                }
            }
        }

        if (setIfFalseVisible && setIfFalse === '' && (varType === 'number' || varType === 'boolean')) {
            setIfFalseVisible = false;
        }

        // calculate enabled states
        let delay = 0;
        let stacked = false;
        for (let u = 0; u < index; u++) {
            if (!this.state.members[u].disabled) {
                if (this.state.members[u].stackNextDelays) {
                    stacked = true;
                }
                if (stacked) {
                    delay += this.state.members[u].delay || 0;
                }
                delay += this.props.intervalBetweenCommands;
            }
        }

        delay += member.delay || 0;

        const title = member.id || this.getTitleForEnums(index);

        return (
            <Paper
                key={`${member.id || ''}_${index}`}
                style={{ ...styles.memberCard, ...(member.disabled ? styles.disabled : undefined) }}
            >
                <div style={styles.memberToolbar}>
                    <IconButton
                        style={styles.memberFolder}
                        title={I18n.t('Edit')}
                        onClick={() => {
                            const openedMembers = [...this.state.openedMembers];
                            const pos = member.id ? openedMembers.indexOf(member.id) : openedMembers.indexOf(index);
                            if (pos !== -1) {
                                openedMembers.splice(pos, 1);
                            } else {
                                openedMembers.push(member.id || index);
                                openedMembers.sort();
                            }
                            window.localStorage.setItem('Scenes.openedMembers', JSON.stringify(openedMembers));
                            this.setState({ openedMembers });
                        }}
                    >
                        {opened ? <IconFolderOpened /> : <IconFolderClosed />}
                    </IconButton>
                    <div
                        style={{ ...styles.memberTitle, cursor: member.id ? undefined : 'pointer' }}
                        onClick={member.id ? undefined : () => this.setState({ showAddEnumsDialog: index })}
                    >
                        {title}
                    </div>
                    <div style={styles.memberDesc}>
                        {member.desc || (member.id && this.state.objectNames[member.id]) || ''}
                    </div>
                    <div style={styles.memberButtons}>
                        <IconButton
                            size="small"
                            style={{ marginLeft: 5 }}
                            aria-label="Delete"
                            title={I18n.t('Delete')}
                            onClick={() => {
                                const suppressDeleteConfirm =
                                    window.localStorage.getItem('scenes.suppressDeleteConfirm');

                                if (suppressDeleteConfirm) {
                                    if (Date.now() - parseInt(suppressDeleteConfirm, 10) < 300000) {
                                        this.deleteSceneMember(member.id || index);
                                    } else {
                                        window.localStorage.removeItem('scenes.suppressDeleteConfirm');
                                        this.setState({ deleteDialog: member.id || index });
                                    }
                                } else {
                                    this.setState({ deleteDialog: member.id || index, suppressDeleteConfirm: false });
                                }
                            }}
                        >
                            <IconDelete />
                        </IconButton>
                        <Switch
                            checked={!member.disabled}
                            onChange={e => {
                                const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                members[index].disabled = !e.target.checked;
                                this.setStateWithParent({ members });
                            }}
                            name={member.id || undefined}
                        />
                        {value}
                    </div>
                </div>
                <div>
                    {!member.disabled && (this.props.intervalBetweenCommands || member.delay) ? (
                        <span>
                            {' '}
                            <IconClock /> {`${delay + I18n.t('ms')} ${I18n.t('from scene start')}`}
                        </span>
                    ) : null}
                </div>
                {opened ? (
                    <div>
                        <Box style={styles.p}>
                            <TextField
                                variant="standard"
                                fullWidth
                                label={I18n.t('Description')}
                                value={member.desc || ''}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        endAdornment: member.desc ? (
                                            <IconButton
                                                size="small"
                                                style={styles.smallClearBtn}
                                                onClick={() => {
                                                    const members: SceneMember[] = JSON.parse(
                                                        JSON.stringify(this.state.members),
                                                    );
                                                    members[index].desc = null;
                                                    this.setStateWithParent({ members });
                                                }}
                                            >
                                                <IconCancel />
                                            </IconButton>
                                        ) : undefined,
                                    },
                                }}
                                onChange={e => {
                                    const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                    members[index].desc = e.target.value;
                                    this.setStateWithParent({ members });
                                }}
                            />
                        </Box>
                        {member.id ? null : (
                            <Box style={styles.p}>
                                <FormControl
                                    style={{ width: '50%' }}
                                    variant="standard"
                                >
                                    <InputLabel>{I18n.t('Value type')}</InputLabel>
                                    <Select
                                        value={member.enums?.type || 'boolean'}
                                        onChange={e => {
                                            const members: SceneMember[] = JSON.parse(
                                                JSON.stringify(this.state.members),
                                            );
                                            members[index].enums = members[index].enums || {
                                                funcs: [],
                                                rooms: [],
                                                others: [],
                                                exclude: [],
                                                type: 'boolean',
                                                delay: null,
                                            };
                                            members[index].enums.type = e.target.value as
                                                | 'boolean'
                                                | 'number'
                                                | 'string';
                                            this.setStateWithParent({ members });
                                        }}
                                    >
                                        <MenuItem value="boolean">{I18n.t('Boolean')}</MenuItem>
                                        <MenuItem value="number">{I18n.t('Number')}</MenuItem>
                                        <MenuItem value="string">{I18n.t('String')}</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    variant="standard"
                                    style={{ width: 'calc(50% - 8px)', marginLeft: 8 }}
                                    label={I18n.t('Delay between commands (ms)')}
                                    value={member.enums?.delay || 0}
                                    type="number"
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                        input: {
                                            endAdornment: member.enums?.delay ? (
                                                <IconButton
                                                    size="small"
                                                    style={styles.smallClearBtn}
                                                    onClick={() => {
                                                        const members: SceneMember[] = JSON.parse(
                                                            JSON.stringify(this.state.members),
                                                        );
                                                        members[index].enums = members[index].enums || {
                                                            funcs: [],
                                                            rooms: [],
                                                            others: [],
                                                            exclude: [],
                                                            type: 'boolean',
                                                            delay: null,
                                                        };
                                                        members[index].enums.delay = null;
                                                        this.setStateWithParent({ members });
                                                    }}
                                                >
                                                    <IconCancel />
                                                </IconButton>
                                            ) : undefined,
                                        },
                                    }}
                                    onChange={e => {
                                        const members: SceneMember[] = JSON.parse(JSON.stringify(this.state.members));
                                        members[index].enums = members[index].enums || {
                                            funcs: [],
                                            rooms: [],
                                            others: [],
                                            exclude: [],
                                            type: 'boolean',
                                            delay: null,
                                        };
                                        members[index].enums.delay = e.target.value;
                                        this.setStateWithParent({ members });
                                    }}
                                />
                            </Box>
                        )}
                        {!this.state.virtualGroup ? this.renderSetValue(index, member, onFalseEnabled, true) : null}
                        {!this.state.virtualGroup && this.state.onFalseEnabled
                            ? this.renderSetValue(index, member, true, false)
                            : null}
                        {!this.state.easy ? (
                            <Box style={styles.p}>
                                <Grid
                                    container
                                    spacing={4}
                                >
                                    <Grid
                                        item
                                        xs={12}
                                        sm={4}
                                    >
                                        <TextField
                                            variant="standard"
                                            fullWidth
                                            label={I18n.t('Delay (ms)')}
                                            title={I18n.t(
                                                'Additionally to the interval between commands. E.g. if the interval %s, this state will be set after %s ms from scene start',
                                                this.props.intervalBetweenCommands,
                                                this.props.intervalBetweenCommands * index + (member.delay || 0),
                                            )}
                                            slotProps={{
                                                inputLabel: {
                                                    shrink: true,
                                                },
                                                htmlInput: {
                                                    min: 0,
                                                },
                                            }}
                                            helperText={
                                                stacked ? I18n.t('from previous state') : I18n.t('from start of scene')
                                            }
                                            value={member.delay || 0}
                                            type="number"
                                            onChange={e => {
                                                const members: SceneMember[] = JSON.parse(
                                                    JSON.stringify(this.state.members),
                                                );
                                                members[index].delay = parseInt(e.target.value, 10);
                                                this.setStateWithParent({ members });
                                            }}
                                        />
                                    </Grid>
                                    <Grid
                                        item
                                        xs={12}
                                        sm={4}
                                    >
                                        {!stacked ? (
                                            <FormControlLabel
                                                label={I18n.t('Stack next delays')}
                                                control={
                                                    <Checkbox
                                                        checked={!!member.stackNextDelays}
                                                        onChange={e => {
                                                            const members = JSON.parse(
                                                                JSON.stringify(this.state.members),
                                                            );
                                                            members[index].stackNextDelays = e.target.checked;
                                                            this.setStateWithParent({ members });
                                                        }}
                                                    />
                                                }
                                            />
                                        ) : null}
                                    </Grid>
                                    <Grid
                                        item
                                        xs={12}
                                        sm={4}
                                    >
                                        <FormControlLabel
                                            label={I18n.t('Stop already started commands')}
                                            control={
                                                <Checkbox
                                                    checked={member.stopAllDelays}
                                                    onChange={e => {
                                                        const members: SceneMember[] = JSON.parse(
                                                            JSON.stringify(this.state.members),
                                                        );
                                                        members[index].stopAllDelays = e.target.checked;
                                                        this.setStateWithParent({ members });
                                                    }}
                                                />
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : null}
                        {!this.state.easy ? (
                            <Box style={styles.p}>
                                <FormControlLabel
                                    label={I18n.t('Do not overwrite state if it has the required value')}
                                    title={I18n.t(
                                        'For example, if the value is already at "%s" and "%s" is the setpoint, then write the value anyway if this checkbox is activated.',
                                        member.setIfTrue === undefined || member.setIfTrue === null
                                            ? 'null'
                                            : member.setIfTrue.toString(),
                                        member.setIfTrue === undefined || member.setIfTrue === null
                                            ? 'null'
                                            : member.setIfTrue.toString(),
                                    )}
                                    control={
                                        <Checkbox
                                            checked={!!member.doNotOverwrite}
                                            onChange={e => {
                                                const members: SceneMember[] = JSON.parse(
                                                    JSON.stringify(this.state.members),
                                                );
                                                members[index].doNotOverwrite = e.target.checked;
                                                this.setStateWithParent({ members });
                                            }}
                                        />
                                    }
                                />
                            </Box>
                        ) : null}
                    </div>
                ) : !this.state.virtualGroup ? (
                    <div style={styles.smallOnTrueFalse}>
                        {setIfTrueVisible ? `${onFalseEnabled ? I18n.t('Set if TRUE') : I18n.t('Setpoint')}: ` : ''}
                        {setIfTrueVisible ? <span style={styles.stateValueTrue}>{setIfTrue}</span> : null}
                        {setIfFalseVisible && onFalseEnabled
                            ? `${setIfTrueVisible ? ' / ' : ''}${I18n.t('Set if FALSE')}: `
                            : null}
                        {setIfFalseVisible && onFalseEnabled ? (
                            <span style={styles.stateValueFalse}>{setIfFalse}</span>
                        ) : null}
                    </div>
                ) : (
                    <div style={{ height: 8 }} />
                )}
            </Paper>
        );
    }

    onWriteScene(val: boolean | number | string): void {
        if (val === 'true') {
            val = true;
        } else if (val === 'false') {
            val = false;
        } else if (typeof val === 'string' && parseFloat(val.replace(',', '.')).toString() === val) {
            val = parseFloat(val.replace(',', '.'));
        }

        this.props.socket.setState(this.props.sceneId, val).catch(e => this.props.showError(e));
    }

    static getItemStyle(isDragging: boolean, draggableStyle: React.CSSProperties): React.CSSProperties {
        return {
            // some basic styles to make the items look a bit nicer
            userSelect: 'none',
            backgroundColor: isDragging ? 'lightgreen' : 'inherit',

            // styles we need to apply on draggable
            ...draggableStyle,
        };
    }

    static getListStyle(isDraggingOver: boolean): React.CSSProperties {
        return {
            background: isDraggingOver ? 'lightblue' : 'inherit',
        };
    }

    renderMessageDialog(): React.JSX.Element | null {
        if (!this.state.message) {
            return null;
        }
        return (
            <MessageDialog
                key="message-dialog"
                onClose={() => this.setState({ message: '' })}
                title={I18n.t('Result')}
                text={this.state.message}
            />
        );
    }

    saveActualState(isForTrue: boolean): void {
        void this.props.socket
            .sendTo(this.state.engineId, 'save', { sceneId: this.props.sceneId, isForTrue: isForTrue || false })
            .then(result => {
                if (result.error) {
                    // show error
                    this.props.showError(`${I18n.t(`Cannot save scene state`)}:${result.error}`);
                } else {
                    if (result.allSaved) {
                        this.setState({ message: I18n.t('Scene state saved') });
                    } else {
                        this.setState({ message: I18n.t('Scene state saved partially. Check log for details') });
                    }
                }
            });
    }

    renderTrueFalseDialog(): React.JSX.Element | null {
        if (!this.state.askTrueFalse) {
            return null;
        }

        return (
            <Dialog
                key="askTrueFalse"
                open={!0}
                onClose={() => this.setState({ askTrueFalse: false })}
            >
                <DialogTitle>{I18n.t('Save actual state')}</DialogTitle>
                <DialogContent>{I18n.t('Do you want to save the current state as TRUE or FALSE?')}</DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.saveActualState(true);
                            this.setState({ askTrueFalse: false });
                        }}
                        color="primary"
                    >
                        TRUE
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.saveActualState(false);
                            this.setState({ askTrueFalse: false });
                        }}
                        color="secondary"
                    >
                        FALSE
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => this.setState({ askTrueFalse: false })}
                        color="grey"
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): (React.JSX.Element | null)[] {
        let sceneState = this.state.states[this.props.sceneId];
        if (this.state.selectedSceneChanged) {
            sceneState = I18n.t('Save scene before test');
        } else if (sceneState === undefined || sceneState === null) {
            sceneState = '';
        }

        if (this.engineId !== this.state.engineId) {
            if (this.engineId) {
                this.props.socket.unsubscribeState(`${this.engineId}.alive`, this.memberStateChange);
            }
            if (this.state.engineId) {
                void this.props.socket.subscribeState(`${this.state.engineId}.alive`, this.memberStateChange);
            }
            this.engineId = this.state.engineId;
        }

        const onFalseEnabled = !this.state.virtualGroup && this.state.onFalseEnabled;
        let takeState;
        if (this.state.states[`${this.state.engineId}.alive`] && sceneState !== true) {
            takeState = (
                <div
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                    title={
                        onFalseEnabled ? I18n.t('Take current state as TRUE or FALSE') : I18n.t('Take current state')
                    }
                >
                    <Save style={{ marginLeft: 4, marginRight: 4, width: 16, height: 16 }} />
                    {sceneState === false ? 'FALSE' : sceneState.toString()}
                </div>
            );
        }

        const result = (
            <div
                key="SceneMembersForm"
                style={{ ...(!this.props.oneColumn ? styles.height : undefined), ...styles.columnContainer }}
            >
                <Toolbar sx={{ '&. MuiToolbar-gutters': styles.guttersZero }}>
                    <Typography
                        variant="h6"
                        sx={styles.sceneTitle}
                    >
                        {I18n.t('Scene states')}
                        {!this.state.states[`${this.state.engineId}.alive`] ? (
                            <span style={styles.instanceNotActive}>{I18n.t('Instance not active')}</span>
                        ) : (
                            ''
                        )}
                        <br />
                        <Box
                            component="div"
                            sx={Utils.getStyle(
                                this.props.theme,
                                styles.sceneSubTitle,
                                !this.state.virtualGroup && sceneState === true && styles.sceneTrue,
                                !this.state.virtualGroup && sceneState === false && styles.sceneFalse,
                                !this.state.virtualGroup && sceneState === 'uncertain' && styles.sceneUncertain,
                            )}
                            style={takeState ? { cursor: 'pointer' } : undefined}
                            onClick={
                                takeState
                                    ? () => {
                                          if (onFalseEnabled) {
                                              this.setState({ askTrueFalse: true });
                                          } else {
                                              this.saveActualState(true);
                                          }
                                      }
                                    : undefined
                            }
                        >
                            {I18n.t('Scene state:')}{' '}
                            {sceneState === true
                                ? 'TRUE'
                                : sceneState === false
                                  ? takeState || 'FALSE'
                                  : takeState || sceneState.toString()}
                        </Box>
                    </Typography>
                    <IconButton
                        title={I18n.t('Add new state')}
                        onClick={() => this.setState({ showDialog: true })}
                    >
                        <IconAdd />
                    </IconButton>
                    <IconButton
                        title={I18n.t('Add new categories')}
                        onClick={() => this.setState({ showAddEnumsDialog: true })}
                    >
                        <IconAddBox />
                    </IconButton>
                </Toolbar>
                <div style={{ ...styles.testButtons, ...styles.width100 }}>
                    {!this.state.selectedSceneChanged && this.state.virtualGroup ? (
                        <TextField
                            variant="standard"
                            style={styles.width100WithButton}
                            label={I18n.t('Write to virtual group')}
                            defaultValue={sceneState}
                            onKeyUp={e => e.keyCode === 13 && this.onWriteScene(this.state.writeSceneState)}
                            onChange={e => this.setState({ writeSceneState: e.target.value })}
                        />
                    ) : null}
                    {!this.state.selectedSceneChanged && this.state.virtualGroup && this.state.members.length ? (
                        <IconButton onClick={() => this.onWriteScene(this.state.writeSceneState)}>
                            <IconPlay />
                        </IconButton>
                    ) : null}
                    {this.state.sceneEnabled && !this.state.selectedSceneChanged && !this.state.virtualGroup ? (
                        <Button
                            color="grey"
                            sx={styles.btnTestTrue}
                            onClick={() => this.onWriteScene(true)}
                            startIcon={<IconPlay />}
                        >
                            {!onFalseEnabled ? I18n.t('Test') : I18n.t('Test TRUE')}
                        </Button>
                    ) : null}
                    {this.state.sceneEnabled &&
                    !this.state.selectedSceneChanged &&
                    onFalseEnabled &&
                    this.state.members.length ? (
                        <Button
                            color="grey"
                            sx={styles.btnTestFalse}
                            startIcon={<IconPlay />}
                            onClick={() => this.onWriteScene(false)}
                        >
                            {I18n.t('Test FALSE')}
                        </Button>
                    ) : null}
                    {this.state.members.length > 1 && this.state.openedMembers.length ? (
                        <IconButton
                            title={I18n.t('Collapse all')}
                            style={styles.btnCollapseAll}
                            onClick={() => {
                                window.localStorage.setItem('Scenes.openedMembers', '[]');
                                this.setState({ openedMembers: [] });
                            }}
                        >
                            <IconCollapseAll />
                        </IconButton>
                    ) : null}
                    {this.state.members.length > 1 && this.state.openedMembers.length !== this.state.members.length ? (
                        <IconButton
                            title={I18n.t('Expand all')}
                            style={styles.btnExpandAll}
                            onClick={() => {
                                const openedMembers = this.state.members.map((member, i) => member.id || i);
                                window.localStorage.setItem('Scenes.openedMembers', JSON.stringify(openedMembers));
                                this.setState({ openedMembers });
                            }}
                        >
                            <IconExpandAll />
                        </IconButton>
                    ) : null}
                </div>
                <DragDropContext onDragEnd={this.onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                style={{ ...styles.scroll, ...SceneMembersForm.getListStyle(snapshot.isDraggingOver) }}
                            >
                                {this.state.members.map((member, i) => (
                                    <Draggable
                                        key={`${member.id || ''}_${i}`}
                                        draggableId={`${member.id || ''}_${i}`}
                                        index={i}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={SceneMembersForm.getItemStyle(
                                                    snapshot.isDragging,
                                                    provided.draggableProps.style as React.CSSProperties,
                                                )}
                                            >
                                                {this.renderMember(member, i)}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        );

        return [
            result,
            this.renderDeleteDialog(),
            this.renderSelectIdDialog(),
            this.renderSelectEnumsDialog(),
            this.renderSelectStateIdDialog(),
            this.renderMessageDialog(),
            this.renderTrueFalseDialog(),
        ];
    }
}

export default SceneMembersForm;

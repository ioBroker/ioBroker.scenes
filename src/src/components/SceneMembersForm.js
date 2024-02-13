import React from 'react'
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
import { I18n, Utils, SelectID as DialogSelectID } from '@iobroker/adapter-react-v5';

// icons
import { AiOutlineClockCircle as IconClock } from 'react-icons/ai';
import {
    MdDelete as IconDelete,
    MdAdd as IconAdd,
    MdPlayArrow as IconPlay,
} from 'react-icons/md';
import { FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened } from 'react-icons/fa';
import {
    Close as IconCancel,
    ExpandMore as IconExpandAll,
    ExpandLess as IconCollapseAll,
    Menu as IconList,
} from '@mui/icons-material';

const TRUE_COLOR       = '#90ee90';
const FALSE_COLOR      = '#ff9999';
const TRUE_DARK_COLOR  = '#528952';
const FALSE_DARK_COLOR = '#774747';
const UNCERTAIN_COLOR  = '#bfb7be';

const styles = theme => ({
    memberTrueFalse: {
        borderRadius: 10,
        padding: `2px ${theme.spacing(1)}`,
        fontSize: 'initial',
        fontWeight: 'initial',
        margin: `0 ${theme.spacing(1)}`,
        textAlign: 'right',
        whiteSpace: 'nowrap',
        maxWidth: 300,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    memberTrue: {
        backgroundColor: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
    },
    memberFalse: {
        backgroundColor: 'pink',
    },
    memberUncertain: {
        color: '#FFF',
        backgroundColor: '#808080',
    },
    memberCard: {
        padding: 4,
        margin: `${theme.spacing(1)} 0`,
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
        paddingRight: theme.spacing(1),
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
            margin: `0 ${theme.spacing(1)}`,
        },
    },
    p: {
        margin: `${theme.spacing(1)} 0`,
    },
    guttersZero: {
        padding: 0,
    },
    sceneTitle: {
        flexGrow: 1,
        color: theme.palette.mode === 'dark' ? '#FFF': '#000',
    },
    sceneSubTitle: {
        fontSize: 'small',
        borderRadius: 10,
        padding: `2px ${theme.spacing(1)}`,
    },
    sceneTrue: {
        background: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
    },
    sceneFalse: {
        background: theme.palette.mode === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
    },
    sceneUncertain: {
        background: UNCERTAIN_COLOR,
    },
    btnTestTrue: {
        background: theme.palette.mode === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
    },
    btnTestFalse: {
        background: theme.palette.mode === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
        marginBottom: theme.spacing(0.5),
    },
    btnExpandAll: {
        float: 'right'
    },
    btnCollapseAll: {
        float: 'right'
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
            borderRadius: 6,
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
        width: `calc(70% - ${70 + theme.spacing(1)})`,
        minWidth: 100,
        marginRight: theme.spacing(1),
    },
    setTolerance: {
        width: `calc(30% - ${70 + theme.spacing(1)})`,
        minWidth: 100,
        marginRight: theme.spacing(1),
    },
    disabled: {
        opacity: 0.3
    },
    instanceNotActive: {
        marginLeft: theme.spacing(1),
        fontSize: 10,
        fontStyle: 'italic',
        color: '#FF0000',
    },
    fromId: {
        marginTop: 8,
    },
});

class SceneMembersForm extends React.Component {
    constructor(props) {
        super(props);

        let openedMembers = window.localStorage.getItem('Scenes.openedMembers') || '[]';
        try {
            openedMembers = JSON.parse(openedMembers);
        } catch (e) {
            openedMembers = [];
        }

        this.state = {
            states: {},
            openedMembers,
            objectTypes: {},
            objectNames: {},
            members: JSON.parse(JSON.stringify(props.members)),
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
            showSelectValueIdDialog: false,
            showSelectValueIdDialogFor: null,
        };

        this.delButtonRef = React.createRef();

        this.engineId = this.state.engineId;

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        this.readObjects()
            .then(newState =>
                this.setState(newState, () => {
                    // subscribe on scene state
                    this.props.socket.subscribeState(this.props.sceneId, this.memberStateChange);
                    this.state.engineId && this.props.socket.subscribeState(`${this.state.engineId}.alive`, this.memberStateChange);

                    // subscribe on all states
                    this.state.members.forEach(member =>
                        member.id && this.props.socket.subscribeState(member.id, this.memberStateChange))
                }));
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeState(this.props.sceneId, this.memberStateChange);
        this.state.engineId && this.props.socket.unsubscribeState(`${this.state.engineId}.alive`, this.memberStateChange);

        this.state.members.forEach(member =>
            this.props.socket.unsubscribeState(member.id, this.memberStateChange));
    }

    static getDerivedStateFromProps(props, state) {
        const newState = {};
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

        return changed ? newState : null;
    }

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        const members = JSON.parse(JSON.stringify(this.state.members));
        const [removed] = members.splice(result.source.index, 1);
        members.splice(result.destination.index, 0, removed);

        this.setStateWithParent({members});
    }

    readObjects() {
        if (this.state.members) {
            return Promise.all(
                this.state.members.map(member =>
                    this.props.socket.getObject(member.id)))
                .then(results => {
                    const objectTypes = {};
                    const objectNames = {};
                    results.forEach(obj => {
                        if (obj && obj.common && obj.common.type) {
                            objectTypes[obj._id] = obj.common.type;
                            objectNames[obj._id] = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}, false);
                        }
                    });

                    return {objectTypes, objectNames};
                })
                .catch(e => this.props.showError(e));
        } else {
            return Promise.resolve({});
        }
    }

    memberStateChange = (id, state) => {
        const states = JSON.parse(JSON.stringify(this.state.states));
        states[id] = state ? state.val : null;
        const objectTypes = JSON.parse(JSON.stringify(this.state.objectTypes));

        if (!objectTypes[id] && states[id] !== null && states[id] !== undefined) {
            objectTypes[id] = typeof states[id];
        }

        if (objectTypes[id] === 'boolean') {
            if (states[id] === 'true') {
                states[id] = true;
            }
            if (states[id] === 'false') {
                states[id] = false;
            }
        } else if (objectTypes[id] === 'number') {
            states[id] = parseFloat(states[id]);
        }

        this.setState({ states, objectTypes });
    };

    createSceneMembers = ids => {
        this.setState({showDialog: false}, () => {
            if (ids.length) {
                const openedMembers = [...this.state.openedMembers];
                const objectTypes = JSON.parse(JSON.stringify(this.state.objectTypes));
                const objectNames = JSON.parse(JSON.stringify(this.state.objectNames));
                const members     = JSON.parse(JSON.stringify(this.state.members));

                Promise.all(ids.map(id =>
                    // Read type of state
                    this.props.socket.getObject(id)
                        .then(obj => {
                            if (!obj) {
                                return;
                            }

                            const template = {
                                id,
                                setIfTrue: null,
                                setIfFalse: null,
                                stopAllDelays: true,
                                desc: null,
                                disabled: false,
                                delay: 0
                            };

                            if (obj) {
                                objectNames[obj._id] = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}, true);
                            }


                            if (obj && obj.common && obj.common.type) {
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
                        })
                        .then(() => this.setStateWithParent({objectTypes, objectNames, members, openedMembers}, () =>
                            // Subscribe on all new members
                            ids.forEach(id => this.props.socket.subscribeState(id, this.memberStateChange)))
                        )
                    )
                )
                    .catch(e => this.props.showError(e));
            } else {
                // Show alert
                this.props.showError(I18n.t('Unknown error!'));
            }
        });
    };

    deleteSceneMember = id => {
        let members = JSON.parse(JSON.stringify(this.state.members));

        for (let i = 0; i < members.length; i++) {
            if (members[i].id === id) {
                members.splice(i, 1);
            }
        }

        this.setStateWithParent({members, deleteDialog: null}, () =>
            this.props.socket.unsubscribeState(id, this.memberStateChange));
    };

    setStateWithParent(newState, cb) {
        const that = this;
        this.setState(newState, () =>
            this.props.updateSceneMembers(that.state.members, cb));
    };

    renderSelectIdDialog() {
        return this.state.showDialog ? <DialogSelectID
            imagePrefix={'../..'}
            key="selectDialogMembers"
            socket={ this.props.socket }
            dialogName="memberEdit"
            multiSelect={ true }
            title={ I18n.t('Select for ') }
            selected={ null }
            onOk={ id => this.createSceneMembers(id) }
            onClose={ () => this.setState({showDialog: false}) }
        /> : null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.state.deleteDialog && setTimeout(() => {
            if (this.delButtonRef.current) {
                this.delButtonRef.current.focus();
            }
        }, 50);
    }

    renderDeleteDialog() {
        if (this.state.deleteDialog === null) {
            return;
        }

        return <Dialog
            open={ true }
            key="deleteDialog"
            onClose={ () =>
                this.setState({deleteDialog: null}) }
            >
                <DialogTitle>{ I18n.t('Are you sure for delete this state?') }</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={<Checkbox checked={this.state.suppressDeleteConfirm} onChange={() => this.setState({suppressDeleteConfirm: !this.state.suppressDeleteConfirm})} />}
                        label={I18n.t('Suppress confirmation for next 5 minutes')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="secondary"
                        ref={this.delButtonRef}
                        onClick={ e => {
                            if (this.state.suppressDeleteConfirm) {
                                window.localStorage.setItem('scenes.suppressDeleteConfirm', Date.now().toString());
                            }
                            this.deleteSceneMember(this.state.deleteDialog);
                        } }
                        startIcon={<IconDelete />}
                    >
                        {I18n.t('Delete')}
                    </Button>
                    <Button
                        color="grey"
                        autoFocus
                        variant="contained"
                        onClick={ () => this.setState({deleteDialog: null}) }
                        startIcon={<IconCancel />}
                    >
                        {I18n.t('Cancel')}
                    </Button>

                </DialogActions>
            </Dialog>;
    };

    renderSelectStateIdDialog() {
        if (!this.state.showSelectValueIdDialog) {
            return null;
        } else {
            let setValue;
            if (this.state.showSelectValueIdDialog === 'true') {
                setValue = this.state.members[this.state.showSelectValueIdDialogFor].setIfTrue;
            } else {
                setValue = this.state.members[this.state.showSelectValueIdDialogFor].setIfFalse;
            }
            const m = typeof setValue === 'string' && setValue.match(/^{{([^}]*)}}$/);
            if (m) {
                setValue = m[1];
            }

            return <DialogSelectID
                imagePrefix={'../..'}
                key="selectDialogMember"
                socket={ this.props.socket }
                dialogName="memberEdit"
                multiSelect={ false }
                title={ I18n.t('Select for ') + (this.state.showSelectValueIdDialog === 'true' ? 'TRUE' : 'FALSE') }
                selected={ setValue }
                onOk={ id => {
                    if (id) {
                        const index = this.state.showSelectValueIdDialogFor;
                        const members = JSON.parse(JSON.stringify(this.state.members));
                        if (this.state.showSelectValueIdDialog === 'true') {
                            members[index].setIfTrue = '{{' + id + '}}';
                        } else {
                            members[index].setIfFalse = '{{' + id + '}}';
                        }

                        this.setState({showSelectValueIdDialog: false, showSelectValueIdDialogFor: null}, () =>
                            this.setStateWithParent({members}));
                    }
                }}
                onClose={ () => this.setState({showSelectValueIdDialog: false, showSelectValueIdDialogFor: null}) }
            />;
        }
    }

    renderSetValue(classes, index, member, onFalseEnabled, isTrue) {
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
            labelTolerance = (onFalseEnabled ? I18n.t('Tolerance by TRUE') : I18n.t('Tolerance'));
            setValueTolerance = member.setIfTrueTolerance;
        } else {
            labelSetValue = fromState ? I18n.t('From ID by FALSE') :I18n.t('Setpoint by FALSE');
            labelTolerance = I18n.t('Tolerance by FALSE');
            setValueTolerance = member.setIfFalseTolerance;
        }

        return <Box className={classes.p}>
            {!this.state.easy || fromState ? <FormControlLabel
                classes={{ root: classes.fromId }}
                control={<Switch
                    checked={fromState}
                    onChange={e => {
                        const members = JSON.parse(JSON.stringify(this.state.members));
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
                />}
                label={I18n.t('From ID')}
            /> : null}
            {!fromState && this.state.objectTypes[member.id] === 'boolean' ?
                <FormControl className={classes.setValue} variant="standard">
                    <InputLabel>{labelSetValue}</InputLabel>
                    <Select
                        variant="standard"
                        value={setValue === true || setValue === 'true' ? 'true' : (setValue === false || setValue === 'false' ? 'false' : 'null')}
                        onChange={ e => {
                            const members = JSON.parse(JSON.stringify(this.state.members));
                            if (isTrue) {
                                members[index].setIfTrue = e.target.value === 'true' ? true : (e.target.value === 'false' ? false : null);
                            } else {
                                members[index].setIfFalse = e.target.value === 'true' ? true : (e.target.value === 'false' ? false : null);
                            }

                            this.setStateWithParent({ members });
                        }}
                    >
                        <MenuItem value="false">FALSE</MenuItem>
                        <MenuItem value="true">TRUE</MenuItem>
                        <MenuItem value="null">{I18n.t('NOT CHANGE')}</MenuItem>
                    </Select>
                </FormControl>
                :
                <>
                    {fromState ?
                        <TextField
                            variant="standard"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            label={labelSetValue}
                            value={setValue || ''}
                            readOnly
                            className={classes.setValue}
                            InputProps={{
                                endAdornment: <IconButton
                                    size="small"
                                    onClick={() => this.setState({ showSelectValueIdDialog: isTrue ? 'true' : 'false', showSelectValueIdDialogFor: index })}>
                                    <IconList />
                                </IconButton>,
                            }}
                        />
                        :
                        <TextField
                            variant="standard"
                            fullWidth
                            InputLabelProps={{shrink: true}}
                            label={labelSetValue}
                            value={setValue === undefined || setValue === null ? '' : setValue}
                            className={classes.setValue}
                            InputProps={{
                                endAdornment: setValue ?
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            const members = JSON.parse(JSON.stringify(this.state.members));
                                            if (isTrue) {
                                                members[index].setIfTrue = null;
                                            } else {
                                                members[index].setIfFalse = null;
                                            }
                                            this.setStateWithParent({ members });
                                        }}>
                                        <IconCancel />
                                    </IconButton>
                                    : undefined,
                            }}
                            onChange={e => {
                                const members = JSON.parse(JSON.stringify(this.state.members));
                                if (this.state.objectTypes[member.id] === 'number' && e.target.value !== '') {
                                    if (isTrue) {
                                        members[index].setIfTrue = parseFloat(e.target.value.replace(',', '.'));
                                    } else {
                                        members[index].setIfFalse = parseFloat(e.target.value.replace(',', '.'));
                                    }
                                } else {
                                    if (isTrue) {
                                        members[index].setIfTrue = e.target.value;
                                    } else {
                                        members[index].setIfFalse = e.target.value;
                                    }
                                }

                                this.setStateWithParent({ members });
                            }}
                        />
                    }

                    {!this.state.easy && this.state.objectTypes[member.id] !== 'boolean' ? <TextField
                        variant="standard"
                        InputLabelProps={{ shrink: true }}
                        label={`± ${labelTolerance}`}
                        value={setValueTolerance === undefined || setValueTolerance === null ? '' : setValueTolerance}
                        title={I18n.t('Absolute value, not percent')}
                        className={classes.setTolerance}
                        InputProps={{
                            endAdornment: setValueTolerance ?
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        const members = JSON.parse(JSON.stringify(this.state.members));
                                        if (isTrue) {
                                            members[index].setIfTrueTolerance = null;
                                        } else {
                                            members[index].setIfFalseTolerance = null;
                                        }
                                        this.setStateWithParent({members});
                                    }}>
                                    <IconCancel />
                                </IconButton>
                                : undefined,
                        }}
                        onChange={e => {
                            const members = JSON.parse(JSON.stringify(this.state.members));
                            if (isTrue) {
                                members[index].setIfTrueTolerance = e.target.value === '' ? '' : parseFloat(e.target.value.replace(',', '.'));
                            } else {
                                members[index].setIfFalseTolerance = e.target.value === '' ? '' : parseFloat(e.target.value.replace(',', '.'));
                            }
                            this.setStateWithParent({ members });
                        }} /> : null}
                </>
            }
        </Box>;
    }

    renderMember = (member, index) => {
        let value = null;
        const classes = this.props.classes;
        if (this.state.states[member.id] !== undefined && this.state.states[member.id] !== null) {
            let _valStr = this.state.states[member.id].toString();

            if (_valStr === 'true') {
                _valStr = 'TRUE';
            } else if (_valStr === 'false') {
                _valStr = 'FALSE';
            }

            if (member.setIfTrueTolerance && Math.abs(this.state.states[member.id] - member.setIfTrue) <= member.setIfTrueTolerance) {
                value = <div
                    title={ I18n.t('Actual state value') }
                    className={ Utils.clsx(classes.memberTrueFalse, classes.memberTrue) }>{_valStr}</div>;
            } else if (this.state.states[member.id] === member.setIfTrue) {
                value = <div
                    title={I18n.t('Actual state value')}
                    className={ Utils.clsx(classes.memberTrueFalse, classes.memberTrue)}
                >
                    {_valStr}
                </div>;
            } else if (member.setIfFalse !== undefined && member.setIfFalseTolerance && Math.abs(this.state.states[member.id] - member.setIfFalse) <= member.setIfFalseTolerance) {
                value = <div
                    title={I18n.t('Actual state value')}
                    className={ Utils.clsx(classes.memberTrueFalse, classes.memberFalse)}
                >
                    {_valStr}
                </div>;
            } else if (member.setIfFalse !== undefined && this.state.states[member.id] === member.setIfFalse) {
                value = <div
                    title={I18n.t('Actual state value')}
                    className={ Utils.clsx(classes.memberTrueFalse, classes.memberFalse)}
                >
                    {_valStr}
                </div>;
            } else {
                value = <div
                    title={I18n.t('Actual state value')}
                    className={ Utils.clsx(classes.memberTrueFalse, classes.memberUncertain)}
                >
                    {_valStr}
                </div>;
            }
        }

        const opened = this.state.openedMembers.includes(member.id);
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

        const varType =  this.state.objectTypes[member.id];

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

        return <Paper key={`${member.id}_${index}`} className={Utils.clsx(classes.memberCard, member.disabled && classes.disabled)}>
            <div className={classes.memberToolbar}>
                <IconButton
                    className={classes.memberFolder}
                    title={I18n.t('Edit')}
                    onClick={() => {
                        const openedMembers = [...this.state.openedMembers];
                        const pos = openedMembers.indexOf(member.id);
                        if (pos !== -1) {
                            openedMembers.splice(pos, 1);
                        } else {
                            openedMembers.push(member.id);
                            openedMembers.sort();
                        }
                        window.localStorage.setItem('Scenes.openedMembers', JSON.stringify(openedMembers));
                        this.setState({openedMembers});
                    }}
                >
                    {opened ? <IconFolderOpened /> : <IconFolderClosed />}
                </IconButton>
                <div className={classes.memberTitle}>{member.id}</div>
                <div className={classes.memberDesc}>{member.desc || this.state.objectNames[member.id] || ''}</div>
                <div className={classes.memberButtons}>
                    <IconButton
                        size="small"
                        style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                        onClick={() => {
                            const suppressDeleteConfirm = window.localStorage.getItem('scenes.suppressDeleteConfirm');
                            if (suppressDeleteConfirm) {
                                if (Date.now() - parseInt(suppressDeleteConfirm, 10) < 300000) {
                                    this.deleteSceneMember(member.id);
                                } else {
                                    window.localStorage.removeItem('scenes.suppressDeleteConfirm');
                                    this.setState({ deleteDialog: member.id });
                                }
                            } else {
                                this.setState({ deleteDialog: member.id, suppressDeleteConfirm: false });
                            }
                        }}
                    >
                        <IconDelete/>
                    </IconButton>
                    <Switch
                        checked={!member.disabled}
                        onChange={e => {
                            const members = JSON.parse(JSON.stringify(this.state.members));
                            members[index].disabled = !e.target.checked;
                            this.setStateWithParent({ members });
                        }}
                        name={member.id}
                    />
                    {value}
                </div>
            </div>
            <div>{member.desc} {!member.disabled && (this.props.intervalBetweenCommands || member.delay) ?
                <span> <IconClock /> {`${delay + I18n.t('ms')} ${I18n.t('from scene start')}`}</span> : null}
            </div>
            {opened ? <div>
                {/*<Box className={classes.p}>
                    <TextField
                        fullWidth
                        InputLabelProps={{shrink: true}} label={I18n.t('Description')}
                        value={member.desc || ''}
                        onChange={e => {
                            const members = JSON.parse(JSON.stringify(this.state.members));
                            members[index].desc = e.target.value;
                            this.setStateWithParent({members});
                        }}
                    />
                </Box>*/}
                {!this.state.virtualGroup ? this.renderSetValue(classes, index, member, onFalseEnabled, true) : null}
                {!this.state.virtualGroup && this.state.onFalseEnabled ? this.renderSetValue(classes, index, member, true, false) : null}
                {!this.state.easy ?
                    <Box className={classes.p}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    label={I18n.t('Delay (ms)')}
                                    title={I18n.t(
                                        'Additionally to the interval between commands. E.g. if the interval %s, this state will be set after %s ms from scene start',
                                        this.props.intervalBetweenCommands,
                                        this.props.intervalBetweenCommands * index + (member.delay || 0)
                                    )}
                                    helperText={stacked ? I18n.t('from previous state') : I18n.t('from start of scene')}
                                    value={member.delay || 0}
                                    min={0}
                                    type="number"
                                    onChange={e => {
                                        const members = JSON.parse(JSON.stringify(this.state.members));
                                        members[index].delay = parseInt(e.target.value, 10);
                                        this.setStateWithParent({ members });
                                    }}/>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                {!stacked ? <FormControlLabel
                                    label={I18n.t('Stack next delays')}
                                    control={
                                        <Checkbox
                                            checked={!!member.stackNextDelays}
                                            onChange={e => {
                                                const members = JSON.parse(JSON.stringify(this.state.members));
                                                members[index].stackNextDelays = e.target.checked;
                                                this.setStateWithParent({ members });
                                            }}
                                        />
                                    }/> : null}
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    label={I18n.t('Stop already started commands')}
                                    control={
                                        <Checkbox
                                            checked={member.stopAllDelays}
                                            onChange={e => {
                                                const members = JSON.parse(JSON.stringify(this.state.members));
                                                members[index].stopAllDelays = e.target.checked;
                                                this.setStateWithParent({ members });
                                            }}
                                        />
                                    }/>
                            </Grid>
                        </Grid>
                    </Box> : null
                }
                {!this.state.easy ? <Box className={classes.p}>
                    <FormControlLabel
                        label={I18n.t('Do not overwrite state if it has the required value')}
                        title={I18n.t('For example, if the value is already at "%s" and "%s" is the setpoint, then write the value anyway if this checkbox is activated.',
                            member.setIfTrue === undefined || member.setIfTrue === null ? 'null' : member.setIfTrue.toString(),
                            member.setIfTrue === undefined || member.setIfTrue === null ? 'null' : member.setIfTrue.toString())}
                        control={<Checkbox
                            checked={!!member.doNotOverwrite}
                            onChange={e => {
                                const members = JSON.parse(JSON.stringify(this.state.members));
                                members[index].doNotOverwrite = e.target.checked;
                                this.setStateWithParent({ members });
                            }}
                        />}
                    />
                </Box> : null}
            </div> :
            (!this.state.virtualGroup ? <div className={classes.smallOnTrueFalse}>
                {setIfTrueVisible ? `${onFalseEnabled ? I18n.t('Set if TRUE') : I18n.t('Setpoint')}: ` : ''}
                {setIfTrueVisible ? <span className={classes.stateValueTrue}>{setIfTrue}</span> : null}
                {setIfFalseVisible && onFalseEnabled ? `${setIfTrueVisible ? ' / ' : ''}${I18n.t('Set if FALSE')}: ` : null}
                {setIfFalseVisible && onFalseEnabled ? <span className={classes.stateValueFalse}>{setIfFalse}</span> : null}
            </div> : <div style={{ height: 8 }} />)}
        </Paper>
    };

    onWriteScene(val) {
        if (val === 'true') {
            val = true;
        } else if (val === 'false') {
            val = false;
        } else if (typeof val === 'string' && parseFloat(val.replace(',', '.')).toString() === val) {
            val = parseFloat(val.replace(',', '.'));
        }

        this.props.socket.setState(this.props.sceneId, val)
            .catch(e => this.props.showError(e));
    }

    getItemStyle = (isDragging, draggableStyle) => ({
        // some basic styles to make the items look a bit nicer
        userSelect: 'none',
        background: isDragging ? 'lightgreen' : 'inherit',

        // styles we need to apply on draggable
        ...draggableStyle
    });

    getListStyle = isDraggingOver => ({ background: isDraggingOver ? 'lightblue' : 'inherit' });

    render = () => {
        let sceneState = this.state.states[this.props.sceneId];
        if (this.state.selectedSceneChanged) {
            sceneState = I18n.t('Save scene before test');
        } else if (sceneState === undefined || sceneState === null) {
            sceneState = '';
        }

        if (this.engineId !== this.state.engineId) {
            this.engineId && this.props.socket.unsubscribeState(`${this.engineId}.alive`, this.memberStateChange);
            this.state.engineId && this.props.socket.subscribeState(`${this.state.engineId}.alive`, this.memberStateChange);
            this.engineId = this.state.engineId;
        }

        const onFalseEnabled =!this.state.virtualGroup && this.state.onFalseEnabled;

        let result = <div key="SceneMembersForm" className={Utils.clsx(!this.props.oneColumn && this.props.classes.height, this.props.classes.columnContainer)}>
            <Toolbar classes={{ gutters: this.props.classes.guttersZero }}>
                <Typography variant="h6" className={Utils.clsx(this.props.classes.sceneTitle)} >
                    {I18n.t('Scene states')}{!this.state.states[`${this.state.engineId}.alive`] ? <span className={this.props.classes.instanceNotActive}>{I18n.t('Instance not active')}</span> : ''}
                    <br />
                    <span
                        className={Utils.clsx(
                            this.props.classes.sceneSubTitle,
                            !this.state.virtualGroup && sceneState === true && this.props.classes.sceneTrue,
                            !this.state.virtualGroup && sceneState === false && this.props.classes.sceneFalse,
                            !this.state.virtualGroup && sceneState === 'uncertain' && this.props.classes.sceneUncertain,
                        )}
                    >
                        {I18n.t('Scene state:')} {sceneState === true ? 'TRUE' : (sceneState === false ? 'FALSE' : sceneState.toString())}
                    </span>
                </Typography>
                <IconButton title={I18n.t('Add new state')} onClick={() => this.setState({ showDialog: true })}>
                    <IconAdd />
                </IconButton>
            </Toolbar>
            <div className={Utils.clsx(this.props.classes.testButtons, this.props.classes.width100)}>
                {!this.state.selectedSceneChanged && this.state.virtualGroup ? <TextField
                    variant="standard"
                    className={this.props.classes.width100WithButton}
                    label={I18n.t('Write to virtual group')}
                    defaultValue={sceneState}
                    onKeyUp={e => e.keyCode === 13 && this.onWriteScene(this.state.writeSceneState)}
                    onChange={e => this.setState({writeSceneState: e.target.value})}
                /> : null}
                {!this.state.selectedSceneChanged && this.state.virtualGroup && this.state.members.length ? <IconButton
                    onClick={e => this.onWriteScene(this.state.writeSceneState) }
                >
                    <IconPlay />
                </IconButton> : null}
                {this.state.sceneEnabled && !this.state.selectedSceneChanged && !this.state.virtualGroup ? <Button
                    color="grey"
                    className={this.props.classes.btnTestTrue}
                    onClick={() => this.onWriteScene(true)}
                    startIcon={<IconPlay />}
                >
                    {!onFalseEnabled ? I18n.t('Test') : I18n.t('Test TRUE')}
                </Button> : null}
                {this.state.sceneEnabled && !this.state.selectedSceneChanged && onFalseEnabled && this.state.members.length ? <Button
                    color="grey"
                    className={this.props.classes.btnTestFalse}
                    startIcon={<IconPlay />}
                    onClick={() => this.onWriteScene(false)}
                >
                    {I18n.t('Test FALSE')}
                </Button> : null}
                {this.state.members.length > 1 && this.state.openedMembers.length ? <IconButton
                    title={I18n.t('Collapse all')}
                    className={ this.props.classes.btnCollapseAll }
                    onClick={() => {
                        window.localStorage.setItem('Scenes.openedMembers', '[]');
                        this.setState({ openedMembers: [] });
                    }}
                >
                    <IconCollapseAll />
                </IconButton> : null}
                {this.state.members.length > 1 && this.state.openedMembers.length !== this.state.members.length ? <IconButton
                    title={I18n.t('Expand all')}
                    className={this.props.classes.btnExpandAll}
                    onClick={() => {
                        const openedMembers = this.state.members.map(member => member.id);
                        window.localStorage.setItem('Scenes.openedMembers', JSON.stringify(openedMembers));
                        this.setState({ openedMembers });
                    }}
                >
                    <IconExpandAll />
                </IconButton> : null}
            </div>
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => <div className={this.props.classes.scroll}
                         {...provided.droppableProps}
                         ref={provided.innerRef}
                         style={this.getListStyle(snapshot.isDraggingOver)}
                    >
                        {this.state.members.map((member, i) =>
                            <Draggable key={`${member.id}_${i}`} draggableId={`${member.id}_${i}`} index={i}>
                                {(provided, snapshot) =>
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={this.getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                        )}
                                    >
                                        {this.renderMember(member, i)}
                                    </div>}
                            </Draggable>
                        )}
                        {provided.placeholder}
                    </div>}
                </Droppable>
            </DragDropContext>
        </div>;

        return [
            result,
            this.renderDeleteDialog(),
            this.renderSelectIdDialog(),
            this.renderSelectStateIdDialog(),
        ];
    }
}

SceneMembersForm.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    scene: PropTypes.object,
    updateSceneMembers: PropTypes.func,
    sceneId: PropTypes.string,
    onFalseEnabled: PropTypes.bool,
    virtualGroup: PropTypes.bool,
    aggregation: PropTypes.string,
    members: PropTypes.array,
    easy: PropTypes.bool,
    sceneEnabled: PropTypes.bool,
    selectedSceneChanged: PropTypes.bool,
    intervalBetweenCommands: PropTypes.number,
    engineId: PropTypes.string,
    oneColumn: PropTypes.bool,
    showError: PropTypes.func,
};

export default withStyles(styles)(SceneMembersForm);

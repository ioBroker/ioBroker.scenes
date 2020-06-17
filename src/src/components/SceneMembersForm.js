import React from 'react'
import clsx from 'clsx'
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

// own components
import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import Utils from '@iobroker/adapter-react/Components/Utils';

// icons
import {AiOutlineClockCircle as IconClock} from 'react-icons/ai';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {IoMdClose as IconClose} from 'react-icons/io';
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdPlayArrow as IconPlay} from 'react-icons/md';

const TRUE_COLOR      = '#90ee90';
const FALSE_COLOR     = '#ff9999';
const TRUE_DARK_COLOR      = '#528952';
const FALSE_DARK_COLOR     = '#774747';
const UNCERTAIN_COLOR = '#bfb7be';

const styles = theme => ({
    memberTrueFalse: {
        borderRadius: 10,
        padding: '2px ' + theme.spacing(1) + 'px',
        fontSize: 'initial',
        fontWeight: 'initial',
        margin: '0 ' + theme.spacing(1) + 'px',
        textAlign: 'right',
        //float: 'right'
    },
    memberTrue: {
        backgroundColor: theme.palette.type === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
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
        margin: theme.spacing(1) + 'px 0',
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
            margin: '0 ' + theme.spacing(1) + 'px',
        },
    },
    p: {
        margin: theme.spacing(1) + 'px 0',
    },
    guttersZero: {
        padding: 0,
    },
    sceneTitle: {
        flexGrow: 1,
        color: theme.palette.type === 'dark' ? '#FFF': '#000',
    },
    sceneSubTitle: {
        fontSize: 'small',
        borderRadius: 10,
        padding: '2px ' + theme.spacing(1) + 'px',
    },
    sceneTrue: {
        background: theme.palette.type === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
    },
    sceneFalse: {
        background: theme.palette.type === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
    },
    sceneUncertain: {
        background: UNCERTAIN_COLOR,
    },
    btnTestTrue: {
        background: theme.palette.type === 'dark' ? TRUE_DARK_COLOR : TRUE_COLOR,
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
    },
    btnTestFalse: {
        background: theme.palette.type === 'dark' ? FALSE_DARK_COLOR : FALSE_COLOR,
        marginBottom: theme.spacing(0.5),
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
    },
    memberTitle: {
        fontSize: 14,
        fontWeight: 'bold',
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
        width: 'calc(50% - ' + theme.spacing(1) + 'px)',
        minWidth: 100,
        marginRight: theme.spacing(1),
    },
    disabled: {
        opacity: 0.3
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
            writeSceneState: '',
            deleteDialog: null,
            onFalseEnabled: props.onFalseEnabled,
            virtualGroup: props.virtualGroup,
            selectedSceneChanged: props.selectedSceneChanged,
        };

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    componentDidMount() {
        this.readObjects()
            .then(newState =>
                this.setState(newState, () => {
                    // subscribe on scene state
                    this.props.socket.subscribeState(this.props.sceneId, this.memberStateChange);
                    // subscribe on all states
                    this.state.members.forEach(member =>
                        this.props.socket.subscribeState(member.id, this.memberStateChange))
                }));
    }

    componentWillUnmount() {
        this.props.socket.unsubscribeState(this.props.sceneId, this.memberStateChange);

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
        if (props.selectedSceneChanged !== state.selectedSceneChanged) {
            newState.selectedSceneChanged = props.selectedSceneChanged;
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
                            objectNames[obj._id] = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}, true);
                        }
                    });

                    return {objectTypes, objectNames};
                });
        } else {
            return Promise.resolve({});
        }
    }

    memberStateChange = (id, result) => {
        const states = JSON.parse(JSON.stringify(this.state.states));
        states[id] = result ? result.val : null;
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

        this.setState({states, objectTypes});
    };
    
    createSceneMembers = ids => {
        this.setState({showDialog: false}, () => {
            // filter out yet existing IDs
            ids = ids.filter(id => !this.state.members.find(item => item.id === id));
            if (ids.length) {
                const openedMembers = [...this.state.openedMembers];
                const objectTypes = JSON.parse(JSON.stringify(this.state.objectTypes));
                const objectNames = JSON.parse(JSON.stringify(this.state.objectNames));
                const members     = JSON.parse(JSON.stringify(this.state.members));

                Promise.all(ids.map(id =>
                    // Read type of state
                    this.props.socket.getObject(id)
                        .then(obj => {
                            const template = {
                                id,
                                setIfTrue: null,
                                setIfFalse: null,
                                stopAllDelays: true,
                                desc: null,
                                disabled: false,
                                delay: 0
                            };

                            objectNames[obj._id] = Utils.getObjectNameFromObj(obj, null, {language: I18n.getLanguage()}, true);

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
                );
            } else {
                // Show alert
            }
        });
    };

    deleteSceneMember = index => {
        let members = JSON.parse(JSON.stringify(this.state.members));
        const id = members[index].id;
        members.splice(index, 1);
        
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
                <div className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={ () => this.setState({deleteDialog: null}) }>
                        {I18n.t('Cancel')}
                    </Button>
                    <Button variant="contained" color="secondary" onClick={ e => this.deleteSceneMember(this.state.deleteDialog) }>
                        { I18n.t('Delete') }
                    </Button>
                </div>
            </Dialog>;
    };

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
                    className={ clsx(classes.memberTrueFalse, classes.memberTrue) }>{ _valStr }</div>;
            } else if (this.state.states[member.id] === member.setIfTrue) {
                value = <div
                    title={ I18n.t('Actual state value') }
                    className={ clsx(classes.memberTrueFalse, classes.memberTrue) }>{ _valStr }</div>;
            } else if (member.setIfFalse !== undefined && member.setIfFalseTolerance && Math.abs(this.state.states[member.id] - member.setIfFalse) <= member.setIfFalseTolerance) {
                value = <div
                    title={ I18n.t('Actual state value') }
                    className={ clsx(classes.memberTrueFalse, classes.memberFalse) }>{ _valStr }</div>;
            } else if (member.setIfFalse !== undefined && this.state.states[member.id] === member.setIfFalse) {
                value = <div
                    title={ I18n.t('Actual state value') }
                    className={ clsx(classes.memberTrueFalse, classes.memberFalse) }>{ _valStr }</div>;
            } else {
                value = <div
                    title={ I18n.t('Actual state value') }
                    className={ clsx(classes.memberTrueFalse, classes.memberUncertain) }>{ _valStr }</div>;
            }
        }

        let setIfTrue = member.setIfTrue;
        if (setIfTrue === undefined || setIfTrue === null) {
            setIfTrue = '';
        } else {
            if (setIfTrue === true) {
                setIfTrue = 'TRUE';
            } else if (setIfTrue === false) {
                setIfTrue = 'FALSE';
            } else {
                if (member.setIfTrueTolerance) {
                    setIfTrue = setIfTrue + '±' + member.setIfTrueTolerance;
                } else {
                    setIfTrue = setIfTrue.toString();
                }
            }
        }

        let setIfFalse = member.setIfFalse;
        if (setIfFalse === undefined || setIfFalse === null) {
            setIfFalse = '';
        } else {
            if (setIfFalse === true) {
                setIfFalse = 'TRUE';
            } else if (setIfFalse === false) {
                setIfFalse = 'FALSE';
            } else {
                if (member.setIfFalseTolerance) {
                    setIfFalse = setIfFalse + '±' + member.setIfFalseTolerance;
                } else {
                    setIfFalse = setIfFalse.toString();
                }
            }
        }

        const opened = this.state.openedMembers.includes(member.id);

        return <Paper key={ member.id } className={ clsx(classes.memberCard, member.disabled && classes.disabled) }>
            <div className={ classes.memberToolbar }>
                <div className={ classes.memberTitle }>{ member.id }</div>
                <div className={ classes.memberDesc }>{ member.desc || this.state.objectNames[member.id] || '' }</div>
                <div className={ classes.memberButtons }>
                    <IconButton title={ I18n.t('Edit') } onClick={ () => {
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
                    }}>
                        { opened ? <IconClose/> : <IconEdit/> }
                    </IconButton>
                    <IconButton
                        size="small"
                        style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                        onClick={ () => this.setState({deleteDialog: index}) }>
                        <IconDelete/>
                    </IconButton>
                    <Switch
                        checked={ !member.disabled }
                        onChange={ e => {
                            const members = JSON.parse(JSON.stringify(this.state.members));
                            members[index].disabled = !e.target.checked;
                            this.setStateWithParent({members});
                        }}
                        name={ member.id }
                    />
                    { value }
                </div>
            </div>
            <div>{ member.desc } { !opened && member.delay ?
                <span> <IconClock/> {member.delay + I18n.t('ms')}</span> : null }</div>
            {
                opened ?
                    <div>
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
                        </Box>*/ }
                        <Box className={ classes.p }>
                            { this.state.objectTypes[member.id] === 'boolean' ?
                                <FormControlLabel
                                    control={<Checkbox
                                        checked={ member.setIfTrue }
                                        onChange={ e => {
                                            const members = JSON.parse(JSON.stringify(this.state.members));
                                            members[index].setIfTrue = e.target.checked;
                                            this.setStateWithParent({members});
                                        } }/>
                                    }
                                    label={ I18n.t('Set if TRUE') }
                                />
                                :
                                <Box className={ classes.p }>
                                    <TextField
                                        InputLabelProps={ {shrink: true} }
                                        label={ I18n.t('Set if TRUE') }
                                        value={ member.setIfTrue || '' }
                                        className={ classes.setValue }
                                        onChange={ e => {
                                            const members = JSON.parse(JSON.stringify(this.state.members));
                                            if (this.state.objectTypes[member.id] === 'number') {
                                                members[index].setIfTrue = parseFloat(e.target.value);
                                            } else {
                                                members[index].setIfTrue = e.target.value;
                                            }

                                            this.setStateWithParent({members});
                                         } }/>
                                    <TextField
                                        InputLabelProps={ {shrink: true} }
                                        label={ '± ' + I18n.t('Tolerance for TRUE') }
                                        value={ member.setIfTrueTolerance || '' }
                                        className={ classes.setValue }
                                        onChange={ e => {
                                            const members = JSON.parse(JSON.stringify(this.state.members));
                                            members[index].setIfTrueTolerance = e.target.value === '' ? '' : parseFloat(e.target.value);
                                            this.setStateWithParent({members});
                                        } }/>
                                </Box>
                            }
                        </Box>
                        { this.state.onFalseEnabled ?
                            <Box className={classes.p}>
                                {
                                    this.state.objectTypes[member.id] === 'boolean' ?
                                        <FormControlLabel
                                            control={<Checkbox checked={ member.setIfFalse } onChange={ e => {
                                                const members = JSON.parse(JSON.stringify(this.state.members));
                                                members[index].setIfFalse = e.target.checked;
                                                this.setStateWithParent({members});
                                            } }/>}
                                            label={ I18n.t('Set if FALSE') }
                                        />
                                        :
                                        <Box className={ classes.p }>
                                            <TextField
                                                fullWidth
                                                InputLabelProps={ {shrink: true} }
                                                label={ I18n.t('Set if FALSE') }
                                                value={ member.setIfFalse || ''}
                                                className={ classes.setValue }
                                                onChange={ e => {
                                                    const members = JSON.parse(JSON.stringify(this.state.members));
                                                    if (this.state.objectTypes[member.id] === 'number') {
                                                        members[index].setIfFalse = parseFloat(e.target.value);
                                                    } else {
                                                        members[index].setIfFalse = e.target.value;
                                                    }
                                                    this.setStateWithParent({members});
                                                } }
                                            />
                                            <TextField
                                                InputLabelProps={ {shrink: true} }
                                                label={ '± ' + I18n.t('Tolerance for FALSE') }
                                                value={ member.setIfFalseTolerance || '' }
                                                className={ classes.setValue }
                                                onChange={ e => {
                                                    const members = JSON.parse(JSON.stringify(this.state.members));
                                                    members[index].setIfFalseTolerance = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                    this.setStateWithParent({members});
                                                } }
                                            />
                                        </Box>
                                }
                            </Box>
                            : null}
                        <Box className={classes.p}>
                            <Grid container spacing={4}>
                                <Grid item xs={4}>
                                    <TextField
                                        fullWidth
                                        InputLabelProps={{shrink: true}}
                                        label={I18n.t('Delay (ms)')}
                                        value={ member.delay || 0}
                                        min={ 0 }
                                        type="number"
                                        onChange={e => {
                                            const members = JSON.parse(JSON.stringify(this.state.members));
                                            members[index].delay = parseInt(e.target.value, 10);
                                            this.setStateWithParent({members});
                                        }}/>
                                </Grid>
                                <Grid item xs={8}>
                                    <FormControlLabel
                                        label={ I18n.t('Stop already started commands') }
                                        control={
                                            <Checkbox
                                                checked={ member.stopAllDelays }
                                                onChange={ e => {
                                                    const members = JSON.parse(JSON.stringify(this.state.members));
                                                    members[index].stopAllDelays = e.target.checked;
                                                    this.setStateWithParent({members});
                                                } }
                                            />
                                    }/>
                                </Grid>
                            </Grid>
                        </Box>
                    </div> :
                    <div className={ classes.smallOnTrueFalse}>
                        { I18n.t('Set if TRUE') + ': ' } <span className={ classes.stateValueTrue }>{ setIfTrue }</span>
                        { this.state.onFalseEnabled ? ' / ' + I18n.t('Set if FALSE') + ': ' : null}
                        { this.state.onFalseEnabled ? <span className={ classes.stateValueFalse }>{ setIfFalse }</span> : null}
                    </div>
            }
        </Paper>
    };

    onWriteScene(val) {
        this.props.socket.setState(this.props.sceneId, val);
    }

    getItemStyle = (isDragging, draggableStyle) => ({
        // some basic styles to make the items look a bit nicer
        userSelect: 'none',
        background: isDragging ? 'lightgreen' : 'inherit',

        // styles we need to apply on draggables
        ...draggableStyle
    });

    getListStyle = isDraggingOver => ({
        background: isDraggingOver ? 'lightblue' : 'inherit',
    });

    render = () => {
        let sceneState = this.state.states[this.props.sceneId];
        if (this.state.selectedSceneChanged) {
            sceneState = I18n.t('Save scene before test')
        } else if (sceneState === undefined || sceneState === null) {
            sceneState = '';
        }

        let result = <div key="SceneMembersForm" className={ clsx(this.props.classes.height, this.props.classes.columnContainer) }>
            <Toolbar classes={{ gutters: this.props.classes.guttersZero}}>
                <Typography variant="h6" className={ clsx(this.props.classes.sceneTitle) } >
                    {I18n.t('Scene states')}
                    <br/>
                    <span className={ clsx(
                        this.props.classes.sceneSubTitle,
                        !this.state.virtualGroup && sceneState === true && this.props.classes.sceneTrue,
                        !this.state.virtualGroup && sceneState === false && this.props.classes.sceneFalse,
                        !this.state.virtualGroup && sceneState === 'uncertain' && this.props.classes.sceneUncertain,
                    ) }>{ I18n.t('Scene state:') } { sceneState.toString() }</span>
                </Typography>
                <IconButton title={I18n.t('Add new state')} onClick={() => this.setState({showDialog: true})}>
                    <IconAdd/>
                </IconButton>
            </Toolbar>
            <div className={ clsx(this.props.classes.testButtons, this.props.classes.width100) }>
                {  !this.state.selectedSceneChanged && this.state.virtualGroup ? <TextField
                    className={ this.props.classes.width100WithButton }
                    label={ I18n.t('Write to virtual group') }
                    defaultValue={ sceneState }
                    onKeyUp={e => e.keyCode === 13 && this.onWriteScene(this.state.writeSceneState)}
                    onChange={e => this.setState({writeSceneState: e.target.value}) }
                /> : null}
                { !this.state.selectedSceneChanged && this.state.virtualGroup ? <IconButton
                    onClick={e => this.onWriteScene(this.state.writeSceneState) }
                ><IconPlay/></IconButton> : null}
                { !this.state.selectedSceneChanged && !this.state.virtualGroup ? <Button
                    className={ this.props.classes.btnTestTrue }
                    onClick={ () => this.onWriteScene(true) }
                ><IconPlay/>{ I18n.t('Test TRUE') }</Button> : null }
                { !this.state.selectedSceneChanged && !this.state.virtualGroup && this.state.onFalseEnabled ? <Button
                    className={ this.props.classes.btnTestFalse }
                    onClick={ () => this.onWriteScene(false) }
                ><IconPlay/>{ I18n.t('Test FALSE') }</Button> : null }
            </div>
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div className={ this.props.classes.scroll }
                             {...provided.droppableProps}
                             ref={ provided.innerRef }
                             style={ this.getListStyle(snapshot.isDraggingOver) }
                        >
                            { this.state.members.map((member, i) =>
                                <Draggable key={ member.id } draggableId={ member.id } index={ i }>
                                    {(provided, snapshot) =>
                                        <div
                                            ref={ provided.innerRef }
                                            {...provided.draggableProps }
                                            {...provided.dragHandleProps }
                                            style={ this.getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            ) }
                                        >{ this.renderMember(member, i) }</div>}
                                </Draggable>
                            )}
                            { provided.placeholder }
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>;

        return [
            result,
            this.renderDeleteDialog(),
            this.renderSelectIdDialog()
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
    selectedSceneChanged: PropTypes.bool,
};

export default withStyles(styles)(SceneMembersForm);
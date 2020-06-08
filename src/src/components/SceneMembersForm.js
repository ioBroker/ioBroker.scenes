import React from 'react'
import clsx from 'clsx'
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

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

// icons
import {AiOutlineClockCircle as IconClock} from 'react-icons/ai';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {IoMdClose as IconClose} from 'react-icons/io';
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdPlayArrow as IconPlay} from 'react-icons/md';

const TRUE_COLOR = '#90ee90';
const FALSE_COLOR = '#ff9999';
const UNCERTAIN_COLOR = '#bfb7be';

const styles = theme => ({
    memberTrueFalse: {
        borderRadius: 10,
        padding: '2px ' + theme.spacing(1) + 'px',
        fontSize: 'initial',
        fontWeight: 'initial',
        margin: '0 ' + theme.spacing(1) + 'px',
        float: 'right'
    },
    memberTrue: {
        backgroundColor: TRUE_COLOR,
    },
    memberFalse: {
        backgroundColor: 'pink',
    },
    memberUncertain: {
        backgroundColor: 'grey',
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
    },
    sceneSubTitle: {
        fontSize: 'small',
        borderRadius: 10,
        padding: '2px ' + theme.spacing(1) + 'px',
    },
    sceneTrue: {
        background: TRUE_COLOR,
    },
    sceneFalse: {
        background: FALSE_COLOR,
    },
    sceneUncertain: {
        background: UNCERTAIN_COLOR,
    },
    btnTestTrue: {
        background: TRUE_COLOR,
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
    },
    btnTestFalse: {
        background: FALSE_COLOR,
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
    }
});

// Todo: do not allow to add ID if yet exists

class SceneMembersForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            states: {},
            memberOpened:  {},
            objectTypes: {},
            sceneObj: JSON.parse(JSON.stringify(this.props.scene)),
            deleteDialog: null,
            writeSceneState: '',
        };
    }

    componentDidMount() {
        this.readObjects()
            .then(objectTypes =>
                this.setState({objectTypes}, () => {
                    // subscribe on scene state
                    this.props.socket.subscribeState(this.state.sceneObj._id, this.memberStateChange);
                    // subscribe on all states
                    this.state.sceneObj.native.members.forEach(member =>
                        this.props.socket.subscribeState(member.id, this.memberStateChange))
                }));
    }

    readObjects() {
        if (this.state.sceneObj.native && this.state.sceneObj.native.members) {
            return Promise.all(
                this.state.sceneObj.native.members.map(member =>
                    this.props.socket.getObject(member.id)))
                .then(results => {
                    const objectTypes = {};
                    results.forEach(obj => {
                        if (obj && obj.common && obj.common.type) {
                            objectTypes[obj._id] = obj.common.type;
                        }
                    });

                    return objectTypes;
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

    componentWillUnmount() {
        this.props.socket.unsubscribeState(this.state.sceneObj._id, this.memberStateChange);

        this.state.sceneObj.native.members.forEach(member =>
            this.props.socket.unsubscribeState(member.id, this.memberStateChange));
    }

    createSceneMember = id => {
        this.setState({showDialog: false}, () => {
            if (this.state.sceneObj.native.members.find(item => item.id === id)) {
                // Show alert
                return;
            }

            // Read type of state
            this.props.socket.getObject(id)
                .then(obj => {
                    const template = {
                        id,
                        setIfTrue: null,
                        setIfFalse: null,
                        stopAllDelays: false,
                        desc: null,
                        disabled: false,
                        delay: null
                    };

                    const objectTypes = JSON.parse(JSON.stringify(this.state.objectTypes));

                    if (obj && obj.common && obj.common.type) {
                        objectTypes[id] = obj.common.type;

                        if (objectTypes[id] === 'boolean') {
                            template.setIfTrue = true;
                            if (this.state.sceneObj.native && this.state.sceneObj.native.onFalse && this.state.sceneObj.native.onFalse.enabled) {
                                template.setIfFalse = false;
                            }
                        }
                    }

                    let scene = JSON.parse(JSON.stringify(this.state.sceneObj));
                    scene.native.members.push(template);

                    // open added state
                    const memberOpened = JSON.parse(JSON.stringify(this.state.memberOpened));
                    memberOpened[scene.native.members.length - 1] = true;

                    this.setState({objectTypes}, () => {
                        // subscribe on new state
                        this.props.socket.subscribeState(id, this.memberStateChange);
                        this.props.updateScene(scene._id, scene);
                    });
                });
        });
    };

    deleteSceneMember = index => {
        let scene = JSON.parse(JSON.stringify(this.state.sceneObj));
        const id = scene.native.members[index].id;
        scene.native.members.splice(index, 1);
        this.props.updateScene(scene._id, scene);
        this.props.socket.unsubscribeState(id, this.memberStateChange);
    };

    setStateWithParent = (newState) => {
        this.setState(newState, () =>
            this.props.setSelectedSceneChanged(this.state.sceneObj._id, this.state.sceneObj));
    };

    dialogs = () => {
        return [
        this.state.showDialog ? <DialogSelectID
            key="selectDialogMembers"
            connection={ this.props.socket }
            dialogName="memberEdit"
            title={ I18n.t('Select for ') }
            //statesOnly={true}
            selected={null}
            onOk={id => this.createSceneMember(id)}
            onClose={() => this.setState({showDialog: false})}
        /> : null,
        <Dialog
        open={ this.state.deleteDialog !== null }
        key="deleteDialog"
        onClose={ () =>
            this.setState({deleteDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this state?') }</DialogTitle>
            <div className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={() => {
                        this.setState({deleteDialog: null});
                    }}>
                        {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={e => {
                    this.deleteSceneMember(this.state.deleteDialog)
                    this.setState({deleteDialog: null});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </div>
        </Dialog>
        ]
    };

    renderMember = (member, index, scene) => {
        let component = this;

        let memberOriginal = this.props.scene.native.members[index];

        let value = null;
        if (this.state.states[member.id] !== undefined && this.state.states[member.id] !== null) {
            let _valStr = this.state.states[member.id].toString();

            if (_valStr === 'true') {
                _valStr = 'TRUE';
            } else if (_valStr === 'false') {
                _valStr = 'FALSE';
            }

            if (this.state.states[member.id] === member.setIfTrue) {
                value = <span
                    title={ I18n.t('Actual state value') }
                    className={ clsx(this.props.classes.memberTrueFalse, this.props.classes.memberTrue) }>{ _valStr }</span>;
            } else if (member.setIfFalse !== undefined && this.state.states[member.id] === member.setIfFalse) {
                value = <span
                    title={ I18n.t('Actual state value') }
                    className={ clsx(this.props.classes.memberTrueFalse, this.props.classes.memberFalse) }>{ _valStr }</span>;
            } else {
                value = <span
                    title={ I18n.t('Actual state value') }
                    className={ clsx(this.props.classes.memberTrueFalse, this.props.classes.memberUncertain) }>{ _valStr }</span>;
            }
        }

        return <Paper key={ member.id } className={ this.props.classes.memberCard }>
            <h3>
                { member.id }

                <span className={this.props.classes.right}>
                    <IconButton title={ I18n.t('Edit') } onClick={ () => {
                        const memberOpened = JSON.parse(JSON.stringify(this.state.memberOpened));
                        memberOpened[index] = !memberOpened[index];
                        component.setState({memberOpened});
                    }}>
                        { this.state.memberOpened[index] ? <IconClose/> : <IconEdit/> }
                    </IconButton>
                    <IconButton size="small" style={{ marginLeft: 5 }} aria-label="Delete" title={I18n.t('Delete')}
                                onClick={ () => this.setState({deleteDialog: index}) }>
                        <IconDelete/>
                    </IconButton>
                    <Switch
                        checked={ !member.disabled }
                        onChange={ e => {
                            member.disabled = !e.target.checked;
                            component.props.updateScene(scene._id, scene);
                        }}
                        name={ member.id }
                    />
                </span>
                { value }
            </h3>
            <div>{ memberOriginal.desc } { !this.state.memberOpened[index] && memberOriginal.delay ?
                <span> <IconClock/> {memberOriginal.delay + I18n.t('ms')}</span> : null }</div>
            {
                this.state.memberOpened[index] ?
                    <div>
                        <Box className={this.props.classes.p}>
                            <TextField
                                fullWidth
                                InputLabelProps={{shrink: true}} label={I18n.t('Description')}
                                value={member.desc || ''}
                                onChange={e => {
                                    const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                    sceneObj.native.members[index].desc = e.target.value;
                                    component.setStateWithParent({sceneObj});
                                }}
                            />
                        </Box>
                        <Box className={this.props.classes.p}>
                            {this.state.objectTypes[member.id] === 'boolean' ?
                                <FormControlLabel
                                    control={<Checkbox checked={member.setIfTrue} onChange={e => {
                                        const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                        sceneObj.native.members[index].setIfTrue = e.target.checked;
                                        component.setStateWithParent({sceneObj});
                                    }}/>}
                                    label={I18n.t('Set if TRUE')}
                                />
                                :
                                <TextField InputLabelProps={{shrink: true}} label={I18n.t('Set if TRUE')}
                                           value={member.setIfTrue}
                                           fullWidth
                                           onChange={e => {
                                               const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                               if (this.state.objectTypes[member.id] === 'number') {
                                                   sceneObj.native.members[index].setIfTrue = parseFloat(e.target.value);
                                               } else {
                                                   sceneObj.native.members[index].setIfTrue = e.target.value;
                                               }

                                               component.setStateWithParent({sceneObj});
                                           }}/>
                            }
                        </Box>
                        {scene.native.onFalse.enabled ?
                            <Box className={this.props.classes.p}>
                                {
                                    this.state.objectTypes[member.id] === 'boolean' ?
                                        <FormControlLabel
                                            control={<Checkbox checked={member.setIfFalse} onChange={e => {
                                                const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                sceneObj.native.members[index].setIfFalse = e.target.checked;
                                                component.setStateWithParent({sceneObj});
                                            }}/>}
                                            label={I18n.t('Set if FALSE')}
                                        />
                                        :
                                        <TextField
                                            fullWidth
                                            InputLabelProps={{shrink: true}} label={I18n.t('Set if FALSE')}
                                            value={member.setIfFalse}
                                            onChange={e => {
                                                const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                if (this.state.objectTypes[member.id] === 'number') {
                                                    sceneObj.native.members[index].setIfFalse = parseFloat(e.target.value);
                                                } else {
                                                    sceneObj.native.members[index].setIfFalse = e.target.value;
                                                }
                                                component.setStateWithParent({sceneObj});
                                            }}
                                        />
                                }
                            </Box>
                            : null}
                        <Box className={this.props.classes.p}>
                            <Grid container spacing={4}>
                                <Grid item xs={4}>
                                    <TextField
                                        fullWidth
                                        InputLabelProps={{shrink: true}}
                                        label={I18n.t('Delay (ms)')}
                                        value={member.delay}
                                        type="number"
                                        onChange={e => {
                                            const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                            sceneObj.native.members[index].delay = parseInt(e.target.value, 10);
                                            component.setStateWithParent({sceneObj});
                                        }}/>
                                </Grid>
                                {member.delay ? <Grid item xs={8}>
                                    <FormControlLabel label={I18n.t('Stop already started commands')} control={
                                        <Checkbox checked={member.stopAllDelays} onChange={e => {
                                            const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                            sceneObj.native.members[index].stopAllDelays = e.target.checked;
                                            component.setStateWithParent({sceneObj});
                                        }}/>
                                    }/>
                                </Grid> : null}
                            </Grid>
                        </Box>
                        {JSON.stringify(member) !== JSON.stringify(this.props.scene.native.members[index]) ?
                            <Box
                                className={clsx(this.props.classes.p, this.props.classes.alignRight, this.props.classes.buttonsContainer)}>
                                <Button variant="contained" onClick={() =>
                                    this.setStateWithParent({sceneObj: JSON.parse(JSON.stringify(this.props.scene))})}
                                >
                                    {I18n.t('Cancel')}
                                </Button>
                                <Button variant="contained" color="primary" onClick={() =>
                                    component.props.updateScene(scene._id, scene)}
                                >
                                    {I18n.t('Save')}
                                </Button>
                            </Box>
                            : null}
                    </div> :
                    <div className={ this.props.classes.smallOnTrueFalse}>
                        { I18n.t('Set if TRUE') + ': ' } <span className={ this.props.classes.stateValueTrue }>{ scene.native.members[index].setIfTrue }</span>
                        { this.state.sceneObj.native.onFalse.enabled ? ' / ' + I18n.t('Set if FALSE') + ': '  : null}
                        { this.state.sceneObj.native.onFalse.enabled ? <span className={ this.props.classes.stateValueFalse }>{ scene.native.members[index].setIfFalse }</span> : null}
                    </div>
            }
        </Paper>
    };

    onWriteScene(val) {
        this.props.socket.setState(this.state.sceneObj._id, val);
    }

    render = () => {
        let scene = this.state.sceneObj;
        if (!scene) {
            return null;
        }
        let component = this;
        let sceneState = this.state.states[scene._id];
        if (sceneState === undefined || sceneState === null) {
            sceneState = '';
        }

        let result = <div key="SceneMembersForm" className={ clsx(this.props.classes.height, this.props.classes.columnContainer) }>
            <Toolbar classes={{ gutters: this.props.classes.guttersZero}}>
                <Typography variant="h6" className={ clsx(this.props.classes.sceneTitle)} >
                    {I18n.t('Scene states')}
                    <br/>
                    <span className={ clsx(
                        this.props.classes.sceneSubTitle,
                        !scene.native.virtualGroup && sceneState === true && this.props.classes.sceneTrue,
                        !scene.native.virtualGroup && sceneState === false && this.props.classes.sceneFalse,
                        !scene.native.virtualGroup && sceneState === 'uncertain' && this.props.classes.sceneUncertain,
                    ) }>{ I18n.t('Scene state:') } { sceneState.toString() }</span>
                </Typography>
                <IconButton title={I18n.t('Add new state')} onClick={() => component.setState({showDialog: true})}>
                    <IconAdd/>
                </IconButton>
            </Toolbar>
            <div className={ this.props.classes.testButtons }>
                { scene.native.virtualGroup ? <TextField
                    label={ I18n.t('Write to virtual group') }
                    defaultValue={ sceneState }
                    onKeyUp={e => e.keyCode === 13 && this.onWriteScene(this.state.writeSceneState)}
                    onChange={e => this.setState({writeSceneState: e.target.value}) }
                /> : null}
                { scene.native.virtualGroup ? <IconButton
                    onClick={e => this.onWriteScene(this.state.writeSceneState) }
                ><IconPlay/></IconButton> : null}
                { !scene.native.virtualGroup ? <Button
                    className={ this.props.classes.btnTestTrue }
                    onClick={() => this.onWriteScene(true)}
                ><IconPlay/>{ I18n.t('Test TRUE') }</Button> : null }
                { !scene.native.virtualGroup && scene.native.onFalse.enabled ? <Button
                    className={ this.props.classes.btnTestFalse }
                    onClick={ () => this.onWriteScene(false) }
                ><IconPlay/>{ I18n.t('Test FALSE') }</Button> : null }
            </div>
            <div className={ this.props.classes.scroll }>
                {
                    scene.native.members.map((member, i) =>
                        this.renderMember(member, i, scene))
                }
            </div>
        </div>;

        return [
            result,
            this.dialogs()
        ];
    }
}

SceneMembersForm.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    scene: PropTypes.object,
    updateScene: PropTypes.func,
};

export default withStyles(styles)(SceneMembersForm);
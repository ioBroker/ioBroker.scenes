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

// own components
import I18n from '@iobroker/adapter-react/i18n';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';

// icons
import {AiOutlineClockCircle as IconClock} from 'react-icons/ai';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {IoMdClose as IconClose} from 'react-icons/io';
import {MdAdd as IconAdd} from 'react-icons/md';

const styles = theme => ({
    memberTrueFalse: {
        borderRadius: 10,
        padding: '2px 8px',
        fontSize: 'initial',
        fontWeight: 'initial',
        margin: '0 10px',
        float: 'right'
    },
    memberTrue: {
        backgroundColor: 'lightgreen',
    },
    memberFalse: {
        backgroundColor: 'pink',
    },
    memberUncertain: {
        backgroundColor: 'grey',
    },
    memberCard: {
        padding: 4,
        margin: '10px 0px',
    },
    right: {
        float: 'right',
    },
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingRight: 10,
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
            margin: '0px 10px',
        },
    }
});

class SceneMembersForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            states: {},
            memberOpened:  {},
            objectTypes: {},
            sceneObj: JSON.parse(JSON.stringify(this.props.scene))
        };
    }

    componentDidMount() {
        this.readObjects()
            .then(objectTypes =>
                this.setState({objectTypes}, () =>
                    // subscribe on all states
                    this.props.scene.native.members.forEach(member =>
                        this.props.socket.subscribeState(member.id, this.memberStateChange))));
    }

    readObjects() {
        if (this.state.sceneObj.native && this.state.sceneObj.members) {
            return Promise.all(
                this.state.sceneObj.members.map(member =>
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

        if (this.state.objectTypes[id] === 'boolean') {
            if (states[id] === 'true') {
                states[id] = true;
            }
            if (states[id] === 'false') {
                states[id] = false;
            }
        } else if (this.state.objectTypes[id] === 'number') {
            states[id] = parseFloat(states[id]);
        }

        this.setState({states});
    };

    componentWillUnmount() {
        this.props.scene.native.members.forEach(member =>
            this.props.socket.unsubscribeState(member.id, this.memberStateChange));
    }

    createSceneMember = id => {
        this.setState({showDialog: false}, () => {
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

                    let scene = JSON.parse(JSON.stringify(this.props.scene));
                    scene.native.members.push(template);

                    // open added state
                    const memberOpened = JSON.parse(JSON.stringify(this.state.memberOpened));
                    memberOpened[scene.native.members.length - 1] = true;

                    this.setState({objectTypes}, () =>
                        this.props.updateScene(scene._id, scene));
                });
        });
    };

    deleteSceneMember = index => {
        let scene = JSON.parse(JSON.stringify(this.state.sceneObj));
        scene.native.members.splice(index, 1);
        this.props.updateScene(scene._id, scene);
    };

    dialogs = () => {
        return this.state.showDialog ? <DialogSelectID
            key="selectDialog"
            connection={ this.props.socket }
            dialogName="memberEdit"
            title={ I18n.t('Select for ') }
            //statesOnly={true}
            selected={null}
            onOk={id => this.createSceneMember(id)}
            onClose={() => this.setState({showDialog: false})}
        /> : null
    };

    renderMember = (member, index, scene, ) => {
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
                    className={ clsx(this.props.classes.memberTrueFalse, this.props.classes.memberTrue) }>{ _valStr }</span>;
            } else if (member.setIfFalse !== undefined && this.state.states[member.id] === member.setIfFalse) {
                value = <span
                    className={ clsx(this.props.classes.memberTrueFalse, this.props.classes.memberFalse) }>{ _valStr }</span>;
            } else {
                value = <span
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
                                onClick={ () => this.deleteSceneMember(index) }>
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
            <div>{ memberOriginal.desc } { memberOriginal.delay ?
                <span> <IconClock/> {memberOriginal.delay + I18n.t('ms')}</span> : null }</div>
            {
                this.state.memberOpened[index] ?
                    <div>
                        <Box component="p">
                            <TextField
                                InputLabelProps={{shrink: true}} label={I18n.t('Description')}
                                value={member.desc}
                                onChange={ e => {
                                    member.desc = e.target.value;
                                    component.setState({sceneObj: scene});
                                } }
                            />
                        </Box>
                        <Box component="p">
                            {this.state.objectTypes[member.id] === 'boolean' ?
                                <FormControlLabel
                                    control={<Checkbox checked={member.setIfTrue} onChange={(e) => {
                                        member.setIfTrue = e.target.checked;
                                        component.setState({sceneObj: scene});
                                    }}/>}
                                    label={I18n.t('Set if TRUE')}
                                />
                                :
                                <TextField InputLabelProps={{shrink: true}} label={I18n.t('Set if TRUE')}
                                           value={member.setIfTrue}
                                           onChange={(e) => {
                                               if (this.state.objectTypes[member.id] === 'number') {
                                                   member.setIfTrue = parseFloat(e.target.value);
                                               } else {
                                                   member.setIfTrue = e.target.value;
                                               }

                                               component.setState({sceneObj: scene});
                                           }}/>
                            }
                        </Box>
                        {scene.native.onFalse.enabled ?
                            <Box component="p">
                                <TextField
                                    InputLabelProps={{shrink: true}} label={I18n.t('Set if FALSE')}
                                    value={member.setIfFalse}
                                    onChange={(e) => {
                                        member.setIfFalse = e.target.value;
                                        component.setState({sceneObj: scene});
                                    }}
                                />
                            </Box>
                            : null}
                        <Box component="p">
                            <Grid container spacing="4">
                                <Grid item xs="4">
                                    <TextField InputLabelProps={{shrink: true}} label={ I18n.t('Delay (ms)') }
                                               value={member.delay}
                                               onChange={(e) => {
                                                   member.delay = e.target.value;
                                                   component.setState({sceneObj: scene});
                                               }}/>
                                </Grid>
                                <Grid item xs="8">
                                    <FormControlLabel label={I18n.t('Stop already started commands')} control={
                                        <Checkbox checked={member.stopAllDelays} onChange={(e) => {
                                            member.stopAllDelays = e.target.checked;
                                            component.setState({sceneObj: scene});
                                        }}/>
                                    }/>
                                </Grid>
                            </Grid>
                        </Box>
                        {JSON.stringify(member) !== JSON.stringify(this.props.scene.native.members[index]) ?
                            <Box component="p"
                                 className={clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer)}>
                                <Button variant="contained" onClick={() =>
                                    this.setState({sceneObj: JSON.parse(JSON.stringify(this.props.scene))})}>
                                    {I18n.t('Cancel')}
                                </Button>
                                <Button variant="contained" color="primary" onClick={() =>
                                    component.props.updateScene(scene._id, scene)}>
                                    {I18n.t('Save')}
                                </Button>
                            </Box>
                            : null}
                    </div> : null
            }
        </Paper>
    };

    render = () => {
        let scene = this.state.sceneObj;
        if (!scene) {
            return null;
        }
        let component = this;
        let result = <div className={ clsx(this.props.classes.height, this.props.classes.columnContainer) }>
            <h2>
                {I18n.t('States')}
                <span className={this.props.classes.right}>
                    <IconButton title={I18n.t('Add new state')} onClick={() => component.setState({showDialog: true})}>
                        <IconAdd/>
                    </IconButton>
                </span>
            </h2>
            <div className={this.props.classes.scroll}>
                {
                    scene.native.members.map((member, i) =>
                        this.renderMember(member, i, scene))
                }
            </div>
        </div>;

        result = [
            result,
            this.dialogs()
        ];

        return result;
    }
}

SceneMembersForm.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    scene: PropTypes.object,
    updateScene: PropTypes.func,
};

export default withStyles(styles)(SceneMembersForm);
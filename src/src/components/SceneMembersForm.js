import React from 'react'
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';
import Fab from '@material-ui/core/Fab';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {IoMdClose as IconClose} from 'react-icons/io';
import {MdAdd as IconAdd} from 'react-icons/md';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import Paper from '@material-ui/core/Paper';
import {AiOutlineClockCircle as IconClock} from 'react-icons/ai';

class SceneMembersForm extends React.Component {
    state = {states: {}, memberOpened: {0: true}}

    componentDidMount() {
        let component = this;
        this.setState({formData: JSON.parse(JSON.stringify(this.props.scene)), selectedMember: 0});
        this.props.scene.native.members.forEach((member) => {
            this.props.socket.subscribeState(member.id, this.memberStateChange);
        });
    }

    memberStateChange = (id, result) => {
        this.state.states[id] = result;
        this.setState({states: this.state.states});
    }
    
    componentWillUnmount() {
        this.props.scene.native.members.forEach((member) => {
            this.props.socket.unsubscribeState(member.id, this.memberStateChange);
        });
    }

    createSceneMember = (id) => {
        this.setState({showDialog: false});
        const template = {
            "id": id,
            "setIfTrue": null,
            "setIfFalse": null,
            "stopAllDelays": false,
            "desc": null,
            "disabled": false,
            "delay": null
        };
    
        let scene = JSON.parse(JSON.stringify(this.props.scene));
        scene.native.members.push(template);
        this.setState({selectedMember: scene.native.members.length - 1});
        this.props.updateScene(scene._id, scene);          
    }

    deleteSceneMember = (key) => {
        let scene = JSON.parse(JSON.stringify(this.props.scene));
        scene.native.members.splice(key, 1);
        this.props.updateScene(scene._id, scene);          
    }

    dialogs = () => {
        let component = this;
        return this.state.showDialog ? <DialogSelectID
            key="selectDialog"
            connection={this.props.socket}
            dialogName="memberEdit"
            title={I18n.t('Select for ')}
            //statesOnly={true}
            selected={null}
            onOk={id => {
                component.createSceneMember(id);
                //const ids = JSON.parse(JSON.stringify(this.state.ids));
                //ids[this.state.selectIdFor] = id;
                //this.setState({selectIdFor: '', ids})
            }}
            onClose={() => this.setState({showDialog: false})}
        /> : null
    }

    member = (member, key, scene) => {
        let component = this;

        let memberOriginal = this.props.scene.native.members[key];
        return <Paper key={key} className="member-card">
            <h3>
                {member.id}
                {this.state.states[member.id] && this.state.states[member.id].val ? <span className="memberTrue">TRUE</span> : <span className="memberFalse">FALSE</span>}
                <span className="right">
                    <IconButton title={I18n.t('Edit')} onClick={()=>{
                        this.state.memberOpened[key] = !this.state.memberOpened[key];
                        component.setState({memberOpened: this.state.memberOpened})
                    }}>
                        {this.state.memberOpened[key] ? <IconClose /> : <IconEdit />}
                    </IconButton>
                    <IconButton size="small" style={{marginLeft: 5}} aria-label="Delete" title={I18n.t('Delete')} onClick={()=>{
                        this.deleteSceneMember(key)
                    }}>
                        <IconDelete />
                    </IconButton>
                    <Switch
                        checked={!member.disabled}
                        onChange={(e)=>{
                            member.disabled = !e.target.checked
                            component.props.updateScene(scene._id, scene);
                        }}
                        name={member.id}
                    />
                </span>
            </h3>
            <div>{memberOriginal.desc} {memberOriginal.delay ? <span> <IconClock/> {memberOriginal.delay}ms</span> : null}</div>
            {
                this.state.memberOpened[key] ?
                <div>
                    <Box component="p">
                        <TextField InputLabelProps={{shrink: true}} label={I18n.t("Description")} value={member.desc}
                        onChange={(e)=>{
                            member.desc = e.target.value;
                            component.setState({formData: scene});
                        }}/>
                    </Box>
                    <Box component="p">
                        <TextField InputLabelProps={{shrink: true}} label={I18n.t("Set if TRUE")} value={member.setIfTrue}
                        onChange={(e)=>{
                            member.setIfTrue = e.target.value;
                            component.setState({formData: scene});
                        }}/>
                    </Box>
                    { scene.native.onFalse.enabled ? 
                        <Box component="p">
                            <TextField InputLabelProps={{shrink: true}} label={I18n.t("Set if FALSE")} value={member.setIfFalse}
                            onChange={(e)=>{
                                member.setIfFalse = e.target.value;
                                component.setState({formData: scene});
                            }}/>
                        </Box>
                    : null }
                    <Box component="p">
                        <Grid container spacing="4">
                            <Grid item xs="4">
                                <TextField InputLabelProps={{shrink: true}} label={I18n.t("Delay (ms)")} value={member.delay}
                                onChange={(e)=>{
                                    member.delay = e.target.value;
                                    component.setState({formData: scene});
                                }}/>
                            </Grid>
                            <Grid item xs="8">
                                <FormControlLabel label={I18n.t("Stop already started commands")} control={
                                    <Checkbox checked={member.stopAllDelays} onChange={(e)=>{
                                        member.stopAllDelays = e.target.checked;
                                        component.setState({formData: scene});
                                    }}/>
                                } />
                            </Grid>
                        </Grid>
                    </Box>
                    {JSON.stringify(member) != JSON.stringify(this.props.scene.native.members[key]) ?
                        <Box component="p" className="align-right buttons-container">
                            <Button variant="contained" onClick={()=>{
                                this.setState({formData: JSON.parse(JSON.stringify(this.props.scene))});
                            }}>
                                {I18n.t("Cancel")}
                            </Button>
                            <Button variant="contained" color="primary" onClick={()=>{
                                component.props.updateScene(scene._id, scene);
                            }}>
                                {I18n.t("Save")}
                            </Button>
                        </Box>
                    : null}
                </div> : null
            }
        </Paper>
    }

    render = () => {
        let scene = this.state.formData;
        if (!scene) {
            return null;
        }
        let component = this;
        let result = <div class="height column-container">
            <h2>
                {I18n.t("States")}
                <span className="right">
                    <IconButton title={I18n.t('Create new scene')} onClick={()=>{
                        component.setState({showDialog: true})
                    }}>
                        <IconAdd />
                    </IconButton>
                </span>
            </h2>
            <div className="scroll">
                {
                    scene.native.members.map((member, key) => {
                        return this.member(member, key, scene);
                    })
                }
            </div>
        </div>;
        
        result = [
            result, 
            this.dialogs()
        ]

        return result;
    }
}

export default SceneMembersForm;
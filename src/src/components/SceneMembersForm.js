import React from 'react'
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';
import Fab from '@material-ui/core/Fab';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import Paper from '@material-ui/core/Paper';

class SceneMembersForm extends React.Component {
    state = {}

    componentDidMount() {
        this.setState({formData: JSON.parse(JSON.stringify(this.props.scene))});
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
          this.props.updateScene(scene._id, scene);          
    }

    deleteSceneMember = (key) => {
        let scene = JSON.parse(JSON.stringify(this.props.scene));
        scene.native.members.splice(key, 1);
        this.props.updateScene(scene._id, scene);          
    }

    render = () => {
        let scene = this.state.formData;
        if (!scene) {
            return null;
        }
        let component = this;
        let result = <div>
            <div>
                <Fab size="small" color="secondary" aria-label="Add" title={I18n.t('Create new scene')} onClick={()=>{component.setState({showDialog: true})}}><IconAdd /></Fab>
            </div>
            {
                scene.native.members.map((member, key) => 
                {
                return <Paper key={key}>
                    <h2>
                        {member.id}
                        <Fab size="small" aria-label="Edit" title={I18n.t('Edit')}><IconEdit /></Fab>
                        <Fab size="small" style={{marginLeft: 5}} aria-label="Delete" title={I18n.t('Delete')} onClick={()=>{this.deleteSceneMember(key)}}><IconDelete /></Fab>
                        <Switch
                            checked={!member.disabled}
                            onChange={(e)=>{
                                member.disabled = !e.target.checked
                                component.props.updateScene(scene._id, scene);
                            }}
                            name={member.id}
                        />
                    </h2>
                    <div>{member.desc}</div>
                    <div><TextField InputLabelProps={{shrink: true}} label={I18n.t("Description")} value={member.desc}
                        onChange={(e)=>{
                            member.desc = e.target.value;
                            component.setState({formData: scene});
                    }}/>
                    </div>
                    <div><TextField InputLabelProps={{shrink: true}} label={I18n.t("Set if TRUE")} disabled={!scene.native.onTrue.enabled} value={member.setIfTrue}
                    onChange={(e)=>{
                        member.setIfTrue = e.target.value;
                        component.setState({formData: scene});
                    }}/>
                    </div>
                    <div><TextField InputLabelProps={{shrink: true}} label={I18n.t("Set if FALSE")} disabled={!scene.native.onFalse.enabled} value={member.setIfFalse}
                        onChange={(e)=>{
                            member.setIfFalse = e.target.value;
                            component.setState({formData: scene});
                    }}/>
                    </div>
                    <div>
                    <Grid container>
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
                    </div>
                    <pre>{JSON.stringify(member, null, 2)}</pre>
                    <div>
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
                    </div>
                </Paper>
                }
            )}
           </div>;
        
        result = [result, 
                this.state.showDialog ? <DialogSelectID
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
        ]

        return result;
    }
}

export default SceneMembersForm;
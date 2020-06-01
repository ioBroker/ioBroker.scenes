import React from 'react'
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';
import Fab from '@material-ui/core/Fab';
import {MdDelete as IconDelete} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';

class SceneForm extends React.Component
{
    state={}

    componentDidMount() {
        this.setState({formData: JSON.parse(JSON.stringify(this.props.scene))});
    }

    render = ()=>{
        let component = this;
        let scene = this.state.formData;
        if (!scene) {
            return null;
        }
        return <div>
            <h2>{scene.common.name}</h2>
            <div>{scene.common.desc}</div>
            <div>
                <Fab size="small" aria-label="Edit" title={I18n.t('Edit')}><IconEdit /></Fab>
                <Fab size="small" style={{marginLeft: 5}} aria-label="Delete" title={I18n.t('Delete')} onClick={()=>{this.props.deleteScene(scene._id);}}><IconDelete /></Fab>
            </div>
            <div>
                <Select value={scene.common.engine}>
                    <MenuItem value={scene.common.engine}>
                        {scene.common.engine}
                    </MenuItem>
                </Select>
                <TextField value={scene.native.burstIntervall}
                onChange={(e)=>{
                    scene.native.burstIntervall = e.target.value;
                    component.setState({formData: scene});
                }}/>
                <Checkbox checked={scene.native.virtualGroup}
                onChange={(e)=>{
                    scene.native.virtualGroup = e.target.checked;
                    component.setState({formData: scene});
                }}/>
            </div>
            <div><Switch checked={scene.native.onTrue.enabled}
                onChange={(e)=>{
                    scene.native.onTrue.enabled = e.target.checked;
                    component.setState({formData: scene});
                }}
            /></div>
            <div>
                <Select value={scene.native.onTrue.trigger.id}>
                    <MenuItem value={scene.native.onTrue.trigger.id}>
                        {scene.native.onTrue.trigger.id}
                    </MenuItem>
                </Select>
                <Select value={scene.native.onTrue.trigger.condition}
                onChange={(e)=>{
                    scene.native.onTrue.trigger.condition = e.target.value;
                    component.setState({formData: scene});
                }}>
                    <MenuItem value="==">==</MenuItem>
                    <MenuItem value="!=">!=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="<">&lt;</MenuItem>
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value="<=">&lt;=</MenuItem>
                    <MenuItem value="update">on update</MenuItem>
                </Select>
                <TextField value={scene.native.onTrue.trigger.value}
                onChange={(e)=>{
                    scene.native.onTrue.trigger.value = e.target.value;
                    component.setState({formData: scene});
                }}/>
            </div>
            <div>
                <TextField value={scene.native.onTrue.cron || ''}
                onChange={(e)=>{
                    scene.native.onTrue.cron = e.target.value;
                    component.setState({formData: scene});
                }}/>
            </div>
            <div><Switch checked={scene.native.onFalse.enabled} onChange={(e)=>{
                scene.native.onFalse.enabled = e.target.checked;
                component.setState({formData: scene});
            }}/></div>
            <div>
                <Select value={scene.native.onFalse.trigger.id}>
                    <MenuItem value={scene.native.onFalse.trigger.id}>
                        {scene.native.onFalse.trigger.id}
                    </MenuItem>
                </Select>
                <Select value={scene.native.onFalse.trigger.condition}
                onChange={(e)=>{
                    scene.native.onFalse.trigger.condition = e.target.value;
                    component.setState({formData: scene});
                }}>
                    <MenuItem value="==">==</MenuItem>
                    <MenuItem value="!=">!=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="<">&lt;</MenuItem>
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value="<=">&lt;=</MenuItem>
                    <MenuItem value="update">on update</MenuItem>
                </Select>
                <TextField value={scene.native.onFalse.trigger.value}
                onChange={(e)=>{
                    scene.native.onFalse.trigger.value = e.target.value;
                    component.setState({formData: scene});
                }}/>
            </div>
            <div>
                <TextField value={scene.native.onFalse.cron || ''}
                onChange={(e)=>{
                    scene.native.onFalse.cron = e.target.value;
                    component.setState({formData: scene});
                }}/>
            </div>
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
            <pre>{JSON.stringify(scene, null, 2)}</pre>
        </div>
    }
}

export default SceneForm;
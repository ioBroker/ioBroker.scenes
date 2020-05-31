import React from 'react'
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react/i18n';

class SceneMembersForm extends React.Component
{
    state = {}

    componentDidMount() {
        this.setState({formData: JSON.parse(JSON.stringify(this.props.scene))});
    }

    render = ()=>{
        let scene = this.state.formData;
        if (!scene) {
            return null;
        }
        let component = this;
        return <div>
            {
                scene.native.members.map((member) => 
                {
                return <div key={member.id}>
                    <h2>{member.id}</h2>
                    <Switch
                        checked={!member.disabled}
                        onChange={(e)=>{
                            member.disabled = !e.target.checked
                            component.props.updateScene(this.scene._id, this.scene);
                        }}
                        name={member.id}
                    />
                    <div><TextField value={member.setIfTrue}
                    onChange={(e)=>{
                        member.setIfTrue = e.target.value;
                        component.setState({formData: scene});
                    }}/>
                    </div>
                    <div><TextField value={member.setIfFalse}
                        onChange={(e)=>{
                            member.setIfFalse = e.target.value;
                            component.setState({formData: scene});
                        }}/>
                    /></div>
                    <div><TextField value={member.delay}
                    onChange={(e)=>{
                        member.delay = e.target.value;
                        component.setState({formData: scene});
                    }}/>
                    <Checkbox checked={member.stopAllDelays}/></div>
                    <div>{member.desc}</div>
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
                </div>
                }
            )}
           </div>
    }
}

export default SceneMembersForm;
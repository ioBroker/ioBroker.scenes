import React from 'react'
import Switch from '@material-ui/core/Switch';

class SceneMembersForm extends React.Component
{
    scene
    render = ()=>{
        this.scene = this.props.scene;
        let component = this;
        return <div>
            {
                this.scene.native.members.map((member) => 
                {
                return <div>
                    <h2>{member.id}</h2>
                    <Switch
                        checked={!member.disabled}
                        onChange={(e)=>{
                            member.disabled = !e.target.checked
                            component.props.updateScene(this.scene._id, this.scene);
                        }}
                        name={member.id}
                    />
                    <div>{member.desc}</div>
                    <pre>{JSON.stringify(member, null, 2)}</pre>
                </div>
                }
            )}
           </div>
    }
}

export default SceneMembersForm;
import React from 'react'

class SceneForm extends React.Component
{
    render = ()=>{
        let scene = this.props.scene;
        return <div>
            <h2>{scene.common.name}</h2>
            <div>{scene.common.desc}</div>
            <pre>{JSON.stringify(scene, null, 2)}</pre>
        </div>
    }
}

export default SceneForm;
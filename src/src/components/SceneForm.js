import React from 'react'

class SceneForm extends React.Component
{
    render = ()=>{
        return <div>{JSON.stringify(this.props.scene)}</div>
    }
}

export default SceneForm;
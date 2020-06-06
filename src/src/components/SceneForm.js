import React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types';
import {withStyles} from "@material-ui/core/styles";

import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';

import DialogSelectID from '@iobroker/adapter-react/Dialogs/SelectID';
import I18n from '@iobroker/adapter-react/i18n';

// icons
import {MdDelete as IconDelete} from 'react-icons/md';
import {FaClone as IconClone} from 'react-icons/fa';
import {BsFolderSymlink as IconMoveToFolder} from 'react-icons/bs';

const styles = theme => ({
    alignRight: {
        textAlign: 'right',
    },
    buttonsContainer: {
        '& button': {
            margin: '0 ' + theme.spacing(1) + 'px',
        },
    },
    height: {
        height: '100%',
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
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

});
// For BF todo: fill engines

class SceneForm extends React.Component {
    state = {
        sceneObj: JSON.parse(JSON.stringify(this.props.scene)),
        newFolder: SceneForm.getFolderPrefix(this.props.scene._id),
        moveDialog: null,
        showDialog: null,
    };

    static getFolderPrefix(sceneId) {
        let result = sceneId.split('.');
        result.shift();
        result.shift();
        result.pop();
        result = result.join('.');
        return result;
    }

    static getFolderList(folder) {
        let result = [];
        result.push(folder);
        Object.values(folder.subFolders).forEach(subFolder =>
            result = result.concat(SceneForm.getFolderList(subFolder)));

        return result;
    };

    dialogs = scene => {
        let component = this;
        return [
            this.state.showDialog ? <DialogSelectID
                key="selectDialog"
                connection={ this.props.socket }
                dialogName="memberEdit"
                title={ I18n.t('Select for ') }
                //statesOnly={true}
                selected={ null }
                onOk={ this.state.showDialog }
                onClose={ () => this.setState({showDialog: false}) }
            /> : null,
            <Dialog
                open={ this.state.moveDialog }
                onClose={ () =>
                    this.setState({moveDialog: null}) }
            >
                <DialogTitle>{ I18n.t('Move to folder') }</DialogTitle>
                <Box component="p">
                    <FormControl>
                        <InputLabel shrink={ true }>{ I18n.t('Folder') }</InputLabel>
                        <Select
                            value={ this.state.newFolder }
                            onChange={e => component.setState({newFolder: e.target.value}) }>
                            {
                                SceneForm.getFolderList(this.props.folders).map(folder => <MenuItem
                                        value={ folder.prefix }>{ folder.prefix ? folder.prefix.replace('.', ' > ') : I18n.t('Root') }</MenuItem>)
                            }
                        </Select>
                    </FormControl>
                </Box>
                <div className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" color="primary" onClick={e => {
                        this.setState({moveDialog: null});
                        this.props.addSceneToFolderPrefix(scene, this.state.newFolder);
                    }}>
                        { I18n.t('Move to folder') }
                    </Button>
                </div>
            </Dialog>
        ];
    };

    render() {
        let component = this;
        let scene = this.state.sceneObj;
        if (!scene) {
            return null;
        }
        let engine = '';
        if (scene.common.engine) {
            let engineId = scene.common.engine.split('.');
            engine = engineId.pop();
            engine = engine + '.' + engineId.pop();
        }

        let result = <div className={ clsx(this.props.classes.columnContainer, this.props.classes.height) }>
            <div>
                <h2>
                    {this.props.scene.common.name}
                    <span className={ this.props.classes.right }>
                        <IconButton aria-label="Clone" title={I18n.t('Clone')} onClick={() => {
                            this.props.cloneScene(scene._id);
                        }}><IconClone/></IconButton>

                        <IconButton aria-label="Delete" title={I18n.t('Delete')} onClick={() => {
                            this.props.deleteScene(scene._id);
                        }}><IconDelete/></IconButton>

                        <IconButton aria-label="Move to folder" title={I18n.t('Move to folder')} onClick={() => {
                            this.setState({moveDialog: true})
                        }}><IconMoveToFolder/></IconButton>

                    </span>
                </h2>
                <div>{this.props.scene.common.desc}</div>
            </div>
            <div className={ this.props.classes.scroll }>
                <Box component="p">
                    <TextField InputLabelProps={{shrink: true}} label={I18n.t('Scene name')} value={scene.common.name}
                               onChange={e => {
                                   const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                   sceneObj.common.name = e.target.value;
                                   component.setState({sceneObj});
                               }}/>
                </Box>
                <Box component="p">
                    <TextField InputLabelProps={{shrink: true}} label={I18n.t('Scene description')}
                               value={scene.common.desc}
                               onChange={e => {
                                   const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                   sceneObj.common.desc = e.target.value;
                                   component.setState({sceneObj});
                               }}/>
                </Box>
                <Box component="p">
                    <Grid container spacing="1">
                        <Grid item xs="6">
                            <FormControl>
                                <InputLabel shrink={true}>{ I18n.t('Instance') }</InputLabel>
                                <Select value={engine}>
                                    <MenuItem value={engine}>{ engine }</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs="6">
                            <TextField InputLabelProps={{shrink: true}} label={ I18n.t('Interval between commands (ms)') }
                                       value={ scene.native.burstIntervall }
                                       type="number"
                                       onChange={e => {
                                           const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                           sceneObj.native.burstIntervall = e.target.value;
                                           component.setState({sceneObj});
                                       }}/>
                        </Grid>
                    </Grid>
                </Box>
                <Box component="p">
                    <Grid container spacing="1">
                        <Grid item xs="6">
                            <FormControlLabel style={{paddingTop: 10}} label={I18n.t('Virtual group')} control={
                                <Checkbox checked={scene.native.virtualGroup}
                                          onChange={e => {
                                              const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                              sceneObj.native.virtualGroup = e.target.checked;
                                              component.setState({sceneObj});
                                          }}/>
                            }/>
                        </Grid>
                        <Grid item xs="6">
                            {!scene.native.virtualGroup ?
                                <FormControlLabel style={{paddingTop: 10}} label={I18n.t('Set value if false')}
                                                  control={
                                                      <Checkbox checked={scene.native.onFalse.enabled}
                                                                onChange={e => {
                                                                    const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                                    sceneObj.native.onFalse.enabled = e.target.checked;
                                                                    component.setState({sceneObj});
                                                                }}/>}
                                />
                                : null}
                        </Grid>
                    </Grid>
                </Box>
                { !scene.native.virtualGroup ?
                    (scene.native.onFalse.enabled ? [scene.native.onTrue, scene.native.onFalse] : [scene.native.onTrue]).map((on, i) => {
                        return <div>
                            <h4>{ on === scene.native.onTrue ? I18n.t('Trigger for TRUE') : I18n.t('Trigger for FALSE') }
                                <span className={ this.props.classes.right }>
                                        <Switch checked={ !!on.trigger.id }
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        component.setState({
                                                            showDialog: id => {
                                                                const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                                let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                                                on.trigger.id = id;
                                                                component.setState({sceneObj});
                                                            }
                                                        });
                                                    } else {
                                                        const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                        let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                                        on.trigger.id = '';
                                                        component.setState({sceneObj});
                                                    }
                                                }}
                                        />
                                    </span>
                            </h4>
                            <div>
                                {on.trigger.id ?
                                    <Grid container spacing="1">
                                        <Grid item xs="8">
                                            <TextField 
                                                InputLabelProps={{shrink: true}} 
                                                label={ I18n.t('Trigger ID') }
                                                value={ on.trigger.id } onClick={() => {
                                                component.setState({
                                                    showDialog: id => {
                                                        const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                        let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                                        on.trigger.id = id;
                                                        component.setState({sceneObj});
                                                    }
                                                });
                                            }}/>
                                        </Grid>
                                        
                                        <Grid item xs="2">
                                            <FormControl>
                                                <InputLabel shrink={true}>{I18n.t('Condition')}</InputLabel>
                                                <Select value={on.trigger.condition}
                                                        onChange={e => {
                                                            const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                            let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                                            on.trigger.condition = e.target.value;
                                                            component.setState({sceneObj});
                                                        }}>
                                                    <MenuItem value="==">==</MenuItem>
                                                    <MenuItem value="!=">!=</MenuItem>
                                                    <MenuItem value=">">&gt;</MenuItem>
                                                    <MenuItem value="<">&lt;</MenuItem>
                                                    <MenuItem value=">=">&gt;=</MenuItem>
                                                    <MenuItem value="<=">&lt;=</MenuItem>
                                                    <MenuItem value="update">on update</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs="2">
                                            <TextField InputLabelProps={{shrink: true}} label={ I18n.t('Value') }
                                                       value={ on.trigger.value }
                                                       onChange={ e => {
                                                           const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                                           let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                                           on.trigger.value = e.target.value;
                                                           component.setState({sceneObj});
                                                       }}/>
                                        </Grid>
                                    </Grid>
                                    : null}
                            </div>
                            <Box component="p">
                                <TextField InputLabelProps={{shrink: true}} label={I18n.t('On time (CRON expression)')}
                                           value={on.cron || ''}
                                           onChange={e => {
                                               const sceneObj = JSON.parse(JSON.stringify(this.state.sceneObj));
                                               let on = i ? sceneObj.native.onFalse : sceneObj.native.onTrue;
                                               on.cron = e.target.value;
                                               component.setState({sceneObj});
                                           }}/>
                            </Box>
                        </div>
                    })
                    : null
                }
                { JSON.stringify(scene) !== JSON.stringify(this.props.scene) ?
                    <div className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                        <Button variant="contained" onClick={() =>
                            this.setState({sceneObj: JSON.parse(JSON.stringify(this.props.scene))})}>
                            {I18n.t('Cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => component.props.updateScene(scene._id, this.state.sceneObj)}>
                            { I18n.t('Save') }
                        </Button>
                    </div>
                    : null }
            </div>
        </div>;

        result = [
            result,
            this.dialogs(scene)
        ];

        return result;
    }
}

SceneForm.propTypes = {
    classes: PropTypes.object,
    socket: PropTypes.object,
    scene: PropTypes.object,
    updateScene: PropTypes.func.isRequired,
    cloneScene: PropTypes.func.isRequired,
    deleteScene: PropTypes.func.isRequired,
    addSceneToFolderPrefix: PropTypes.func.isRequired,
    folders: PropTypes.func,
};

export default withStyles(styles)(SceneForm);
import React from 'react';
import PropTypes from 'prop-types';

import {
    TextField,
    Switch,
    Select,
    MenuItem,
    Checkbox,
    Box,
    Grid,
    FormControlLabel,
    FormControl,
    InputLabel,
    Button,
} from '@mui/material';

import { Utils, I18n, DialogSelectID, Cron } from '@iobroker/adapter-react-v5';

const styles = {
    alignRight: {
        textAlign: 'right',
    },
    height: {
        height: '100%',
    },
    width100: {
        width: '100%',
    },
    columnContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 16,
    },
    right: {
        float: 'right',
    },
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingRight: 8,
        width: '100%',
    },
    editItem: theme => ({
        display: 'block',
        mb: '16px',
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
    }),
    marginBottom2: {
        mb: '4px',
    },
    p: {
        margin: `8px 0`,
    },
    onTrue: {
        background: 'lightgreen',
    },
    onFalse: {
        background: '#ff9999',
    },
    pTrue: theme => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#002502' : '#90ee90',
        p: '4px',
    }),
    pFalse: theme => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#332100' : '#eec590',
        p: '4px',
    }),
};

class SceneForm extends React.Component {
    constructor(props) {
        super(props);

        const sceneObj = props.scene ? JSON.parse(JSON.stringify(props.scene)) : {};

        delete sceneObj.native.members;

        this.state = {
            common: sceneObj.common,
            native: sceneObj.native,
            showDialog: null,
            sceneId: props.scene._id,
            showCronDialog: null,
        };

        const inputs = ['Trigger', 'Value', 'Cron', 'Name', 'Description'];
        this.inputs = {};
        inputs.map(
            name =>
                (this.inputs[name] = {
                    ref: React.createRef(),
                    start: 0,
                    end: 0,
                }),
        );
    }

    static getDerivedStateFromProps(props, state) {
        const sceneObj = props.scene ? JSON.parse(JSON.stringify(props.scene)) : {};

        delete sceneObj.native.members;

        if (
            JSON.stringify(sceneObj.common) !== JSON.stringify(state.common) ||
            JSON.stringify(sceneObj.native) !== JSON.stringify(state.native)
        ) {
            return {
                common: sceneObj.common,
                native: sceneObj.native,
            };
        }

        return null;
    }

    setStateWithParent = (newState, cb) => {
        this.setState(newState, () => this.props.updateScene(newState.common, newState.native, cb));
    };

    renderSelectIdDialog() {
        return this.state.showDialog ? (
            <DialogSelectID
                key="selectDialog"
                imagePrefix="../.."
                socket={this.props.socket}
                dialogName="memberEdit"
                title={I18n.t('Select for ')}
                selected={null}
                onOk={this.state.showDialog}
                onClose={() => this.setState({ showDialog: false })}
            />
        ) : null;
    }

    renderOnTrueFalse(name) {
        const on = this.state.native[name];

        return (
            <Box
                sx={
                    this.state.native.onFalse.enabled
                        ? on === this.state.native.onTrue
                            ? styles.pTrue
                            : styles.pFalse
                        : undefined
                }
            >
                <Box
                    component="div"
                    key="switch"
                    sx={styles.editItem}
                >
                    <h4 style={this.state.native.onFalse.enabled ? { marginTop: 0 } : null}>
                        {on === this.state.native.onTrue
                            ? this.state.native.onFalse.enabled
                                ? I18n.t('Trigger for TRUE')
                                : I18n.t('Trigger')
                            : I18n.t('Trigger for FALSE')}
                        <span style={styles.right}>
                            <Switch
                                checked={!!on.trigger.id}
                                onChange={e => {
                                    if (e.target.checked) {
                                        this.setState({
                                            showDialog: id => {
                                                const native = JSON.parse(JSON.stringify(this.state.native));
                                                native[name].trigger.id = id;
                                                native[name].trigger.condition = native[name].trigger.condition || '==';
                                                this.setStateWithParent({ native });
                                            },
                                        });
                                    } else {
                                        const native = JSON.parse(JSON.stringify(this.state.native));
                                        native[name].trigger.id = '';
                                        this.setStateWithParent({ native });
                                    }
                                }}
                            />
                        </span>
                    </h4>
                </Box>
                <Box
                    component="div"
                    key="id"
                    sx={styles.editItem}
                >
                    {on.trigger.id ? (
                        <Grid
                            container
                            spacing={1}
                        >
                            <Grid
                                item
                                xs={8}
                            >
                                <TextField
                                    variant="standard"
                                    inputRef={this.inputs.Trigger.ref}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    label={I18n.t('Trigger ID')}
                                    value={on.trigger.id}
                                    onFocus={() => this.saveCursorPosition('Trigger')}
                                    onKeyDown={() => this.saveCursorPosition('Trigger')}
                                    onChange={() => this.saveCursorPosition('Trigger')}
                                    onClick={() =>
                                        this.setState({
                                            showDialog: id => {
                                                const native = JSON.parse(JSON.stringify(this.state.native));
                                                native[name].trigger.id = id;
                                                native[name].trigger.condition = native[name].trigger.condition || '==';
                                                this.setStateWithParent({ native });
                                            },
                                        })
                                    }
                                />
                            </Grid>

                            <Grid
                                item
                                xs={2}
                            >
                                <FormControl variant="standard">
                                    <InputLabel shrink>{I18n.t('Condition')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={on.trigger.condition || '=='}
                                        onChange={e => {
                                            const native = JSON.parse(JSON.stringify(this.state.native));
                                            native[name].trigger.condition = e.target.value;
                                            this.setStateWithParent({ native });
                                        }}
                                    >
                                        <MenuItem value="==">==</MenuItem>
                                        <MenuItem value="!=">!=</MenuItem>
                                        <MenuItem value=">">&gt;</MenuItem>
                                        <MenuItem value="<">&lt;</MenuItem>
                                        <MenuItem value=">=">&gt;=</MenuItem>
                                        <MenuItem value="<=">&lt;=</MenuItem>
                                        <MenuItem value="update">{I18n.t('on update')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                            >
                                <TextField
                                    variant="standard"
                                    inputRef={this.inputs.Value.ref}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    label={I18n.t('Value')}
                                    value={on.trigger.value || ''}
                                    onFocus={() => this.saveCursorPosition('Value')}
                                    onKeyDown={() => this.saveCursorPosition('Value')}
                                    onChange={e => {
                                        this.saveCursorPosition('Value');
                                        const native = JSON.parse(JSON.stringify(this.state.native));
                                        native[name].trigger.value = e.target.value;
                                        this.setStateWithParent({ native });
                                    }}
                                />
                            </Grid>
                        </Grid>
                    ) : null}
                </Box>
                <Box
                    component="div"
                    key="cron"
                    sx={Utils.getStyle(
                        this.props.theme,
                        styles.editItem,
                        this.state.native.onFalse.enabled && styles.marginBottom2,
                    )}
                >
                    <TextField
                        variant="standard"
                        inputRef={this.inputs.Cron.ref}
                        style={{ width: 'calc(100% - 52px)' }}
                        InputLabelProps={{ shrink: true }}
                        label={
                            name === 'onTrue'
                                ? I18n.t('On time (CRON expression)')
                                : I18n.t('Off time (CRON expression)')
                        }
                        value={on.cron || ''}
                        onFocus={() => this.saveCursorPosition('Cron')}
                        onKeyDown={() => this.saveCursorPosition('Cron')}
                        onChange={e => {
                            this.saveCursorPosition('Cron');
                            const native = JSON.parse(JSON.stringify(this.state.native));
                            native[name].cron = e.target.value;
                            this.setStateWithParent({ native });
                        }}
                    />
                    <Button
                        style={{ minWidth: 48, marginLeft: 4, marginTop: 10 }}
                        variant="contained"
                        onClick={() => this.setState({ showCronDialog: name || 'onFalse' })}
                    >
                        ...
                    </Button>
                </Box>
            </Box>
        );
    }

    saveCursorPosition = name => {
        this.inputs[name].start = this.inputs[name].ref.current.selectionStart;
        this.inputs[name].end = this.inputs[name].ref.current.selectionEnd;
    };

    componentDidUpdate() {
        // If there was a request to update the selection via setState...
        // Update the selection.
        Object.keys(this.inputs).forEach(name => {
            if (this.inputs[name].ref.current) {
                if (this.inputs[name].ref.current.selectionStart !== this.inputs[name].start) {
                    this.inputs[name].ref.current.selectionStart = this.inputs[name].start;
                }
                if (this.inputs[name].ref.current.selectionEnd !== this.inputs[name].end) {
                    this.inputs[name].ref.current.selectionEnd = this.inputs[name].end;
                }
            }
        });
    }

    renderCronDialog() {
        if (!this.state.showCronDialog) {
            return null;
        }

        return (
            <Cron
                key="cronDialog"
                cron={this.state.native[this.state.showCronDialog].cron}
                noWizard
                onOk={cron => {
                    const native = JSON.parse(JSON.stringify(this.state.native));
                    native[this.state.showCronDialog].cron = cron;
                    this.setStateWithParent({ native, showCronDialog: null });
                }}
                theme={this.props.theme}
                onClose={() => this.setState({ showCronDialog: null })}
            />
        );
    }

    render() {
        let result = (
            <Box
                key="sceneForm"
                style={{
                    ...styles.columnContainer,
                    ...(!this.props.oneColumn ? { height: 'calc(100% - 16px)' } : undefined),
                }}
            >
                <Box style={styles.scroll}>
                    <Box sx={styles.editItem}>
                        <TextField
                            variant="standard"
                            inputRef={this.inputs.Name.ref}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            label={I18n.t('Scene name')}
                            value={this.state.common.name}
                            onFocus={() => this.saveCursorPosition('Name')}
                            onKeyDown={() => this.saveCursorPosition('Name')}
                            onChange={e => {
                                this.saveCursorPosition('Name');
                                const common = JSON.parse(JSON.stringify(this.state.common));
                                common.name = e.target.value;
                                this.setStateWithParent({ common });
                            }}
                        />
                    </Box>
                    <Box sx={styles.editItem}>
                        <TextField
                            variant="standard"
                            inputRef={this.inputs.Description.ref}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            label={I18n.t('Scene description')}
                            value={this.state.common.desc}
                            onFocus={() => this.saveCursorPosition('Description')}
                            onKeyDown={() => this.saveCursorPosition('Description')}
                            onChange={e => {
                                this.saveCursorPosition('Description');
                                const common = JSON.parse(JSON.stringify(this.state.common));
                                common.desc = e.target.value;
                                this.setStateWithParent({ common });
                            }}
                        />
                    </Box>
                    <Box sx={styles.editItem}>
                        <Grid
                            container
                            spacing={1}
                        >
                            <Grid
                                item
                                xs={12}
                                sm={6}
                            >
                                <FormControl
                                    fullWidth
                                    variant="standard"
                                >
                                    <InputLabel shrink>{I18n.t('Instance')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.common.engine}
                                        onChange={e => {
                                            const common = JSON.parse(JSON.stringify(this.state.common));
                                            common.engine = e.target.value;
                                            this.setStateWithParent({ common });
                                        }}
                                    >
                                        {this.props.instances.map(id => (
                                            <MenuItem
                                                key={id}
                                                value={id}
                                            >
                                                {id.replace('system.adapter.', '')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                sm={6}
                            >
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    label={I18n.t('Interval between commands')}
                                    min={0}
                                    value={this.state.native.burstInterval || 0}
                                    helperText="ms"
                                    type="number"
                                    onChange={e => {
                                        const native = JSON.parse(JSON.stringify(this.state.native));
                                        native.burstInterval = parseInt(e.target.value, 10);
                                        this.setStateWithParent({ native });
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={styles.editItem}>
                        <Grid
                            container
                            spacing={1}
                        >
                            <Grid
                                item
                                xs={12}
                                sm={6}
                            >
                                <FormControlLabel
                                    style={{ paddingTop: 10 }}
                                    title={I18n.t('virtual_group_tooltip')}
                                    label={I18n.t('Virtual group')}
                                    control={
                                        <Checkbox
                                            checked={this.state.native.virtualGroup}
                                            onChange={e => {
                                                const native = JSON.parse(JSON.stringify(this.state.native));
                                                native.virtualGroup = e.target.checked;
                                                this.setStateWithParent({ native });
                                            }}
                                        />
                                    }
                                />
                            </Grid>
                            <Grid
                                item
                                xs={12}
                                sm={6}
                            >
                                {!this.state.native.virtualGroup ? (
                                    <FormControlLabel
                                        style={{ paddingTop: 10 }}
                                        label={I18n.t('Set value if false')}
                                        control={
                                            <Checkbox
                                                checked={this.state.native.onFalse.enabled}
                                                onChange={e => {
                                                    const native = JSON.parse(JSON.stringify(this.state.native));
                                                    native.onFalse.enabled = e.target.checked;
                                                    this.setStateWithParent({ native });
                                                }}
                                            />
                                        }
                                    />
                                ) : null}
                                {this.state.native.virtualGroup && !this.state.native.easy ? (
                                    <FormControl
                                        fullWidth
                                        variant="standard"
                                    >
                                        <InputLabel shrink>{I18n.t('Aggregation')}</InputLabel>
                                        <Select
                                            variant="standard"
                                            value={this.state.native.aggregation || 'uncertain'}
                                            onChange={e => {
                                                const native = JSON.parse(JSON.stringify(this.state.native));
                                                native.aggregation = e.target.value;
                                                this.setStateWithParent({ native });
                                            }}
                                        >
                                            {['uncertain', 'any', 'avg', 'min', 'max'].map(id => (
                                                <MenuItem
                                                    key={id}
                                                    value={id}
                                                >
                                                    {id}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : null}
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={styles.editItem}>
                        <Grid
                            container
                            spacing={1}
                        >
                            <Grid
                                item
                                xs={12}
                                sm={6}
                            >
                                <FormControlLabel
                                    style={{ paddingTop: 10 }}
                                    label={I18n.t('Easy mode')}
                                    control={
                                        <Checkbox
                                            checked={this.state.native.easy}
                                            onChange={e => {
                                                const native = JSON.parse(JSON.stringify(this.state.native));
                                                native.easy = e.target.checked;
                                                this.setStateWithParent({ native });
                                            }}
                                        />
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    {!this.state.native.virtualGroup ? this.renderOnTrueFalse('onTrue') : null}
                    {!this.state.native.virtualGroup && this.state.native.onFalse.enabled
                        ? this.renderOnTrueFalse('onFalse')
                        : null}
                </Box>
            </Box>
        );

        return [result, this.renderSelectIdDialog(), this.renderCronDialog()];
    }
}

SceneForm.propTypes = {
    socket: PropTypes.object,
    scene: PropTypes.object,
    updateScene: PropTypes.func.isRequired,
    instances: PropTypes.array,
    theme: PropTypes.object.isRequired,
    oneColumn: PropTypes.bool,
    showError: PropTypes.func,
};

export default SceneForm;

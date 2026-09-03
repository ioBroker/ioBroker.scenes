import React from 'react';

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

import { Utils, I18n, DialogSelectID, Cron, type IobTheme, type AdminConnection } from '@iobroker/gui-components';
import type { SceneCommon, SceneConfig, SceneObject } from '../types';

const styles: Record<string, any> = {
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
        // padding, not margin: a top margin here collapsed out of the scroll
        // container and had to be subtracted from the height again, which left a
        // dead 16px strip above the Save/Cancel toolbar
        paddingTop: 16,
        boxSizing: 'border-box',
    },
    // the switch is taller than the heading's line box; as a float it overflowed
    // the h4 and crowded the element below, so the heading is a flex row instead
    headingRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    right: {
        marginLeft: 'auto',
    },
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        paddingRight: 8,
        width: '100%',
    },
    editItem: (theme: IobTheme): any => ({
        display: 'block',
        mb: '16px',
        color: theme.palette.mode === 'dark' ? '#FFF' : '#000',
    }),
    marginBottom2: {
        mb: '4px',
    },
    // CRON input + "..." button on one baseline, without magic width offsets
    cronRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
    },
    p: {
        margin: `8px 0`,
    },
    // the checkbox must stand on the same base line as the standard inputs beside it
    triggerCheckbox: {
        marginTop: '12px',
    },
    onTrue: {
        background: 'lightgreen',
    },
    onFalse: {
        background: '#ff9999',
    },
    pTrue: (theme: IobTheme): any => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#002502' : '#90ee90',
        p: '4px',
    }),
    pFalse: (theme: IobTheme): any => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#332100' : '#eec590',
        p: '4px',
    }),
};

interface SceneFormProps {
    socket: AdminConnection;
    scene: SceneObject;
    updateScene: (common?: SceneCommon, native?: SceneConfig) => void;
    instances: string[];
    theme: IobTheme;
    oneColumn: boolean;
    showError: (error: string) => void;
}

interface SceneFormState {
    common: SceneCommon;
    native: SceneConfig;
    showDialog: ((id: string | string[]) => void) | null;
    sceneId: string;
    showCronDialog: 'onTrue' | 'onFalse' | null;
    /** Objects of the trigger IDs, to show the possible values and the type of the trigger state */
    triggerObjects: Record<string, ioBroker.StateObject | null>;
}

/** Default count of the allowed activations. Must be the same as in the backend */
const DEFAULT_LOOP_PROTECTION_COUNT = 100;
/** Default time window for the loop protection in ms. Must be the same as in the backend */
const DEFAULT_LOOP_PROTECTION_INTERVAL = 10000;

/** Conditions that can be used with any state */
const CONDITIONS = ['==', '!=', '>', '<', '>=', '<=', 'update'];
/** Conditions that make sense for booleans and for states with a list of allowed values */
const CONDITIONS_DISCRETE = ['==', '!=', 'update'];

class SceneForm extends React.Component<SceneFormProps, SceneFormState> {
    /** IDs, for which the object was already requested, to not read the same object again and again */
    private readonly requestedTriggers: string[] = [];

    private readonly inputs: {
        Trigger: { ref: React.RefObject<any>; start: number; end: number };
        Value: { ref: React.RefObject<any>; start: number; end: number };
        Cron: { ref: React.RefObject<any>; start: number; end: number };
        Name: { ref: React.RefObject<any>; start: number; end: number };
        Description: { ref: React.RefObject<any>; start: number; end: number };
    };

    constructor(props: SceneFormProps) {
        super(props);

        const sceneObj: { common: SceneCommon; native: SceneConfig; _id: string } = props.scene
            ? JSON.parse(JSON.stringify(props.scene))
            : { common: {}, native: {} as SceneConfig, _id: '' };

        // @ts-expect-error we do not need this information
        delete sceneObj.native.members;

        this.state = {
            common: sceneObj.common,
            native: sceneObj.native,
            showDialog: null,
            sceneId: props.scene._id,
            showCronDialog: null,
            triggerObjects: {},
        };

        this.inputs = {
            Trigger: { ref: React.createRef(), start: 0, end: 0 },
            Value: { ref: React.createRef(), start: 0, end: 0 },
            Cron: { ref: React.createRef(), start: 0, end: 0 },
            Name: { ref: React.createRef(), start: 0, end: 0 },
            Description: { ref: React.createRef(), start: 0, end: 0 },
        };
    }

    componentDidMount(): void {
        this.readTriggerObjects();
    }

    /** Read the objects of both trigger IDs, to know the type and the possible values of the trigger states */
    readTriggerObjects(): void {
        (['onTrue', 'onFalse'] as const).forEach(name => {
            const id = this.state.native[name]?.trigger?.id;
            if (!id || this.requestedTriggers.includes(id)) {
                return;
            }
            this.requestedTriggers.push(id);

            this.props.socket
                .getObject(id)
                .then(obj =>
                    this.setState(state => ({
                        triggerObjects: {
                            ...state.triggerObjects,
                            [id]: (obj as ioBroker.StateObject) || null,
                        },
                    })),
                )
                .catch(e => {
                    console.error(`Cannot read object ${id}: ${e}`);
                    this.setState(state => ({ triggerObjects: { ...state.triggerObjects, [id]: null } }));
                });
        });
    }

    /**
     * Convert `common.states` of an object into a list for the select
     *
     * @param states states as they are stored in the object
     */
    static parseStates(states: unknown): { value: string; label: string }[] | null {
        if (states === undefined || states === null) {
            return null;
        }
        let result: { value: string; label: string }[] = [];

        if (typeof states === 'string') {
            // "value:text;value:text"
            states.split(';').forEach(item => {
                const parts = item.split(':');
                if (parts[0] !== undefined && parts[0] !== '') {
                    result.push({ value: parts[0].trim(), label: (parts[1] ?? parts[0]).trim() });
                }
            });
        } else if (Array.isArray(states)) {
            result = states.map(value => ({
                value: (value as string | number).toString(),
                label: `${value as string}`,
            }));
        } else if (typeof states === 'object') {
            result = Object.keys(states as Record<string, string>).map(value => ({
                value,
                label: `${(states as Record<string, string>)[value]}`,
            }));
        }

        return result.length ? result : null;
    }

    static getDerivedStateFromProps(props: SceneFormProps, state: SceneFormState): Partial<SceneFormState> | null {
        const sceneObj: { common: SceneCommon; native: SceneConfig; _id: string } = props.scene
            ? JSON.parse(JSON.stringify(props.scene))
            : { common: {}, native: {}, _id: '' };

        // @ts-expect-error we do not need this information
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

    setStateWithParent = (newState: { native?: SceneConfig; common?: SceneCommon; showCronDialog?: null }): void => {
        this.setState(newState as SceneFormState, () => this.props.updateScene(newState.common, newState.native));
    };

    renderSelectIdDialog(): React.JSX.Element | null {
        const onOk = this.state.showDialog;
        return onOk ? (
            <DialogSelectID
                key="selectDialog"
                imagePrefix="../.."
                socket={this.props.socket}
                dialogName="memberEdit"
                title={I18n.t('Select for ')}
                selected=""
                onOk={selected => selected !== undefined && onOk(selected)}
                onClose={() => this.setState({ showDialog: null })}
                theme={this.props.theme}
            />
        ) : null;
    }

    /**
     * Render the input for the trigger value: a select for booleans and for states with `common.states`,
     * a number input for numbers and a normal text input for everything else
     *
     * @param name which trigger is rendered
     * @param triggerObj object of the trigger state or null if it is unknown
     */
    renderTriggerValue(name: 'onTrue' | 'onFalse', triggerObj: ioBroker.StateObject | null): React.JSX.Element {
        const trigger = this.state.native[name].trigger;
        const value = trigger.value === undefined || trigger.value === null ? '' : trigger.value.toString();

        const onChange = (newValue: string): void => {
            const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
            native[name].trigger.value = newValue;
            this.setStateWithParent({ native });
        };

        const states = SceneForm.parseStates(triggerObj?.common?.states);
        const type = triggerObj?.common?.type;

        if (states || type === 'boolean') {
            // Take the values from the object, and for booleans just TRUE and FALSE
            const options = states || [
                { value: 'false', label: 'FALSE' },
                { value: 'true', label: 'TRUE' },
            ];
            // Do not lose a value that is not in the list (e.g., if the object was changed later)
            if (value !== '' && !options.find(item => item.value === value)) {
                options.push({ value, label: value });
            }

            return (
                <FormControl
                    fullWidth
                    variant="standard"
                >
                    <InputLabel shrink>{I18n.t('Value')}</InputLabel>
                    <Select
                        variant="standard"
                        displayEmpty
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>{I18n.t('Not set')}</em>
                        </MenuItem>
                        {options.map(item => (
                            <MenuItem
                                key={item.value}
                                value={item.value}
                            >
                                {item.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }

        // "selectionStart" cannot be read or written for number inputs, so the cursor position is only kept for text
        const isNumber = type === 'number';

        return (
            <TextField
                variant="standard"
                inputRef={isNumber ? undefined : this.inputs.Value.ref}
                fullWidth
                type={isNumber ? 'number' : 'text'}
                slotProps={{
                    inputLabel: {
                        shrink: true,
                    },
                }}
                label={I18n.t('Value')}
                helperText={triggerObj?.common?.unit || ''}
                value={value}
                onFocus={isNumber ? undefined : () => this.saveCursorPosition('Value')}
                onKeyDown={isNumber ? undefined : () => this.saveCursorPosition('Value')}
                onChange={e => {
                    if (!isNumber) {
                        this.saveCursorPosition('Value');
                    }
                    onChange(e.target.value);
                }}
            />
        );
    }

    renderOnTrueFalse(name: 'onTrue' | 'onFalse'): React.JSX.Element {
        const on = this.state.native[name];
        const triggerObj = (on.trigger.id && this.state.triggerObjects[on.trigger.id]) || null;
        // for booleans and for states with a list of allowed values the comparison operators make no sense
        const conditions = [
            ...(triggerObj?.common?.type === 'boolean' ||
            (SceneForm.parseStates(triggerObj?.common?.states) && triggerObj?.common?.type !== 'number')
                ? CONDITIONS_DISCRETE
                : CONDITIONS),
        ];
        const condition = on.trigger.condition || '==';
        // never hide a condition that is already configured, even if it does not fit to the type
        if (!conditions.includes(condition)) {
            conditions.push(condition);
        }

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
                    <h4
                        style={{
                            ...styles.headingRow,
                            ...(this.state.native.onFalse.enabled ? { marginTop: 0 } : undefined),
                        }}
                    >
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
                                            showDialog: (_id: string | string[]): void => {
                                                let id: string;
                                                if (Array.isArray(_id)) {
                                                    id = _id[0];
                                                } else {
                                                    id = _id;
                                                }
                                                const native: SceneConfig = JSON.parse(
                                                    JSON.stringify(this.state.native),
                                                );
                                                native[name].trigger.id = id;
                                                native[name].trigger.condition = native[name].trigger.condition || '==';
                                                this.setStateWithParent({ native });
                                            },
                                        });
                                    } else {
                                        const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
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
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <TextField
                                    variant="standard"
                                    inputRef={this.inputs.Trigger.ref}
                                    fullWidth
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                    label={I18n.t('Trigger ID')}
                                    value={on.trigger.id || ''}
                                    onFocus={() => this.saveCursorPosition('Trigger')}
                                    onKeyDown={() => this.saveCursorPosition('Trigger')}
                                    onChange={() => this.saveCursorPosition('Trigger')}
                                    onClick={() =>
                                        this.setState({
                                            showDialog: (_id: string | string[]): void => {
                                                let id: string;
                                                if (Array.isArray(_id)) {
                                                    id = _id[0];
                                                } else {
                                                    id = _id;
                                                }
                                                const native: SceneConfig = JSON.parse(
                                                    JSON.stringify(this.state.native),
                                                );
                                                native[name].trigger.id = id;
                                                native[name].trigger.condition = native[name].trigger.condition || '==';
                                                this.setStateWithParent({ native });
                                            },
                                        })
                                    }
                                />
                            </Grid>

                            <Grid size={{ xs: 6, sm: 2 }}>
                                <FormControl
                                    fullWidth
                                    variant="standard"
                                >
                                    <InputLabel shrink>{I18n.t('Condition')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={condition}
                                        onChange={e => {
                                            const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
                                            native[name].trigger.condition = e.target.value;
                                            this.setStateWithParent({ native });
                                        }}
                                    >
                                        {conditions.map(item => (
                                            <MenuItem
                                                key={item}
                                                value={item}
                                            >
                                                {item === 'update' ? I18n.t('on update') : item}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 2 }}>
                                {condition === 'update' ? null : this.renderTriggerValue(name, triggerObj)}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                {condition === 'update' ? null : (
                                    <FormControlLabel
                                        style={styles.triggerCheckbox}
                                        title={I18n.t('only_on_change_tooltip')}
                                        label={I18n.t('Only on change')}
                                        control={
                                            <Checkbox
                                                checked={on.trigger.onlyOnChange !== false}
                                                onChange={e => {
                                                    const native: SceneConfig = JSON.parse(
                                                        JSON.stringify(this.state.native),
                                                    );
                                                    native[name].trigger.onlyOnChange = e.target.checked;
                                                    this.setStateWithParent({ native });
                                                }}
                                            />
                                        }
                                    />
                                )}
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
                        styles.cronRow,
                        this.state.native.onFalse.enabled ? styles.marginBottom2 : undefined,
                    )}
                >
                    <TextField
                        variant="standard"
                        inputRef={this.inputs.Cron.ref}
                        style={{ flexGrow: 1, minWidth: 0 }}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
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
                            const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
                            native[name].cron = e.target.value;
                            this.setStateWithParent({ native });
                        }}
                    />
                    <Button
                        style={{ minWidth: 48, flexShrink: 0 }}
                        variant="contained"
                        onClick={() => this.setState({ showCronDialog: name || 'onFalse' })}
                    >
                        ...
                    </Button>
                </Box>
            </Box>
        );
    }

    saveCursorPosition = (name: 'Name' | 'Trigger' | 'Value' | 'Cron' | 'Description'): void => {
        this.inputs[name].start = this.inputs[name].ref.current.selectionStart;
        this.inputs[name].end = this.inputs[name].ref.current.selectionEnd;
    };

    componentDidUpdate(): void {
        // The trigger ID could be changed in the meantime
        this.readTriggerObjects();

        // If there was a request to update the selection via setState...
        // Update the selection.
        (Object.keys(this.inputs) as ('Name' | 'Trigger' | 'Value' | 'Cron' | 'Description')[]).forEach(name => {
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

    renderCronDialog(): React.JSX.Element | null {
        if (!this.state.showCronDialog) {
            return null;
        }

        return (
            <Cron
                key="cronDialog"
                cron={this.state.native[this.state.showCronDialog].cron || undefined}
                noWizard
                onOk={cron => {
                    const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
                    native[this.state.showCronDialog!].cron = cron;
                    this.setStateWithParent({ native, showCronDialog: null });
                }}
                theme={this.props.theme}
                onClose={() => this.setState({ showCronDialog: null })}
            />
        );
    }

    render(): (React.JSX.Element | null)[] {
        const result = (
            <Box
                key="sceneForm"
                style={{
                    ...styles.columnContainer,
                    ...(!this.props.oneColumn ? { height: '100%' } : undefined),
                }}
            >
                <Box style={styles.scroll}>
                    <Box sx={styles.editItem}>
                        <TextField
                            variant="standard"
                            inputRef={this.inputs.Name.ref}
                            fullWidth
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            label={I18n.t('Scene name')}
                            value={this.state.common.name || ''}
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
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            label={I18n.t('Scene description')}
                            value={this.state.common.desc || ''}
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl
                                    fullWidth
                                    variant="standard"
                                >
                                    <InputLabel shrink>{I18n.t('Instance')}</InputLabel>
                                    <Select
                                        variant="standard"
                                        value={this.state.common.engine || this.props.instances[0] || ''}
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    variant="standard"
                                    fullWidth
                                    label={I18n.t('Interval between commands')}
                                    slotProps={{
                                        htmlInput: {
                                            min: 0,
                                        },
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                    value={this.state.native.burstInterval || 0}
                                    helperText="ms"
                                    type="number"
                                    onChange={e => {
                                        const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControlLabel
                                    style={{ paddingTop: 10 }}
                                    title={I18n.t('virtual_group_tooltip')}
                                    label={I18n.t('Virtual group')}
                                    control={
                                        <Checkbox
                                            checked={!!this.state.native.virtualGroup}
                                            onChange={e => {
                                                const native: SceneConfig = JSON.parse(
                                                    JSON.stringify(this.state.native),
                                                );
                                                native.virtualGroup = e.target.checked;
                                                this.setStateWithParent({ native });
                                            }}
                                        />
                                    }
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {!this.state.native.virtualGroup ? (
                                    <FormControlLabel
                                        style={{ paddingTop: 10 }}
                                        label={I18n.t('Set value if false')}
                                        control={
                                            <Checkbox
                                                checked={!!this.state.native.onFalse.enabled}
                                                onChange={e => {
                                                    const native: SceneConfig = JSON.parse(
                                                        JSON.stringify(this.state.native),
                                                    );
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
                                                const native: SceneConfig = JSON.parse(
                                                    JSON.stringify(this.state.native),
                                                );
                                                native.aggregation = e.target.value;
                                                this.setStateWithParent({ native });
                                            }}
                                        >
                                            {['uncertain', 'any', 'avg', 'min', 'max', 'sum'].map(id => (
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControlLabel
                                    style={{ paddingTop: 10 }}
                                    label={I18n.t('Easy mode')}
                                    control={
                                        <Checkbox
                                            checked={!!this.state.native.easy}
                                            onChange={e => {
                                                const native: SceneConfig = JSON.parse(
                                                    JSON.stringify(this.state.native),
                                                );
                                                native.easy = e.target.checked;
                                                this.setStateWithParent({ native });
                                            }}
                                        />
                                    }
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    {/*
                        The loop protection is always active, only its settings are hidden in the easy mode.
                        It stands after the "Easy mode" checkbox, so that the checkbox does not jump away
                        from the mouse pointer, when the settings appear.
                    */}
                    {!this.state.native.easy ? (
                        <Box sx={styles.editItem}>
                            <Grid
                                container
                                spacing={1}
                            >
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControlLabel
                                        style={{ paddingTop: 10 }}
                                        title={I18n.t('loop_protection_tooltip')}
                                        label={I18n.t('Loop protection')}
                                        control={
                                            <Checkbox
                                                checked={this.state.native.loopProtection !== false}
                                                onChange={e => {
                                                    const native: SceneConfig = JSON.parse(
                                                        JSON.stringify(this.state.native),
                                                    );
                                                    native.loopProtection = e.target.checked;
                                                    this.setStateWithParent({ native });
                                                }}
                                            />
                                        }
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        disabled={this.state.native.loopProtection === false}
                                        label={I18n.t('Max activations')}
                                        title={I18n.t('loop_protection_tooltip')}
                                        type="number"
                                        slotProps={{
                                            htmlInput: {
                                                min: 1,
                                            },
                                            inputLabel: {
                                                shrink: true,
                                            },
                                        }}
                                        value={this.state.native.loopProtectionCount ?? DEFAULT_LOOP_PROTECTION_COUNT}
                                        onChange={e => {
                                            const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
                                            native.loopProtectionCount =
                                                parseInt(e.target.value, 10) || DEFAULT_LOOP_PROTECTION_COUNT;
                                            this.setStateWithParent({ native });
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4 }}>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        disabled={this.state.native.loopProtection === false}
                                        label={I18n.t('In time window')}
                                        title={I18n.t('loop_protection_tooltip')}
                                        type="number"
                                        helperText="ms"
                                        slotProps={{
                                            htmlInput: {
                                                min: 1000,
                                            },
                                            inputLabel: {
                                                shrink: true,
                                            },
                                        }}
                                        value={
                                            this.state.native.loopProtectionInterval ?? DEFAULT_LOOP_PROTECTION_INTERVAL
                                        }
                                        onChange={e => {
                                            const native: SceneConfig = JSON.parse(JSON.stringify(this.state.native));
                                            native.loopProtectionInterval =
                                                parseInt(e.target.value, 10) || DEFAULT_LOOP_PROTECTION_INTERVAL;
                                            this.setStateWithParent({ native });
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ) : null}
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

export default SceneForm;

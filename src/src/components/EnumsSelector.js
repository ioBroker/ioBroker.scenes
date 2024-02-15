import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import {
    Button, Card,
    Checkbox, CircularProgress,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Grid, IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon, ListItemText,
    ListSubheader, Tooltip
} from '@mui/material';

import {
    AddBox as IconAddBox,
    Close as IconCancel,
    List as IconList,
    Clear as ClearIcon,
    Add as AddIcon,
    Check as IconCheck,
} from '@mui/icons-material';

import {
    I18n,
    Icon,
    TextWithIcon,
    IconChannel,
    IconDevice,
    IconState,
    Utils,
} from '@iobroker/adapter-react-v5';

const styles = theme => ({
    dialogPaper: {
        height: 'calc(100% - 96px)',
    },
    enumGroupMember: {
        display: 'inline-flex',
        margin: 4,
        padding: 4,
        backgroundColor: '#00000010',
        border: '1px solid #FFF',
        borderColor: theme.palette.text.hint,
        color: theme.palette.text.primary,
        alignItems: 'center',
        position: 'relative',
    },
    icon: {
        height: 32,
        width: 32,
        marginRight: 5,
        cursor: 'grab',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'inline-block',
    },
    secondLine: {
        fontSize: 9,
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        opacity: 0.5,
    },
});

class EnumsSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            enums: null,
            funcs: [],
            rooms: [],
            others: [],
            value: this.props.value || {
                funcs: [],
                rooms: [],
                others: [],
                exclude: [],
                type: 'boolean',
            },
            ids: [],
            objects: {},
            icons: {},
        };
        this.lang = I18n.getLanguage();
    }

    componentDidMount() {
        this.props.socket.getEnums()
            .then(enums => {
                const rooms = Object.keys(enums).filter(e => e.startsWith('enum.rooms.') && enums[e].common.members?.length);
                const funcs = Object.keys(enums).filter(e => e.startsWith('enum.functions.') && enums[e].common.members?.length);
                const others = Object.keys(enums).filter(e => !e.startsWith('enum.functions.') && !e.startsWith('enum.rooms.') && enums[e].common.members?.length);

                this.setState({ enums, rooms, others, funcs }, () => this.updateAllIds());
            })
            .catch(e => this.props.showError(e));
    }

    async updateAllIds() {
        const objects = JSON.parse(JSON.stringify(this.state.objects));
        const ids = [];
        this.state.value.rooms.forEach(roomId => {
            const members = this.state.enums[roomId].common.members;
            for (let r = 0; r < members.length; r++) {
                if (!ids.includes(members[r])) {
                    ids.push(members[r]);
                }
            }
        });
        if (!this.state.value.rooms.length) {
            this.state.value.funcs.forEach(funcId => {
                const members = this.state.enums[funcId].common.members;
                for (let r = 0; r < members.length; r++) {
                    if (!ids.includes(members[r])) {
                        ids.push(members[r]);
                    }
                }
            });
        } else if (this.state.value.funcs.length) {
            for (let i = ids.length - 1; i >= 0; i--) {
                const id = ids[i];
                // find this id in all functions
                if (!this.state.value.funcs.find(funcId => this.state.enums[funcId].common.members.includes(id))) {
                    ids.splice(i, 1);
                }
            }
        }
        this.state.value.others.forEach(enumId => {
            const members = this.state.enums[enumId].common.members;
            for (let r = 0; r < members.length; r++) {
                if (!ids.includes(members[r])) {
                    ids.push(members[r]);
                }
            }
        });

        for (let i = ids.length - 1; i >= 0; i--) {
            if (!objects[ids[i]]) {
                const obj = await this.props.socket.getObject(ids[i]);
                if (obj) {
                    delete obj.native;
                    objects[ids[i]] = obj;
                } else {
                    objects[ids[i]] = {
                        _id: ids[i],
                        common: {},
                    };
                }
            }
        }

        const icons = JSON.parse(JSON.stringify(this.state.icons));
        try {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (icons[id] === undefined) {
                    icons[id] = Utils.getObjectIcon(objects[id]);
                    if (!icons[id]) {
                        // check the parent
                        const channelId = Utils.getParentId(id);

                        if (channelId && channelId.split('.').length > 2) {
                            const channelObj = await this.props.socket.getObject(channelId);
                            if (channelObj && (channelObj.type === 'channel' || channelObj.type === 'device')) {
                                if (channelObj.common?.icon) {
                                    icons[channelId] = Utils.getObjectIcon(channelObj);
                                    icons[id] = icons[channelId];
                                } else {
                                    // check the parent
                                    const deviceId = Utils.getParentId(channelId);
                                    if (deviceId && deviceId.split('.').length > 2) {
                                        const deviceObj = await this.props.socket.getObject(deviceId);
                                        if (deviceObj && (deviceObj.type === 'channel' || deviceObj.type === 'device')) {
                                            if (deviceObj.common?.icon) {
                                                icons[deviceId] = Utils.getObjectIcon(deviceObj);
                                                icons[channelId] = icons[deviceId];
                                                icons[id] = icons[deviceId];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            window.alert(`Cannot get icons: ${e}`);
        }

        this.setState({ ids, icons, objects });
    }

    static getName(name, lang) {
        return (name && typeof name === 'object') ? (name[lang] || name.en || '') : (name || '');
    }

    renderDevice(id) {
        const member = this.state.objects[id];
        const name = member.common?.name && EnumsSelector.getName(member.common?.name, this.lang);
        // const textColor = Utils.getInvertedColor(props.enum?.common?.color, props.themeType, true);

        return <Card
            key={id}
            title={name ? `${I18n.t('Name: %s', name)}\nID: ${member._id}` : member._id}
            variant="outlined"
            className={this.props.classes.enumGroupMember}
            style={{ opacity: this.state.value.exclude.includes(id) ? 0.5 : 1 }}
        >
            {
                this.state.icons[id] ?
                    <Icon className={this.props.classes.icon} src={this.state.icons[id]} />
                    :
                    (member.type === 'state' ? <IconState className={this.props.classes.icon} />
                            : (member.type === 'channel' ?
                                    <IconChannel className={this.props.classes.icon} />
                                    : member.type === 'device' ?
                                        <IconDevice className={this.props.classes.icon} /> :
                                        <IconList className={this.props.classes.icon} />
                            )
                    )
            }
            <div>
                {name || member._id}
                {name ? <div className={this.props.classes.secondLine}>{member._id}</div> : null}
            </div>
            <IconButton
                size="small"
                onClick={() => {
                    const value = JSON.parse(JSON.stringify(this.state.value));
                    const pos = value.exclude.indexOf(id);
                    if (pos !== -1) {
                        value.exclude.splice(pos, 1);
                    } else {
                        value.exclude.push(id);
                    }
                    this.setState({ value });
                }}
            >
                {this.state.value.exclude.includes(id) ? <Tooltip title={I18n.t('Include')} placement="top">
                    <AddIcon style={{ /* color: textColor */ }} />
                </Tooltip> : <Tooltip title={I18n.t('Exclude')} placement="top">
                    <ClearIcon style={{ /* color: textColor */ }} />
                </Tooltip>}
            </IconButton>
        </Card>;
    }

    render() {
        return <Dialog
            key="selectDialogEnums"
            open={!0}
            fullWidth
            maxWidth="lg"
            classes={{ paper: this.props.classes.dialogPaper }}
            onClose={() => this.setState({ showAddEnumsDialog: false })}
        >
            <DialogTitle>{I18n.t('Select for ')}</DialogTitle>
            <DialogContent>
                <div>
                    <div style={{ width: this.state.others.length ? '66.6%' : '100%', height: 38, textAlign: 'center' }}>
                        {I18n.t('Overlap of rooms and functions')}
                    </div>
                    {this.state.others.length ? <Grid item xs={12} md={4} style={{ height: '100%', overflowY: 'auto' }}>
                        {I18n.t('Additional')}
                    </Grid> : null}
                </div>
                <Grid container spacing={2} style={{ height: 'calc(100% - 38px - 150px)' }}>
                    {this.state.enums ? <Grid item xs={12} md={this.state.others.length ? 4 : 6} style={{ height: '100%', overflowY: 'auto', marginTop: 0 }}>
                        <List
                            sx={{ width: '100%' }}
                            subheader={<ListSubheader component="div" style={{ lineHeight: '32px', fontWeight: 'bold' }}>
                                {I18n.t('Rooms')}
                            </ListSubheader>}
                        >
                            {this.state.rooms.map(id => <ListItem
                                key={id}
                                disablePadding
                            >
                                <ListItemButton
                                    onClick={e => {
                                        const value = JSON.parse(JSON.stringify(this.state.value));
                                        const pos = value.rooms.indexOf(id);
                                        if (pos !== -1) {
                                            value.rooms.splice(pos, 1);
                                        } else {
                                            value.rooms.push(id);
                                        }
                                        this.setState({ value }, () => this.updateAllIds());
                                    }}
                                    dense
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={this.state.value.rooms.includes(id)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={<TextWithIcon value={this.state.enums[id]} lang={this.lang} />} />
                                </ListItemButton>
                            </ListItem>)}
                        </List>
                    </Grid> : <CircularProgress />}
                    {this.state.enums ? <Grid item xs={12} md={this.state.others.length ? 4 : 6} style={{ height: '100%', overflowY: 'auto', marginTop: 0 }}>
                        <List
                            sx={{ width: '100%' }}
                            subheader={<ListSubheader component="div" style={{ lineHeight: '32px', fontWeight: 'bold' }}>
                                {I18n.t('Functions')}
                            </ListSubheader>}
                        >
                            {this.state.funcs.map(id => <ListItem
                                key={id}
                                disablePadding
                            >
                                <ListItemButton
                                    onClick={e => {
                                        const value = JSON.parse(JSON.stringify(this.state.value));
                                        const pos = value.funcs.indexOf(id);
                                        if (pos !== -1) {
                                            value.funcs.splice(pos, 1);
                                        } else {
                                            value.funcs.push(id);
                                        }
                                        this.setState({ value }, () => this.updateAllIds());
                                    }}
                                    dense
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={this.state.value.funcs.includes(id)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={<TextWithIcon value={this.state.enums[id]} lang={this.lang} />} />
                                </ListItemButton>
                            </ListItem>)}
                        </List>
                    </Grid> : null}
                    {this.state.others.length ? <Grid item xs={12} md={4} style={{ height: '100%', overflowY: 'auto' }}>
                        <List
                            sx={{ width: '100%' }}
                            subheader={<ListSubheader component="div" style={{ lineHeight: '32px', fontWeight: 'bold' }}>
                                {I18n.t('Other')}
                            </ListSubheader>}
                        >
                            {this.state.others.map(id => <ListItem
                                key={id}
                                disablePadding
                            >
                                <ListItemButton
                                    onClick={e => {
                                        const value = JSON.parse(JSON.stringify(this.state.value));
                                        const pos = value.others.indexOf(id);
                                        if (pos !== -1) {
                                            value.others.splice(pos, 1);
                                        } else {
                                            value.others.push(id);
                                        }
                                        this.setState({ value }, () => this.updateAllIds());
                                    }}
                                    dense
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={this.state.value.others.includes(id)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary={<TextWithIcon value={this.state.enums[id]} lang={this.lang} />} />
                                </ListItemButton>
                            </ListItem>)}
                        </List>
                    </Grid> : null}
                </Grid>
                <div
                    style={{
                        height: 142,
                        width: '100%',
                        overflowY: 'auto',
                        border: '1px solid grey',
                        boxSizing: 'border-box',
                        marginTop: 8,
                    }}
                >
                    {this.state.ids.map(id => this.renderDevice(id))}
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.props.onClose(this.state.value)}
                    startIcon={this.props.edit ? <IconCheck /> : <IconAddBox />}
                >
                    {this.props.edit ? I18n.t('Apply') : I18n.t('Add')}
                </Button>
                <Button
                    color="grey"
                    onClick={() => this.props.onClose(null)}
                    startIcon={<IconCancel />}
                >
                    {I18n.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

EnumsSelector.propTypes = {
    socket: PropTypes.object,
    onClose: PropTypes.func,
    value: PropTypes.object,
    edit: PropTypes.bool,
    showError: PropTypes.func,
};

export default withStyles(styles)(EnumsSelector);

import React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import I18n from '@iobroker/adapter-react/i18n';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import {FaFolder as IconFolderClosed, FaFolderOpen as IconFolderOpened, FaScroll as IconScript} from 'react-icons/fa';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Switch from '@material-ui/core/Switch';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';

// icons
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';
import {MdModeEdit as IconEdit} from 'react-icons/md';
import {MdClose as IconCancel} from 'react-icons/md';
import {MdCheck as IconCheck} from 'react-icons/md';
import {MdAdd as IconAdd} from 'react-icons/md';
import {MdCreateNewFolder as IconFolderAdd} from 'react-icons/md';

import Utils from '@iobroker/adapter-react/Components/Utils';


const FORBIDDEN_CHARS = /[.\][*,;'"`<>\\?]/g;
const LEVEL_PADDING = 16;

const styles = theme => ({
    scroll: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        width: '100%',
    },
    right: {
        float: 'right',
    },
    heightMinusToolbar: {
        height: 'calc(100% - 48px)',
    },
    mainToolbar: {
        background: theme.palette.primary.main,
    },
    textInput: {
        display: 'block',
    },
    noGutters: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    noPaddings: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    itemIcon: {
        width: 24,
        height: 24,
    },
    itemIconRoot: {
        minWidth: 24 + theme.spacing(1),
    },
    width100: {
        width: '100%',
    },
    leftMenuItem: {
        display: 'block',
        borderRadius: 10,
    },
    alignRight: {
        textAlign: 'right',
    },
    itemIconFolder: {
        color: theme.palette.type === 'dark' ? '#ffca2c' : '#ffca2c'
    },
    changed: {
        position: 'relative',
        '&:after': {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: 6,
            background: '#FF0000',
            position: 'absolute',
            top: 5,
            right: 5,
        },
    },
    disabled: {
        opacity: 0.3
    },
    folderItem: {
        fontWeight: 'bold',
        cursor: 'pointer',
        color: theme.palette.type === 'dark' ? '#FFF': '#000',
    },
    listItemTitle: {
        color: theme.palette.type === 'dark' ? '#FFF': '#000',
    },
    listItemSubTitle: {
        color: theme.palette.type === 'dark' ? '#bababa': '#2a2a2a',
    },
    list: {
        width: '100%',
        padding: 0,
    },
    p: {
        margin: '1em 0',
    },
    folderButtons:  {
        height: 32,
    }
});

class ScenesList extends React.Component {
    constructor(props) {
        super(props);

        let opened;
        try {
            opened = JSON.parse(window.localStorage.getItem('Scenes.opened')) || [];
        } catch (e) {
            opened = [];
        }

        this.state = {
            opened,
            search: '',
            reorder: false,
            showSearch: false,
            addFolderDialog: null,
            addFolderDialogTitle: null,
            editFolderDialogeditFolderDialog: null,
            editFolderDialogTitle: null,
        };
    }

    onAddFolder(parent, id) {
        let opened = JSON.parse(JSON.stringify(this.state.opened));
        opened.push(id);
        this.setState({addFolderDialog: null, opened}, () =>
            this.props.onCreateFolder(parent, id));
    }

    renderAddFolderDialog() {
        return this.state.addFolderDialog ?
            <Dialog
                key="addDialog"
                open={ !!this.state.addFolderDialog }
                onClose={ () => this.setState({addFolderDialog: null}) }
            >
                <DialogTitle>{I18n.t('Create folder')}</DialogTitle>
                <DialogContent className={ this.props.classes.p }>
                    <TextField
                        autoFocus={true}
                        label={ I18n.t('Title') }
                        value={ this.state.addFolderDialogTitle }
                        onChange={ e =>
                            this.setState({addFolderDialogTitle: e.target.value.replace(FORBIDDEN_CHARS, '_')}) }
                        onKeyUp={e => e.keyCode === 13 && this.onAddFolder(this.state.addFolderDialog, this.state.addFolderDialogTitle) }
                    />
                </DialogContent>
                <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                    <Button variant="contained" onClick={ () => this.setState({addFolderDialog: null}) }>
                        <IconCancel className={ this.props.classes.buttonIcon }/>
                        { I18n.t('Cancel') }
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!this.state.addFolderDialogTitle || Object.keys(this.props.folders.subFolders).find(name => name === this.state.addFolderDialogTitle)}
                        onClick={() => this.onAddFolder(this.state.addFolderDialog, this.state.addFolderDialogTitle)}
                        color="primary" autoFocus
                    >
                        <IconCheck className={ this.props.classes.buttonIcon }/>
                        {I18n.t('Create')}
                    </Button>
                </DialogActions>
            </Dialog> : null;
    }

    onRenameFolder(folder, newName) {
        let pos;

        // if selected folder opened, replace its ID in this.state.opened
        if ((pos = this.state.opened.indexOf(folder.prefix)) !== -1) {
            const opened = [...this.state.opened];
            opened.splice(pos, 1);
            opened.push(newName);
            opened.sort();
            this.setState({opened});
        }

        return this.props.onRenameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle)
            .then(() => this.setState({editFolderDialog: null}));
    }

    renderEditFolderDialog() {
        if (!this.state.editFolderDialog) {
            return;
        }

        const isUnique = !Object.keys(this.props.folders.subFolders).find(folder => folder.id === this.state.editFolderDialogTitle);

        return <Dialog
            key="dialogEdit"
            open={ !!this.state.editFolderDialog }
            onClose={ () => this.setState({editFolderDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Edit folder') }</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus={true}
                    label={ I18n.t('Title') }
                    value={ this.state.editFolderDialogTitle }
                    onChange={ e => this.setState({editFolderDialogTitle: e.target.value.replace(FORBIDDEN_CHARS, '_')}) }
                    onKeyUp={e => e.keyCode === 13 && this.onRenameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle) }
                />
            </DialogContent>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({editFolderDialog: null}) }>
                    <IconCancel className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Cancel') }
                </Button>
                <Button
                    variant="contained"
                    disabled={ !this.state.editFolderDialogTitle || this.state.editFolderDialogTitleOrigin === this.state.editFolderDialogTitle || !isUnique}
                    onClick={() => this.onRenameFolder(this.state.editFolderDialog, this.state.editFolderDialogTitle)}
                    color="primary"
                    autoFocus
                >
                    <IconCheck className={ this.props.classes.buttonIcon }/>
                    { I18n.t('Apply') }
                </Button>
            </DialogActions>
        </Dialog>;
    }

    toggleFolder(folder) {
        const opened = [...this.state.opened];
        const pos = opened.indexOf(folder.prefix);
        if (pos === -1) {
            opened.push(folder.prefix);
        } else {
            opened.splice(pos, 1);

            // If active scene is inside this folder select the first scene
            if (Object.keys(folder.scenes).includes(this.props.selectedSceneId)) {
                // To do ask question
                if (this.props.selectedSceneChanged) {
                    this.confirmCb = () => {
                        this.setState({selectedSceneId: '', selectedSceneData: null, selectedSceneChanged: false, opened});
                        window.localStorage.setItem('Scenes.opened', JSON.stringify(opened));
                    };
                    return this.setState({sceneChangeDialog: 'empty'});
                }

                this.setState({selectedSceneId: '', selectedSceneData: null, selectedSceneChanged: false});
            }
        }

        window.localStorage.setItem('Scenes.opened', JSON.stringify(opened));

        this.setState({opened});
    }

    renderTreeScene = (item, level) => {
        const scene = this.props.scenes[item._id];
        if (!scene || (this.state.search && !item.common.name.includes(this.state.search))) {
            return null;
        }

        level = level || 0;

        const changed = this.props.selectedSceneId && this.props.selectedSceneId === scene._id && this.props.selectedSceneChanged;

        return <ListItem
            style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
            key={ item._id }
            classes={{root: this.props.classes.noPaddings}}
            selected={ this.props.selectedSceneId ? this.props.selectedSceneId === scene._id : false }
            button
            className={ clsx(changed && this.props.classes.changed, !scene.common.enabled && this.props.classes.disabled) }
            onClick={ () => this.props.onSceneSelect(scene._id) }>
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} }><IconScript className={ this.props.classes.itemIcon }/></ListItemIcon>
            <ListItemText
                classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                primary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) }
                secondary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}, true) }
            />
            <ListItemSecondaryAction>
                {this.state.changingScene === scene._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <Switch
                        checked={ scene.common.enabled }
                        onChange={event => this.props.onSceneEnableDisable(event.target.name) }
                        name={ scene._id }
                    />
                }
            </ListItemSecondaryAction>
        </ListItem>;
    };

    renderTree(parent, level) {
        let result = [];
        level = level || 0;
        let opened = this.state.opened ? this.state.opened.includes(parent.prefix) : false;

        // Show folder item
        if (parent && parent.id) {
            result.push(<ListItem
                key={ parent.prefix }
                classes={ {gutters: this.props.classes.noGutters, root: this.props.classes.noPaddings} }
                className={ clsx(this.props.classes.width100, this.props.classes.folderItem) }
                style={ {paddingLeft: (level - 1) * LEVEL_PADDING + this.props.theme.spacing(1)} }
            >
                <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleFolder(parent) }>{ opened ?
                    <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                    <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                }</ListItemIcon>
                <ListItemText>{ parent.id }</ListItemText>
                <ListItemSecondaryAction>
                    {opened ? <IconButton
                        onClick={() => this.props.onCreateScene(parent.id) }
                        title={ I18n.t('Create new scene') }
                    ><IconAdd/></IconButton> : null}
                    <IconButton
                        onClick={ () =>
                            this.setState({
                                editFolderDialog: parent,
                                editFolderDialogTitle: parent.id,
                                editFolderDialogTitleOrigin: parent.id
                            })
                        }
                        title={ I18n.t('Edit folder name') }
                    ><IconEdit/></IconButton>
                    <IconButton onClick={ () => this.toggleFolder(parent) } title={ opened ? I18n.t('Collapse') : I18n.t('Expand')  }>
                        { opened ? <IconExpand/> : <IconCollapse/> }
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>);
        }

        if (parent && (opened || !parent.id)) { // root cannot be closed and have id === ''
            const values     = Object.values(parent.scenes);
            const subFolders = Object.values(parent.subFolders);

            // add first sub-folders
            result.push(
                subFolders
                    .sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0))
                    .map(subFolder =>
                        this.renderTree(subFolder, level + 1))
            );

            // Add as second scenes

            result.push(<ListItem
                key={ 'items_' + parent.prefix }
                classes={ {gutters: this.props.classes.noGutters, root: this.props.classes.noPaddings} }
                className={ this.props.classes.width100 }>
                <List
                    variant="dense"
                    className={ this.props.classes.list }
                    classes={ {root: this.props.classes.leftMenuItem} }
                    //style={ {paddingLeft: level * LEVEL_PADDING + this.props.theme.spacing(1)} }
                >
                    { values.length ?
                        values.sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0)).map(scene => this.renderTreeScene(scene, level))
                        :
                        (!subFolders.length ? <ListItem><ListItemText className={ this.props.classes.folderItem}>{ I18n.t('No scenes created yet')}</ListItemText></ListItem> : '')
                    }
                </List>
            </ListItem>);
        }

        return result;
    }

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
            <IconButton
                onClick={ () => this.props.onCreateScene() }
                title={ I18n.t('Create new scene') }
            ><IconAdd/></IconButton>

            <IconButton
                onClick={ () => this.setState({addFolderDialog: this.props.folders, addFolderDialogTitle: ''}) }
                title={ I18n.t('Create new folder') }
            ><IconFolderAdd/></IconButton>

            <span className={this.props.classes.right}>
                <IconButton onClick={() => this.setState({showSearch: !this.state.showSearch}) }>
                    <SearchIcon/>
                </IconButton>
            </span>
            {this.state.showSearch ?
                <TextField
                    value={ this.state.search }
                    className={ this.props.classes.textInput }
                    onChange={ e => this.setState({search: e.target.value}) }/>
                : null
            }
        </Toolbar>;
    }

    render() {
        return [
            this.renderListToolbar(),
            <div key="list" className={ this.props.classes.heightMinusToolbar }>
                <List className={ this.props.classes.scroll }>
                    { this.renderTree(this.props.folders) }
                </List>
            </div>,
            this.renderAddFolderDialog(),
            this.renderEditFolderDialog()
        ];
    }
}

ScenesList.propTypes = {
    onRenameFolder: PropTypes.func,
    onCreateScene: PropTypes.func,
    onCreateFolder: PropTypes.func,
    onSceneSelect: PropTypes.func,
    onSceneEnableDisable: PropTypes.func,
    classes: PropTypes.object,
    scenes: PropTypes.object,
    selectedSceneId: PropTypes.string,
    selectedSceneChanged: PropTypes.bool,
    theme: PropTypes.object,
    folders: PropTypes.object,
};

export default withStyles(styles)(ScenesList);
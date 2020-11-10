import React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import { useDrag, useDrop, DndProvider as DragDropContext } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'

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
import {MdSwapVert as IconReorder} from 'react-icons/md';

import Utils from '@iobroker/adapter-react/Components/Utils';

const LEVEL_PADDING = 16;

export const Droppable = (props) => {
    const { onDrop} = props;

    const [{ isOver, isOverAny}, drop] = useDrop({
        accept: ['item'],
        drop: e => isOver ? onDrop(e) : undefined,
        collect: monitor => ({
            isOver: monitor.isOver({ shallow: true }),
            isOverAny: monitor.isOver(),
        }),
    });

    return <div ref={drop} className={clsx(isOver && 'js-folder-dragover', isOverAny && 'js-folder-dragging')}>
        {props.children}
    </div>;
};

export const Draggable = (props) => {
    const { name } = props;
    const [{ opacity }, drag] = useDrag({
        item: {
            name,
            type: 'item'
        },
        collect: (monitor) => ({
            opacity: monitor.isDragging() ? 0.3 : 1,
        }),
    });

    // About transform: https://github.com/react-dnd/react-dnd/issues/832#issuecomment-442071628
    return <div ref={drag} style={{ opacity, transform: 'translate3d(0, 0, 0)' }}>
        {props.children}
    </div>;
};

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
    },
    mainList: {
        width: 'calc(100% - ' + theme.spacing(1) + 'px)',
        marginLeft: theme.spacing(1),
        '& .js-folder-dragover>li.folder-reorder': {
            background: '#40adff'
        },
        '& .js-folder-dragging .folder-reorder': {
            opacity: 1,
        },
        '& .js-folder-dragging .item-reorder': {
            opacity: 0.3,
        }
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
                            this.setState({addFolderDialogTitle: e.target.value.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\./g, '_')}) }
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
                    onChange={ e => this.setState({editFolderDialogTitle: e.target.value.replace(Utils.FORBIDDEN_CHARS, '_').replace(/\./g, '_')}) }
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

        const listItem = <ListItem
            style={ {paddingLeft: (this.state.reorder ? level : (level - 1)) * LEVEL_PADDING} }
            key={ item._id }
            classes={{root: this.props.classes.noPaddings}}
            selected={ this.props.selectedSceneId ? this.props.selectedSceneId === scene._id : false }
            button
            className={ clsx(
                changed && this.props.classes.changed,
                !scene.common.enabled && this.props.classes.disabled,
                this.state.reorder && 'item-reorder'
            ) }
            onClick={ () => this.props.onSceneSelect(scene._id) }>
            <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} }><IconScript className={ this.props.classes.itemIcon }/></ListItemIcon>
            <ListItemText
                classes={ {primary: this.props.classes.listItemTitle, secondary: this.props.classes.listItemSubTitle} }
                primary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}) }
                secondary={ Utils.getObjectNameFromObj(scene, null, {language: I18n.getLanguage()}, true) }
            />
            {!this.state.reorder ? <ListItemSecondaryAction>
                {this.state.changingScene === scene._id ?
                    <CircularProgress size={ 24 }/>
                    :
                    <Switch
                        checked={ scene.common.enabled }
                        onChange={event => this.props.onSceneEnableDisable(event.target.name) }
                        name={ scene._id }
                    />
                }
            </ListItemSecondaryAction> : null}
        </ListItem>;

        if (this.state.reorder) {
            return <Draggable key={'draggable_' + item._id} name={item._id}>{listItem}</Draggable>;
        } else {
            return  listItem;
        }
    };

    onDragFinish(source, target) {
        console.log('Rename ' + source + ' => ' + target);
        let newId = target + '.' + source.split('.').pop();
        if (source !== newId) {
            if (this.props.scenes[newId]) {
                newId += '_' + I18n.t('copy');
            }
            this.props.onMoveScene(source, newId);
        }
    }

    renderTree(parent, level) {
        let result = [];
        level = level || 0;
        let opened = this.state.reorder ||(this.state.opened ? this.state.opened.includes(parent.prefix) : false);

        const reactChildren = [];
        if (parent && (opened || !parent.id)) { // root cannot be closed and have id === ''
            const values     = Object.values(parent.scenes);
            const subFolders = Object.values(parent.subFolders);

            // add first sub-folders
            subFolders
                .sort((a, b) => a.id > b.id ? 1 : (a.id < b.id ? -1 : 0))
                .forEach(subFolder =>
                    reactChildren.push(this.renderTree(subFolder, level + 1)));

            // Add as second scenes
            if (values.length || subFolders.length) {
                values
                    .sort((a, b) => a._id > b._id ? 1 : (a._id < b._id ? -1 : 0))
                    .forEach(scene =>
                        reactChildren.push(this.renderTreeScene(scene, level + 1)));
            } else {
                reactChildren.push(<ListItem><ListItemText className={ this.props.classes.folderItem}>{ I18n.t('No scenes created yet')}</ListItemText></ListItem>);
            }
        }

        // Show folder item
        if (parent && (parent.id || this.state.reorder)) {
            const folder = <ListItem
                key={ parent.prefix }
                classes={ {gutters: this.props.classes.noGutters, root: this.props.classes.noPaddings} }
                className={ clsx(this.props.classes.width100, this.props.classes.folderItem, this.state.reorder && 'folder-reorder') }
                style={ {paddingLeft: (this.state.reorder ? level : (level - 1)) * LEVEL_PADDING} }
            >
                <ListItemIcon classes={ {root: this.props.classes.itemIconRoot} } onClick={ () => this.toggleFolder(parent) }>{ opened ?
                    <IconFolderOpened className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/> :
                    <IconFolderClosed className={ clsx(this.props.classes.itemIcon, this.props.classes.itemIconFolder) }/>
                }</ListItemIcon>
                <ListItemText>{ parent.id || I18n.t('Root') }</ListItemText>
                {!this.state.reorder ? <ListItemSecondaryAction>
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
                </ListItemSecondaryAction> : null}
            </ListItem>;

            if (!this.state.reorder) {
                result.push(folder);
            } else {
                result.push(<Droppable
                    key={'droppable_' + parent.prefix}
                    name={parent.prefix}
                    onDrop={e => this.onDragFinish(e.name, 'scene.0' + (parent.prefix ? '.' : '') + parent.prefix)}
                >
                    {folder}
                </Droppable>);
            }
        }

        reactChildren && reactChildren.forEach(r => result.push(r));

        return result;
    }

    renderListToolbar() {
        return <Toolbar key="toolbar" variant="dense" className={ this.props.classes.mainToolbar }>
            {!this.state.reorder ? <IconButton
                onClick={ () => this.props.onCreateScene() }
                title={ I18n.t('Create new scene') }
            ><IconAdd/></IconButton> : null}

                {!this.state.reorder ? <IconButton
                onClick={ () => this.setState({addFolderDialog: this.props.folders, addFolderDialogTitle: ''}) }
                title={ I18n.t('Create new folder') }
            ><IconFolderAdd/></IconButton> : null}

            {!this.state.reorder ? <span className={this.props.classes.right}>
                <IconButton onClick={() => this.setState({showSearch: !this.state.showSearch}) }>
                    <SearchIcon/>
                </IconButton>
            </span> : null}
            {this.state.showSearch ?
                <TextField
                    value={ this.state.search }
                    className={ this.props.classes.textInput }
                    onChange={ e => this.setState({search: e.target.value}) }/>
                : null
            }
            <div style={{flexGrow: 1}}/>
            {!this.state.showSearch ? <IconButton
                key="reorder"
                title={I18n.t('Reorder scenes in folders')}
                className={this.props.classes.toolbarButtons}
                style={{color: this.state.reorder ? 'red' : undefined, float: 'right'}}
                onClick={e => {
                    e.stopPropagation();
                    this.setState({reorder: !this.state.reorder});
                }}
            ><IconReorder/></IconButton> : null }
        </Toolbar>;
    }

    render() {
        return [
            this.renderListToolbar(),
            <div key="list" className={ this.props.classes.heightMinusToolbar }>
                <DragDropContext backend={HTML5Backend}>
                    <List className={ clsx(this.props.classes.scroll, this.props.classes.mainList) }>
                        { this.renderTree(this.props.folders) }
                    </List>
                </DragDropContext>
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
    onMoveScene: PropTypes.func,
    onSceneEnableDisable: PropTypes.func,
    classes: PropTypes.object,
    scenes: PropTypes.object,
    selectedSceneId: PropTypes.string,
    selectedSceneChanged: PropTypes.bool,
    theme: PropTypes.object,
    folders: PropTypes.object,
};

export default withStyles(styles)(ScenesList);
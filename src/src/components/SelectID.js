/**
 * Copyright 2018-2020 bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';

import I18n from '@iobroker/adapter-react/i18n';
import ObjectBrowser from './ObjectBrowser';
import {withStyles} from '@material-ui/core/styles/index';

const styles = theme => ({
    headerID: {
        fontWeight: 'bold',
        fontStyle: 'italic'
    },
    dialog: {
        height: '95%'
    },
    content: {
        height: '100%',
        overflow: 'hidden'
    }
});

class DialogSelectID extends React.Component {
    constructor(props) {
        super(props);
        this.dialogName = this.props.dialogName || 'default';
        this.dialogName = 'SelectID.' + this.dialogName;

        this.filters = window.localStorage.getItem(this.dialogName) || '{}';

        try {
            this.filters = JSON.parse(this.filters);
        } catch (e) {
            this.filters = {};
        }

        let selected = this.props.selected || [];
        if (typeof selected !== 'object') {
            selected = [selected];
        }
        selected = selected.filter(id => id);

        this.state =  {
            selected,
            name: ''
        };
    }

    handleCancel() {
        this.props.onClose();
    };

    handleOk() {
        this.props.onOk(this.props.multiSelect ? this.state.selected : this.state.selected[0] || '', this.state.name);
        this.props.onClose();
    };

    render() {
        let title;
        if (this.state.name || this.state.selected.length) {
            if (this.state.selected.length === 1) {
                title = [
                    <span key="selected">{ I18n.t('Selected') } </span>,
                    <span key="id" className={ this.props.classes.headerID }>{
                        (this.state.name || this.state.selected) + (this.state.name ? ' [' + this.state.selected + ']' : '')
                    }</span>
                ];
            } else {
                title = [
                    <span key="selected">{ I18n.t('Selected') } </span>,
                    <span key="id" className={ this.props.classes.headerID }>{
                        I18n.t('%s items', this.state.selected.length)
                    }</span>
                ];
            }
        } else {
            title = this.props.title || I18n.t('Please select object ID...');
        }

        return (
            <Dialog
                disableBackdropClick
                maxWidth={false}
                disableEscapeKeyDown
                classes={{paper: this.props.classes.dialog}}
                fullWidth={true}
                open={true}
                aria-labelledby="selectid-dialog-title"
            >
                <DialogTitle id="selectid-dialog-title">{ title }</DialogTitle>
                <DialogContent className={this.props.classes.content}>
                    <ObjectBrowser
                        prefix={ this.props.prefix }
                        defaultFilters={ this.filters }
                        showExpertButton={ this.props.showExpertButton !== undefined ? this.props.showExpertButton : true }
                        style={ {width: '100%', height: '100%'} }
                        columns={ this.props.columns || ['name', 'type', 'role', 'room', 'func', 'val'] }
                        types={ this.props.types || ['state'] }
                        t={ I18n.t }
                        socket={ this.props.socket }
                        selected={ this.state.selected }
                        multiSelect={ this.props.multiSelect }
                        name={ this.state.name }
                        theme={ this.props.theme }
                        onFilterChanged={ filterConfig => {
                            this.filters = filterConfig;
                            window.localStorage.setItem(this.dialogName, JSON.stringify(filterConfig));
                        } }
                        onSelect={ (selected, name, isDouble) => {
                            if (JSON.stringify(selected) !== JSON.stringify(this.state.selected)) {
                                this.setState({selected, name}, () =>
                                    isDouble && this.handleOk());
                            } else if (isDouble) {
                                this.handleOk();
                            }
                        } }
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={ () => this.handleOk() } disabled={ !this.state.selected.length } color="primary">{ this.props.ok || I18n.t('Ok') }</Button>
                    <Button onClick={ () => this.handleCancel() } color="primary">{ this.props.cancel || I18n.t('Cancel') }</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

DialogSelectID.propTypes = {
    classes: PropTypes.object,
    onClose: PropTypes.func,
    dialogName: PropTypes.string,
    onOk: PropTypes.func.isRequired,
    title: PropTypes.string,
    selected: PropTypes.string,
    statesOnly: PropTypes.bool,
    socket: PropTypes.object.isRequired,
    cancel: PropTypes.string,
    prefix: PropTypes.string,
    ok: PropTypes.string,
    theme: PropTypes.string,
    showExpertButton: PropTypes.bool,
    multiSelect: PropTypes.bool,
    types: PropTypes.array,   // optional ['state', 'instance', 'channel']
    columns: PropTypes.array, // optional ['name', 'type', 'role', 'room', 'func', 'val', 'buttons']
};

export default withStyles(styles)(DialogSelectID);

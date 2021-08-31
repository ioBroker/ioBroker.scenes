// Common
import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools'

// icons
import {MdClose as IconClose} from 'react-icons/md';
import IconCopy from '@iobroker/adapter-react/icons/IconCopy';
import {MdCheck as IconCheck} from 'react-icons/md';

// Own
import I18n from '@iobroker/adapter-react/i18n';
import copy from '@iobroker/adapter-react/Components/copy-to-clipboard';

const styles = theme => ({
    divWithoutTitle: {
        width: '100%',
        height: '100%',
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    },
});

class ExportImportDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            text: props.sceneObj ? JSON.stringify(props.sceneObj, null, 2) : '',
            error: false,
            toast: '',
        };
    }

    onChange(value) {
        const newState = {text: value};
        try {
            JSON.parse(value);
            if (this.state.error) {
                newState.error = false;
            }

            this.setState(newState);
        } catch (e) {
            newState.error = true;
            this.setState(newState);
        }
    }

    renderToast() {
        return <Snackbar open={ !!this.state.toast } autoHideDuration={ 3000 } onClick={ () => this.setState({ toast: '' }) } onClose={ () => this.setState({ toast: '' }) }>
            <Alert color="info" severity="success" >{ this.state.toast }</Alert>
        </Snackbar>;
    }

    render() {
        return <Dialog
            open={ true }
            onClose={ () => this.props.onClose() }
            aria-labelledby="export-dialog-title"
            fullWidth
            maxWidth="lg"
            fullScreen={ true }
            aria-describedby="export-dialog-description"
        >
            <DialogTitle id="export-dialog-title">{ this.props.isImport ? I18n.t('Import scene') : I18n.t('Export scene') }</DialogTitle>
            <DialogContent>
                <div className={ clsx(this.props.classes.divWithoutTitle, this.state.error && this.props.classes.error) }>
                    <AceEditor
                        autoFocus
                        mode="json"
                        width="100%"
                        height="100%"
                        onLoad={editor => {
                            this.codeEditor = editor;
                            this.codeEditor.focus();
                        }}
                        theme={ this.props.themeType === 'dark' ? 'clouds_midnight' : 'chrome' }
                        onChange={ newValue => this.onChange(newValue) }
                        value={ this.state.text || '' }
                        name="UNIQUE_ID_OF_DIV"
                        fontSize={ 14 }
                        readOnly={ !this.props.isImport }
                        editorProps={{ $blockScrolling: true }}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                { this.props.isImport ?
                    <Button
                        disabled={ !this.state.text || this.state.error }
                        onClick={ () => this.props.onClose(JSON.parse(this.state.text)) }
                        color="primary"
                        startIcon={<IconCheck />}
                    >
                        { I18n.t('Import') }
                    </Button>
                    :
                    <Button
                        onClick={ () => {
                            copy(this.state.text);
                            this.setState({ toast: I18n.t('Copied') });
                            setTimeout(() => this.props.onClose(), 500);
                        }}
                        color="primary"
                        autoFocus
                        startIcon={<IconCopy />}
                    >
                        { I18n.t('Copy to clipboard') }
                    </Button>}
                <Button
                    onClick={ () => this.props.onClose() }
                    autoFocus={ !this.props.isImport }
                    startIcon={<IconClose />}
                >
                    { I18n.t('Close') }
                </Button>
                { this.renderToast() }
            </DialogActions>
        </Dialog>;
    }
}

ExportImportDialog.propTypes = {
    classes: PropTypes.object,
    sceneObj: PropTypes.object,
    themeType: PropTypes.string,
    onClose: PropTypes.func,
    isImport: PropTypes.bool,
};

export default withStyles(styles)(ExportImportDialog);
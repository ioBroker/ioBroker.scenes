// Common
import React from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Alert, Snackbar } from '@mui/material';

import AceEditor from 'react-ace';
import type { Editor } from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/ext-language_tools';

// icons
import { Close as IconClose, Check as IconCheck } from '@mui/icons-material';

// Own
import { Utils, I18n, IconCopy, type ThemeType } from '@iobroker/adapter-react-v5';
import type { SceneObject } from '../types';

const styles: Record<'divWithoutTitle' | 'error' | 'dialogHeight', React.CSSProperties> = {
    divWithoutTitle: {
        width: 'calc(100% - 4px)',
        height: 'calc(100% - 4px)',
        border: '2px solid #00000000',
    },
    error: {
        border: '2px solid #FF0000',
    },
    dialogHeight: {
        height: 'calc(100% - 64px)',
    },
};

interface ExportImportDialogProps {
    scenesObj?: Record<string, SceneObject>;
    sceneObj?: SceneObject;
    themeType: ThemeType;
    onClose: (scenes?: Record<string, SceneObject>, scene?: SceneObject) => void;
    isImport: boolean;
    allScenes?: boolean;
}

interface ExportImportDialogState {
    showWarning: SceneObject | null;
    text: string;
    error: boolean;
    toast: string;
}

class ExportImportDialog extends React.Component<ExportImportDialogProps, ExportImportDialogState> {
    private codeEditor: Editor | null = null;

    constructor(props: ExportImportDialogProps) {
        super(props);

        this.state = {
            text: !props.allScenes
                ? props.sceneObj
                    ? JSON.stringify(props.sceneObj, null, 2)
                    : ''
                : props.scenesObj
                  ? JSON.stringify(props.scenesObj, null, 2)
                  : '',
            error: false,
            toast: '',
            showWarning: null,
        };
    }

    onChange(value: string): void {
        const newState: Partial<ExportImportDialogState> = { text: value };
        try {
            JSON.parse(value);
            if (this.state.error) {
                newState.error = false;
            }

            this.setState(newState as ExportImportDialogState);
        } catch {
            newState.error = true;
            this.setState(newState as ExportImportDialogState);
        }
    }

    renderToast(): React.JSX.Element {
        return (
            <Snackbar
                open={!!this.state.toast}
                autoHideDuration={3000}
                onClick={() => this.setState({ toast: '' })}
                onClose={() => this.setState({ toast: '' })}
            >
                <Alert
                    color="info"
                    severity="success"
                >
                    {this.state.toast}
                </Alert>
            </Snackbar>
        );
    }

    renderWarningDialog(): React.JSX.Element | null {
        if (!this.state.showWarning) {
            return null;
        }
        return (
            <Dialog
                open={!0}
                onClose={() => this.setState({ showWarning: null })}
            >
                <DialogTitle>{I18n.t('Scene will be overwritten and cannot be undone!')}</DialogTitle>
                <DialogContent>{I18n.t('Are you sure?')}</DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.props.onClose(undefined, this.state.showWarning!);
                            this.setState({ showWarning: null });
                        }}
                        color="primary"
                        autoFocus
                        startIcon={<IconCheck />}
                    >
                        {I18n.t('Overwrite')}
                    </Button>
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.setState({ showWarning: null })}
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Close')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    render(): React.JSX.Element {
        return (
            <Dialog
                open={!0}
                sx={{ '& .MuiDialog-paper': styles.dialogHeight }}
                onClose={() => this.props.onClose()}
                aria-labelledby="export-dialog-title"
                fullWidth
                maxWidth="xl"
                aria-describedby="export-dialog-description"
            >
                {this.renderWarningDialog()}
                <DialogTitle id="export-dialog-title">
                    {this.props.isImport ? I18n.t('Import scene') : I18n.t('Export scene')}
                </DialogTitle>
                <DialogContent>
                    <div style={{ ...styles.divWithoutTitle, ...(this.state.error ? styles.error : undefined) }}>
                        <AceEditor
                            mode="json"
                            width="100%"
                            height="100%"
                            onLoad={editor => {
                                this.codeEditor = editor;
                                this.codeEditor.focus();
                            }}
                            theme={this.props.themeType === 'dark' ? 'clouds_midnight' : 'chrome'}
                            onChange={newValue => this.onChange(newValue)}
                            value={this.state.text || ''}
                            name="UNIQUE_ID_OF_DIV"
                            fontSize={14}
                            readOnly={!this.props.isImport}
                            editorProps={{ $blockScrolling: true }}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    {this.props.isImport ? (
                        <Button
                            variant="contained"
                            disabled={!this.state.text || this.state.error}
                            onClick={() => {
                                try {
                                    if (this.props.allScenes) {
                                        const scenes: Record<string, SceneObject> = JSON.parse(this.state.text);
                                        this.props.onClose(scenes);
                                    } else {
                                        const scene: SceneObject = JSON.parse(this.state.text);
                                        this.setState({ showWarning: scene });
                                    }
                                } catch {
                                    this.setState({ toast: I18n.t('Cannot parse') });
                                }
                            }}
                            color="primary"
                            startIcon={<IconCheck />}
                        >
                            {I18n.t('Import')}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => {
                                Utils.copyToClipboard(this.state.text);
                                this.setState({ toast: I18n.t('Copied') });
                                setTimeout(() => this.props.onClose(), 500);
                            }}
                            color="primary"
                            autoFocus
                            startIcon={<IconCopy />}
                        >
                            {I18n.t('Copy to clipboard')}
                        </Button>
                    )}
                    <Button
                        color="grey"
                        variant="contained"
                        onClick={() => this.props.onClose()}
                        autoFocus={!this.props.isImport}
                        startIcon={<IconClose />}
                    >
                        {I18n.t('Close')}
                    </Button>
                    {this.renderToast()}
                </DialogActions>
            </Dialog>
        );
    }
}

export default ExportImportDialog;

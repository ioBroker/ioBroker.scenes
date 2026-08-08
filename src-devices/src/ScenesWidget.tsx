import type { Theme } from '@mui/material';
import WidgetGeneric, {
    React,
    MuiMaterial,
    MuiIcons,
    getTileStyles,
    isNeumorphicTheme,
    type WidgetGenericProps,
    type WidgetGenericState,
    type CustomWidgetPlugin,
} from '@iobroker/dm-widgets';
import type { ConfigItemPanel } from '@iobroker/dm-utils';
import { Icon } from '@iobroker/gui-components';
import type { SceneObject } from '../../src/types';

const { Box, Typography } = MuiMaterial || {};
const PlayArrowIcon = MuiIcons?.PlayArrow;
const MovieIcon = MuiIcons?.Movie;

interface ScenesWidgetSettings extends CustomWidgetPlugin {
    sceneStateId?: string;
    widgetIcon?: string;
    widgetIconActive?: string;
    /** Confirmation: 'none', 'dialog', 'pin' */
    confirm?: 'none' | 'dialog' | 'pin';
    /** Custom confirmation text */
    confirmText?: string;
    /** PIN code */
    pin?: string;
}

/** Scene state: true = active, false = inactive, 'uncertain' = not all devices match */
type SceneActivity = boolean | 'uncertain' | null;

interface ScenesWidgetState extends WidgetGenericState {
    active: SceneActivity;
    sceneName: string;
    lastActivated: number | null;
    /** true if the scene has onFalse enabled — can be toggled on/off */
    canDeactivate: boolean;
}

type StateHandler = (id: string, state: ioBroker.State | null | undefined) => void;

export default class ScenesWidget extends WidgetGeneric<ScenesWidgetState, ScenesWidgetSettings> {
    static getConfigSchema(): { name: string; schema: ConfigItemPanel } {
        return {
            name: 'Scenes',
            schema: {
                type: 'panel',
                label: 'sc_Scene',
                items: {
                    sceneStateId: {
                        type: 'objectId',
                        label: 'sc_Scene state',
                        root: 'scene.0',
                        fillOnSelect: 'common.name=>name(X)',
                    },
                    name: { type: 'text', label: 'sc_Name', default: '' },
                    widgetIcon: {
                        type: 'component',
                        subType: 'iconSelect',
                        label: 'sc_Icon',
                        sm: 6,
                    },
                    widgetIconActive: {
                        type: 'component',
                        subType: 'iconSelect',
                        label: 'sc_Active icon',
                        sm: 6,
                    },
                    confirm: {
                        type: 'select',
                        label: 'sc_Confirmation',
                        options: [
                            { value: 'none', label: 'sc_No confirmation' },
                            { value: 'dialog', label: 'sc_Confirm dialog' },
                            { value: 'pin', label: 'sc_PIN code' },
                        ],
                        default: 'none',
                        format: 'dropdown',
                    },
                    confirmText: {
                        type: 'text',
                        label: 'sc_Confirmation text',
                        default: '',
                        hidden: "!data.confirm || data.confirm === 'none'",
                    },
                    pin: {
                        type: 'text',
                        label: 'sc_PIN',
                        default: '',
                        hidden: "data.confirm !== 'pin'",
                    },
                },
            },
        };
    }

    private sceneHandler: StateHandler | null = null;
    private timerInterval: ReturnType<typeof setInterval> | null = null;

    constructor(props: WidgetGenericProps<ScenesWidgetSettings>) {
        super(props);
        this.state = {
            ...this.state,
            active: null,
            sceneName: '',
            lastActivated: null,
            canDeactivate: false,
        };
    }

    componentDidMount(): void {
        super.componentDidMount?.();
        this.subscribe();
        this.timerInterval = setInterval(() => {
            if (this.state.lastActivated != null) {
                this.forceUpdate();
            }
        }, 60_000);
    }

    componentDidUpdate(prev: WidgetGenericProps<ScenesWidgetSettings>, prevState: ScenesWidgetState): void {
        super.componentDidUpdate?.(prev, prevState);
        if (prev.settings.sceneStateId !== this.props.settings.sceneStateId) {
            this.unsubscribeScene();
            this.subscribe();
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount?.();
        this.unsubscribeScene();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private subscribe(): void {
        const ctx = this.props.stateContext;
        const { sceneStateId } = this.props.settings;
        if (!ctx || !sceneStateId) {
            return;
        }

        this.sceneHandler = (_id, state) => {
            const val = state?.val;
            let active: SceneActivity;
            if (val === 'uncertain') {
                active = 'uncertain';
            } else {
                active = val === true || val === 'true';
            }
            this.setState({
                active,
                lastActivated: active === true ? (state?.lc ?? Date.now()) : this.state.lastActivated,
            });
        };
        ctx.getState(sceneStateId, this.sceneHandler);

        void ctx.getObject<ioBroker.Object>(sceneStateId).then(obj => {
            const cName = obj?.common?.name;
            const update: Partial<ScenesWidgetState> = {};
            if (cName) {
                const name =
                    typeof cName === 'string'
                        ? cName
                        : (cName as Record<string, string>).en ||
                          Object.values(cName as Record<string, string>)[0] ||
                          '';
                if (!this.props.settings.name) {
                    update.sceneName = name;
                }
            }
            // Check if scene supports deactivation (has onFalse enabled)
            const native = (obj as SceneObject)?.native;
            update.canDeactivate = !!native?.onFalse?.enabled;
            this.setState(update as ScenesWidgetState);
        });
    }

    private unsubscribeScene(): void {
        const ctx = this.props.stateContext;
        const { sceneStateId } = this.props.settings;
        if (ctx && this.sceneHandler && sceneStateId) {
            ctx.removeState(sceneStateId, this.sceneHandler);
            this.sceneHandler = null;
        }
    }

    private executeAction(): void {
        const { sceneStateId } = this.props.settings;
        if (!sceneStateId) {
            return;
        }
        const socket = this.props.stateContext.getSocket();
        // Toggle: if scene is active and supports deactivation, send false; otherwise send true
        const value = this.state.canDeactivate && this.state.active === true ? false : true;
        void socket.setState(sceneStateId, value);
    }

    private handleTileClick = (): void => {
        const { confirm } = this.props.settings;
        if (confirm === 'pin') {
            this.showPinPad(this.props.settings.pin || '');
        } else if (confirm === 'dialog') {
            this.showConfirmDialog('dialog', undefined, this.props.settings.confirmText);
        } else {
            this.executeAction();
        }
    };

    // --- Generic callbacks ---

    protected onPinPadSuccess(): void {
        this.executeAction();
    }

    protected onConfirmDialogSuccess(): void {
        this.executeAction();
    }

    // --- Overrides ---

    protected isTileActive(): boolean {
        return this.state.active === true || this.state.active === 'uncertain';
    }

    // eslint-disable-next-line class-methods-use-this
    protected hasTileAction(): boolean {
        return true;
    }

    protected onTileClick(): void {
        this.handleTileClick();
    }

    private renderIcon(activity: SceneActivity, size: string): React.JSX.Element {
        const { widgetIcon, widgetIconActive, color, colorActive } = this.props.settings;
        const activeColor = colorActive || color;
        const isActive = activity === true;
        const isUncertain = activity === 'uncertain';
        let icon = (isActive || isUncertain) && widgetIconActive ? widgetIconActive : widgetIcon;

        if (icon) {
            if (!icon.startsWith('http://') && !icon.startsWith('https://') && !icon.startsWith('data:image')) {
                icon = this.props.stateContext.imagePrefix + (icon.startsWith('/') ? icon.substring(1) : icon);
            }
            return (
                <Icon
                    src={icon}
                    style={{
                        width: size,
                        height: size,
                        objectFit: 'contain',
                        filter: isActive ? undefined : isUncertain ? 'opacity(0.6)' : 'grayscale(100%) opacity(0.5)',
                    }}
                />
            );
        }

        return isActive ? (
            <PlayArrowIcon sx={{ fontSize: size, color: activeColor || '#4caf50' }} />
        ) : isUncertain ? (
            <PlayArrowIcon sx={{ fontSize: size, color: '#ff9800', opacity: 0.7 }} />
        ) : (
            <MovieIcon sx={{ fontSize: size, opacity: 0.5 }} />
        );
    }

    renderCompact(): React.JSX.Element {
        const { active, sceneName, lastActivated } = this.state;
        const { color, colorActive, sceneStateId } = this.props.settings;
        const displayName = this.props.settings.name || sceneName || 'Scene';
        const isActive = active === true;
        const isUncertain = active === 'uncertain';
        const tileActive = isActive || isUncertain;
        const clickable = !!sceneStateId;
        const settingsButton = this.renderSettingsButton();
        const indicators = this.renderIndicators(settingsButton);

        return (
            <Box sx={(theme: Theme) => WidgetGeneric.getStyleCompact(theme)}>
                <Box
                    onClick={clickable ? this.handleTileClick : undefined}
                    sx={(theme: Theme) => {
                        const accentColor = isUncertain ? '#ff9800' : tileActive ? colorActive || color : color;
                        const tile = getTileStyles(theme, tileActive, accentColor, clickable, color);
                        return {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            aspectRatio: '1',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: clickable ? 'pointer' : 'default',
                            ...tile,
                            padding: isNeumorphicTheme(theme) ? 'max(12px, 8cqi)' : 'max(16px, 10cqi)',
                        };
                    }}
                >
                    {indicators}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {this.renderIcon(active, 'max(48px, 30cqi)')}
                    </Box>
                    <Box sx={{ width: '100%', textAlign: 'left' }}>
                        <Typography
                            variant="body2"
                            noWrap
                            sx={(theme: Theme) => ({
                                fontWeight: 600,
                                fontSize: 'max(0.75rem, 4cqi)',
                                lineHeight: 1.3,
                                ...(isNeumorphicTheme(theme)
                                    ? {
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.08em',
                                          fontSize: 'max(0.65rem, 3.5cqi)',
                                      }
                                    : {}),
                            })}
                        >
                            {displayName}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.6,
                                fontSize: 'max(0.6rem, 3cqi)',
                                display: 'block',
                                lineHeight: 1.2,
                                color: isUncertain ? '#ff9800' : undefined,
                            }}
                        >
                            {isUncertain
                                ? 'uncertain'
                                : isActive && lastActivated
                                  ? this.fromNow(lastActivated)
                                  : !sceneStateId
                                    ? '—'
                                    : ''}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    renderWide(): React.JSX.Element {
        const { active, sceneName, lastActivated } = this.state;
        const { color, colorActive, sceneStateId } = this.props.settings;
        const displayName = this.props.settings.name || sceneName || 'Scene';
        const isActive = active === true;
        const isUncertain = active === 'uncertain';
        const tileActive = isActive || isUncertain;
        const clickable = !!sceneStateId;
        const settingsButton = this.renderSettingsButton();
        const indicators = this.renderIndicators(settingsButton);

        return (
            <Box sx={(theme: Theme) => WidgetGeneric.getStyleWide(theme)}>
                <Box
                    onClick={clickable ? this.handleTileClick : undefined}
                    sx={(theme: Theme) => {
                        const accentColor = isUncertain ? '#ff9800' : tileActive ? colorActive || color : color;
                        const tile = getTileStyles(theme, tileActive, accentColor, clickable, color);
                        return {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: '100%',
                            height: 80,
                            position: 'relative',
                            cursor: clickable ? 'pointer' : 'default',
                            overflow: 'hidden',
                            ...tile,
                        };
                    }}
                >
                    {indicators}
                    <Box sx={{ flexShrink: 0, fontSize: 32, pl: 2, display: 'flex', alignItems: 'center' }}>
                        {this.renderIcon(active, '32px')}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            noWrap
                            sx={(theme: Theme) => ({
                                fontWeight: 600,
                                ...(isNeumorphicTheme(theme)
                                    ? { textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }
                                    : {}),
                            })}
                        >
                            {displayName}
                        </Typography>
                        {isUncertain ? (
                            <Typography
                                variant="caption"
                                sx={{ color: '#ff9800', opacity: 0.8, display: 'block' }}
                            >
                                uncertain
                            </Typography>
                        ) : isActive && lastActivated ? (
                            <Typography
                                variant="caption"
                                sx={{ opacity: 0.6, display: 'block' }}
                            >
                                {this.fromNow(lastActivated)}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
                {settingsButton}
            </Box>
        );
    }
}

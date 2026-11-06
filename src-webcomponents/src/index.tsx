/**
 * A scene of the scenes adapter as a web component: `<iob-scenes-scene>` - the web component of the devices widget
 * "Scene Button" (`src-devices/src/ScenesWidget.tsx`).
 *
 * One module for every host - vis-2, devices, Aura, admin (`@iobroker/web-components`). Its manifest is a file of
 * its own (`scenes-scene.json`, written by the build from `manifest.ts`), so a host loads this module only when it
 * shows the element. The host sets `socket` and `settings`, and if it has them `theme`, `editMode` and `dialogs`.
 *
 * The setting `scene` is the state of the scene, `scene.<n>.<name>`. The element shows whether the scene is active
 * (`true`), not (`false`) or only partly (`uncertain`), and since when it is active. A click writes `true` - or
 * `false` to an active scene with "set on false" - as the devices widget does; the adapter then sets the states of the
 * scene. The object of the scene is kept up to date: its name, whether it has "set on false" and whether it is
 * enabled. A confirmation or a PIN is asked for in a dialog of the host.
 *
 * React is not in the module: it comes from `lib/esm/react-19.js` beside `adapter/`, see `vite.config.ts`.
 */
import { createRoot, type Root } from 'react-dom/client';

import { defineWebComponent, IobWebComponent } from '@iobroker/web-components/element';
import type { WebComponentSetting } from '@iobroker/web-components';

import type { SceneObject } from '../../src/types';
import { getActivity, getClickValue, getGroupValue, isSceneId, TAG, type SceneSettings } from './constants';
import { formatAgo, getWord, type WordKey } from './i18n';
import { Hint, SceneView } from './SceneView';
import { STYLES } from './styles';

/** How often "5 minutes ago" is drawn again while the scene is active */
const TICK_MS = 30_000;

class ScenesSceneElement extends IobWebComponent<SceneSettings> {
    readonly #root: Root;

    #timer: ReturnType<typeof setInterval> | null = null;

    /** A confirmation is open: further clicks are ignored */
    #asking = false;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = STYLES;
        const mount = document.createElement('div');
        mount.className = 'mount';
        shadow.append(style, mount);
        this.#root = createRoot(mount);
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#timer ||= setInterval(() => {
            const id = this.settings.scene;
            if (isSceneId(id) && getActivity(this.states[id]?.val) === true) {
                this.render();
            }
        }, TICK_MS);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this.#timer) {
            clearInterval(this.#timer);
            this.#timer = null;
        }
    }

    protected override getStateIds(settings: SceneSettings): string[] {
        return isSceneId(settings.scene) ? [settings.scene] : [];
    }

    /** The object of the scene, kept up to date: its name, "set on false" and whether it is enabled */
    protected override getObjectIds(settings: SceneSettings): string[] {
        return isSceneId(settings.scene) ? [settings.scene] : [];
    }

    /** The object of the scene; `undefined` while it is read, `null` if there is none */
    #getScene(id: string): SceneObject | null | undefined {
        const obj = this.objects[id];
        if (obj === undefined || obj === null) {
            return obj;
        }
        return obj.type === 'state' ? (obj as unknown as SceneObject) : null;
    }

    /** The name of the settings, else of the scene, else the last part of its ID */
    #getName(id: string, scene: SceneObject | null | undefined): string {
        return (
            this.settings.name?.trim() ||
            this.text(scene?.common?.name) ||
            id.split('.').pop() ||
            getWord(this.systemLang, 'scene')
        );
    }

    async #onClick(id: string, value: boolean, name: string): Promise<void> {
        if (this.editMode || this.#asking) {
            return;
        }
        this.#asking = true;
        try {
            if (await this.#confirm(value, name)) {
                await this.setState(id, value);
            }
        } catch {
            // the host refused the dialog or the socket is gone: nothing was written
        } finally {
            this.#asking = false;
        }
    }

    /**
     * Asks before writing, if the settings say so: a question, or a PIN. The host shows the dialog; it stays open
     * after a wrong PIN, with a note
     *
     * @param value what the click writes: true activates, false deactivates
     * @param name the name of the scene, the title of the dialog
     * @returns true if the scene may be written
     */
    async #confirm(value: boolean, name: string): Promise<boolean> {
        const { confirm, confirmText } = this.settings;
        if (confirm !== 'dialog' && confirm !== 'pin') {
            return true;
        }
        const lang = this.systemLang;
        const word = (key: WordKey): string => getWord(lang, key);
        const question = confirmText?.trim() || word(value ? 'confirmActivate' : 'confirmDeactivate');
        const ok = word(value ? 'activate' : 'deactivate');
        const pin = this.settings.pin ?? '';

        // a PIN dialog without a PIN in the settings would let everybody in: then it is a question only
        if (confirm === 'dialog' || !pin) {
            const result = await this.openDialog({
                title: name,
                form: { type: 'panel', items: { question: { type: 'staticText', text: question } } },
                ok,
            });
            return result !== null;
        }

        let wrong = false;
        for (;;) {
            const items: Record<string, WebComponentSetting> = {
                question: { type: 'staticText', text: question },
            };
            if (wrong) {
                items.wrong = { type: 'staticText', text: word('wrongPin') };
            }
            items.pin = { type: 'password', label: word('pin') };
            const result = await this.openDialog({ title: name, form: { type: 'panel', items }, ok });
            if (!result) {
                return false;
            }
            if (String(result.pin ?? '') === pin) {
                return true;
            }
            wrong = true;
        }
    }

    protected override render(): void {
        const settings = this.settings;
        const lang = this.systemLang;
        const word = (key: WordKey): string => getWord(lang, key);
        const id = settings.scene?.trim();

        if (!id) {
            this.#root.render(
                <Hint
                    text={word('chooseScene')}
                    editMode={this.editMode}
                />,
            );
            return;
        }

        const scene = isSceneId(id) ? this.#getScene(id) : null;
        if (scene === null) {
            this.#root.render(
                <Hint
                    text={word('notScene')}
                    editMode={this.editMode}
                />,
            );
            return;
        }

        const state = this.states[id];
        const activity = getActivity(state?.val);
        const off = scene?.common?.enabled === false;
        const native = scene?.native;
        const canDeactivate = !!native?.onFalse?.enabled && !native?.virtualGroup;
        const value = getClickValue(activity, canDeactivate);
        const name = this.#getName(id, scene);

        let status = '';
        const groupValue = getGroupValue(state?.val);
        if (off) {
            status = word('disabled');
        } else if (activity === 'uncertain') {
            status = word('uncertain');
        } else if (groupValue) {
            const unit = scene?.common?.unit;
            status = unit ? `${groupValue} ${unit}` : groupValue;
        } else if (activity === true && state?.lc) {
            status = formatAgo(lang, state.lc, Date.now());
        }

        const icon = settings.icon?.trim() || '';
        const iconActive = settings.iconActive?.trim() || icon;

        this.#root.render(
            <SceneView
                name={name}
                activity={activity}
                status={status}
                image={activity === true || activity === 'uncertain' ? iconActive : icon}
                color={settings.color?.trim() || ''}
                off={off}
                action={word(value ? 'activate' : 'deactivate')}
                editMode={this.editMode}
                onClick={() => void this.#onClick(id, value, name)}
            />,
        );
    }
}

defineWebComponent(TAG, ScenesSceneElement);

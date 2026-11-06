/** Tag of the custom element; a host checks that the module defines exactly this one */
export const TAG = 'iob-scenes-scene';

/** The built module, next to its manifest */
export const MODULE_FILE = 'scenes-scene.js';

/** The manifest the build writes next to the module; `common.webComponents` names this one */
export const MANIFEST_FILE = 'scenes-scene.json';

/** Where `tasks.js` puts the module in the admin folder; the React import is relative to it */
export const MODULE_PATH = `webcomponents/${MODULE_FILE}`;

/** How a click is confirmed, as in the devices widget */
export type ConfirmMode = 'none' | 'dialog' | 'pin';

/** The values of the settings of the manifest; a setting without a value is missing */
export type SceneSettings = {
    /** The state of the scene: `scene.0.<name>` */
    scene?: string;
    /** Instead of the name of the scene */
    name?: string;
    /** Image while the scene is not active; the built-in symbol if empty */
    icon?: string;
    /** Image while the scene is active; `icon` if empty */
    iconActive?: string;
    /** Color of the active scene; the success color of the theme if empty */
    color?: string;
    confirm?: ConfirmMode;
    /** Question of the confirmation; a default one if empty */
    confirmText?: string;
    pin?: string;
};

/** Whether the scene is active: `uncertain` if only some of its states have their values, null while unknown */
export type SceneActivity = boolean | 'uncertain' | null;

/**
 * Whether an ID is the state of a scene: `scene.<instance>.<name>`, also in folders
 *
 * @param id the ID of the setting
 */
export function isSceneId(id: string | undefined): id is string {
    return !!id && /^scene\.\d+\.[^.]/.test(id);
}

/**
 * The activity of a scene from the value of its state, read as the adapter writes it (`src/main.ts`):
 * `true`, `false`, or `uncertain` for a group whose states have not all the values of one side.
 *
 * @param val the value of the scene state
 */
export function getActivity(val: ioBroker.StateValue | undefined): SceneActivity {
    if (val === undefined || val === null) {
        return null;
    }
    if (val === 'uncertain') {
        return 'uncertain';
    }
    return val === true || val === 'true';
}

/**
 * The value a click writes, as the devices widget does: `false` to an active scene that can be switched off (with
 * "set on false"), `true` otherwise
 *
 * @param activity whether the scene is active now
 * @param canDeactivate whether the scene has "set on false" enabled
 */
export function getClickValue(activity: SceneActivity, canDeactivate: boolean): boolean {
    return !(canDeactivate && activity === true);
}

/**
 * The value of a virtual group to show as text, or an empty string for the values of a scene
 *
 * @param val the value of the scene state
 */
export function getGroupValue(val: ioBroker.StateValue | undefined): string {
    if (val === undefined || val === null || typeof val === 'boolean' || val === 'uncertain') {
        return '';
    }
    if (val === 'true' || val === 'false') {
        return '';
    }
    return typeof val === 'number' ? String(Math.round(val * 100) / 100) : String(val);
}

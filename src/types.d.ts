export type SceneTrigger = {
    enabled?: boolean;
    cron?: string | null;
    trigger: {
        value?: null | string | number | boolean;
        id?: string;
        condition?: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'update';
        /**
         * Activate the scene only if the value of the trigger state was really changed.
         * Every write with the same value is ignored then. Default: true.
         * Has no effect for the "update" condition.
         */
        onlyOnChange?: boolean;
    };
    astro?: string | null;
};

interface SceneEnumsValue {
    funcs: string[];
    rooms: string[];
    others: string[];
    exclude: string[];
    type: 'boolean' | 'number' | 'string';
    delay: number | null | string;
}

export type SceneMember = {
    setIfFalse?: boolean | string | null | number;
    setIfTrue?: boolean | string | null | number;
    id?: string;
    setIfFalseTolerance?: number | null;
    setIfTrueTolerance?: number | null;
    stopAllDelays?: boolean;
    enums?: SceneEnumsValue;
    desc?: string | null;
    disabled?: boolean;
    delay?: number;
    ackTrue?: boolean;
    stackNextDelays?: boolean;
    doNotOverwrite?: boolean;
};

export type SceneConfig = {
    onTrue: SceneTrigger;
    onFalse: SceneTrigger;
    easy: boolean;
    burstInterval?: number;
    members: SceneMember[];
    virtualGroup?: boolean;
    aggregation?: 'uncertain' | 'any' | 'avg' | 'min' | 'max' | 'sum';
    /** Disable the scene automatically if it was activated too often in a short time (loop detection). Default: true */
    loopProtection?: boolean;
    /** How many activations are allowed within `loopProtectionInterval`. Default: 10 */
    loopProtectionCount?: number;
    /** Length of the time window for the loop protection in ms. Default: 10000 */
    loopProtectionInterval?: number;
};

export type SceneCommon = ioBroker.StateCommon & { engine: string; enabled: boolean };

export type SceneObject = Omit<ioBroker.StateObject, 'common'> & { common: SceneCommon; native: SceneConfig };

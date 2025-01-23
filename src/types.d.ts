export type SceneTrigger = {
    enabled?: boolean;
    cron?: string | null;
    trigger: {
        value?: null | string | number | boolean;
        id?: string;
        condition?: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'update';
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
    aggregation?: 'uncertain' | 'any' | 'avg' | 'min' | 'max';
};

export type SceneCommon = ioBroker.StateCommon & { engine: string; enabled: boolean };

export type SceneObject = Omit<ioBroker.StateObject, 'common'> & { common: SceneCommon; native: SceneConfig };

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenesAdapter = void 0;
// Copyright Bluefox <dogafox@gmail.com> 2015-2025
//
const adapter_core_1 = require("@iobroker/adapter-core");
const node_schedule_1 = __importDefault(require("node-schedule"));
const type_detector_1 = __importStar(require("@iobroker/type-detector"));
const NAMES = {
    [type_detector_1.Types.airCondition]: { boolean: 'POWER', number: 'SET' },
    [type_detector_1.Types.blind]: { number: 'SET' },
    [type_detector_1.Types.cie]: { string: 'CIE', boolean: 'ON' },
    [type_detector_1.Types.ct]: { number: 'TEMPERATURE', boolean: 'ON' },
    [type_detector_1.Types.dimmer]: { boolean: 'ON_SET', number: 'SET' },
    [type_detector_1.Types.gate]: { boolean: 'SET' },
    [type_detector_1.Types.hue]: { boolean: 'ON', number: 'DIMMER|BRIGHTNESS' },
    [type_detector_1.Types.slider]: { number: 'SET' },
    [type_detector_1.Types.light]: { boolean: 'SET' },
    //    [Types.lock]: {boolean: 'SET'}, // not supported yet
    [type_detector_1.Types.media]: { boolean: 'STATE' },
    [type_detector_1.Types.rgb]: { boolean: 'ON', number: 'DIMMER|BRIGHTNESS' },
    [type_detector_1.Types.rgbSingle]: { boolean: 'ON', string: 'RGB' },
    [type_detector_1.Types.rgbwSingle]: { boolean: 'ON', string: 'RGBW' },
    [type_detector_1.Types.socket]: { boolean: 'SET' },
    [type_detector_1.Types.vacuumCleaner]: { boolean: 'POWER' },
    [type_detector_1.Types.volume]: { boolean: 'SET' },
    [type_detector_1.Types.volumeGroup]: { boolean: 'SET' },
};
class ScenesAdapter extends adapter_core_1.Adapter {
    scenesTimeout = {};
    hasEnums = false;
    enumsRecord = {};
    scenes = {};
    counts = {};
    sceneValue = {};
    subscription = null;
    ids = {};
    triggers = {};
    timers = {};
    checkTimers = {};
    cronTasks = {};
    tIndex = 1; // never ending counter
    constructor(options = {}) {
        super({
            ...options,
            name: 'scenes',
            strictObjectChecks: false, // because existing scenes have type 'boolean'. But it can have value 'uncertain'
            unload: cb => {
                Object.keys(this.scenesTimeout).forEach(id => this.scenesTimeout[id] && clearTimeout(this.scenesTimeout[id]));
                this.scenesTimeout = {};
                cb && cb();
            },
            stateChange: (id, state) => this.onStateChange(id, state),
            objectChange: (id, obj) => this.onObjectChange(id, obj),
            ready: async () => {
                await this.main();
                this.subscribeForeignObjects('scene.*');
                this.subscribeForeignObjects('enum.*');
            },
            message: async (obj) => this.onMessage(obj),
        });
    }
    onStateChange(id, state) {
        if (state) {
            if (this.scenes[id] && state) {
                this.sceneValue[id] = { val: state.val, ack: state.ack };
            }
            if (!state.ack) {
                if (this.scenes[id]) {
                    if (this.scenes[id].native.virtualGroup) {
                        this.activateScene(id, state.val);
                    }
                    else {
                        let val = state.val;
                        if (val === 'true') {
                            val = true;
                        }
                        if (val === 'false') {
                            val = false;
                        }
                        if (val === '0') {
                            val = 0;
                        }
                        if (val) {
                            // activate a scene
                            this.activateScene(id, true);
                        }
                        else if (this.scenes[id].native.onFalse && this.scenes[id].native.onFalse.enabled) {
                            this.activateScene(id, false);
                        }
                    }
                }
            }
            if (this.ids[id]) {
                for (let s = 0; s < this.ids[id].length; s++) {
                    this.checkScene(this.ids[id][s], id, state);
                }
            }
            if (this.triggers[id]) {
                for (let t = 0; t < this.triggers[id].length; t++) {
                    this.checkTrigger(this.triggers[id][t], id, state, true);
                    this.checkTrigger(this.triggers[id][t], id, state, false);
                }
            }
        }
    }
    onObjectChange(id, obj) {
        if (id.startsWith('scene.')) {
            if (this.scenes[id]) {
                this.restartAdapter();
            }
            else if (obj) {
                const sceneObj = obj;
                if (sceneObj.common.engine === `system.adapter.${this.namespace}`) {
                    this.restartAdapter();
                }
            }
        }
        else if (id.startsWith('enum.') && this.hasEnums) {
            this.restartAdapter();
        }
    }
    async onMessage(obj) {
        if (!obj || !obj.message) {
            return;
        }
        if (typeof obj.message === 'string' && obj.message.startsWith('{')) {
            try {
                obj.message = JSON.parse(obj.message);
            }
            catch {
                this.log.error(`Cannot parse message: ${obj.message}`);
                this.sendTo(obj.from, obj.command, { error: 'Cannot parse message' }, obj.callback);
                return;
            }
        }
        let sceneId;
        if (typeof obj.message === 'string') {
            sceneId = obj.message;
        }
        else if (obj.message && obj.message.sceneId) {
            sceneId = obj.message.sceneId;
        }
        if (!sceneId) {
            this.log.error(`Cannot find scene ID in message: ${JSON.stringify(obj.message)}`);
            this.sendTo(obj.from, obj.command, { error: 'No scene ID' }, obj.callback);
            return;
        }
        if (sceneId && obj.command === 'save') {
            let isForTrue = true;
            if (typeof obj.message === 'object' && obj.message.isForTrue !== undefined) {
                isForTrue = obj.message.isForTrue;
            }
            try {
                const allSaved = await this.saveScene(obj.message.sceneId, isForTrue);
                this.sendTo(obj.from, obj.command, { result: 'Current states saved', allSaved }, obj.callback);
            }
            catch (err) {
                this.sendTo(obj.from, obj.command, { error: err }, obj.callback);
            }
        }
        else if (obj.command === 'enable') {
            let sceneObj;
            try {
                sceneObj = (await this.getForeignObjectAsync(sceneId));
            }
            catch (e) {
                this.log.error(`Cannot get scene: ${e}`);
                this.sendTo(obj.from, obj.command, { error: `Cannot get scene: ${e}` }, obj.callback);
                return;
            }
            if (sceneObj) {
                if (!sceneObj.common.enabled) {
                    sceneObj.common.enabled = true;
                    delete sceneObj.ts;
                    await this.setForeignObjectAsync(sceneObj._id, sceneObj);
                    this.sendTo(obj.from, obj.command, { result: 'Scene was enabled' }, obj.callback);
                }
                else {
                    this.sendTo(obj.from, obj.command, { warning: 'Scene already enabled' }, obj.callback);
                }
            }
        }
        else if (obj.command === 'disable') {
            let sceneObj;
            try {
                sceneObj = (await this.getForeignObjectAsync(sceneId));
            }
            catch (e) {
                this.log.error(`Cannot get scene: ${e}`);
                this.sendTo(obj.from, obj.command, { error: `Cannot get scene: ${e}` }, obj.callback);
                return;
            }
            if (sceneObj) {
                if (sceneObj.common.enabled !== false) {
                    sceneObj.common.enabled = false;
                    delete sceneObj.ts;
                    await this.setForeignObjectAsync(sceneObj._id, sceneObj);
                    this.sendTo(obj.from, obj.command, { result: 'Scene was disabled' }, obj.callback);
                }
                else {
                    this.sendTo(obj.from, obj.command, { warning: 'Scene already disabled' }, obj.callback);
                }
            }
        }
    }
    // expects like: scene.0.blabla
    async saveScene(sceneID, isForTrue) {
        if (isForTrue === undefined) {
            isForTrue = true;
        }
        this.log.debug(`Saving ${sceneID}...`);
        let obj;
        try {
            obj = (await this.getForeignObjectAsync(sceneID));
            delete obj.ts;
        }
        catch (e) {
            this.log.error(`Cannot get scene: ${e}`);
            throw new Error('Scene not found');
        }
        if (obj?.native?.members) {
            let anyNotSaved = false;
            for (let m = 0; m < obj.native.members.length; m++) {
                const member = obj.native.members[m];
                let state;
                if (member.id) {
                    state = await this.getForeignStateAsync(member.id);
                    console.log(`ID ${member.id}=${state ? state.val : state}`);
                }
                else if (member.enums) {
                    // enum => get all states and their values
                    const ids = this.getAllEnumIds(member.enums);
                    const values = [];
                    // copy all settings from the first member
                    for (let i = 0; i < ids.length; i++) {
                        const controlId = await this.getControlState(ids[i], member.enums.type, sceneID);
                        if (!controlId) {
                            continue;
                        }
                        const value = await this.getForeignStateAsync(controlId);
                        if (value) {
                            values.push(value.val);
                        }
                    }
                    // determine common state
                    if (member.enums.type === 'boolean' || member.enums.type === 'string') {
                        // all states must be true or false
                        let val = values[0];
                        for (let i = 1; i < values.length; i++) {
                            if (val !== values[i]) {
                                val = 'uncertain';
                                break;
                            }
                        }
                        state = { val };
                        this.log.info(`Take for member ${m} of (${sceneID}) value "${val}" from ${values.length} states`);
                    }
                    else if (member.enums.type === 'number') {
                        // calculate average
                        let val = parseFloat(values[0]);
                        for (let i = 1; i < values.length; i++) {
                            val += parseFloat(values[i]);
                        }
                        val /= values.length;
                        state = { val };
                        this.log.info(`Take for member ${m} of (${sceneID}) average value "${val}" from ${values.length} states`);
                    }
                }
                if (state?.val !== 'uncertain') {
                    if (isForTrue) {
                        member.setIfTrue = state ? state.val : null;
                    }
                    else {
                        member.setIfFalse = state ? state.val : null;
                    }
                }
                else {
                    anyNotSaved = true;
                }
            }
            try {
                delete obj.ts;
                await this.setForeignObjectAsync(sceneID, obj);
                this.log.info(`Scene ${typeof obj.common.name === 'object' ? obj.common.name.en || '' : obj.common.name} saved`);
                return !anyNotSaved;
            }
            catch (e) {
                this.log.error(`Cannot save scene: ${e}`);
                throw new Error('Cannot save scene');
            }
        }
        else {
            throw new Error(obj ? 'Scene not found' : 'Scene has no members');
        }
    }
    restartAdapter() {
        this.log.info('restartAdapter');
        // stop all timers
        Object.keys(this.checkTimers).forEach(id => this.checkTimers[id] && clearTimeout(this.checkTimers[id]));
        this.checkTimers = {};
        Object.keys(this.timers).forEach(id => this.timers[id].forEach(tt => tt?.timer && clearTimeout(tt.timer)));
        this.timers = {};
        Object.keys(this.cronTasks).forEach(id => {
            this.cronTasks[`${id}_true`]?.cancel();
            this.cronTasks[`${id}_false`]?.cancel();
        });
        if (!this.subscription) {
            this.unsubscribeForeignStates('*');
        }
        else {
            this.unsubscribeForeignStates('scene.*');
            // and for all states
            this.subscription.forEach(pattern => this.unsubscribeForeignStates(pattern));
        }
        this.subscription = null;
        this.scenes = {};
        this.ids = {};
        this.triggers = {};
        this.timers = {};
        this.tIndex = 1;
        this.checkTimers = {};
        this.cronTasks = {};
        this.main().catch(e => this.log.error(`Cannot restart adapter: ${e}`));
    }
    // Check if actual states are exactly as desired in the scene
    checkScene(sceneId, stateId, state) {
        if (state && stateId) {
            for (let i = 0; i < this.scenes[sceneId].native.members.length; i++) {
                // if state must be updated
                if (stateId && this.scenes[sceneId].native.members[i].id === stateId) {
                    this.scenes[sceneId].native.members[i].actual = state.val;
                }
            }
        }
        this.checkTimers[sceneId] =
            this.checkTimers[sceneId] ||
                setTimeout(async (_sceneId) => {
                    this.checkTimers[_sceneId] = null;
                    let activeTrue = null;
                    let activeFalse = null;
                    let activeValue = null;
                    const sceneObj = this.scenes[_sceneId];
                    const sceneObjNative = sceneObj.native;
                    const isWithFalse = sceneObjNative.onFalse && sceneObjNative.onFalse.enabled;
                    let avgCounter = 0;
                    for (let i = 0; i < sceneObjNative.members.length; i++) {
                        const member = sceneObjNative.members[i];
                        // There are some states
                        if (activeTrue === null) {
                            activeTrue = true;
                        }
                        if (activeFalse === null) {
                            activeFalse = true;
                        }
                        if (sceneObjNative.virtualGroup) {
                            if (activeValue === 'uncertain') {
                                continue;
                            }
                            if (activeValue === null) {
                                activeValue = member.actual || null;
                            }
                            else {
                                if (activeValue != member.actual) {
                                    if (sceneObjNative.aggregation === undefined ||
                                        sceneObjNative.aggregation === 'uncertain') {
                                        activeValue = 'uncertain';
                                    }
                                    else {
                                        if (sceneObjNative.aggregation === 'any') {
                                            activeValue =
                                                activeValue || (member.actual === undefined ? null : member.actual);
                                        }
                                        else if (sceneObjNative.aggregation === 'min') {
                                            activeValue = Math.min(activeValue, parseFloat(member.actual) || 0);
                                        }
                                        else if (sceneObjNative.aggregation === 'max') {
                                            activeValue = Math.max(activeValue, parseFloat(member.actual) || 0);
                                        }
                                        else if (sceneObjNative.aggregation === 'avg') {
                                            activeValue =
                                                parseFloat(activeValue) +
                                                    (parseFloat(member.actual) || 0);
                                            avgCounter++;
                                        }
                                    }
                                }
                                else if (sceneObjNative.aggregation === 'avg') {
                                    activeValue =
                                        parseFloat(activeValue) + (parseFloat(member.actual) || 0);
                                    avgCounter++;
                                }
                            }
                        }
                        else {
                            let setIfTrue;
                            let setIfFalse;
                            try {
                                setIfTrue = await this.getSetValue(member.setIfTrue);
                                setIfFalse = await this.getSetValue(member.setIfFalse);
                            }
                            catch (e) {
                                this.log.warn(`Error while getting True/False states: ${e}`);
                            }
                            if (setIfTrue !== null && setIfTrue !== undefined) {
                                if (member.setIfTrueTolerance) {
                                    if (Math.abs((parseFloat(setIfTrue) || 0) -
                                        (parseFloat(member.actual) || 0)) > member.setIfTrueTolerance) {
                                        activeTrue = false;
                                    }
                                }
                                else {
                                    if (setIfTrue != member.actual) {
                                        activeTrue = false;
                                    }
                                }
                            }
                            if (isWithFalse && setIfFalse !== null && setIfFalse !== undefined) {
                                if (member.setIfFalseTolerance) {
                                    if (Math.abs((parseFloat(setIfFalse) || 0) -
                                        (parseFloat(member.actual) || 0)) > member.setIfFalseTolerance) {
                                        activeFalse = false;
                                    }
                                }
                                else if (setIfFalse != member.actual) {
                                    activeFalse = false;
                                }
                            }
                        }
                    }
                    try {
                        if (sceneObjNative.virtualGroup) {
                            if (activeValue !== null) {
                                if (sceneObjNative.aggregation === 'avg' && avgCounter) {
                                    activeValue = (parseFloat(activeValue) || 0) / (avgCounter + 1);
                                }
                                if (this.sceneValue[_sceneId].val !== activeValue || !this.sceneValue[_sceneId].ack) {
                                    this.sceneValue[_sceneId].val = activeValue;
                                    this.sceneValue[_sceneId].ack = true;
                                    await this.setForeignStateAsync(_sceneId, activeValue, true);
                                }
                            }
                        }
                        else {
                            if (sceneObjNative.onFalse && sceneObjNative.onFalse.enabled) {
                                if (activeTrue) {
                                    if (this.sceneValue[_sceneId].val !== true || !this.sceneValue[_sceneId].ack) {
                                        this.sceneValue[_sceneId].val = true;
                                        this.sceneValue[_sceneId].ack = true;
                                        await this.setForeignStateAsync(_sceneId, true, true);
                                    }
                                }
                                else if (activeFalse) {
                                    if (this.sceneValue[_sceneId].val !== false || !this.sceneValue[_sceneId].ack) {
                                        this.sceneValue[_sceneId].val = false;
                                        this.sceneValue[_sceneId].ack = true;
                                        await this.setForeignStateAsync(_sceneId, false, true);
                                    }
                                }
                                else {
                                    if (this.sceneValue[_sceneId].val !== 'uncertain' ||
                                        !this.sceneValue[_sceneId].ack) {
                                        this.sceneValue[_sceneId].val = 'uncertain';
                                        this.sceneValue[_sceneId].ack = true;
                                        await this.setForeignStateAsync(_sceneId, 'uncertain', true);
                                    }
                                }
                            }
                            else {
                                if (activeTrue !== null) {
                                    if (this.sceneValue[_sceneId].val !== activeTrue ||
                                        !this.sceneValue[_sceneId].ack) {
                                        this.sceneValue[_sceneId].val = activeTrue;
                                        this.sceneValue[_sceneId].ack = true;
                                        await this.setForeignStateAsync(_sceneId, activeTrue, true);
                                    }
                                }
                            }
                        }
                    }
                    catch (err) {
                        this.log.error(`Can not set requested state ${_sceneId}: ${err.message}`);
                    }
                }, 200, sceneId);
    }
    checkTrigger(sceneId, stateId, state, isTrue) {
        let val;
        let fVal;
        let aVal;
        if (!state) {
            return;
        }
        const triggerObj = isTrue
            ? this.scenes[sceneId].native.onTrue
            : this.scenes[sceneId].native.onFalse;
        if (!triggerObj || triggerObj.enabled === false || !triggerObj.trigger) {
            return;
        }
        const trigger = triggerObj.trigger;
        if (trigger.id === stateId) {
            const stateVal = state && state.val !== undefined && state.val !== null ? state.val.toString() : '';
            val = trigger.value;
            this.log.debug(`checkTrigger: ${trigger.id}(${state.val}) ${trigger.condition} ${val === null || val === undefined ? 'null' : val.toString()}`);
            switch (trigger.condition) {
                case undefined:
                case '==':
                    if (val == stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case '!=':
                    if (val != stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case '>':
                    fVal = parseFloat(val);
                    aVal = parseFloat(stateVal);
                    if (fVal.toString() == val && stateVal === aVal.toString()) {
                        if (aVal > fVal) {
                            this.activateScene(sceneId, isTrue);
                        }
                    }
                    else if (val !== null && val !== undefined && val > stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case '<':
                    fVal = parseFloat(val);
                    aVal = parseFloat(stateVal);
                    if (fVal.toString() == val && stateVal === aVal.toString()) {
                        if (aVal < fVal) {
                            this.activateScene(sceneId, isTrue);
                        }
                    }
                    else if (val !== null && val !== undefined && val < stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case '>=':
                    fVal = parseFloat(val);
                    aVal = parseFloat(stateVal);
                    if (fVal.toString() == val && stateVal === aVal.toString()) {
                        if (aVal >= fVal) {
                            this.activateScene(sceneId, isTrue);
                        }
                    }
                    else if (val !== null && val !== undefined && val >= stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case '<=':
                    fVal = parseFloat(val);
                    aVal = parseFloat(stateVal);
                    if (fVal.toString() == val && stateVal === aVal.toString()) {
                        if (aVal <= fVal) {
                            this.activateScene(sceneId, isTrue);
                        }
                    }
                    else if (val !== null && val !== undefined && val <= stateVal) {
                        this.activateScene(sceneId, isTrue);
                    }
                    break;
                case 'update':
                    this.activateScene(sceneId, isTrue);
                    break;
                default:
                    this.log.error(`Unsupported condition: ${trigger.condition}`);
                    break;
            }
        }
    }
    async getSetValue(value) {
        if (value === undefined) {
            return null;
        }
        const m = typeof value === 'string' && value.match(/^\s*{{([^}]*)}}\s*$/);
        if (m) {
            if (!m[1]) {
                throw new Error(`Value did not contain a state ID: ${value}`);
            }
            // try to read setValue from other stateId
            const state = await this.getForeignStateAsync(m[1]);
            if (state) {
                return state.val;
            }
            throw new Error(`State ${m[1]} is empty`);
        }
        return value;
    }
    // Set one state of the scene
    activateSceneState(sceneId, state, isTrue) {
        if (!this.scenes[sceneId]) {
            return this.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
        }
        const stateObj = this.scenes[sceneId].native.members[state];
        let desiredValue = null;
        if (!this.scenes[sceneId].native.virtualGroup) {
            if (stateObj) {
                desiredValue = isTrue ? stateObj.setIfTrue : stateObj.setIfFalse;
            }
        }
        else {
            desiredValue = isTrue;
        }
        if (desiredValue === null || desiredValue === undefined) {
            return this.log.debug(`Ignore in "${sceneId}" the ${state} by ${isTrue}, is defined as NULL.`);
        }
        // calculate stacked delay
        let delay = 0;
        let stacked = false;
        for (let u = 0; u < state; u++) {
            if (this.scenes[sceneId].native.members[u].stackNextDelays) {
                stacked = true;
            }
            if (stacked) {
                delay += this.scenes[sceneId].native.members[u].delay || 0;
            }
        }
        delay += stateObj.delay || 0;
        this.getSetValue(desiredValue)
            .then(desiredValue => {
            if (!stateObj.id) {
                return;
            }
            if (delay) {
                this.timers[stateObj.id] = this.timers[stateObj.id] || [];
                if (stateObj.stopAllDelays && this.timers[stateObj.id].length) {
                    this.log.debug(`Cancel running timers (${this.timers[stateObj.id].length} for ${stateObj.id}`);
                    this.timers[stateObj.id].forEach(item => clearTimeout(item.timer));
                    this.timers[stateObj.id] = [];
                }
                this.tIndex++;
                // Start timeout
                const timer = setTimeout((id, setValue, _tIndex) => {
                    this.log.debug(`Set delayed state for "${sceneId}": ${id} = ${setValue}`);
                    // execute timeout
                    if (stateObj.doNotOverwrite) {
                        void this.getForeignState(id, (err, state) => {
                            // Set new state only if differ from the desired state
                            if (!state || state.val !== setValue) {
                                this.setForeignState(id, setValue, !!stateObj.ackTrue);
                            }
                        });
                    }
                    else {
                        this.setForeignState(id, setValue, !!stateObj.ackTrue);
                    }
                    if (this.timers[id]) {
                        // remove timer from the list
                        for (let r = 0; r < this.timers[id].length; r++) {
                            if (this.timers[id][r].tIndex === _tIndex) {
                                this.timers[id].splice(r, 1);
                                break;
                            }
                        }
                    }
                }, delay, stateObj.id, desiredValue, this.tIndex);
                this.timers[stateObj.id].push({ timer, tIndex: this.tIndex });
            }
            else {
                if (stateObj.stopAllDelays && this.timers[stateObj.id] && this.timers[stateObj.id].length) {
                    this.log.debug(`Cancel running timers for "${stateObj.id}" (${this.timers[stateObj.id].length})`);
                    this.timers[stateObj.id].forEach(item => clearTimeout(item.timer));
                    this.timers[stateObj.id] = [];
                }
                // Set the desired state
                if (stateObj.doNotOverwrite) {
                    this.getForeignState(stateObj.id, (err, state) => {
                        // Set new state only if differ from the desired state
                        if (!state || state.val !== desiredValue) {
                            this.setForeignState(stateObj.id, desiredValue, !!stateObj.ackTrue);
                        }
                    });
                }
                else {
                    this.setForeignState(stateObj.id, desiredValue, !!stateObj.ackTrue);
                }
            }
        })
            .catch(e => this.log.error(`Cannot read setValue from ${desiredValue
            .toString()
            .replace(/^\s*{{/, '')
            .replace(/}}\s*$/, '')}: ${e}`));
    }
    // Set all states of the state with an interval
    activateSceneStates(sceneId, state, isTrue, interval, callback) {
        if (!this.scenes[sceneId]) {
            this.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
            return callback();
        }
        if (!this.scenes[sceneId].native.members[state]) {
            return callback();
        }
        if (!state) {
            this.activateSceneState(sceneId, state, isTrue);
            state++;
            if (!this.scenes[sceneId].native.members[state]) {
                return callback();
            }
        }
        this.scenesTimeout[`${sceneId}_${state}`] = setTimeout(() => {
            this.scenesTimeout[`${sceneId}_${state}`] = null;
            this.activateSceneState(sceneId, state, isTrue);
            this.activateSceneStates(sceneId, state + 1, isTrue, interval, callback);
        }, interval);
    }
    activateScene(sceneId, isTrue) {
        this.log.debug(`activateScene: execute for "${sceneId}" (${isTrue})`);
        if (!this.scenes[sceneId]) {
            this.log.error(`Unexpected error: Scene "${sceneId}" does not exist!`);
            return;
        }
        this.scenes[sceneId].native.burstInterval =
            parseInt(this.scenes[sceneId].native.burstInterval, 10) || 0;
        // all commands must be executed without an interval
        if (!this.scenes[sceneId].native.burstInterval) {
            for (let state = 0; state < this.scenes[sceneId].native.members.length; state++) {
                this.activateSceneState(sceneId, state, isTrue);
            }
            if (!this.scenes[sceneId].native.virtualGroup) {
                if (this.scenes[sceneId].native.onFalse && this.scenes[sceneId].native.onFalse.enabled) {
                    if (this.sceneValue[sceneId]?.val !== isTrue || !this.sceneValue[sceneId].ack) {
                        this.log.debug(`activateScene: new state for "${sceneId}" is "${isTrue}"`);
                        if (this.sceneValue[sceneId]) {
                            this.sceneValue[sceneId].val = isTrue;
                            this.sceneValue[sceneId].ack = true;
                        }
                        else {
                            this.sceneValue[sceneId] = { val: isTrue, ack: true };
                        }
                        this.setForeignState(sceneId, isTrue, true);
                    }
                }
                else if (this.sceneValue[sceneId]?.val !== true || !this.sceneValue[sceneId].ack) {
                    this.log.debug(`activateScene: new state for "${sceneId}" is "true"`);
                    if (this.sceneValue[sceneId]) {
                        this.sceneValue[sceneId].val = true;
                        this.sceneValue[sceneId].ack = true;
                    }
                    else {
                        this.sceneValue[sceneId] = { val: true, ack: true };
                    }
                    this.setForeignState(sceneId, true, true);
                }
            }
        }
        else {
            // make some interval between commands
            this.activateSceneStates(sceneId, 0, isTrue, this.scenes[sceneId].native.burstInterval, () => {
                // possible scene was renamed
                if (!this.scenes[sceneId]) {
                    return;
                }
                if (this.scenes[sceneId].native.onFalse && this.scenes[sceneId].native.onFalse.enabled) {
                    if (this.sceneValue[sceneId]?.val !== isTrue || !this.sceneValue[sceneId].ack) {
                        this.log.debug(`activateScene: new state for "${sceneId}" is "${isTrue}"`);
                        if (this.sceneValue[sceneId]) {
                            this.sceneValue[sceneId].val = isTrue;
                            this.sceneValue[sceneId].ack = true;
                        }
                        else {
                            this.sceneValue[sceneId] = { val: isTrue, ack: true };
                        }
                        this.setForeignState(sceneId, isTrue, true);
                    }
                }
                else if (this.sceneValue[sceneId]?.val !== true || !this.sceneValue[sceneId]?.ack) {
                    this.log.debug(`activateScene: new state for "${sceneId}" is "true"`);
                    if (this.sceneValue[sceneId]) {
                        this.sceneValue[sceneId].val = true;
                        this.sceneValue[sceneId].ack = true;
                    }
                    else {
                        this.sceneValue[sceneId] = { val: true, ack: true };
                    }
                    this.setForeignState(sceneId, true, true);
                }
            });
        }
    }
    getSceneItemState(sceneId, stateNumber) {
        const stateId = this.scenes[sceneId].native.members[stateNumber].id;
        if (!stateId) {
            if (!--this.counts[sceneId]) {
                delete this.counts[sceneId];
                this.checkScene(sceneId);
            }
        }
        else {
            void this.getForeignState(stateId, (_err, state) => {
                // possible scene was renamed
                if (!this.scenes[sceneId]?.native?.members?.[stateNumber]) {
                    return;
                }
                this.scenes[sceneId].native.members[stateNumber].actual = state ? state.val : null;
                // If processing finished
                if (!--this.counts[sceneId]) {
                    delete this.counts[sceneId];
                    this.checkScene(sceneId);
                }
            });
        }
    }
    initTrueFalse(sceneId, isTrue) {
        const usedIds = [];
        const sStruct = isTrue ? this.scenes[sceneId].native.onTrue : this.scenes[sceneId].native.onFalse;
        if (!sStruct || sStruct.enabled === false) {
            return;
        }
        // remember triggers for true
        if (sStruct.trigger?.id) {
            usedIds.push(sStruct.trigger.id);
            this.triggers[sStruct.trigger.id] = this.triggers[sStruct.trigger.id] || [];
            if (!this.triggers[sStruct.trigger.id].includes(sceneId)) {
                this.triggers[sStruct.trigger.id].push(sceneId);
            }
        }
        // initiate cron tasks
        const scheduleName = `${sceneId}_${isTrue}`;
        if (sStruct.cron) {
            this.log.debug(`Initiate cron task for ${sceneId}(${isTrue}): ${sStruct.cron}`);
            if (this.cronTasks[scheduleName]) {
                this.cronTasks[scheduleName].cancel();
                this.cronTasks[scheduleName] = null;
            }
            this.cronTasks[scheduleName] = node_schedule_1.default.scheduleJob(sStruct.cron, () => {
                this.log.debug(`cron for ${sceneId}(${isTrue}): ${sStruct.cron}`);
                this.activateScene(sceneId, isTrue);
            });
        }
        else if (this.cronTasks[scheduleName]) {
            this.cronTasks[scheduleName].cancel();
            delete this.cronTasks[scheduleName];
        }
        return usedIds;
    }
    getAllEnumIds(enumsSettings) {
        const ids = [];
        enumsSettings.rooms.forEach(roomId => {
            const members = this.enumsRecord[roomId].common.members;
            if (members) {
                for (let r = 0; r < members.length; r++) {
                    if (!ids.includes(members[r])) {
                        ids.push(members[r]);
                    }
                }
            }
        });
        if (!enumsSettings.rooms.length) {
            enumsSettings.funcs.forEach(funcId => {
                const members = this.enumsRecord[funcId].common.members;
                if (members) {
                    for (let r = 0; r < members.length; r++) {
                        if (!ids.includes(members[r])) {
                            ids.push(members[r]);
                        }
                    }
                }
            });
        }
        else if (enumsSettings.funcs.length) {
            for (let i = ids.length - 1; i >= 0; i--) {
                const id = ids[i];
                // find this id in all functions
                if (!enumsSettings.funcs.find(funcId => this.enumsRecord[funcId].common.members?.includes(id))) {
                    ids.splice(i, 1);
                }
            }
        }
        enumsSettings.others.forEach(enumId => {
            const members = this.enumsRecord[enumId].common.members;
            if (members) {
                for (let r = 0; r < members.length; r++) {
                    if (!ids.includes(members[r])) {
                        ids.push(members[r]);
                    }
                }
            }
        });
        for (let e = 0; e < enumsSettings.exclude.length; e++) {
            const index = ids.indexOf(enumsSettings.exclude[e]);
            if (index !== -1) {
                ids.splice(index, 1);
            }
        }
        return ids;
    }
    async findControlState(obj, type) {
        // read all states of the device
        const objs = await this.getObjectViewAsync('system', 'state', {
            startkey: `${obj._id}.\u0000`,
            endkey: `${obj._id}.\u9999`,
        });
        const objects = {};
        objs.rows.forEach(item => (objects[item.id] = item.value));
        objects[obj._id] = obj;
        const keys = Object.keys(objects);
        let found = '';
        // if it is only one state with this type and writable, take it
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            if (objects[id].type === 'state' &&
                objects[id].common.type === type &&
                objects[id].common.write !== false) {
                if (!found) {
                    found = id;
                }
                else {
                    // more than one state with this type
                    found = '';
                    break;
                }
            }
        }
        // else try to use type detector
        const detector = new type_detector_1.default();
        // initialize iobroker type detector
        const usedIds = [];
        const ignoreIndicators = ['UNREACH_STICKY']; // Ignore indicators by name
        const excludedTypes = [type_detector_1.Types.info];
        const options = {
            id: obj._id,
            objects,
            _keysOptional: keys,
            _usedIdsOptional: usedIds,
            ignoreIndicators,
            excludedTypes,
        };
        const controls = detector.detect(options);
        if (controls?.length) {
            // try to find in all controls
            for (let c = 0; c < controls.length; c++) {
                const control = controls[c];
                if (NAMES[control.type]?.[type]) {
                    const names = NAMES[control.type][type].split('|');
                    for (let t = 0; t < names.length; t++) {
                        const st = control.states.find(state => state.name === names[t] && state.id);
                        if (st) {
                            return st.id;
                        }
                    }
                }
            }
        }
        return null;
    }
    async getControlState(id, type, sceneId) {
        const obj = await this.getForeignObjectAsync(id);
        if (!obj) {
            return null;
        }
        if (obj.type !== 'state') {
            if (obj.type === 'channel' || obj.type === 'device' || obj.type === 'folder') {
                // try to use types detector to find the control state
                const controlId = await this.findControlState(obj, type || 'boolean');
                if (!controlId) {
                    this.log.warn(`Cannot find control state of type "${type || 'boolean'}" for "${obj.type}" ${id} in "${sceneId}"`);
                    return null;
                }
                return controlId;
            }
            this.log.warn(`Cannot find control state for ${id} as it is not device or channel`);
            return null;
        }
        return id;
    }
    async enum2scenes(sceneId, index) {
        if (!this.hasEnums) {
            this.hasEnums = true;
            // read enums
            const objs = await this.getObjectViewAsync('system', 'enum', {
                startkey: 'enum.\u0000',
                endkey: 'enum.\u9999',
            });
            this.enumsRecord = {};
            objs.rows.forEach(item => (this.enumsRecord[item.id] = item.value));
        }
        const patternMember = JSON.parse(JSON.stringify(this.scenes[sceneId].native.members[index]));
        const enumsSettings = JSON.parse(JSON.stringify(patternMember.enums));
        delete patternMember.enums;
        // remove this member from a list
        this.scenes[sceneId].native.members.splice(index, 1);
        // collect all IDs in this enum
        const ids = this.getAllEnumIds(enumsSettings);
        // copy all settings from the first member
        for (let i = 0; i < ids.length; i++) {
            const controlId = await this.getControlState(ids[i], enumsSettings.type, sceneId);
            if (!controlId) {
                continue;
            }
            const newMember = JSON.parse(JSON.stringify(patternMember));
            newMember.id = controlId;
            if (i) {
                newMember.delay = enumsSettings.delay || 0;
            }
            // place this member on the place of index
            this.scenes[sceneId].native.members.splice(index++, 0, newMember);
        }
    }
    async initScenes() {
        const countIds = [];
        this.hasEnums = false;
        // list all scenes in Object
        for (const sceneId in this.scenes) {
            if (!Object.prototype.hasOwnProperty.call(this.scenes, sceneId)) {
                continue;
            }
            this.counts[sceneId] = 0;
            this.sceneValue[sceneId] = { val: null, ack: true }; // default state
            // Go through all states in Array
            for (let state = 0; state < this.scenes[sceneId].native.members.length; state++) {
                const stateId = this.scenes[sceneId].native.members[state].id;
                // calculate subscriptions
                if (stateId && !countIds.includes(stateId)) {
                    countIds.push(stateId);
                }
                // remember which scenes uses this state
                if (stateId) {
                    this.ids[stateId] = this.ids[stateId] || [];
                    if (!this.ids[stateId].includes(sceneId)) {
                        this.ids[stateId].push(sceneId);
                    }
                }
                // Convert delay
                if (this.scenes[sceneId].native.members[state].delay) {
                    const delay = parseInt(this.scenes[sceneId].native.members[state].delay, 10) || 0;
                    if ((this.scenes[sceneId].native.members[state].delay || 0).toString() !== delay.toString()) {
                        this.log.error(`Invalid delay for scene "${sceneId}": ${this.scenes[sceneId].native.members[state].delay}`);
                        this.scenes[sceneId].native.members[state].delay = 0;
                    }
                    else {
                        this.scenes[sceneId].native.members[state].delay = delay;
                    }
                }
                else {
                    this.scenes[sceneId].native.members[state].delay = 0;
                }
                /*
                if (this.scenes[sceneId].native.members[state].setIfTrue === undefined || this.scenes[sceneId].native.members[state].setIfTrue === null) {
                    this.scenes[sceneId].native.members[state].setIfTrue = false;
                }
                if (this.scenes[sceneId].native.members[state].setIfFalse === undefined || this.scenes[sceneId].native.members[state].setIfFalse === null) {
                    this.scenes[sceneId].native.members[state].setIfFalse = false;
                }*/
                this.counts[sceneId]++;
                // read actual state
                this.getSceneItemState(sceneId, state);
            }
            if (this.scenes[sceneId].native.onTrue && this.scenes[sceneId].native.onTrue.trigger) {
                if (this.scenes[sceneId].native.onTrue.trigger.value === null ||
                    this.scenes[sceneId].native.onTrue.trigger.value === undefined) {
                    this.scenes[sceneId].native.onTrue.trigger.value = '';
                }
                else {
                    this.scenes[sceneId].native.onTrue.trigger.value =
                        this.scenes[sceneId].native.onTrue.trigger.value.toString();
                }
            }
            if (this.scenes[sceneId].native.onFalse && this.scenes[sceneId].native.onFalse.trigger) {
                if (this.scenes[sceneId].native.onFalse.trigger.value === null ||
                    this.scenes[sceneId].native.onFalse.trigger.value === undefined) {
                    this.scenes[sceneId].native.onFalse.trigger.value = '';
                }
                else {
                    this.scenes[sceneId].native.onFalse.trigger.value =
                        this.scenes[sceneId].native.onFalse.trigger.value.toString();
                }
            }
            // Init trigger, cron and astro for onTrue
            let usedIds = this.initTrueFalse(sceneId, true);
            usedIds?.forEach(id => !countIds.includes(id) && countIds.push(id));
            // Init trigger, cron and astro for onFalse
            usedIds = this.initTrueFalse(sceneId, false);
            usedIds?.forEach(id => !countIds.includes(id) && countIds.push(id));
        }
        // If it is requested more than 20 ids, get all of them
        if (countIds.length > 200) {
            this.log.debug('initScenes: subscribe on all');
            await this.subscribeForeignStatesAsync('*');
        }
        else {
            // subscribe for own scenes
            await this.subscribeForeignStatesAsync('scene.*');
            this.subscription = countIds;
            // and for all states
            for (let i = 0; i < countIds.length; i++) {
                this.log.debug(`initScenes: subscribe on ${countIds[i]}`);
                await this.subscribeForeignStatesAsync(countIds[i]);
            }
        }
    }
    async main() {
        // Read all scenes
        const states = (await this.getForeignObjectsAsync('scene.*', 'state'));
        if (states) {
            for (const id in states) {
                // ignore if no states involved
                if (!Object.prototype.hasOwnProperty.call(states, id) || !states[id].native?.members?.length) {
                    continue;
                }
                // ignore if a scene is disabled
                if (!states[id].common.enabled) {
                    continue;
                }
                // ignore if another instance
                if (states[id].common.engine !== `system.adapter.${this.namespace}`) {
                    continue;
                }
                this.scenes[id] = states[id];
                this.scenes[id].native = this.scenes[id].native || {};
                // rename attribute
                if (this.scenes[id].native.burstIntervall !== undefined) {
                    this.scenes[id].native.burstInterval = this.scenes[id].native.burstIntervall;
                    delete this.scenes[id].native.burstIntervall;
                }
                // Remove all disabled scenes
                for (let m = states[id].native.members.length - 1; m >= 0; m--) {
                    if (!this.scenes[id].native.members[m] || states[id].native.members[m].disabled) {
                        this.scenes[id].native.members.splice(m, 1);
                        continue;
                    }
                    // Reset actual state
                    this.scenes[id].native.members[m].actual = null;
                }
                if (!states[id].native.members.length) {
                    delete this.scenes[id];
                    continue;
                }
                // extend all enums to simple scenes
                let i;
                do {
                    i = this.scenes[id].native.members.findIndex(member => member.enums);
                    if (i !== -1) {
                        await this.enum2scenes(id, i);
                    }
                } while (i !== -1);
            }
        }
        await this.initScenes();
    }
}
exports.ScenesAdapter = ScenesAdapter;
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new ScenesAdapter(options);
}
else {
    // otherwise start the instance directly
    (() => new ScenesAdapter())();
}
//# sourceMappingURL=main.js.map
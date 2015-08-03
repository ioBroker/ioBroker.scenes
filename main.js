/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils   = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('scenes');

adapter.on('stateChange', function (id, state) {
    if (state) {
        if (scenes[id] && state) {
            scenes[id].value = state;
        }
        if (!state.ack) {
            if (scenes[id]) {
                if (state.val) {
                    // activate scene
                    activateScene(id, true);
                } else if (scenes[id].native.setIfFalse) {
                    activateScene(id, false);
                }
            }
        }

        if (ids[id]) {
            for (var s = 0; s < ids[id].length; s++) {
                checkScene(ids[id][s], id, state);
            }
        }

        if (triggers[id]) {
            for (var t = 0; t < triggers[id].length; t++) {
                checkTrigger(triggers[id][t], id, state);
            }

        }
    }
});

adapter.on('objectChange', function (id, obj) {
    if (id.match(/^scene\./)) {
        if (scenes[id]) {
            restartAdapter();
        } else if (obj) {
            if (obj.common.engine == 'system.adapter.' + adapter.namespace) {
                restartAdapter();
            }
        }
    }
});

function restartAdapter() {
    // stop all timers
    for (var t in triggers) {
        for (var id = 0; id < triggers[t].length; id++) {
            clearTimeout(triggers[t][id]);
        }
    }
    for (var t in checkTimers) {
        clearTimeout(checkTimers[t]);
    }
    if (!subscription) {
        adapter.unsubscribeForeignStates();
    } else {
        adapter.unsubscribeForeignStates('scene.*');
        // and for all states
        for (var i = 0; i < subscription.length; i++) {
            adapter.unsubscribeForeignStates(subscription[i]);
        }
    }
    subscription = null;
    scenes       = {};
    ids          = {};
    triggers     = {};
    timers        = {};
    tIndex       = 1;
    checkTimers  = {};

    main();
}

adapter.on('ready', function () {
    main();
    adapter.subscribeForeignObjects('scene.*');
});

var subscription = null;
var scenes       = {};
var ids          = {};
var triggers     = {};
var timers       = {};
var checkTimers  = {};

// Check if actual states are exactly as desired in the scene
function checkScene(sceneId, stateId, state) {
    if (checkTimers[sceneId]) {
        for (var i = 0; i < scenes[sceneId].native.members.length; i++) {
            // Do not check states with delay
            if (scenes[sceneId].native.members[i].delay) continue;

            // if state must be updated
            if (stateId && scenes[sceneId].native.members[i].id == stateId) {
                scenes[sceneId].native.members[i].actual = state.val;
            }
        }

        return;
    }
    checkTimers[sceneId] = setTimeout(function () {
        checkTimers[sceneId] = null;
        var activeTrue  = null;
        var activeFalse = null;
        for (var i = 0; i < scenes[sceneId].native.members.length; i++) {
            // Do not check states with delay
            if (scenes[sceneId].native.members[i].delay) continue;

            // There are some states
            if (activeTrue  === null) activeTrue  = true;
            if (activeFalse === null) activeFalse = true;

            // if state must be updated
            if (stateId && scenes[sceneId].native.members[i].id == stateId) {
                scenes[sceneId].native.members[i].actual = state.val;
            }

            if (scenes[sceneId].native.members[i].setIfTrue != scenes[sceneId].native.members[i].actual) {
                activeTrue = false;
                if (!scenes[sceneId].native.setIfFalse) break;
            }
            if (scenes[sceneId].native.members[i].setIfFalse != scenes[sceneId].native.members[i].actual) {
                activeFalse = false;
            }
        }

        if (scenes[sceneId].native.setIfFalse) {
            if (activeTrue) {
                if (!scenes[sceneId].value || (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack)) {
                    scenes[sceneId].value = scenes[sceneId].value || {};
                    scenes[sceneId].value.val = true;
                    scenes[sceneId].value.ack = true;

                    adapter.setForeignState(sceneId, true, true);
                }
            } else if (activeFalse) {
                if (!scenes[sceneId].value || (scenes[sceneId].value.val !== false || !scenes[sceneId].value.ack)) {
                    scenes[sceneId].value = scenes[sceneId].value || {};
                    scenes[sceneId].value.val = false;
                    scenes[sceneId].value.ack = true;

                    adapter.setForeignState(sceneId, false, true);
                }
            } else {
                if (!scenes[sceneId].value || (scenes[sceneId].value.val !== 'uncertain' || !scenes[sceneId].value.ack)) {
                    scenes[sceneId].value = scenes[sceneId].value || {};
                    scenes[sceneId].value.val = 'uncertain';
                    scenes[sceneId].value.ack = true;

                    adapter.setForeignState(sceneId, 'uncertain', true);
                }
            }
        } else {
            if (activeTrue !== null) {
                if (!scenes[sceneId].value || (scenes[sceneId].value.val !== activeTrue || !scenes[sceneId].value.ack)) {
                    scenes[sceneId].value = scenes[sceneId].value || {};
                    scenes[sceneId].value.val = activeTrue;
                    scenes[sceneId].value.ack = true;

                    adapter.setForeignState(sceneId, activeTrue, true);
                }
            }
        }
    }, 500);

}

function checkTrigger(sceneId, stateId, state) {
    var val;
    var fVal;
    var aVal;

    if (scenes[sceneId].native.triggerId == stateId) {
        val = scenes[sceneId].native.triggerValue;

        switch (scenes[sceneId].native.triggerCond) {
            case '==':
                if (val.toString() == state.val.toString()) {
                    activateScene(sceneId);
                }

                break;

            case '!=':
                if (val.toString() != state.val.toString()) {
                    activateScene(sceneId);
                }
                break;

            case '>':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val.toString() && state.val.toString() == aVal.toString()) {
                    if (aVal > fVal) activateScene(sceneId);
                } else
                if (val.toString() > state.val.toString()) {
                    activateScene(sceneId);
                }
                break;

            case '<':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val.toString() && state.val.toString() == aVal.toString()) {
                    if (aVal < fVal) activateScene(sceneId);
                } else
                if (val.toString() < state.val.toString()) {
                    activateScene(sceneId);
                }                    break;

            case '>=':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val.toString() && state.val.toString() == aVal.toString()) {
                    if (aVal >= fVal) activateScene(sceneId);
                } else
                if (val.toString() >= state.val.toString()) {
                    activateScene(sceneId);
                }                    break;

            case '<=':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val.toString() && state.val.toString() == aVal.toString()) {
                    if (aVal <= fVal) activateScene(sceneId);
                } else
                if (val.toString() <= state.val.toString()) {
                    activateScene(sceneId);
                }
                break;

            default:
                adapter.log.error('Unsupported condition: ' + scenes[sceneId].native.triggerCond);
                break;
        }
    }
}

var tIndex = 1; // never ending counter

function activateScene(sceneId, isTrue) {

    for (var state = 0; state < scenes[sceneId].native.members.length; state++) {
        var stateObj = scenes[sceneId].native.members[state];
        if (stateObj.delay) {
            timers[state.id] = timers[state.id] || [];
            if (stateObj.stopAllDelays) {
                for (var t = 0; t < timers[state.id].length; t++) {
                    clearTimeout(timers[state.id][t]);
                }
                timers[state.id] = [];
            }
            tIndex++;

            // Start timeout
            var timer = setTimeout(function (id, setValue, _tIndex) {
                // execute timeout
                adapter.setForeignState(id, setValue);

                // remove timer from the list
                for (var r = 0; r < timers[id].length; r++) {
                    if (timers[id][r] == _tIndex) {
                        timers[id].splice(r, 1);
                        break;
                    }
                }

            }, stateObj.delay, state.id, isTrue ? stateObj.setIfTrue : stateObj.setIfFalse, tIndex);

            timers[state.id].push({timer: timer, tIndex: tIndex});
        } else {
            if (stateObj.stopAllDelays && timers[state.id]) {
                for (var t = 0; t < timers[state.id].length; t++) {
                    clearTimeout(timers[state.id][t]);
                }
                timers[state.id] = [];
            }


            adapter.setForeignState(stateObj.id, isTrue ? stateObj.setIfTrue : stateObj.setIfFalse);
        }
    }

    if (scenes[sceneId].native.setIfFalse) {
        if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
            scenes[sceneId].value.val = isTrue;
            scenes[sceneId].value.ack = true;
            adapter.setForeignState(sceneId, isTrue, true);
        }
    } else
    if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
        scenes[sceneId].value.val = true;
        scenes[sceneId].value.ack = true;
        adapter.setForeignState(sceneId, true, true);
    }
}

function getState(sceneId, stateNumber) {
    var stateId = scenes[sceneId].native.members[stateNumber].id;
    adapter.getForeignState(stateId, function (err, state) {
        scenes[sceneId].native.members[stateNumber].actual = state ? state.val : null;
        // If processing finshed
        if (!--scenes[sceneId].count) {
            delete scenes[sceneId].count;
            checkScene(sceneId);
        }
    });
}

function initScenes() {
    var countIds = [];

    // list all scenes in Object
    for (var sceneId in scenes) {
        scenes[sceneId].count = 0;
        // Go through all states in Array
        for (var state = 0; state < scenes[sceneId].native.members.length; state++) {
            var stateId = scenes[sceneId].native.members[state].id;
            // calculate subscriptions
            if (countIds.indexOf(stateId) == -1) countIds.push(stateId);

            // remember which scenes uses this state
            ids[stateId] = ids[stateId] || [];
            if (ids[stateId].indexOf(sceneId) == -1) {
                ids[stateId].push(sceneId);
            }

            // remember triggers
            if (scenes[sceneId].common.triggerId) {
                if (countIds.indexOf(scenes[sceneId].common.triggerId) == -1) countIds.push(scenes[sceneId].common.triggerId);
                triggers[scenes[sceneId].common.triggerId] = triggers[scenes[sceneId].common.triggerId] || [];
                triggers[scenes[sceneId].common.triggerId].push(sceneId);
            }

            scenes[sceneId].count++;
            // read actual state
            getState(sceneId, state);
        }
    }

    // If requested more than 20 ids => get all of them
    if (countIds.length > 20) {
        adapter.subscribeForeignStates();
    } else {
        // subscribe for own scenes
        adapter.subscribeForeignStates('scene.*');
        subscription = countIds;
        // and for all states
        for (var i = 0; i < countIds.length; i++) {
            adapter.subscribeForeignStates(countIds[i]);
        }
    }
}

function main() {
    // Read all scenes
    adapter.getForeignObjects('scene.*', 'state', function (err, states) {
        if (states) {
            for (var id in states) {
                if (!states[id].native || !states[id].native.members || !states[id].native.members.length) continue;
                if (!states[id].common.enabled) continue;
                if (states[id].common.engine != 'system.adapter.' + adapter.namespace) continue;

                scenes[id] = states[id];

                for (var m = states[id].native.members.length - 1; m >= 0; m--) {
                    if (states[id].native.members[m].disabled) scenes[id].native.members.splice(m, 1);
                    scenes[id].native.members[m].actual = null;
                }
            }
        }
        initScenes();
    });
}


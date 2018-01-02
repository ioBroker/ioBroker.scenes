// Copyright Bluefox <dogafox@gmail.com> 2015
//

// Structure of one scene
// {
//     "common": {
//         "name": "scene 2",
//         "type": "boolean",
//         "role": "scene.state",
//         "desc": "scene 2",
//         "enabled": true,
//         "engine": "system.adapter.scenes.0"
//     },
//     "native": {
//         "burstIntervall": 0,
//         "members": [
//             {
//                 "id": "system.adapter.hm-rega.0.alive",
//                 "setIfFalse": false,                       // value if scene set to false
//                 "setIfTrue": true                          // value if scene set to true
//             },
//             {
//                 "id": "system.adapter.hm-rega.0.connected",
//                 "setIfTrue": true
//             },
//             {
//                 "id": "system.adapter.node-red.0.memHeapTotal",
//                 "setIfTrue": null,
//                 "setIfFalse": 28.54,
//                 "stopAllDelays": true                      // if all other timers for this ID must be stopped
//             }
//         ],
//         "onTrue": {                                        // Settings for scene if value of scene set to true
//             "triggerId": null,
//             "triggerCond": null,
//             "triggerValue": null,
//             "cron": "",
//             "astro": "",
//         },
//         "onFalse": {                                       // Settings for scene if value of scene set to false
//             "enabled": false,                              // if set to "false" supported
//             "triggerId": null,
//             "triggerCond": null,
//             "triggerValue": null,
//             "cron": "",
//             "astro": "",
//         },
//     }


/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils   = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.Adapter('scenes');

var schedule;
var suncalc;

adapter.on('stateChange', function (id, state) {
    if (state) {
        if (scenes[id] && state) {
            scenes[id].value = state;
        }
        if (!state.ack) {
            if (scenes[id]) {
                if (scenes[id].native.virtualGroup) {
                    activateScene(id, state.val);
                } else {
                    var val = state.val;
                    if (val === 'true')  val = true;
                    if (val === 'false') val = false;
                    if (val === '0')     val = 0;

                    if (val) {
                        // activate scene
                        activateScene(id, true);
                    } else if (scenes[id].native.onFalse && scenes[id].native.onFalse.enabled) {
                        activateScene(id, false);
                    }
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
                checkTrigger(triggers[id][t], id, state, true);
                checkTrigger(triggers[id][t], id, state, false);
            }
        }
    }
});

adapter.on('objectChange', function (id, obj) {
    if (id.match(/^scene\./)) {
        if (scenes[id]) {
            restartAdapter();
        } else if (obj) {
            if (obj.common.engine === 'system.adapter.' + adapter.namespace) {
                restartAdapter();
            }
        }
    }
});

function restartAdapter() {
    adapter.log.info('restartAdapter');
    // stop all timers
    var t;
    for (t in checkTimers) {
        clearTimeout(checkTimers[t]);
    }
    for (t in astroTimers) {
        clearTimeout(astroTimers[t]);
    }
    for (t in timers) {
        clearTimeout(timers[t]);
    }
    if (schedule) {
        for (t in cronTasks) {
            if (cronTasks[t]) cronTasks[t].cancel();
        }
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
    timers       = {};
    tIndex       = 1;
    checkTimers  = {};
    astroTimers  = {};
    cronTasks    = {};

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
var astroTimers  = {};
var cronTasks    = {};

// Check if actual states are exactly as desired in the scene
function checkScene(sceneId, stateId, state) {
    if (checkTimers[sceneId]) {
        for (var i = 0; i < scenes[sceneId].native.members.length; i++) {
            // Do not check states with delay
            if (scenes[sceneId].native.members[i].delay) continue;

            // if state must be updated
            if (stateId && scenes[sceneId].native.members[i].id === stateId) {
                scenes[sceneId].native.members[i].actual = state.val;
            }
        }

        return;
    }

    checkTimers[sceneId] = setTimeout(function () {
        checkTimers[sceneId] = null;
        var activeTrue  = null;
        var activeFalse = null;
        var activeValue = null;
        var isWithFalse = (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled);

        for (var i = 0; i < scenes[sceneId].native.members.length; i++) {
            // Do not check states with delay
            if (scenes[sceneId].native.members[i].delay) continue;

            // There are some states
            if (activeTrue  === null) activeTrue  = true;
            if (activeFalse === null) activeFalse = true;

            // if state must be updated
            if (stateId && scenes[sceneId].native.members[i].id === stateId) {
                scenes[sceneId].native.members[i].actual = state.val;
            }

            if (scenes[sceneId].native.virtualGroup) {
                if (activeValue === 'uncertain') continue;

                if (activeValue === null) {
                    activeValue = scenes[sceneId].native.members[i].actual;
                } else if (activeValue != scenes[sceneId].native.members[i].actual) {
                    activeValue = 'uncertain';
                }
            } else {
                if (scenes[sceneId].native.members[i].setIfTrue != scenes[sceneId].native.members[i].actual) {
                    activeTrue = false;
                    //if (!isWithFalse) break; -- state must be updated
                }
                if (isWithFalse && scenes[sceneId].native.members[i].setIfFalse != scenes[sceneId].native.members[i].actual) {
                    activeFalse = false;
                }
            }
        }

        if (scenes[sceneId].native.virtualGroup) {
            if (activeValue !== null) {
                if (scenes[sceneId].value.val !== activeValue || !scenes[sceneId].value.ack) {
                    scenes[sceneId].value.val = activeValue;
                    scenes[sceneId].value.ack = true;

                    adapter.setForeignState(sceneId, activeValue, true);
                }
            }
        } else {
            if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
                if (activeTrue) {
                    if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                        scenes[sceneId].value.val = true;
                        scenes[sceneId].value.ack = true;

                        adapter.setForeignState(sceneId, true, true);
                    }
                } else if (activeFalse) {
                    if (scenes[sceneId].value.val !== false || !scenes[sceneId].value.ack) {
                        scenes[sceneId].value.val = false;
                        scenes[sceneId].value.ack = true;

                        adapter.setForeignState(sceneId, false, true);
                    }
                } else {
                    if (scenes[sceneId].value.val !== 'uncertain' || !scenes[sceneId].value.ack) {
                        scenes[sceneId].value.val = 'uncertain';
                        scenes[sceneId].value.ack = true;

                        adapter.setForeignState(sceneId, 'uncertain', true);
                    }
                }
            } else {
                if (activeTrue !== null) {
                    if (scenes[sceneId].value.val !== activeTrue || !scenes[sceneId].value.ack) {
                        scenes[sceneId].value.val = activeTrue;
                        scenes[sceneId].value.ack = true;

                        adapter.setForeignState(sceneId, activeTrue, true);
                    }
                }
            }
        }
    }, 200);
}

function checkTrigger(sceneId, stateId, state, isTrue) {
    var val;
    var fVal;
    var aVal;

    if (!state) return;

    var trigger = isTrue ? scenes[sceneId].native.onTrue : scenes[sceneId].native.onFalse;
    if (!trigger || trigger.enabled === false || !trigger.trigger) return;
    trigger = trigger.trigger;

    if (trigger.id === stateId) {
        var stateVal = (state && state.val !== undefined && state.val !== null) ? state.val.toString() : '';

        val = trigger.value;
        
        adapter.log.debug('checkTrigger: ' + trigger.id + '(' + state.val + ') ' + trigger.condition + ' ' + val.toString());

        switch (trigger.condition) {
            case '==':
                if (val == stateVal) activateScene(sceneId, isTrue);
                break;

            case '!=':
                if (val != stateVal) activateScene(sceneId, isTrue);
                break;

            case '>':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal > fVal) activateScene(sceneId, isTrue);
                } else
                if (val > state.val.toString()) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '<':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal < fVal) activateScene(sceneId, isTrue);
                } else
                if (val < state.val.toString()) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case '>=':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal >= fVal) activateScene(sceneId, isTrue);
                } else
                if (val >= state.val.toString()) {
                    activateScene(sceneId, isTrue);
                }                    
                break;

            case '<=':
                fVal = parseFloat(val);
                aVal = parseFloat(state.val);
                if (fVal.toString() == val && stateVal === aVal.toString()) {
                    if (aVal <= fVal) activateScene(sceneId, isTrue);
                } else
                if (val <= state.val.toString()) {
                    activateScene(sceneId, isTrue);
                }
                break;

            case 'update':
                activateScene(sceneId, isTrue);
                break;

            default:
                adapter.log.error('Unsupported condition: ' + trigger.condition);
                break;
        }
    }
}

var tIndex = 1; // never ending counter

// Set one state of the scene
function activateSceneState(sceneId, state, isTrue) {
    var stateObj = scenes[sceneId].native.members[state];

    if (!scenes[sceneId].native.virtualGroup) {
        isTrue = isTrue ? stateObj.setIfTrue : stateObj.setIfFalse;
    }

    if (stateObj.delay) {
        timers[stateObj.id] = timers[stateObj.id] || [];
        if (stateObj.stopAllDelays && timers[stateObj.id].length) {
            adapter.log.debug('Cancel running timers (' + timers[stateObj.id].length + ' for ' + stateObj.id);
            for (var tt = 0; tt < timers[stateObj.id].length; tt++) {
                clearTimeout(timers[stateObj.id][tt].timer);
            }
            timers[stateObj.id] = [];
        }
        tIndex++;

        // Start timeout
        var timer = setTimeout(function (id, setValue, _tIndex) {
            adapter.log.debug('Set delayed state for "' + sceneId + '": ' + id + ' = ' + setValue);
            // execute timeout
            adapter.setForeignState(id, setValue);

            if (timers[id]) {
                // remove timer from the list
                for (var r = 0; r < timers[id].length; r++) {
                    if (timers[id][r].tIndex === _tIndex) {
                        timers[id].splice(r, 1);
                        break;
                    }
                }
            }
        }, stateObj.delay, stateObj.id, isTrue, tIndex);

        timers[stateObj.id].push({timer: timer, tIndex: tIndex});
    } else {
        if (stateObj.stopAllDelays && timers[stateObj.id] && timers[stateObj.id].length) {
            adapter.log.debug('Cancel running timers for "' + stateObj.id + '" (' + timers[stateObj.id].length + ')');
            for (var t = 0; t < timers[stateObj.id].length; t++) {
                clearTimeout(timers[stateObj.id][t].timer);
            }
            timers[stateObj.id] = [];
        }
        adapter.setForeignState(stateObj.id, isTrue);
    }
}

// Set all states of the state with interval
function activateSceneStates(sceneId, state, isTrue, interval, callback) {
    if (!scenes[sceneId].native.members[state]) {
        return callback();
    }
    if (state == 0) {
        activateSceneState(sceneId, state, isTrue);
        state++;
        if (!scenes[sceneId].native.members[state]) {
            return callback();
        }
    }

    setTimeout(function () {
        activateSceneState(sceneId, state, isTrue);
        activateSceneStates(sceneId, state + 1, isTrue, interval, callback);
    }, interval);
}

function activateScene(sceneId, isTrue) {
    adapter.log.debug('activateScene: execute for "' + sceneId + '" (' + isTrue + ')');

    // all commands must be executed without interval
    if (!scenes[sceneId].native.burstIntervall) {
        for (var state = 0; state < scenes[sceneId].native.members.length; state++) {
            activateSceneState(sceneId, state, isTrue);
        }

        if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
            if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
                adapter.log.debug('activateScene: new state for "' + sceneId + '" is "' + isTrue + '"');
                scenes[sceneId].value.val = isTrue;
                scenes[sceneId].value.ack = true;
                adapter.setForeignState(sceneId, isTrue, true);
            }
        } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
            adapter.log.debug('activateScene: new state for "' + sceneId + '" is "true"');
            scenes[sceneId].value.val = true;
            scenes[sceneId].value.ack = true;
            adapter.setForeignState(sceneId, true, true);
        }
    } else {
        // make some interval between commands
        activateSceneStates(sceneId, 0, isTrue, scenes[sceneId].native.burstIntervall, function () {
            if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.enabled) {
                if (scenes[sceneId].value.val !== isTrue || !scenes[sceneId].value.ack) {
                    adapter.log.debug('activateScene: new state for "' + sceneId + '" is "' + isTrue + '"');
                    scenes[sceneId].value.val = isTrue;
                    scenes[sceneId].value.ack = true;
                    adapter.setForeignState(sceneId, isTrue, true);
                }
            } else if (scenes[sceneId].value.val !== true || !scenes[sceneId].value.ack) {
                adapter.log.debug('activateScene: new state for "' + sceneId + '" is "true"');
                scenes[sceneId].value.val = true;
                scenes[sceneId].value.ack = true;
                adapter.setForeignState(sceneId, true, true);
            }
        });
    }
}

function getState(sceneId, stateNumber, callback) {
    var stateId = scenes[sceneId].native.members[stateNumber].id;
    adapter.getForeignState(stateId, function (err, state) {
        // possible scene was renamed
        if (!scenes[sceneId]) return;

        scenes[sceneId].native.members[stateNumber].actual = state ? state.val : null;
        // If processing finshed
        if (!--scenes[sceneId].count) {
            delete scenes[sceneId].count;
            checkScene(sceneId);
        }
    });
}

function initTrueFalse(sceneId, isTrue) {
    var usedIds = [];
    var sStruct = isTrue ? scenes[sceneId].native.onTrue : scenes[sceneId].native.onFalse;
    if (!sStruct) return;
    if (sStruct.enabled === false) return;

    // remember triggers for true
    if (sStruct.trigger && sStruct.trigger.id) {
        usedIds.push(sStruct.trigger.id);
        triggers[sStruct.trigger.id] = triggers[sStruct.trigger.id] || [];
        if (triggers[sStruct.trigger.id].indexOf(sceneId) === -1) {
            triggers[sStruct.trigger.id].push(sceneId);
        }
    }
    // initiate cron tasks
    if (sStruct.cron) {
        if (!schedule) schedule = require('node-schedule');

        adapter.log.debug('Initiate cron task for ' + sceneId + '(' + isTrue + ') : ' + sStruct.cron);
        cronTasks[sceneId] = schedule.scheduleJob(sStruct.cron, function () {
            adapter.log.debug('cron for ' + sceneId + '(' + isTrue + ') : ' + sStruct.cron);
            activateScene(sceneId, isTrue);
        });
    }

    return usedIds;
}

function initScenes() {
    var countIds = [];

    // list all scenes in Object
    for (var sceneId in scenes) {
        scenes[sceneId].count = 0;
        scenes[sceneId].value = {val: null, ack: true}; // default state

        // Go through all states in Array
        for (var state = 0; state < scenes[sceneId].native.members.length; state++) {
            var stateId = scenes[sceneId].native.members[state].id;
            // calculate subscriptions
            if (countIds.indexOf(stateId) === -1) countIds.push(stateId);

            // remember which scenes uses this state
            ids[stateId] = ids[stateId] || [];
            if (ids[stateId].indexOf(sceneId) === -1) ids[stateId].push(sceneId);

            // Convert delay
            if (scenes[sceneId].native.members[state].delay) {
                var delay =  parseInt(scenes[sceneId].native.members[state].delay, 10);
                if (scenes[sceneId].native.members[state].delay != delay.toString()) {
                    adapter.log.error('Invalid delay for scene "' + sceneId + '": ' + scenes[sceneId].native.members[state].delay);
                    scenes[sceneId].native.members[state].delay = 0;
                } else {
                    scenes[sceneId].native.members[state].delay = delay;
                }
            } else {
                scenes[sceneId].native.members[state].delay = 0;
            }

            if (scenes[sceneId].native.members[state].setIfTrue === undefined || scenes[sceneId].native.members[state].setIfTrue === null) {
                scenes[sceneId].native.members[state].setIfTrue = false;
            }
            if (scenes[sceneId].native.members[state].setIfFalse === undefined || scenes[sceneId].native.members[state].setIfFalse === null) {
                scenes[sceneId].native.members[state].setIfFalse = false;
            }

            scenes[sceneId].count++;
            // read actual state
            getState(sceneId, state);
        }
        if (scenes[sceneId].native.onTrue  && scenes[sceneId].native.onTrue.trigger)  {
            if (scenes[sceneId].native.onTrue.trigger.value === null || scenes[sceneId].native.onTrue.trigger.value === undefined) {
                scenes[sceneId].native.onTrue.trigger.value  = '';
            } else {
                scenes[sceneId].native.onTrue.trigger.value  = scenes[sceneId].native.onTrue.trigger.value.toString();
            }
        }
        if (scenes[sceneId].native.onFalse && scenes[sceneId].native.onFalse.trigger) {
            if (scenes[sceneId].native.onFalse.trigger.value === null || scenes[sceneId].native.onFalse.trigger.value === undefined) {
                scenes[sceneId].native.onFalse.trigger.value  = '';
            } else {
                scenes[sceneId].native.onFalse.trigger.value  = scenes[sceneId].native.onFalse.trigger.value.toString();
            }
        }
        // Init trigger, cron and astro for onTrue
        var usedIds = initTrueFalse(sceneId, true);
        if (usedIds) {
            for (var k = 0; k < usedIds.length; k++) {
                if (countIds.indexOf(usedIds[k]) === -1) countIds.push(usedIds[k]);
            }
        }

        // Init trigger, cron and astro for onFalse
        usedIds = initTrueFalse(sceneId, false);
        if (usedIds) {
            for (k = 0; k < usedIds.length; k++) {
                if (countIds.indexOf(usedIds[k]) === -1) countIds.push(usedIds[k]);
            }
        }
    }

    // If requested more than 20 ids => get all of them
    if (countIds.length > 20) {
        adapter.log.debug('initScenes: subscribe on all');

        adapter.subscribeForeignStates();
    } else {
        // subscribe for own scenes
        adapter.subscribeForeignStates('scene.*');
        subscription = countIds;
        // and for all states
        for (var i = 0; i < countIds.length; i++) {
            adapter.log.debug('initScenes: subscribe on ' + countIds[i]);
            adapter.subscribeForeignStates(countIds[i]);
        }
    }
}

function main() {
    // Read all scenes
    adapter.getForeignObjects('scene.*', 'state', function (err, states) {
        if (states) {
            for (var id in states) {
                // ignore if no states involved
                if (!states.hasOwnProperty(id) || !states[id].native || !states[id].native.members || !states[id].native.members.length) continue;
                //ignore if scene is disabled
                if (!states[id].common.enabled) continue;
                // ignore if another instance
                if (states[id].common.engine !== 'system.adapter.' + adapter.namespace) continue;

                scenes[id] = states[id];

                // Remove all disabled scenes
                for (var m = states[id].native.members.length - 1; m >= 0; m--) {
                    // Reset actual state
                    scenes[id].native.members[m].actual = null;
                    if (states[id].native.members[m].disabled) scenes[id].native.members.splice(m, 1);
                }
            }
        }
        initScenes();
    });
}


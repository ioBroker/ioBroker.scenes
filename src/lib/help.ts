/**
 * The answer of the message `help`: what the instance answers, written for AI agents (e.g. ioBroker.pi-agent,
 * or the MCP server with `send_to`) and script authors. Keep it in sync with `onMessage` in main.ts and the README.
 */

/** Every command `onMessage` answers; `write` = the command changes something */
export const COMMANDS: { command: string; write: boolean }[] = [
    { command: 'help', write: false },
    { command: 'save', write: true },
    { command: 'enable', write: true },
    { command: 'disable', write: true },
    { command: 'stop', write: true },
];

export const HELP = `ioBroker.scenes: scenes, groups and virtual groups. A scene is a state scene.0.<name> with a list of member
states and their desired values; writing the scene state sets all members at once (with optional delays). An agent
can activate scenes, save the current values of the members into a scene, enable, disable and stop scenes.

Scenes are the objects scene.0.* of type state with common.engine = "system.adapter.scenes.0": common.name = the
name, common.enabled = active (a disabled scene does nothing), native.members = [{id, setIfTrue, setIfFalse, delay,
disabled}], native.onFalse.enabled = it is a group, native.virtualGroup = it is a virtual group. A desired value
"{{<state id>}}" means the current value of that state.

Commands (sendTo scenes.0); sceneId = the ID of the scene state, e.g. "scene.0.Bath.allLights":
- save {sceneId, isForTrue?}: stores the current values of all member states as the desired values of the scene,
  for true (isForTrue true, the default) or for false (isForTrue false: the values "set on false" of a group).
  Members from rooms and functions get the common value of their devices (numbers: the average). Overwrites the
  scene: {result, allSaved}; allSaved false = some room/function members were not saved (their devices differ).
- enable {sceneId} / disable {sceneId}: sets common.enabled of the scene; a disabled scene ignores writes to its
  state, its triggers and its schedule: {result} or {warning: "Scene already enabled"/"Scene already disabled"}.
- stop {sceneId}: cancels the delayed commands of a running scene that are not written yet (the written values
  stay): {result: "<n> pending commands stopped"}.
enable, disable and stop also take the scene ID as a plain string instead of {sceneId}; save needs {sceneId}.
Errors: {error}, e.g. "Scene not found" (stop: also for a disabled scene), "No scene ID".

States (scene.0.*): to activate a scene, write its state with ack false (no message needed):
- scene: true (any value except false, 0, "", "false", "0") sets every member to setIfTrue. The value of the scene
  is then true while the members have their desired values, else false.
- group (native.onFalse.enabled): true sets setIfTrue, false sets setIfFalse. Value: true, false or "uncertain".
- virtual group: the written value (e.g. 40 = all blinds to 40 %) goes to every member. Value: the common value of
  the members; if they differ, "uncertain" or min, max, avg, sum, any of them (native.aggregation).
- the string "stop" stops a running scene like the command stop (not a virtual group: it forwards "stop").
A scene can also run by itself: native.onTrue / native.onFalse with trigger (a state and a condition) or cron.

How to talk to the user:
- Find the scene by its name (the objects scene.0.*); name scenes and devices by name, not by ID.
- Activating a scene switches real devices: only when the user asks for it; if several scenes fit, ask which one.
- save overwrites the stored values of the scene, disable stops its triggers and schedule: only on the user's
  explicit request. For save of a group ask whether the values are for on (true) or off (false).
- When the user asks what a scene does, list its members by name with their desired values.`;

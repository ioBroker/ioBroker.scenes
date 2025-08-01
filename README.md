![Logo](admin/scenes.png)
# ioBroker scenes adapter

![Number of Installations](http://iobroker.live/badges/scenes-installed.svg)
![Number of Installations](http://iobroker.live/badges/scenes-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.scenes.svg)](https://www.npmjs.com/package/iobroker.scenes)

![Test and Release](https://github.com/ioBroker/ioBroker.scenes/workflows/Test%20and%20Release/badge.svg)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/scenes/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)
[![Downloads](https://img.shields.io/npm/dm/iobroker.scenes.svg)](https://www.npmjs.com/package/iobroker.scenes)

_scenes Adapter_ can create scenes and execute them in ioBroker environment.

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

This adapter can create three types of scenes: 
- **scenes**
- **groups**
- **virtual groups**

## Scenes
**Scenes** will be created if setting "set on false" are not used. 
Every scene can be configured individually, so you can have **scenes** and **groups** in one instance of adapter.
The **scene** is just a list of states id and values, that these states must have by activation of the scene. E.g., we have created on the scene `scene.allLightInBath`:

```
  scene.allLightInBath
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true
  +- hm-rpc.0.TOP_LIGHT.STATE     - true
```

To activate the scene, we must set `scene.allLightInBath` to true (e.g., over a script or vis). Then both states will be set to desired values, to `true`. 
The value of `scene.allLightInBath` will be `true` too. If we manually switch to the top light, the value of the `scene.allLightInBath` will go to `false`.
And again to `true` if we will manually switch the light on.

Let's add to the **scene** the fan:

```
  scene.allLightInBath
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true
  |- hm-rpc.0.TOP_LIGHT.STATE     - true
  |- hm-rpc.0.FAN.STATE          - true
  |- hm-rpc.0.FAN.STATE          - false (delay 60000ms)
```

In this case, the fan will be switched on ba activation of the **scene** and will be switched off in one minute. 
After the fan will be switched off the value of `scene.allLightInBath` will go to `false`, because not all states are equal to desired values. 
States with delay are not participated in calculations.

You can test the scene with a "play" button.
Additionally, you can link this **scene** direct with other scene ID. E.g., if you have a sensor on the door, you can select it as a trigger:

```
  trigger
    id:        hm-rpc.0.DOOR_SENSOR.STATE
    condition: ==
    value:     true
```

And every time you open the door in the bath, all lights with fan will be switched on.

## Groups
**Groups** are like virtual channels. You can create with the help of **groups** virtual device from several actuators and control them together, like one device.
Let's modify our sample with the bath's lights.  

```
  scene.allLightInBath             "set on true"    "set on false" 
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true             false
  +- hm-rpc.0.TOP_LIGHT.STATE     - true             false
```

If you link this **group** with the door sensor like:

```
  trigger on true
    id:        hm-rpc.0.DOOR_SENSOR.STATE
    condition: ==
    value:     true

  trigger on false
    id:        hm-rpc.0.DOOR_SENSOR.STATE
    condition: ==
    value:     false
```

Every time you open the door, all lights in a bath will be switched on. The value of the `scene.allLightInBath` will go to **true**.
If you close the door, the lights will be switched off, and the value of `scene.allLightInBath` will go to **false**. 

It is useless, but it is good as an example.

If you manually switch on one light, the value of the `scene.allLightInBath` will go to **uncertain**.

Delays can be used in the **group** too, but the states with delay are not participated in calculations of the current value of **group**.

## Virtual groups
**Virtual groups** are like virtual channels and like groups, but can have any kind of values: numbers, strings, and so on. 
You can create a virtual group to control all shutters in the living room. 
By writing 40% into a virtual group, all shutters will be set to 40%.

Additionally, you can define the behavior for which value should be taken for the group if not all states of the group have the same value.

You can provide the following aggregations (available only in advanced mode):
- `uncertain` - (default) - the value of the group will have text `uncertain`.
- `any` - first non-zero value of all states in a group.
- `min` - minimal value of all states in a group.
- `max` - maximal value of all states in a group.
- `avg` - average value of all states in a group.

## Save actual states as a scene
To save actual states in some scene, you can send a message to the adapter:
```js
sendTo(
    'scenes.0', 
    'save', 
    {sceneId: 
        'scene.0.SCENE_ID', // scene ID 
        isForTrue: true     // true if actual values must be saved for `true` state and `false` if for false 
    }, 
    result => result.err && console.error(result.error) // optional
);
```
The adapter will read all actual values for IDs defined in this scene and save it as configured ones.
## Disable or enable a scene via a message
To disable or enable some scene, you can send a message to the adapter:
```js
// enable
sendTo(
    'scenes.0', 
    'enable', 
    'scene.0.SCENE_ID', 
    result => result.err && console.error(result.error) // optional
);
// disable
sendTo(
    'scenes.0', 
    'disable', 
    'scene.0.SCENE_ID', 
    result => result.err && console.error(result.error) // optional
);
// or
sendTo(
    'scenes.0', 
    'disable', // 'enable' to enable
    {sceneId: 'scene.0.SCENE_ID'}, 
    result => result.err && console.error(result.error) // optional
);
```

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

## Changelog
### 4.0.3 (2025-07-20)
* (agross) Canceled the cron tasks on the instance stop

### 4.0.2 (2025-06-16)
* (bluefox) Small improvements for layout

### 4.0.1 (2025-01-23)
* (bluefox) Adapter was migrated to TypeScript
* (bluefox) Corrected error with the Select ID dialog

### 3.2.4 (2025-01-22)
* (bluefox) Migrated to vite
* (bluefox) Packages updated

### 3.2.3 (2024-08-26)
* (bluefox) Packages updated

### 3.2.1 (2024-06-21)
* (bluefox) GUI migrated for the new `adapter-react` library

### 3.1.1 (2024-06-21)
* (bluefox) Packages updated
* (bluefox) Prepared for js-controller 6

### 3.0.4 (2024-04-27)
* (bluefox) Corrected error if profile is empty

### 3.0.3 (2024-02-25)
* (bluefox) Saving of the scene states from GUI was implemented

### 3.0.1 (2024-02-16)
* (bluefox) Cleared cron tasks by re-init
* (bluefox) CRON Editor dialog added
* (bluefox) Implemented scene enabling/disabling via messages
* (bluefox) Implemented the writing of the scene states with ack=true
* (bluefox) Added description to the scene states
* (bluefox) Added possibility to use categories/enumerations

### 2.4.2 (2024-02-12)
* (bluefox) Preserved empty folders by renaming and moving of scenes

### 2.4.0 (2022-12-23)
* (Apollon77) prevent a crash case reported by Sentry
* (bluefox) Updated some GUI libraries

### 2.3.9 (2022-02-13)
* (bluefox) Updated some GUI libraries
* (bluefox) Updated releaser

### 2.3.8 (2021-08-31)
* (Apollon77) Handles a case where states are not set but used as value (Sentry IOBROKER-SCENES-13)
* (TyrionWarMage) Added the aggregation mode for the virtual groups.
* (bluefox) Sentry data will not be sent in front-end if the diagnostic or sentry is disabled

### 2.3.6 (2021-01-22)
* (Apollon77) Check state id before getting value (Sentry IOBROKER-SCENES-F)

### 2.3.5 (2021-01-22)
* (Apollon77) Add error logging if invalid ids are configured for scenes (Sentry IOBROKER-SCENES-Y)

### 2.3.4 (2021-01-16)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-X, IOBROKER-SCENES-V)

### 2.3.3 (2020-12-06)
* (bluefox) Implemented drag&drop for the reorder of scenes in folders
* (bluefox) Implemented Easy mode
* (bluefox) Possibility to use set point from another state

### 2.3.1 (2020-11-06)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-M)

### 2.3.0 (2020-11-02)
* (bluefox) Fixed GUI errors

### 2.1.7 (2020-10-30)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-E, IOBROKER-SCENES-G, IOBROKER-SCENES-A)

### 2.1.6 (2020-09-25)
* (bluefox) Updated the select ID dialog.

### 2.1.3 (2020-09-18)
* (Apollon77) Prevent crash cases (Sentry IOBROKER-SCENES-B, IOBROKER-SCENES-8, IOBROKER-SCENES-D)

### 2.1.2 (2020-07-08)
* (bluefox) Interval between states was corrected

### 2.0.17 (2020-06-29)
* (bluefox) GUI error corrected

### 2.0.13 (2020-06-27)
* (bluefox) Mobile view added

### 2.0.12 (2020-06-26)
* (bluefox) GUI error corrected

### 2.0.10 (2020-06-20)
* (bluefox) Added "Do not overwrite state if it has the required value" option

### 2.0.9 (2020-06-17)
* (bluefox) The colors are corrected

### 2.0.8 (2020-06-16)
* (bluefox) The tolerance is implemented

### 2.0.3 (2020-06-14)
* (bluefox) New GUI based on React

### 1.1.1 (2019-05-26)
* (bluefox) Added storing of actual values in a scene via a message

### 1.1.0 (2018-04-24)
* (bluefox) Works now with Admin3

### 1.0.2 (2018-01-21)
* (bluefox) use new select ID dialog
* (DeepCoreSystem) translations
* (paul53) text fixes

### 1.0.0 (2017-11-11)
* (bluefox) fix false scenes

### 0.2.7 (2017-08-14)
* (bluefox) Support of iobroker.pro

### 0.2.6 (2016-06-21)
* (bluefox) add read/write settings to scene object

### 0.2.5 (2016-02-03)
* (bluefox) update node-schedule

### 0.2.4 (2016-01-24)
* (bluefox) fix error disabled states in a scene

### 0.2.3 (2015-12-10)
* (bluefox) fix error with trigger on false

### 0.2.2 (2015-11-22)
* (bluefox) fix error with restart adapter

### 0.2.1 (2015-10-27)
* (bluefox) delete triggers if virtual groups enabled

### 0.2.0 (2015-10-27)
* (bluefox) support of virtual groups

### 0.1.3 (2015-09-19)
* (bluefox) show set value if 0 or false in settings

### 0.1.2 (2015-08-15)
* (bluefox) add translations
* (bluefox) try to fix error by renaming

### 0.1.1 (2015-08-10)
* (bluefox) allow description for states in a scene
* (bluefox) check by rename if the scene with the same name yet exists
* (bluefox) allowed a coping of a scene
* (bluefox) fix error with delay and stopAllDelays settings

### 0.1.0 (2015-08-09)
* (bluefox) fix error with delays and config change
* (bluefox) implement replace

### 0.0.2 (2015-08-05)
* (bluefox) change configuration schema
* (bluefox) add cron
* (bluefox) add a burst interval

### 0.0.1 (2015-07-29)
* (bluefox) initial commit

## License
The MIT License (MIT)

Copyright (c) 2015-2025, Bluefox (dogafox@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

![Logo](admin/scenes.png)
ioBroker scenes adapter
=================
scenes Adapter can create scenes and execute them in ioBroker environment.

This adapter can create two types of scenes: 
- *scenes*
- *groups*

## Scenes
Scenes will be created if settings "set on false" are not used. 
Every scene can be configured individually, so you can have *scenes* and *groups* in one instance of adapter.
Scene is just list of states id and values, that these states must have by activation of the scene. E.g. we have created on scene "_scene.allLightInBath_":

```
  scene.allLightInBath
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true
  +- hm-rpc.0.TOP_LIGHT.STATE     - true
```

To activate scene we must set "_scene.allLightInBath_" to true (e.g over script or vis). Then both states will be set to desired values, to true. 
The value of _scene.allLightInBath_ will be true too. If we manually switch of the top light the value of the _scene.allLightInBath_ will go to false.
And again to true if we switch manuall the light on.

Let's add to the scene the fan:

```
  scene.allLightInBath
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true
  |- hm-rpc.0.TOP_LIGHT.STATE     - true
  |- hm-rpc.0.FAN.STATE          - true
  |- hm-rpc.0.FAN.STATE          - false (delay 60000ms)
```

In this case the fan will be switched on ba activation of the scene and will be switched off in one minute. 
After the fan will be switched off the value of _scene.allLightInBath_ will go to false, because not all states are equal to desired values. 
States with delay are not participate in calculations.

You can test the scene with a "play" button.
Additionally you can link this scene direct with other scene ID. E.g if you have a sensor on the door you can select it as trigger:

```
  trigger
    id:        hm-rpc.0.DOOR_SENSOR.STATE
    condition: ==
    value:     true
```

And every time you will open the door in the bath the all light with fan will be switched on.

## Groups
Groups are like virtual channels. You can create with the help of *groups* virtual device from several actuators and control them together, like one device.
Lets modify our sample with bath's lights.  

```
  scene.allLightInBath             "set on true"    "set on false" 
  |- hm-rpc.0.BOTTOM_LIGHT.STATE  - true             false
  +- hm-rpc.0.TOP_LIGHT.STATE     - true             false
```

If you will link this *group* with the door sensor like:

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

Every time you will open the door the all light in a bath will be switched on. The value of the _scene.allLightInBath_ will go to *true*.
If you will close the door the light will be switched off. And the value of _scene.allLightInBath_ will go to *false*. 
It is useless, but is good as an example.
If you will manually switch one light on, the value of the _scene.allLightInBath_ will go to *uncertain*.
Delays can be used too.



## Changelog

### 0.0.1 (2015-07-29)
* (bluefox) initial commit

## Install

```node iobroker.js add scenes```

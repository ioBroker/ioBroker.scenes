# Older changes
## 4.0.2 (2025-06-16)
* (bluefox) Small improvements for layout

## 4.0.1 (2025-01-23)
* (bluefox) Adapter was migrated to TypeScript
* (bluefox) Corrected error with the Select ID dialog

## 3.2.4 (2025-01-22)
* (bluefox) Migrated to vite
* (bluefox) Packages updated

## 3.2.3 (2024-08-26)
* (bluefox) Packages updated

## 3.2.1 (2024-06-21)
* (bluefox) GUI migrated for the new `adapter-react` library

## 3.1.1 (2024-06-21)
* (bluefox) Packages updated
* (bluefox) Prepared for js-controller 6

## 3.0.4 (2024-04-27)
* (bluefox) Corrected error if profile is empty

## 3.0.3 (2024-02-25)
* (bluefox) Saving of the scene states from GUI was implemented

## 3.0.1 (2024-02-16)
* (bluefox) Cleared cron tasks by re-init
* (bluefox) CRON Editor dialog added
* (bluefox) Implemented scene enabling/disabling via messages
* (bluefox) Implemented the writing of the scene states with ack=true
* (bluefox) Added description to the scene states
* (bluefox) Added possibility to use categories/enumerations

## 2.4.2 (2024-02-12)
* (bluefox) Preserved empty folders by renaming and moving of scenes

## 2.4.0 (2022-12-23)
* (Apollon77) prevent a crash case reported by Sentry
* (bluefox) Updated some GUI libraries

## 2.3.9 (2022-02-13)
* (bluefox) Updated some GUI libraries
* (bluefox) Updated releaser

## 2.3.8 (2021-08-31)
* (Apollon77) Handles a case where states are not set but used as value (Sentry IOBROKER-SCENES-13)
* (TyrionWarMage) Added the aggregation mode for the virtual groups.
* (bluefox) Sentry data will not be sent in front-end if the diagnostic or sentry is disabled

## 2.3.6 (2021-01-22)
* (Apollon77) Check state id before getting value (Sentry IOBROKER-SCENES-F)

## 2.3.5 (2021-01-22)
* (Apollon77) Add error logging if invalid ids are configured for scenes (Sentry IOBROKER-SCENES-Y)

## 2.3.4 (2021-01-16)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-X, IOBROKER-SCENES-V)

## 2.3.3 (2020-12-06)
* (bluefox) Implemented drag&drop for the reorder of scenes in folders
* (bluefox) Implemented Easy mode
* (bluefox) Possibility to use set point from another state

## 2.3.1 (2020-11-06)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-M)

## 2.3.0 (2020-11-02)
* (bluefox) Fixed GUI errors

## 2.1.7 (2020-10-30)
* (Apollon77) Prevent a crash case (Sentry IOBROKER-SCENES-E, IOBROKER-SCENES-G, IOBROKER-SCENES-A)

## 2.1.6 (2020-09-25)
* (bluefox) Updated the select ID dialog.

## 2.1.3 (2020-09-18)
* (Apollon77) Prevent crash cases (Sentry IOBROKER-SCENES-B, IOBROKER-SCENES-8, IOBROKER-SCENES-D)

## 2.1.2 (2020-07-08)
* (bluefox) Interval between states was corrected

## 2.0.17 (2020-06-29)
* (bluefox) GUI error corrected

## 2.0.13 (2020-06-27)
* (bluefox) Mobile view added

## 2.0.12 (2020-06-26)
* (bluefox) GUI error corrected

## 2.0.10 (2020-06-20)
* (bluefox) Added "Do not overwrite state if it has the required value" option

## 2.0.9 (2020-06-17)
* (bluefox) The colors are corrected

## 2.0.8 (2020-06-16)
* (bluefox) The tolerance is implemented

## 2.0.3 (2020-06-14)
* (bluefox) New GUI based on React

## 1.1.1 (2019-05-26)
* (bluefox) Added storing of actual values in a scene via a message

## 1.1.0 (2018-04-24)
* (bluefox) Works now with Admin3

## 1.0.2 (2018-01-21)
* (bluefox) use new select ID dialog
* (DeepCoreSystem) translations
* (paul53) text fixes

## 1.0.0 (2017-11-11)
* (bluefox) fix false scenes

## 0.2.7 (2017-08-14)
* (bluefox) Support of iobroker.pro

## 0.2.6 (2016-06-21)
* (bluefox) add read/write settings to scene object

## 0.2.5 (2016-02-03)
* (bluefox) update node-schedule

## 0.2.4 (2016-01-24)
* (bluefox) fix error disabled states in a scene

## 0.2.3 (2015-12-10)
* (bluefox) fix error with trigger on false

## 0.2.2 (2015-11-22)
* (bluefox) fix error with restart adapter

## 0.2.1 (2015-10-27)
* (bluefox) delete triggers if virtual groups enabled

## 0.2.0 (2015-10-27)
* (bluefox) support of virtual groups

## 0.1.3 (2015-09-19)
* (bluefox) show set value if 0 or false in settings

## 0.1.2 (2015-08-15)
* (bluefox) add translations
* (bluefox) try to fix error by renaming

## 0.1.1 (2015-08-10)
* (bluefox) allow description for states in a scene
* (bluefox) check by rename if the scene with the same name yet exists
* (bluefox) allowed a coping of a scene
* (bluefox) fix error with delay and stopAllDelays settings

## 0.1.0 (2015-08-09)
* (bluefox) fix error with delays and config change
* (bluefox) implement replace

## 0.0.2 (2015-08-05)
* (bluefox) change configuration schema
* (bluefox) add cron
* (bluefox) add a burst interval

## 0.0.1 (2015-07-29)
* (bluefox) initial commit

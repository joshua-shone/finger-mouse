# Finger Mouse

A hardware project to create a multi-finger tracking device.

## Concept

A mouse with articulation points for several fingers, where the position of each finger-tip is tracked using the timing of laser sweeps.

## Mockup and Simulation tool

[![Simulation Tool](sim_tool_screenshot.png)](https://joshua-shone.github.io/finger-mouse)

The simulation and mockup tool allows components to be interactively moved around to find optimum configurations.

[Launch Simulation Tool](https://joshua-shone.github.io/finger-mouse).

## Geometry

![geometry](https://joshua-shone.github.io/finger-mouse/geometry.svg)

## Components

| Model | Type | Description | Count | Cost |
| --- | --- | --- | --- | ---: |
| BPV22NF | Photodiode | One for each finger + static reference | 7 | [6.79€](https://www.digikey.de/product-detail/de/vishay-semiconductor-opto-division/BPV22NF/751-1007-ND/1681141) |
| TLV2464 | Op amp | Amplifies photodiodes | 4 | [10.08€](https://www.digikey.de/product-detail/de/texas-instruments/TLV2464IPWR/296-7575-1-ND/374375) |
| PPN7PA12C1 | Motor | To rotate mirrors | 1 | [2.83€](https://www.digikey.de/product-detail/en/nmb-technologies-corporation/PPN7PA12C1/P14355-ND/2417079) |
| D2F-01L | Microswitch | Mouse-button switch for each finger | 6 | [9.42€](https://www.digikey.de/product-detail/de/omron-electronics-inc-emc-div/D2F-01L/SW154-ND/83264) |
| S9398030L/C | Laser | With line-producing lens | 1 | [21.88€](http://www.egismos.com/de/IR-laser-module-980nm-D9mm/980nm-30mW-High-End-Laser-Line-Generator-D9mm) |

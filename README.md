# Blip Module
A plugin that will allow a blip representation of an instance that is offscreen to be shown and much more with customizable settings!

## Installation

### ES Module

```js
import { Blip } from './blip.mjs';
```

### IIFE (Immediately Invoked Function Expression)

```js
<script src="blip.js"></script>;
// ...
window.BlipBundle.Blip;
```

### Global Dependency

Blip relies on the `VYLO` variable being globally accessible.
## Inputs, limits, and recycling

Blip uses the global `VYLO` engine and bundles Collector for interface recycling.
Collector includes its own internal Logger; Blip has no direct Logger dependency.
The update loop runs only while blips are tracked. Always call `remove()` when a
blip is no longer needed. Removed markers release their target reference and return
to Collector's bounded pool (20 by default). Active markers are capped at
`BlipManagerSingleton.MAX_BLIPS` (200 by default); a capped component has a null
`instance` and callers may retry later.

Pass optional `input` callbacks in the blip settings to provide your own viewport
and target data. Without these callbacks, Blip reads VYLO's camera and map objects.
Coordinates and dimensions in `getTargetData` are world pixels, with `x` and `y`
at the target's center. Viewport dimensions and `buffer` are screen pixels;
`maxDistance` measures world pixels beyond the viewport edge.

```ts
const blip = new BlipComponent(target, {
    atlasName: 'game-atlas', iconName: 'warning'
}, {
    buffer: 28, showsDistance: false, maxDistance: 450,
    input: {
        getViewport: () => ({
            width: 640, height: 360, x: camera.x, y: camera.y,
            zoomX: 1, zoomY: 1
        }),
        getTargetData: target => ({
            x: target.centerX, y: target.centerY,
            width: target.width, height: target.height,
            active: !target.removed
        })
    }
});
// When the effect ends:
blip.remove();
```

`showsDistance` is reserved for future distance-label support.

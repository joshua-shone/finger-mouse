# polymer-panzoom
Panning/zooming web component utilizing CSS3 transforms, built with [Polymer](https://www.polymer-project.org)

## Run the Demo

```bash
npm install
npm start
```

Then navigate a browser to [http://localhost:8080/](http://localhost:8080/)

To serve the demo on a different port:

```bash
npm start -- --port=8081
```

## Usage

### Setting up Dependencies

Serve Polymer at root, i.e. `/polymer`.

The [web-components polyfill](https://github.com/webcomponents/webcomponentsjs) is required by Polymer, so ensure that it's included, for example with a `<script>` tag:

```html
<script src="webcomponentsjs/webcomponents-lite.min.js"></script>
```

If using `polymer-panzoom` as a [bower](https://bower.io/) component, the contents of the bower components directory could be served at root, such that `/polymer` `/webcomponentsjs` are accesible.

### Using the Component

Import `polymer-panzoom` with a `<link>` tag:

```html
<link rel="import" href="panzoom.html">
```

`polymer-panzoom` elements can now be used in the page to wrap other elements for panning/zooming. For example:

```html
<polymer-panzoom id="my-panzoom">
  <img src="big-image-to-be-zoomed-and-panned.jpg">
</polymer-panzoom>
```

Panning/zooming parameters can then be applied, for example:

```javascript
var myPanzoom = document.getElementById('my-panzoom');
myPanzoom.panOffset({x: 100, y: 150});
myPanzoom.zoomOffset(0.1);
```

### Methods

#### .panzoom(options)

Apply panning/zooming parameters.

> *options* - An object containing:
> - translate {x, y}
> - scale (multiplier)

#### .panzoomTowardPosition(position, zoomOffset)

Pan and zoom toward or away from the given position based on a zoom offset factor.

> - *position* {x, y}
> - *zoomOffset* multiplier

#### .panzoomShowRegion(rect, minimumZoom)

Pan and zoom to fit the given rectangle into view.

> - *rect* {left, top, right, bottom}
> - *minimumZoom* (optional)

#### .panzoomConvertPoint(point, sourceCoords, destCoords)

Translates an X-Y pixel position to/from container and content coordinates.
Container coordinates are local to the DOM element on which this panzoom behavior is applied.
Content coordinates are local to the child elements within the panzoom DOM element.

> - *point* An object with x and y fields, e.g. {x:100, y:20.5}
> - *sourceCoords* Source coordinates, either "CONTAINER" or "CONTENT".
> - *destCoords* Destination coordinates, either "CONTAINER" or "CONTENT".

Returns: The converted point, as an object with x and y fields, e.g. {x:40.89, y:42}
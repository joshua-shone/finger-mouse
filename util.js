var svgNS = 'http://www.w3.org/2000/svg';

function addDebugPoint(parentElement, position, radius) {
  var debugPoint = document.createElementNS(svgNS, 'circle');
  debugPoint.setAttributeNS(null, 'class', 'debug-point');
  debugPoint.setAttributeNS(null, 'r', radius || '5');
  debugPoint.setAttributeNS(null, 'cx', position.x);
  debugPoint.setAttributeNS(null, 'cy', position.y);
  parentElement.appendChild(debugPoint);
  return debugPoint;
}

var pixelImages = new Map();

function setPixelOnCanvas(context, x, y, color) {
  var pixelImage = pixelImages.get(context);
  if (!pixelImage) {
    pixelImage = context.createImageData(1,1);
    pixelImages.set(context, pixelImage);
  }
  
  pixelImage.data[0] = color.r;
  pixelImage.data[1] = color.g;
  pixelImage.data[2] = color.b;
  pixelImage.data[3] = color.a;
  context.putImageData(pixelImage, x, y);
}

function setupDragging(element, options) {

  var cursorBeforeDrag = null;

  function handleMousemove(event) {
    event.preventDefault();
    event.stopPropagation();
    var cursorDelta = {x: event.pageX - cursorBeforeDrag.x, y: event.pageY - cursorBeforeDrag.y};
    options.move(cursorDelta, event);
  }

  element.addEventListener('mousedown', (event) => {
    if (options.button && event.button !== options.button) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    cursorBeforeDrag = {x: event.pageX, y: event.pageY};
    if (options.start) {
      options.start(cursorBeforeDrag);
    }
    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('mouseup',   handleMouseup);
    return false;
  });

  function handleMouseup(event) {
    window.removeEventListener('mousemove', handleMousemove);
    window.removeEventListener('mouseup',   handleMouseup);
    if (options.end) {
      options.end();
    }
  }
}
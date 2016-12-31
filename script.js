var svg = document.getElementsByTagName('svg')[0];
var svgNS = 'http://www.w3.org/2000/svg';

var baseLayer = document.getElementById('base-layer');

var laserSource = document.getElementsByClassName('laser-source')[0];
var laserLine = document.getElementById('laser-line');

var laserAngle = 0;
var laserPosition = {x: 700, y: 400};
var isLaserSpinning = true;
var isDraggingLaser = false;

var mirrors = [];

var nextSweptAreaGradientId = 1;

var heatmap = document.getElementById('heatmap');
var heatmapCanvasContext = heatmap.getContext('2d');

var pixelImage = heatmapCanvasContext.createImageData(1,1);
var pixelImageData = pixelImage.data;

function setPixelOnCanvas(context, x, y, color) {
  pixelImageData[0] = color.r;
  pixelImageData[1] = color.g;
  pixelImageData[2] = color.b;
  pixelImageData[3] = color.a;
  context.putImageData(pixelImage, x, y);
}

setPixelOnCanvas(heatmapCanvasContext, 10, 10, {r: 255, g: 0, b: 0, a: 255});

var heatmapResolutionX = parseInt(heatmap.getAttribute('width'));
var heatmapResolutionY = parseInt(heatmap.getAttribute('height'));

function updateHeatmap() {
  
  var separationAngleThreshold = Math.PI / 8;
  
  for (var y=0; y<heatmapResolutionY; y++) {
    for (var x=0; x<heatmapResolutionX; x++) {
      var worldPosition = {
        x: (x / heatmapResolutionX) * document.body.clientWidth,
        y: (y / heatmapResolutionY) * document.body.clientHeight,
      }
      
      var value = 0;
      
      var vectorToLaser = normalized(subtract(worldPosition, laserPosition));
      
      var mirrorsInRange = mirrors.filter(function(mirror) {
        if (!whichSideOfLine(mirror, worldPosition)) {
          return false;
        }
        if (whichSideOfLine({start: mirror.reflectedLaserOrigin, end: mirror.start}, worldPosition)) {
          return false;
        }
        if (!whichSideOfLine({start: mirror.reflectedLaserOrigin, end: mirror.end}, worldPosition)) {
          return false;
        }
        return true;
      });
      
      var laserOrigins = [laserPosition];
      mirrorsInRange.forEach(function(mirror) {
        laserOrigins.push(mirror.reflectedLaserOrigin);
      });
      
      var bestScore = null;
      
      laserOrigins.forEach(function(laserOrigin1) {
        laserOrigins.forEach(function(laserOrigin2) {
          if (laserOrigin1 === laserOrigin2) {
            return;
          }
          var vectorToOrigin1 = subtract(worldPosition, laserOrigin1);
          var vectorToOrigin2 = subtract(worldPosition, laserOrigin2);
          
          var angleBetweenOrigins = Math.acos(dotProduct(normalized(vectorToOrigin1), normalized(vectorToOrigin2)));
          
          var score = angleBetweenOrigins;
          if (score > (Math.PI / 2)) { // 90 degrees
            score = Math.PI - score;
          }
          
          if (!bestScore || (score > bestScore)) {
            bestScore = score;
          }
        });
      });
      
      setPixelOnCanvas(heatmapCanvasContext, x, y, {r: 255, g: 0, b: 0, a: 200 * (bestScore / Math.PI)});
    }
  }
}

window.addEventListener('resize', function() {
  updateHeatmap();
});

function createMirror(start, end) {
  var mirror = {};
  
  mirror.lineElement = document.createElementNS(svgNS, 'line');
  mirror.lineElement.setAttributeNS(null, 'class', 'mirror');
  baseLayer.appendChild(mirror.lineElement);
  
  mirror.reflectedLaserOriginElement = document.createElementNS(svgNS, 'circle');
  mirror.reflectedLaserOriginElement.setAttributeNS(null, 'class', 'reflected-laser-origin');
  mirror.reflectedLaserOriginElement.setAttributeNS(null, 'r', '5');
  baseLayer.appendChild(mirror.reflectedLaserOriginElement);
  
  mirror.handleStart = document.createElementNS(svgNS, 'circle');
  mirror.handleStart.setAttributeNS(null, 'class', 'mirror-handle');
  mirror.handleStart.setAttributeNS(null, 'r', '8');
  baseLayer.appendChild(mirror.handleStart);
  
  mirror.handleEnd = document.createElementNS(svgNS, 'circle');
  mirror.handleEnd.setAttributeNS(null, 'class', 'mirror-handle');
  mirror.handleEnd.setAttributeNS(null, 'r', '8');
  baseLayer.appendChild(mirror.handleEnd);
  
  function startHandleDragged(event) {
    mirror.update({x: event.clientX, y: event.clientY}, mirror.end);
    updateHeatmap();
  }
  mirror.handleStart.addEventListener('mousedown', function() {
    window.addEventListener('mousemove', startHandleDragged);
    window.addEventListener('mouseup', startHandleMouseup);
  });
  function startHandleMouseup(event) {
    window.removeEventListener('mousemove', startHandleDragged);
    window.removeEventListener('mouseup', startHandleMouseup);
  }
  
  function endHandleDragged(event) {
    mirror.update(mirror.start, {x: event.clientX, y: event.clientY});
    updateHeatmap();
  }
  mirror.handleEnd.addEventListener('mousedown', function() {
    window.addEventListener('mousemove', endHandleDragged);
    window.addEventListener('mouseup', endHandleMouseup);
  });
  function endHandleMouseup(event) {
    window.removeEventListener('mousemove', endHandleDragged);
    window.removeEventListener('mouseup', endHandleMouseup);
  }
  
  mirror.sweepGradient = document.createElementNS(svgNS, 'radialGradient');
  mirror.sweepGradient.setAttributeNS(null, 'id', 'sweptAreaGradient' + nextSweptAreaGradientId);
  mirror.sweepGradient.setAttributeNS(null, 'gradientUnits', 'userSpaceOnUse');
  baseLayer.appendChild(mirror.sweepGradient);
  
  mirror.sweptArea = document.createElementNS(svgNS, 'path');
  mirror.sweptArea.setAttributeNS(null, 'class', 'swept-area');
  mirror.sweptArea.setAttributeNS(null, 'fill', 'url(#sweptAreaGradient' + nextSweptAreaGradientId + ')');
  baseLayer.appendChild(mirror.sweptArea);
  
  var stop1 = document.createElementNS(svgNS, 'stop');
  stop1.setAttributeNS(null, 'offset', '0%');
  stop1.setAttributeNS(null, 'stop-color', 'rgba(20, 79, 255, 0.8)');
  mirror.sweepGradient.appendChild(stop1);
  var stop2 = document.createElementNS(svgNS, 'stop');
  stop2.setAttributeNS(null, 'offset', '100%');
  stop2.setAttributeNS(null, 'stop-color', 'rgba(0, 70, 204, 0)');
  mirror.sweepGradient.appendChild(stop2);
  
  nextSweptAreaGradientId++;
  
  mirror.update = function(start, end) {
    mirror.start = start;
    mirror.end = end;
    
    mirror.handleStart.setAttributeNS(null, 'cx', start.x);
    mirror.handleStart.setAttributeNS(null, 'cy', start.y);
    
    mirror.handleEnd.setAttributeNS(null, 'cx', end.x);
    mirror.handleEnd.setAttributeNS(null, 'cy', end.y);
    
    mirror.lineElement.setAttributeNS(null, 'x1', start.x);
    mirror.lineElement.setAttributeNS(null, 'y1', start.y);
    mirror.lineElement.setAttributeNS(null, 'x2', end.x);
    mirror.lineElement.setAttributeNS(null, 'y2', end.y);
    
    var closestPoint = closestPointOnLine(mirror, laserPosition);
    var reflectedLaserOrigin = add(closestPoint, subtract(closestPoint, laserPosition));
    mirror.reflectedLaserOriginElement.setAttributeNS(null, 'cx', reflectedLaserOrigin.x);
    mirror.reflectedLaserOriginElement.setAttributeNS(null, 'cy', reflectedLaserOrigin.y);
    mirror.reflectedLaserOrigin = reflectedLaserOrigin;
    var sweepExtent = 1100;
    var sweptAreaPoint1 = add(reflectedLaserOrigin, multiply(normalized(subtract(mirror.start, reflectedLaserOrigin)), sweepExtent));
    var sweptAreaPoint2 = add(reflectedLaserOrigin, multiply(normalized(subtract(mirror.end, reflectedLaserOrigin)), sweepExtent));
    mirror.sweptArea.setAttributeNS(null, 'd', 'M' + mirror.start.x + ',' + mirror.start.y + ' L ' + 
                                              sweptAreaPoint1.x + ',' + sweptAreaPoint1.y + ' ' +
                                              'A ' + sweepExtent + ',' + sweepExtent + ' 0 0 0 ' + 
                                              sweptAreaPoint2.x + ',' + sweptAreaPoint2.y + ' L ' +
                                              mirror.end.x + ',' + mirror.end.y);
    
    mirror.sweepGradient.setAttributeNS(null, 'cx', reflectedLaserOrigin.x);
    mirror.sweepGradient.setAttributeNS(null, 'cy', reflectedLaserOrigin.y);
    mirror.sweepGradient.setAttributeNS(null, 'fx', reflectedLaserOrigin.x);
    mirror.sweepGradient.setAttributeNS(null, 'fy', reflectedLaserOrigin.y);
    mirror.sweepGradient.setAttributeNS(null, 'r', sweepExtent);
  }
  
  mirror.update(start, end);
  
  mirrors.push(mirror);
}

createMirror({x: 100, y: 400}, {x: 500, y: 100});
createMirror({x: 1100, y: 100}, {x: 1500, y: 400});
// createMirror({x: 500, y: 100}, {x: 1100, y: 100});

updateHeatmap();

var coverageToggle = document.getElementById('coverage-toggle');
coverageToggle.addEventListener('click', function() {
  mirrors.forEach(function(mirror) {
    mirror.sweptArea.classList.toggle('hidden');
  });
});

var heatmapToggle = document.getElementById('heatmap-toggle');
heatmapToggle.addEventListener('click', function() {
  heatmap.classList.toggle('hidden');
});

var laserSpinToggle = document.getElementById('laser-spin-toggle');
laserSpinToggle.addEventListener('click', function() {
  isLaserSpinning = !isLaserSpinning;
});

var reflectedLaserOriginsToggle = document.getElementById('reflected-laser-origins-toggle');
reflectedLaserOriginsToggle.addEventListener('click', function() {
  mirrors.forEach(function(mirror) {
    mirror.reflectedLaserOriginElement.classList.toggle('hidden');
  });
});

function laserSourceDragged(event) {
  laserPosition = {x: event.clientX, y: event.clientY};
  laserSource.setAttributeNS(null, 'cx', event.clientX);
  laserSource.setAttributeNS(null, 'cy', event.clientY);
  mirrors.forEach(function(mirror) {
    mirror.update(mirror.start, mirror.end);
  });
  updateHeatmap();
}
laserSource.addEventListener('mousedown', function() {
  window.addEventListener('mousemove', laserSourceDragged);
  window.addEventListener('mouseup', laserSourceMouseup);
});
function laserSourceMouseup(event) {
  window.removeEventListener('mousemove', laserSourceDragged);
  window.removeEventListener('mouseup', laserSourceMouseup);
}

function addDebugPoint(position, radius) {
  var debugPoint = document.createElementNS(svgNS, 'circle');
  debugPoint.setAttributeNS(null, 'class', 'debug-point');
  debugPoint.setAttributeNS(null, 'r', radius || '5');
  debugPoint.setAttributeNS(null, 'cx', position.x);
  debugPoint.setAttributeNS(null, 'cy', position.y);
  baseLayer.appendChild(debugPoint);
}

mirrors.forEach(function(mirror) {

});

function updateLaserLine() {
  
  var radius = 800;
  var laserVector = {
    x: Math.sin(laserAngle),
    y: Math.cos(laserAngle),
  }
  
  var laserPoints = [{
    position: laserPosition,
    vector: laserVector,
    mirror: null,
  }]
  while(true) {
    var nextPoint = findNextLaserPoint(laserPoints[laserPoints.length-1]);
    laserPoints.push(nextPoint);
    if (!nextPoint.vector) {
      break;
    }
  }
  
  mirrors.forEach(function(mirror) {
    mirror.lineElement.classList.remove('hit');
  });
  
  var pathString = 'M ';
  var firstPoint = true;
  laserPoints.forEach(function(laserPoint) {
    pathString += laserPoint.position.x + ',' + laserPoint.position.y + ' '
    if (firstPoint) {
      pathString += 'L ';
      firstPoint = false;
    }
    if (laserPoint.mirror) {
      laserPoint.mirror.lineElement.classList.add('hit');
    }
  });
  
  laserLine.setAttributeNS(null, 'd', pathString);
}

function findNextLaserPoint(currentPoint) {
  var nextPosition = add(currentPoint.position, multiply(currentPoint.vector, 10000));
  var nextVector = null;
  var hitMirror = null;
  mirrors.forEach(function(mirror) {
    if (currentPoint.mirror && currentPoint.mirror === mirror) {
      return;
    }
    
    // Using ray-line intersection technique from http://stackoverflow.com/a/14318254/1933312
    var result = lineIntersection({start: currentPoint.position, end: add(currentPoint.position, currentPoint.vector)}, mirror);
    var intersects = (result.t > 0) && (result.u > 0 && result.u < 1);
    if (intersects) {
      var hitPoint = add(currentPoint.position, multiply(currentPoint.vector, result.t));
      
      var mirrorVector = subtract(mirror.end, mirror.start);
      var mirrorNormal = normalized({x: -mirrorVector.y, y: mirrorVector.x});
      
      var incidentVector = subtract(hitPoint, currentPoint.position);
      var reflectionVector = reflect(incidentVector, mirrorNormal);
      
      nextPosition = hitPoint;
      nextVector = normalized(reflectionVector);
      hitMirror = mirror;
    }
  });
  
  return {
    position: nextPosition,
    vector: nextVector,
    mirror: hitMirror,
  }
}

var lastTimestamp = null;

function updateFrame(timestamp) {
  if (!isDraggingLaser && lastTimestamp && isLaserSpinning) {
    var timeDelta = timestamp - lastTimestamp;
    laserAngle += timeDelta * 0.001;
  }
  
  updateLaserLine();
  
  lastTimestamp = timestamp;
  window.requestAnimationFrame(updateFrame);
}

window.addEventListener('mousedown', function(event) {
  if (event.button === 2) {
    isDraggingLaser = true;
    event.preventDefault();
    return false;
  }
});

document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});

window.addEventListener('mouseup', function() {
  isDraggingLaser = false;
});

window.addEventListener('mousemove', function(event) {
  if (isDraggingLaser) {
    laserAngle = Math.atan2(event.clientY - laserPosition.y, -(event.clientX - laserPosition.x)) - (Math.PI / 2);
  }
});

window.requestAnimationFrame(updateFrame);

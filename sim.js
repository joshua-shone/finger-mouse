class Sim {
  constructor(svg) {
    this.svg = svg;
    
    this.layers = {
      base:                  svg.getElementsByClassName('base-layer')[0],
      coverage:              svg.getElementsByClassName('coverage-layer')[0],
      multiLaserLines:       svg.getElementsByClassName('multi-laser-lines-layer')[0],
      reflectedLaserOrigins: svg.getElementsByClassName('reflected-laser-origins-layer')[0],
    }
    
    this.nextSweptAreaGradientId = 1;
    
    this.mirrors = [];
    
    this.laser = new Laser(this, {x: 1700, y: 600}, Math.PI);
    this.motor = new Motor(this, {x: 410, y: 600});
    
    this.multiLaserLines = [];
    this.multiLaserLineCount = 200;
    
    this.heatmap = document.getElementById('heatmap');
    this.heatmapCanvasContext = this.heatmap.getContext('2d');

    this.heatmapResolutionX = parseInt(this.heatmap.getAttribute('width'));
    this.heatmapResolutionY = parseInt(this.heatmap.getAttribute('height'));
  }
  
  toggleLayer(layer, toggle) {
    this.layers[layer].classList.toggle('hidden', !toggle);
  }
  
  isLayerVisible(layer) {
    return !this.layers[layer].classList.contains('hidden');
  }
  
  createMirror(start, end, options) {
    var mirror = new Mirror(this, start, end, options);
    mirror.update(start, end);
    this.mirrors.push(mirror);
    return mirror;
  }

  findNextLaserHit(hit) {
    var nextHit = {
      position: add(hit.position, multiply(hit.direction, 10000)),
      direction: null,
      mirror: null,
    }
    this.mirrors.forEach((mirror) => {
      if (hit.mirror && hit.mirror === mirror) {
        return;
      }
      
      // Using ray-line intersection technique from http://stackoverflow.com/a/14318254/1933312
      var result = lineIntersection({start: hit.position, end: add(hit.position, hit.direction)}, mirror);
      var intersects = (result.t > 0) && (result.u >= 0 && result.u <= 1);
      if (intersects) {
        var hitPoint = add(hit.position, multiply(hit.direction, result.t));
        
        var mirrorVector = vectorTo(mirror.start, mirror.end);
        var mirrorNormal = normalized({x: -mirrorVector.y, y: mirrorVector.x});
        
        var incidentVector = vectorTo(hit.position, hitPoint);
        var reflectionVector = reflect(incidentVector, mirrorNormal);
        
        if (!nextHit.direction || (lengthBetween(hit.position, hitPoint) < lengthBetween(hit.position, nextHit.position))) {
          nextHit.position = hitPoint;
          if (whichSideOfLine(mirror, hit.position)) {
            nextHit.direction = normalized(reflectionVector);
          }
          nextHit.mirror = mirror;
        }
      }
    });
    
    return nextHit;
  }
  
  pointLaserAt(position) {
    this.motor.angle = angleTo(this.motor.position, position);
  }
  
  updateMultiLaserLines() {

    if (this.multiLaserLines.length != this.multiLaserLineCount) {
      this.multiLaserLines.forEach((multiLaserLine) => {
        multiLaserLine.remove();
      });
      this.multiLaserLines = [];

      for (var i=0; i<this.multiLaserLineCount; i++) {
        var multiLaserLine = document.createElementNS(svgNS, 'polyline');
        multiLaserLine.setAttributeNS(null, 'class', 'laser-line');
        this.layers.multiLaserLines.appendChild(multiLaserLine);
        this.multiLaserLines.push(multiLaserLine);
      }
    }

    var rotationRange = Math.PI / 2;

    var motorAngleBefore = this.motor.angle;
    if (this.isLayerVisible('multiLaserLines')) {
      this.multiLaserLines.forEach((multiLaserLine, index) => {
        this.motor.angle = rotationRange * (index / this.multiLaserLineCount);
        this.motor.update();
        var multiPathString = sim.laser.generatePath();
        multiLaserLine.setAttributeNS(null, 'points', multiPathString);
      });
    }
    this.motor.angle = motorAngleBefore;
  }
  
  updateHeatmap() {
    
    if (this.heatmap.classList.contains('hidden')) {
      return;
    }
    
    var separationAngleThreshold = Math.PI / 8;
    
    for (var y=0; y<this.heatmapResolutionY; y++) {
      for (var x=0; x<this.heatmapResolutionX; x++) {
        var worldPosition = {
          x: (x / this.heatmapResolutionX) * document.body.clientWidth,
          y: (y / this.heatmapResolutionY) * document.body.clientHeight,
        }
        
        var value = 0;
        
        var mirrorsInRange = this.mirrors.filter((mirror) => {
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
        
        var laserOrigins = [this.laser.position].concat(mirrorsInRange.map((mirror) => mirror.reflectedLaserOrigin));
        
        var bestScore = null;
        
        laserOrigins.forEach((laserOrigin1) => {
          laserOrigins.forEach((laserOrigin2) => {
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
        
        setPixelOnCanvas(this.heatmapCanvasContext, x, y, {r: 255, g: 0, b: 0, a: 200 * (bestScore / Math.PI)});
      }
    }
  }
  
  findVisibleMirrorSegments(vantagePoint) {
    var localizedMirrors = [];
    this.mirrors.forEach((mirror) => {
      var vectorToStart = vectorTo(vantagePoint, mirror.start);
      var vectorToEnd   = vectorTo(vantagePoint, mirror.end);
      var localizedMirror = {
        start: {x: angleOfVector(vectorToStart), y: length(vectorToStart)},
        end:   {x: angleOfVector(vectorToEnd),   y: length(vectorToEnd)},
      };
      
      if (localizedMirror.start.x > localizedMirror.end.x) {
        localizedMirror = {
          start: localizedMirror.end,
          end:   localizedMirror.start,
        }
      }
      
      localizedMirrors.push(localizedMirror);
    });
    
    localizedMirrors.filter((localizedMirror) => {
      localizedMirrors.forEach((otherLocalizedMirror) => {
        if (localizedMirror !== otherLocalizedMirror) {
          if (otherLocalizedMirror.start.x < localizedMirror.start.x && otherLocalizedMirror.end.x > localizedMirror.end.x) {
            
          }
        }
      });
    });
  }
}

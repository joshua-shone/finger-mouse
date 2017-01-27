class Mirror {
  constructor(sim, start, end, options) {
    this.sim = sim;
    this.start   = start;
    this.end     = end;
    this.options = options;
    
    this.lineElement = document.createElementNS(svgNS, 'line');
    this.lineElement.setAttributeNS(null, 'class', 'mirror');
    sim.layers.base.appendChild(this.lineElement);
    
    this.reflectedLaserOriginElement = document.createElementNS(svgNS, 'circle');
    this.reflectedLaserOriginElement.setAttributeNS(null, 'class', 'reflected-laser-origin');
    this.reflectedLaserOriginElement.setAttributeNS(null, 'r', '5');
    this.reflectedLaserOriginNormalElement = document.createElementNS(svgNS, 'line');
    this.reflectedLaserOriginNormalElement.setAttributeNS(null, 'class', 'reflected-laser-origin-normal');
    sim.layers.reflectedLaserOrigins.appendChild(this.reflectedLaserOriginElement);
    sim.layers.reflectedLaserOrigins.appendChild(this.reflectedLaserOriginNormalElement);
    
    if (options.draggable) {
    
      this.handleStart = document.createElementNS(svgNS, 'circle');
      this.handleStart.setAttributeNS(null, 'class', 'handle');
      this.handleStart.setAttributeNS(null, 'r', '8');
      sim.layers.base.appendChild(this.handleStart);
      
      this.handleEnd = document.createElementNS(svgNS, 'circle');
      this.handleEnd.setAttributeNS(null, 'class', 'handle');
      this.handleEnd.setAttributeNS(null, 'r', '8');
      sim.layers.base.appendChild(this.handleEnd);
      
      setupDragging(this.handleStart, {
        start: (cursorBeforeDrag) => {
          this.startBeforeDrag = this.start;
        },
        move: (cursorDelta) => {
          this.update(add(this.startBeforeDrag, divide(cursorDelta, sim.panzoom._panzoomScale)), this.end);
          sim.updateHeatmap();
          sim.laser.update();
          sim.updateMultiLaserLines();
        }
      });
      
      setupDragging(this.handleEnd, {
        start: (cursorBeforeDrag) => {
          this.endBeforeDrag = this.end;
        },
        move: (cursorDelta) => {
          this.update(this.start, add(this.endBeforeDrag, divide(cursorDelta, sim.panzoom._panzoomScale)));
          sim.updateHeatmap();
          sim.laser.update();
          sim.updateMultiLaserLines();
        }
      });
    }
    
    this.sweepGradient = document.createElementNS(svgNS, 'radialGradient');
    this.sweepGradient.setAttributeNS(null, 'id', 'sweptAreaGradient' + sim.nextSweptAreaGradientId);
    this.sweepGradient.setAttributeNS(null, 'gradientUnits', 'userSpaceOnUse');
    sim.layers.coverage.appendChild(this.sweepGradient);
    
    this.sweptArea = document.createElementNS(svgNS, 'path');
    this.sweptArea.setAttributeNS(null, 'class', 'swept-area');
    this.sweptArea.setAttributeNS(null, 'fill', 'url(#sweptAreaGradient' + sim.nextSweptAreaGradientId + ')');
    sim.layers.coverage.appendChild(this.sweptArea);
    
    var stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttributeNS(null, 'offset', '0%');
    stop1.setAttributeNS(null, 'stop-color', 'rgba(20, 79, 255, 0.8)');
    this.sweepGradient.appendChild(stop1);
    var stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttributeNS(null, 'offset', '100%');
    stop2.setAttributeNS(null, 'stop-color', 'rgba(0, 70, 204, 0)');
    this.sweepGradient.appendChild(stop2);
    
    sim.nextSweptAreaGradientId++;
  }
  
  update(start, end) {
    this.start = start;
    this.end = end;
    
    if (this.options.draggable) {
      this.handleStart.setAttributeNS(null, 'cx', start.x);
      this.handleStart.setAttributeNS(null, 'cy', start.y);
      
      this.handleEnd.setAttributeNS(null, 'cx', end.x);
      this.handleEnd.setAttributeNS(null, 'cy', end.y);
    }
    
    this.lineElement.setAttributeNS(null, 'x1', start.x);
    this.lineElement.setAttributeNS(null, 'y1', start.y);
    this.lineElement.setAttributeNS(null, 'x2', end.x);
    this.lineElement.setAttributeNS(null, 'y2', end.y);
    
    var closestPoint = closestPointOnLine(this, this.sim.laser.position);
    var reflectedLaserOrigin = add(closestPoint, vectorTo(this.sim.laser.position, closestPoint));
    this.reflectedLaserOrigin = reflectedLaserOrigin;
    
    if (whichSideOfLine(this, this.sim.laser.position)) {

      this.reflectedLaserOriginElement.setAttributeNS(null, 'cx', reflectedLaserOrigin.x);
      this.reflectedLaserOriginElement.setAttributeNS(null, 'cy', reflectedLaserOrigin.y);
      this.reflectedLaserOriginNormalElement.setAttributeNS(null, 'x1', reflectedLaserOrigin.x);
      this.reflectedLaserOriginNormalElement.setAttributeNS(null, 'y1', reflectedLaserOrigin.y);
      this.reflectedLaserOriginNormalElement.setAttributeNS(null, 'x2', closestPoint.x);
      this.reflectedLaserOriginNormalElement.setAttributeNS(null, 'y2', closestPoint.y);
      var sweepExtent = 1100;
      var sweptAreaPoint1 = add(reflectedLaserOrigin, multiply(normalized(vectorTo(reflectedLaserOrigin, this.start)), sweepExtent));
      var sweptAreaPoint2 = add(reflectedLaserOrigin, multiply(normalized(vectorTo(reflectedLaserOrigin, this.end)),   sweepExtent));
      this.sweptArea.setAttributeNS(null, 'd', 'M' + this.start.x + ',' + this.start.y + ' L ' + 
                                                sweptAreaPoint1.x + ',' + sweptAreaPoint1.y + ' ' +
                                                'A ' + sweepExtent + ',' + sweepExtent + ' 0 0 0 ' + 
                                                sweptAreaPoint2.x + ',' + sweptAreaPoint2.y + ' L ' +
                                                this.end.x + ',' + this.end.y);
      
      this.sweepGradient.setAttributeNS(null, 'cx', reflectedLaserOrigin.x);
      this.sweepGradient.setAttributeNS(null, 'cy', reflectedLaserOrigin.y);
      this.sweepGradient.setAttributeNS(null, 'fx', reflectedLaserOrigin.x);
      this.sweepGradient.setAttributeNS(null, 'fy', reflectedLaserOrigin.y);
      this.sweepGradient.setAttributeNS(null, 'r', sweepExtent);
      
      this.reflectedLaserOriginElement.classList.remove('hidden');
      this.reflectedLaserOriginNormalElement.classList.remove('hidden');
      this.sweepGradient.classList.remove('hidden');
    } else {
      this.reflectedLaserOriginElement.classList.add('hidden');
      this.reflectedLaserOriginNormalElement.classList.add('hidden');
      this.sweepGradient.classList.add('hidden');
    }
  }
}
class Laser {
  constructor(sim, position, angle) {
    this.sim = sim;
    this.position = position;
    this.angle = angle;
    
    this.sourceElement = sim.svg.getElementsByClassName('laser-source')[0];
    this.lineElement   = sim.svg.getElementsByClassName('laser-line')[0];
    
    this.isBeingDragged = false;
    var positionBeforeDrag = null;
    setupDragging(this.sourceElement, {
      start: () => {
        positionBeforeDrag = this.position;
        this.isBeingDragged = true;
      },
      move: (cursorDelta) => {
        this.position = add(positionBeforeDrag, divide(cursorDelta, sim.panzoom._panzoomScale));
        this.sourceElement.setAttributeNS(null, 'cx', this.position.x);
        this.sourceElement.setAttributeNS(null, 'cy', this.position.y);
        sim.mirrors.forEach((mirror) => {
          mirror.update(mirror.start, mirror.end);
        });
        sim.updateHeatmap();
        this.update();
        sim.updateMultiLaserLines();
      },
      end: () => {
        this.isBeingDragged = false;
      }
    });
    
    this.update();
  }
  
  generatePath() {
    
    var laserVector = vectorAtAngle(this.angle);
    
    var laserPoints = [{
      position: this.position,
      direction: laserVector,
      mirror: null,
    }]
    for (var i=0; i<10; i++) {
      var nextPoint = this.sim.findNextLaserHit(laserPoints[laserPoints.length-1]);
      laserPoints.push(nextPoint);
      if (!nextPoint.direction) {
        break;
      }
    }
    
    return laserPoints.map((laserPoint) => laserPoint.position.x + ',' + laserPoint.position.y + ' ').join('');
  }
  
  update() {
    this.lineElement.setAttributeNS(null, 'points', this.generatePath());
  }
}

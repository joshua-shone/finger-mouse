class Motor {
  constructor(sim, position) {
    this.sim = sim;
    this.position = position;
    this.angle = 0;
    this.radius = 30;
    this.isSpinning = false;
    
    this.mirrors = [];
    for (var i=0; i<4; i++) {
      this.mirrors.push(
        sim.createMirror({x: 10, y: 10}, {x: 20, y: 20}, {draggable: false})
      );
    }
    
    this.rotationMarker = document.createElementNS(svgNS, 'line');
    this.rotationMarker.setAttributeNS(null, 'class', 'laser-line');
    sim.layers.base.appendChild(this.rotationMarker);
    
    this.update();
  }
  
  update() {
    var rotationMarkerPosition = add(this.position, multiply(vectorAtAngle(this.angle), this.radius));
    this.rotationMarker.setAttributeNS(null, 'x1', this.position.x);
    this.rotationMarker.setAttributeNS(null, 'y1', this.position.y);
    this.rotationMarker.setAttributeNS(null, 'x2', rotationMarkerPosition.x);
    this.rotationMarker.setAttributeNS(null, 'y2', rotationMarkerPosition.y);
    var angleInterval = (Math.PI * 2) / this.mirrors.length;
    this.mirrors.forEach((mirror, index) => {
      var mirrorNormal = vectorAtAngle(this.angle + (angleInterval * index));
      var mirrorCenter = multiply(mirrorNormal, this.radius);
      var mirrorStartVector = add(mirrorCenter, multiply(perpendicular(mirrorNormal),         this.radius));
      var mirrorEndVector   = add(mirrorCenter, multiply(negate(perpendicular(mirrorNormal)), this.radius));
      mirror.update(add(this.position, mirrorStartVector), add(this.position, mirrorEndVector));
    });
  }
}

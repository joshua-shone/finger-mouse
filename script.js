var svg = document.getElementById('sim-svg');

var sim = new Sim(svg);

sim.createMirror({x: 600, y: 200}, {x: 1700, y: 600}, {draggable: true});

window.addEventListener('resize', () => {
  sim.updateHeatmap();
});

var coverageToggle = document.getElementById('coverage-toggle');
coverageToggle.classList.toggle('on', sim.isLayerVisible('coverage'));
coverageToggle.addEventListener('change', () => {
  sim.toggleLayer('coverage', coverageToggle.checked);
});

var isDisplayingHeatmap = false;
var heatmapToggle = document.getElementById('heatmap-toggle');
heatmapToggle.classList.add('off');
heatmapToggle.addEventListener('change', () => {
  isDisplayingHeatmap = heatmapToggle.checked;
  sim.heatmap.classList.toggle('hidden', !isDisplayingHeatmap);
  sim.updateHeatmap();
});

var laserSpinToggle = document.getElementById('laser-spin-toggle');
laserSpinToggle.classList.add('off');
laserSpinToggle.addEventListener('change', () => {
  sim.motor.isSpinning = laserSpinToggle.checked;
});

var reflectedLaserOriginsToggle = document.getElementById('reflected-laser-origins-toggle');
reflectedLaserOriginsToggle.classList.toggle('on', sim.isLayerVisible('reflectedLaserOrigins'));
reflectedLaserOriginsToggle.addEventListener('change', () => {
  sim.toggleLayer('reflectedLaserOrigins', reflectedLaserOriginsToggle.checked);
});

var multiLaserLinesToggle = document.getElementById('multi-laser-lines-toggle');
multiLaserLinesToggle.classList.toggle('off', sim.isLayerVisible('multiLaserLines'));
multiLaserLinesToggle.addEventListener('change', () => {
  sim.toggleLayer('multiLaserLines', multiLaserLinesToggle.checked);
  multiLaserLinesSlider.set('disabled', !sim.isLayerVisible('multiLaserLines'));
  if (sim.isLayerVisible('multiLaserLines')) {
    sim.updateMultiLaserLines();
  }
});

var multiLaserLinesSlider = document.getElementById('multi-laser-lines-slider');
multiLaserLinesSlider.set('value', sim.multiLaserLineCount);
multiLaserLinesSlider.addEventListener('immediate-value-changed', () => {
  sim.multiLaserLineCount = multiLaserLinesSlider.immediateValue;
  sim.updateMultiLaserLines();
});

var spinningMirrorsRadiusSlider = document.getElementById('spinning-mirrors-radius');
spinningMirrorsRadiusSlider.set('value', sim.motor.radius);
spinningMirrorsRadiusSlider.addEventListener('immediate-value-changed', () => {
  sim.motor.radius = spinningMirrorsRadiusSlider.immediateValue;
  sim.motor.update();
  sim.laser.update();
  sim.updateMultiLaserLines();
});

var lastTimestamp = null;

function updateFrame(timestamp) {
  if (lastTimestamp) {
    var timeDelta = timestamp - lastTimestamp;
    
    if (sim.motor.isSpinning) {
      sim.motor.angle += timeDelta * 0.001;
      sim.laser.update();
      sim.motor.update();
    }
  }
  
  lastTimestamp = timestamp;
  window.requestAnimationFrame(updateFrame);
}
window.requestAnimationFrame(updateFrame);

var cursorDebugPoint = addDebugPoint(sim.layers.base, {x:0, y: 0});
setupDragging(svg, {
  button: 2,
  move: (cursorDelta, event) => {
    var cursor = {x: event.offsetX, y: event.offsetY};
    sim.pointLaserAt(cursor);
    sim.motor.update();
    sim.laser.update();
    
    var angleToCursor = angleTo(sim.motor.position, cursor);
    var angleToLaser  = angleTo(sim.motor.position, sim.laser.position);
    var reflectionAngle = angleToCursor + ((angleToLaser - angleToCursor) / 2);
    
//     spinningMirrorsAngle = reflectionAngle - (angleOfVector({x: lengthBetween(cursor, spinningMirrorsPosition), y: spinningMirrorsRadius}) * (spinningMirrorsAngle / (Math.PI/2)));
    
    cursorDebugPoint.setAttributeNS(null, 'cx', cursor.x);
    cursorDebugPoint.setAttributeNS(null, 'cy', cursor.y);
  }
});

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


function crossProduct(v1, v2) {
  return (v1.x*v2.y) - (v1.y*v2.x);
}

function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

function add(v1, v2) {
    return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
  }
}

function subtract(v1, v2) {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
  }
}

function multiply(vector, operand) {
  if ((typeof operand) === 'number') {
    return {
      x: vector.x * operand,
      y: vector.y * operand,
    }
  } else {
    return {
      x: vector.x * operand.x,
      y: vector.y * operand.y,
    }
  }
}

function divide(vector, scalar) {
  return {
    x: vector.x / scalar,
    y: vector.y / scalar,
  }
}

function length(vector) {
  return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
}

function normalized(vector) {
  var l = length(vector);
  return {
    x: vector.x / l,
    y: vector.y / l,
  }
}

function reflect(incident, normal) {
  return subtract(incident, multiply(normal, dotProduct(incident, normal) * 2));
}

function closestPointOnLine(line, point) {
  var lineStartToPoint = subtract(point, line.start);
  var lineVector = subtract(line.end, line.start);
  
  var lineVectorSquaredMagnitude = (lineVector.x * lineVector.x) + (lineVector.y * lineVector.y);
  
  var dot = dotProduct(lineStartToPoint, lineVector);

  var t = dot / lineVectorSquaredMagnitude;
  
  return {
    x: line.start.x + lineVector.x * t,
    y: line.start.y + lineVector.y * t,
  }
}

// Taken from http://stackoverflow.com/a/565282/1933312
function lineIntersection(line1, line2) {
  var startsVector = subtract(line2.start, line1.start);
  
  var line1vector = subtract(line1.end, line1.start);
  var line2vector = subtract(line2.end, line2.start);
  
  var lineVectorsCrossProduct = crossProduct(line1vector, line2vector);
  
  var t = crossProduct(startsVector, divide(line2vector, lineVectorsCrossProduct));
  var u = crossProduct(startsVector, divide(line1vector, lineVectorsCrossProduct));
  
  return {t: t, u: u};
}
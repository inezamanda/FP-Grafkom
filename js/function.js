function getAt(map, position) {
  var x = Math.round(position.x),
    y = Math.round(position.y);
  return map[y] && map[y][x];
}

function isWall(map, position) {
  var cell = getAt(map, position);
  return cell && cell.isWall === true;
}

function removeAt(map, scene, position) {
  var x = Math.round(position.x),
    y = Math.round(position.y);
  if (map[y] && map[y][x]) {
    // Don't actually remove, just make invisible.
    map[y][x].visible = false;
  }
}

// Object show up on the other side if out of bounds
function wrapObject(object, map) {
  if (object.position.x < map.left) object.position.x = map.right;
  else if (object.position.x > map.right) object.position.x = map.left;

  if (object.position.y > map.top) object.position.y = map.bottom;
  else if (object.position.y < map.bottom) object.position.y = map.top;
}

var distance = (function () {
  var difference = new THREE.Vector3();

  return function (object1, object2) {
    // Calculate difference between objects' positions.
    difference.copy(object1.position).sub(object2.position);

    return difference.length();
  };
})();

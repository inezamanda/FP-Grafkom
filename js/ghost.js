var createGhost = (function () {
  // buat hantu
  var ghostGeometry = new THREE.SphereGeometry(GHOST_RADIUS, 16, 16);

  return function (scene, position) {
    var ghostMaterial = new THREE.MeshPhongMaterial({ color: "red" });
    var ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
    ghost.isGhost = true;
    ghost.isWrapper = true;
    ghost.isAfraid = false;

    // Ghosts start moving left.
    ghost.position.copy(position);
    ghost.direction = new THREE.Vector3(-1, 0, 0);

    scene.add(ghost);
  };
})();

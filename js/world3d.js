/* ==================== 3D PREHISTORIC WORLD & BIOME BUILDER ==================== */
var JDR = window.JDR || {};

JDR.World3D = (function(){
  function World3D(scene, mapConfig){
    this.scene = scene;
    this.map = mapConfig || JDR.MAPS[0];
    this.terrainMesh = null;
    this.waterMesh = null;
    this.collectibles = []; // amber items
    this.checkpoints = [];  // stone archway time trials
    this.instancedMeshes = [];
    this.particles = null;
    this.size = JDR.CONFIG.SIM_3D.TERRAIN_SIZE || 300;
    this.segments = JDR.CONFIG.SIM_3D.TERRAIN_SEGMENTS || 90;

    this.init();
  }

  // Analytical mathematical height function for zero-latency collision queries
  World3D.prototype.getTerrainHeight = function(x, z){
    var dist = Math.sqrt(x * x + z * z);
    var normDist = dist / (this.size * 0.5);

    var base = 0;
    var biome = this.map.biomeType;

    if (biome === 'volcano') {
      // Rugged volcanic crags with a central calderic depression
      base = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5.5 + Math.sin(x * 0.12 + z * 0.08) * 2.5;
      // Magma river trench
      var trench = Math.sin(x * 0.035) * 15 - z;
      if (Math.abs(trench) < 12) {
        base -= (12 - Math.abs(trench)) * 0.35;
      }
    } else if (biome === 'desert') {
      // Sweeping sand dunes
      base = Math.sin(x * 0.03 + z * 0.015) * 6.0 + Math.cos(x * 0.07 - z * 0.04) * 2.2;
    } else if (biome === 'ice') {
      // Glacial ridges and sharp peaks
      base = Math.abs(Math.sin(x * 0.04)) * 7.5 + Math.cos(z * 0.05) * 4.5;
    } else if (biome === 'swamp') {
      // Low undulating peat bogs and shallow pools
      base = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2.5;
    } else {
      // Jungle: rolling hills and river canyon
      base = Math.sin(x * 0.04) * 4.5 + Math.cos(z * 0.035) * 3.8 + Math.sin(x * 0.09) * 1.5;
      var river = Math.sin(z * 0.025) * 20 - x;
      if (Math.abs(river) < 14) {
        base -= (14 - Math.abs(river)) * 0.35;
      }
    }

    // Outer boundary ridge so players remain in the prehistoric valley
    if (normDist > 0.7) {
      var edgeRise = Math.pow((normDist - 0.7) / 0.3, 2) * 28.0;
      base += edgeRise;
    }

    return base;
  };

  World3D.prototype.init = function(){
    this.buildTerrain();
    this.buildWaterOrLava();
    this.buildVegetationAndRocks();
    this.buildCollectibles();
    this.buildCheckpoints();
    this.buildAtmosphericParticles();
  };

  World3D.prototype.buildTerrain = function(){
    var geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    var posAttr = geom.attributes.position;
    for (var i = 0; i < posAttr.count; i++) {
      var x = posAttr.getX(i);
      var z = posAttr.getZ(i);
      var y = this.getTerrainHeight(x, z);
      posAttr.setY(i, y);
    }
    geom.computeVertexNormals();

    var mat = new THREE.MeshStandardMaterial({
      color: this.map.groundColor,
      roughness: this.map.groundRoughness || 0.85,
      metalness: 0.08,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  };

  World3D.prototype.buildWaterOrLava = function(){
    var waterGeom = new THREE.PlaneGeometry(this.size * 0.95, this.size * 0.95, 32, 32);
    waterGeom.rotateX(-Math.PI / 2);

    var isLava = this.map.isLava || false;
    var waterMat = new THREE.MeshStandardMaterial({
      color: this.map.waterColor,
      roughness: isLava ? 0.3 : 0.15,
      metalness: isLava ? 0.1 : 0.8,
      transparent: true,
      opacity: isLava ? 0.95 : 0.75,
      emissive: isLava ? 0xff3b11 : 0x051a22,
      emissiveIntensity: isLava ? 0.6 : 0.1
    });

    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.position.y = this.map.waterLevel || -1.2;
    this.scene.add(this.waterMesh);
  };

  World3D.prototype.buildVegetationAndRocks = function(){
    var biome = this.map.biomeType;
    var treeCount = this.map.treeCount || 80;
    var rockCount = this.map.rockCount || 60;

    // ==================== INSTANCED TREES / CYCADS ====================
    var trunkGeom = new THREE.CylinderGeometry(0.35, 0.6, 5.0, 6);
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x422d19, roughness: 0.9 });
    var leavesGeom = new THREE.ConeGeometry(2.4, 4.5, 6);
    var leavesColor = biome === 'volcano' ? 0x3d281a : (biome === 'desert' ? 0x9e8a4a : (biome === 'ice' ? 0x7c9bb0 : 0x2e6629));
    var leavesMat = new THREE.MeshStandardMaterial({ color: leavesColor, roughness: 0.8 });

    var treeGroup = new THREE.Group();
    for (var t = 0; t < treeCount; t++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 12 + Math.random() * (this.size * 0.38);
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var y = this.getTerrainHeight(x, z);

      if (y > (this.map.waterLevel || -1.2) + 0.5) {
        var tree = new THREE.Group();
        tree.position.set(x, y, z);
        var tScale = 0.8 + Math.random() * 0.7;
        tree.scale.set(tScale, tScale, tScale);

        var trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        tree.add(trunk);

        var foliage = new THREE.Mesh(leavesGeom, leavesMat);
        foliage.position.y = 5.2;
        foliage.castShadow = true;
        tree.add(foliage);

        treeGroup.add(tree);
      }
    }
    this.scene.add(treeGroup);

    // ==================== PREHISTORIC ROCKS & FOSSILS ====================
    var rockGeom = new THREE.DodecahedronGeometry(1.4, 1);
    var rockColor = biome === 'volcano' ? 0x1f1715 : (biome === 'desert' ? 0x9c7a52 : (biome === 'ice' ? 0xa8c0d4 : 0x444b42));
    var rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.9, flatShading: true });

    var rockGroup = new THREE.Group();
    for (var r = 0; r < rockCount; r++) {
      var rAngle = Math.random() * Math.PI * 2;
      var rDist = 8 + Math.random() * (this.size * 0.4);
      var rx = Math.cos(rAngle) * rDist;
      var rz = Math.sin(rAngle) * rDist;
      var ry = this.getTerrainHeight(rx, rz);

      var rock = new THREE.Mesh(rockGeom, rockMat);
      var rScale = 0.7 + Math.random() * 1.5;
      rock.scale.set(rScale * (0.8 + Math.random() * 0.5), rScale, rScale);
      rock.position.set(rx, ry + rScale * 0.4, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    }
    this.scene.add(rockGroup);

    // Desert Giant Fossils
    if (biome === 'desert') {
      var boneMat = new THREE.MeshStandardMaterial({ color: 0xe8dfcb, roughness: 0.6 });
      for (var f = 0; f < 5; f++) {
        var ribGroup = new THREE.Group();
        var fx = (f - 2) * 22;
        var fz = 35 + (f % 2) * 15;
        ribGroup.position.set(fx, this.getTerrainHeight(fx, fz), fz);
        for (var rib = 0; rib < 4; rib++) {
          var ribArch = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.4, 6, 12, Math.PI), boneMat);
          ribArch.position.set(0, 0, (rib - 1.5) * 2.8);
          ribArch.rotation.x = Math.PI / 2;
          ribArch.castShadow = true;
          ribGroup.add(ribArch);
        }
        this.scene.add(ribGroup);
      }
    }
  };

  World3D.prototype.buildCollectibles = function(){
    // Amber crystals scattered across the prehistoric valley
    var amberGeom = new THREE.OctahedronGeometry(0.85, 0);
    var amberMat = new THREE.MeshStandardMaterial({
      color: 0xffaa11,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0xff7700,
      emissiveIntensity: 0.75
    });

    var count = 35;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() * 0.3);
      var dist = 15 + Math.random() * (this.size * 0.35);
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var baseY = this.getTerrainHeight(x, z);

      var mesh = new THREE.Mesh(amberGeom, amberMat);
      mesh.position.set(x, baseY + 1.6, z);
      this.scene.add(mesh);

      // Light glow point
      var glow = new THREE.PointLight(0xff9900, 1.2, 8);
      glow.position.set(0, 0, 0);
      mesh.add(glow);

      this.collectibles.push({
        mesh: mesh,
        baseY: baseY + 1.6,
        collected: false,
        rotSpeed: 1.5 + Math.random()
      });
    }
  };

  World3D.prototype.buildCheckpoints = function(){
    // Ancient stone archways for exploration and time trials
    var archMat = new THREE.MeshStandardMaterial({ color: 0x555855, roughness: 0.9, flatShading: true });
    var archCount = 6;
    for (var a = 0; a < archCount; a++) {
      var angle = (a / archCount) * Math.PI * 2;
      var dist = 45;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var y = this.getTerrainHeight(x, z);

      var arch = new THREE.Group();
      arch.position.set(x, y, z);
      arch.rotation.y = angle + Math.PI / 2;

      // Pillars
      [-3.0, 3.0].forEach(function(px){
        var col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.0, 1.2), archMat);
        col.position.set(px, 3.0, 0);
        col.castShadow = true;
        arch.add(col);
      });
      // Lintel / Header
      var lintel = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.4, 1.4), archMat);
      lintel.position.set(0, 6.5, 0);
      lintel.castShadow = true;
      arch.add(lintel);

      this.scene.add(arch);
      this.checkpoints.push({
        position: new THREE.Vector3(x, y + 3.0, z),
        group: arch,
        passed: false
      });
    }
  };

  World3D.prototype.buildAtmosphericParticles = function(){
    // Floating particles (leaves, ash, snow, spores)
    var count = 300;
    var geom = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var halfSize = this.size * 0.45;

    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * halfSize * 2;
      positions[i * 3 + 1] = 1 + Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * halfSize * 2;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var pColor = this.map.particleColor || 0x66ff88;
    var mat = new THREE.PointsMaterial({
      color: pColor,
      size: 0.5,
      transparent: true,
      opacity: 0.75
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
  };

  World3D.prototype.update = function(delta, playerPos){
    var time = Date.now() * 0.001;

    // Animate collectibles (hover & spin)
    for (var i = 0; i < this.collectibles.length; i++) {
      var item = this.collectibles[i];
      if (!item.collected) {
        item.mesh.rotation.y += delta * item.rotSpeed;
        item.mesh.position.y = item.baseY + Math.sin(time * 3.0 + i) * 0.35;

        // Check player pickup
        if (playerPos) {
          var dx = playerPos.x - item.mesh.position.x;
          var dz = playerPos.z - item.mesh.position.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 2.5) {
            item.collected = true;
            this.scene.remove(item.mesh);
            JDR.Audio3D.playAmberCollect();
            if (JDR.SaveManager) {
              JDR.SaveManager.addCoins(10);
              if (JDR.SaveManager.data.explorationStats) {
                JDR.SaveManager.data.explorationStats.amberCollected++;
              }
            }
            if (JDR.simEngine) {
              JDR.simEngine.onAmberCollected();
            }
          }
        }
      }
    }

    // Animate atmospheric particles
    if (this.particles) {
      var pos = this.particles.geometry.attributes.position.array;
      for (var p = 0; p < pos.length / 3; p++) {
        pos[p * 3 + 1] -= delta * 1.5;
        if (pos[p * 3 + 1] < 0) pos[p * 3 + 1] = 25;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Lava hazard check
    if (this.map.isLava && playerPos) {
      var curY = this.getTerrainHeight(playerPos.x, playerPos.z);
      if (curY <= this.map.waterLevel + 0.3) {
        // Player stepped into molten lava!
        if (JDR.simEngine) {
          JDR.simEngine.onLavaHazard();
        }
      }
    }
  };

  return World3D;
})();

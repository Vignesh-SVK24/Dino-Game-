/* ==================== 3D PREHISTORIC WORLD & ADVANCED BIOMES ==================== */
var JDR = window.JDR || {};

JDR.World3D = (function(){
  // Procedural Terrain Texture Generator for rich surface detail
  function createBiomeTerrainTexture(biomeType, baseColorHex){
    var cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 512;
    var ctx = cvs.getContext('2d');

    // Base tone
    ctx.fillStyle = '#' + new THREE.Color(baseColorHex).getHexString();
    ctx.fillRect(0, 0, 512, 512);

    if (biomeType === 'volcano') {
      // Charcoal basalt with glowing orange cracks
      ctx.fillStyle = '#140c0a';
      for (var b = 0; b < 1200; b++) {
        var bx = Math.random() * 512, by = Math.random() * 512;
        ctx.fillRect(bx, by, 3 + Math.random() * 8, 3 + Math.random() * 8);
      }
      // Glowing fissures
      ctx.strokeStyle = 'rgba(255, 90, 20, 0.45)';
      ctx.lineWidth = 2.5;
      for (var f = 0; f < 8; f++) {
        ctx.beginPath();
        var fx = Math.random() * 512, fy = Math.random() * 512;
        ctx.moveTo(fx, fy);
        for (var step = 0; step < 6; step++) {
          fx += (Math.random() - 0.5) * 60;
          fy += (Math.random() - 0.5) * 60;
          ctx.lineTo(fx, fy);
        }
        ctx.stroke();
      }
    } else if (biomeType === 'desert') {
      // Wind-swept dune ripples
      ctx.fillStyle = '#f2c879';
      for (var r = 0; r < 512; r += 12) {
        ctx.beginPath();
        ctx.arc(256, r, 260, 0, Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(180, 120, 50, 0.25)';
        ctx.stroke();
      }
    } else if (biomeType === 'ice') {
      // Glacial crystal veins and frost
      ctx.fillStyle = '#ffffff';
      for (var s = 0; s < 1800; s++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
      ctx.strokeStyle = 'rgba(100, 180, 240, 0.35)';
      ctx.lineWidth = 1.8;
      for (var c = 0; c < 12; c++) {
        ctx.beginPath();
        var cx = Math.random() * 512, cy = Math.random() * 512;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random() - 0.5) * 80, cy + (Math.random() - 0.5) * 80);
        ctx.stroke();
      }
    } else if (biomeType === 'swamp') {
      // Dark peat with glowing bioluminescent lichen
      ctx.fillStyle = '#1c2918';
      for (var p = 0; p < 1400; p++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
      }
      ctx.fillStyle = 'rgba(85, 255, 136, 0.45)';
      for (var g = 0; g < 180; g++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Jungle: rich mossy turf and soil patches
      ctx.fillStyle = '#2d5a1e';
      for (var j = 0; j < 2400; j++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
      }
      ctx.fillStyle = '#488a2c';
      for (var m = 0; m < 600; m++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 4 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  function World3D(scene, mapConfig){
    this.scene = scene;
    this.map = mapConfig || JDR.MAPS[0];
    this.terrainMesh = null;
    this.waterMesh = null;
    this.waterMaterial = null;
    this.lavaLight = null;
    this.collectibles = [];
    this.checkpoints = [];
    this.particles = null;
    this.obstacles = [];      // Solid collision cylinders: { x, z, radius, height, type }
    this.mudPatches = [];     // Mud slow patches: { x, z, radius }
    this.treeMeshes = [];     // Animated swaying trees
    this.wildlife = [];       // Mini-compies and soaring pterosaurs
    this.landmarks = [];      // Exploration landmarks
    this.size = JDR.CONFIG.SIM_3D.TERRAIN_SIZE || 300;
    this.segments = JDR.CONFIG.SIM_3D.TERRAIN_SEGMENTS || 90;

    this.init();
  }

  World3D.prototype.getTerrainHeight = function(x, z){
    var dist = Math.sqrt(x * x + z * z);
    var normDist = dist / (this.size * 0.5);

    var base = 0;
    var biome = this.map.biomeType;

    if (biome === 'volcano') {
      base = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5.8 + Math.sin(x * 0.12 + z * 0.08) * 2.8;
      var trench = Math.sin(x * 0.035) * 15 - z;
      if (Math.abs(trench) < 13) {
        base -= (13 - Math.abs(trench)) * 0.38;
      }
    } else if (biome === 'desert') {
      base = Math.sin(x * 0.03 + z * 0.015) * 6.5 + Math.cos(x * 0.07 - z * 0.04) * 2.4;
    } else if (biome === 'ice') {
      base = Math.abs(Math.sin(x * 0.04)) * 8.0 + Math.cos(z * 0.05) * 4.8;
    } else if (biome === 'swamp') {
      base = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2.6;
    } else {
      base = Math.sin(x * 0.04) * 4.8 + Math.cos(z * 0.035) * 4.0 + Math.sin(x * 0.09) * 1.6;
      var river = Math.sin(z * 0.025) * 20 - x;
      if (Math.abs(river) < 14) {
        base -= (14 - Math.abs(river)) * 0.38;
      }
    }

    if (normDist > 0.68) {
      var edgeRise = Math.pow((normDist - 0.68) / 0.32, 2) * 32.0;
      base += edgeRise;
    }

    return base;
  };

  World3D.prototype.getTerrainNormal = function(x, z){
    var eps = 1.2;
    var hL = this.getTerrainHeight(x - eps, z);
    var hR = this.getTerrainHeight(x + eps, z);
    var hD = this.getTerrainHeight(x, z - eps);
    var hU = this.getTerrainHeight(x, z + eps);
    var norm = new THREE.Vector3(hL - hR, 2.0 * eps, hD - hU).normalize();
    return norm;
  };

  World3D.prototype.isPlayerInMud = function(x, z){
    for (var i = 0; i < this.mudPatches.length; i++) {
      var mp = this.mudPatches[i];
      var dx = x - mp.x, dz = z - mp.z;
      if (dx * dx + dz * dz < mp.radius * mp.radius) return true;
    }
    return false;
  };

  World3D.prototype.init = function(){
    this.buildTerrain();
    this.buildWaterOrLava();
    this.buildVegetationAndRocks();
    this.buildMudAndLogs();
    this.buildCollectibles();
    this.buildLandmarks();
    this.buildWildlife();
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

    var terrainTex = createBiomeTerrainTexture(this.map.biomeType, this.map.groundColor);

    var mat = new THREE.MeshStandardMaterial({
      color: this.map.groundColor,
      map: terrainTex,
      roughness: this.map.groundRoughness || 0.8,
      metalness: 0.06,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  };

  World3D.prototype.buildWaterOrLava = function(){
    var waterGeom = new THREE.PlaneGeometry(this.size * 0.95, this.size * 0.95, 36, 36);
    waterGeom.rotateX(-Math.PI / 2);

    var isLava = this.map.isLava || false;
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: this.map.waterColor,
      roughness: isLava ? 0.35 : 0.1,
      metalness: isLava ? 0.1 : 0.75,
      transparent: true,
      opacity: isLava ? 0.96 : 0.78,
      emissive: isLava ? 0xff4400 : 0x051a24,
      emissiveIntensity: isLava ? 0.85 : 0.12
    });

    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.waterMesh.position.y = this.map.waterLevel || -1.2;
    this.scene.add(this.waterMesh);

    // Dynamic pulsating lava light
    if (isLava) {
      this.lavaLight = new THREE.PointLight(0xff4400, 2.2, 55);
      this.lavaLight.position.set(0, 3, 0);
      this.scene.add(this.lavaLight);
    }
  };

  World3D.prototype.buildVegetationAndRocks = function(){
    var biome = this.map.biomeType;
    var treeCount = this.map.treeCount || 80;
    var rockCount = this.map.rockCount || 60;

    // High-Detail Trees with dual-tone foliage
    var trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 5.2, 8);
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.85 });

    var crownGeom1 = new THREE.ConeGeometry(2.5, 4.2, 7);
    var crownGeom2 = new THREE.ConeGeometry(2.0, 3.6, 7);

    var leafColor1 = biome === 'volcano' ? 0x2b1c14 : (biome === 'desert' ? 0xbaa459 : (biome === 'ice' ? 0x6e8e9e : 0x246320));
    var leafColor2 = biome === 'volcano' ? 0x3d2417 : (biome === 'desert' ? 0xd4be6c : (biome === 'ice' ? 0x8aaab8 : 0x3b8532));

    var leafMat1 = new THREE.MeshStandardMaterial({ color: leafColor1, roughness: 0.72 });
    var leafMat2 = new THREE.MeshStandardMaterial({ color: leafColor2, roughness: 0.72 });

    var treeGroup = new THREE.Group();
    for (var t = 0; t < treeCount; t++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 14 + Math.random() * (this.size * 0.38);
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var y = this.getTerrainHeight(x, z);

      if (y > (this.map.waterLevel || -1.2) + 0.4) {
        var tree = new THREE.Group();
        tree.position.set(x, y, z);
        var tScale = 0.85 + Math.random() * 0.65;
        tree.scale.set(tScale, tScale, tScale);

        var trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2.6;
        trunk.castShadow = true;
        tree.add(trunk);

        // Lower foliage
        var c1 = new THREE.Mesh(crownGeom1, leafMat1);
        c1.position.y = 4.8;
        c1.castShadow = true;
        tree.add(c1);

        // Upper brighter foliage tier
        var c2 = new THREE.Mesh(crownGeom2, leafMat2);
        c2.position.y = 6.4;
        c2.castShadow = true;
        tree.add(c2);

        treeGroup.add(tree);
        this.treeMeshes.push(tree);

        // Register solid obstacle for sliding collision
        this.obstacles.push({
          x: x,
          z: z,
          radius: 1.1 * tScale,
          height: 5.5 * tScale,
          type: 'tree'
        });
      }
    }
    this.scene.add(treeGroup);

    // Prehistoric Rocks with specular edge highlights
    var rockGeom = new THREE.DodecahedronGeometry(1.4, 1);
    var rockColor = biome === 'volcano' ? 0x181210 : (biome === 'desert' ? 0xa88458 : (biome === 'ice' ? 0xb5cee0 : 0x3e453d));
    var rockMat = new THREE.MeshStandardMaterial({
      color: rockColor,
      roughness: 0.78,
      metalness: 0.12,
      flatShading: true
    });

    var rockGroup = new THREE.Group();
    for (var r = 0; r < rockCount; r++) {
      var rAngle = Math.random() * Math.PI * 2;
      var rDist = 10 + Math.random() * (this.size * 0.4);
      var rx = Math.cos(rAngle) * rDist;
      var rz = Math.sin(rAngle) * rDist;
      var ry = this.getTerrainHeight(rx, rz);

      var rock = new THREE.Mesh(rockGeom, rockMat);
      var rScale = 0.75 + Math.random() * 1.6;
      rock.scale.set(rScale * (0.8 + Math.random() * 0.5), rScale, rScale);
      rock.position.set(rx, ry + rScale * 0.45, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);

      // Register solid obstacle for sliding collision
      this.obstacles.push({
        x: rx,
        z: rz,
        radius: rScale * 1.35,
        height: rScale * 1.8,
        type: 'rock'
      });
    }
    this.scene.add(rockGroup);

    // Desert Giant Fossils
    if (biome === 'desert') {
      var boneMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d5, roughness: 0.52, metalness: 0.08 });
      for (var f = 0; f < 5; f++) {
        var ribGroup = new THREE.Group();
        var fx = (f - 2) * 24;
        var fz = 36 + (f % 2) * 16;
        ribGroup.position.set(fx, this.getTerrainHeight(fx, fz), fz);
        for (var rib = 0; rib < 4; rib++) {
          var ribArch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.42, 6, 12, Math.PI), boneMat);
          ribArch.position.set(0, 0, (rib - 1.5) * 3.0);
          ribArch.rotation.x = Math.PI / 2;
          ribArch.castShadow = true;
          ribGroup.add(ribArch);
        }
        this.scene.add(ribGroup);
        this.obstacles.push({ x: fx, z: fz, radius: 2.8, height: 4.0, type: 'fossil' });
      }
    }
  };

  World3D.prototype.buildMudAndLogs = function(){
    // Mud / Slowing swamp mire patches
    var mudCount = 8;
    var mudColor = this.map.biomeType === 'ice' ? 0x98b8c8 : (this.map.biomeType === 'volcano' ? 0x1f0d06 : 0x221a12);
    var mudMat = new THREE.MeshStandardMaterial({
      color: mudColor,
      roughness: 0.95,
      metalness: 0.04
    });

    for (var m = 0; m < mudCount; m++) {
      var mAngle = (m / mudCount) * Math.PI * 2 + Math.random() * 0.4;
      var mDist = 18 + Math.random() * (this.size * 0.32);
      var mx = Math.cos(mAngle) * mDist;
      var mz = Math.sin(mAngle) * mDist;
      var my = this.getTerrainHeight(mx, mz);
      var mRadius = 4.5 + Math.random() * 3.5;

      var patchGeom = new THREE.CircleGeometry(mRadius, 14);
      var patch = new THREE.Mesh(patchGeom, mudMat);
      patch.rotateX(-Math.PI / 2);
      patch.position.set(mx, my + 0.06, mz);
      patch.receiveShadow = true;
      this.scene.add(patch);

      this.mudPatches.push({ x: mx, z: mz, radius: mRadius });
    }

    // Fallen Mossy / Petrified Logs
    var logCount = 6;
    var logGeom = new THREE.CylinderGeometry(0.5, 0.6, 7.2, 8);
    var logColor = this.map.biomeType === 'ice' ? 0x3d4b54 : (this.map.biomeType === 'volcano' ? 0x1a120e : 0x2d1e12);
    var logMat = new THREE.MeshStandardMaterial({ color: logColor, roughness: 0.88 });

    for (var l = 0; l < logCount; l++) {
      var lAngle = (l / logCount) * Math.PI * 2 + 0.6;
      var lDist = 22 + Math.random() * (this.size * 0.3);
      var lx = Math.cos(lAngle) * lDist;
      var lz = Math.sin(lAngle) * lDist;
      var ly = this.getTerrainHeight(lx, lz);

      var log = new THREE.Mesh(logGeom, logMat);
      log.rotateZ(Math.PI / 2);
      log.rotation.y = Math.random() * Math.PI;
      log.position.set(lx, ly + 0.45, lz);
      log.castShadow = true;
      log.receiveShadow = true;
      this.scene.add(log);

      this.obstacles.push({ x: lx, z: lz, radius: 1.8, height: 1.2, type: 'log' });
    }
  };

  World3D.prototype.buildCollectibles = function(){
    // 1. Amber Gemstones (Worth 10)
    var amberGeom = new THREE.OctahedronGeometry(0.85, 0);
    var amberMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.1,
      metalness: 0.85,
      emissive: 0xff7700,
      emissiveIntensity: 0.85
    });

    var amberCount = 26;
    for (var i = 0; i < amberCount; i++) {
      var angle = (i / amberCount) * Math.PI * 2 + (Math.random() * 0.3);
      var dist = 15 + Math.random() * (this.size * 0.35);
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var baseY = this.getTerrainHeight(x, z);

      var mesh = new THREE.Mesh(amberGeom, amberMat);
      mesh.position.set(x, baseY + 1.6, z);
      this.scene.add(mesh);

      var glow = new THREE.PointLight(0xff9900, 1.2, 8);
      mesh.add(glow);

      this.collectibles.push({
        type: 'amber',
        value: 10,
        mesh: mesh,
        baseY: baseY + 1.6,
        collected: false,
        rotSpeed: 1.6 + Math.random()
      });
    }

    // 2. Golden Prehistoric Dinosaur Eggs (Worth 50)
    var eggGeom = new THREE.SphereGeometry(0.7, 12, 10);
    eggGeom.scale(0.85, 1.25, 0.85);
    var eggMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.22,
      metalness: 0.65,
      emissive: 0xb58000,
      emissiveIntensity: 0.6
    });

    var eggCount = 5;
    for (var e = 0; e < eggCount; e++) {
      var eAngle = (e / eggCount) * Math.PI * 2 + 0.35;
      var eDist = 30 + Math.random() * 65;
      var ex = Math.cos(eAngle) * eDist;
      var ez = Math.sin(eAngle) * eDist;
      var eY = this.getTerrainHeight(ex, ez);

      var eggMesh = new THREE.Mesh(eggGeom, eggMat);
      eggMesh.position.set(ex, eY + 1.5, ez);
      this.scene.add(eggMesh);

      var eggLight = new THREE.PointLight(0xffcc00, 1.6, 10);
      eggMesh.add(eggLight);

      this.collectibles.push({
        type: 'egg',
        value: 50,
        mesh: eggMesh,
        baseY: eY + 1.5,
        collected: false,
        rotSpeed: 1.1
      });
    }

    // 3. Ancient Fossil Relics (Worth 25)
    var boneMat = new THREE.MeshStandardMaterial({
      color: 0xf5eedb,
      roughness: 0.4,
      metalness: 0.15,
      emissive: 0x3d3525,
      emissiveIntensity: 0.25
    });
    var fossilGeom = new THREE.TorusGeometry(0.65, 0.2, 6, 12);

    var fossilCount = 6;
    for (var f = 0; f < fossilCount; f++) {
      var fAngle = (f / fossilCount) * Math.PI * 2 + 0.8;
      var fDist = 25 + Math.random() * 70;
      var fx = Math.cos(fAngle) * fDist;
      var fz = Math.sin(fAngle) * fDist;
      var fY = this.getTerrainHeight(fx, fz);

      var fossilMesh = new THREE.Mesh(fossilGeom, boneMat);
      fossilMesh.position.set(fx, fY + 1.4, fz);
      this.scene.add(fossilMesh);

      this.collectibles.push({
        type: 'fossil',
        value: 25,
        mesh: fossilMesh,
        baseY: fY + 1.4,
        collected: false,
        rotSpeed: 1.4
      });
    }
  };

  World3D.prototype.buildLandmarks = function(){
    var mapId = this.map.id;
    var defs = JDR.LANDMARKS ? JDR.LANDMARKS.filter(function(l){ return l.mapId === mapId; }) : [];

    for (var i = 0; i < defs.length; i++) {
      var lm = defs[i];
      var y = this.getTerrainHeight(lm.x, lm.z);
      var lmGroup = new THREE.Group();
      lmGroup.position.set(lm.x, y, lm.z);

      // Landmark Beacon Pillar / Monument
      var beaconMat = new THREE.MeshStandardMaterial({
        color: 0x224255,
        roughness: 0.45,
        metalness: 0.7,
        emissive: 0x257095,
        emissiveIntensity: 0.5
      });
      var beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 8.5, 6), beaconMat);
      beaconMesh.position.y = 4.25;
      beaconMesh.castShadow = true;
      lmGroup.add(beaconMesh);

      // Glowing Landmark Orb at Peak
      var orbMat = new THREE.MeshStandardMaterial({
        color: 0x65bceb,
        emissive: 0x65bceb,
        emissiveIntensity: 1.0,
        roughness: 0.1
      });
      var orb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), orbMat);
      orb.position.y = 9.2;
      lmGroup.add(orb);

      var orbLight = new THREE.PointLight(0x65bceb, 2.5, 25);
      orbLight.position.y = 9.2;
      lmGroup.add(orbLight);

      this.scene.add(lmGroup);
      this.obstacles.push({ x: lm.x, z: lm.z, radius: 2.2, height: 9.0, type: 'monument' });

      var alreadyFound = JDR.SaveManager.data && JDR.SaveManager.data.discoveredLandmarks &&
                         JDR.SaveManager.data.discoveredLandmarks.indexOf(lm.id) >= 0;

      this.landmarks.push({
        data: lm,
        position: new THREE.Vector3(lm.x, y, lm.z),
        mesh: lmGroup,
        radius: lm.radius || 16,
        discovered: alreadyFound
      });
    }
  };

  World3D.prototype.buildWildlife = function(){
    // 1. Roaming Mini-Compies Herd (5 small grazing dinosaurs)
    var compyMat = new THREE.MeshStandardMaterial({ color: 0x5a7e3d, roughness: 0.7 });
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    for (var c = 0; c < 5; c++) {
      var angle = (c / 5) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 20 + Math.random() * 40;
      var cx = Math.cos(angle) * dist;
      var cz = Math.sin(angle) * dist;
      var cy = this.getTerrainHeight(cx, cz);

      var compy = new THREE.Group();
      compy.position.set(cx, cy, cz);

      // Body & Head
      var cBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.55), compyMat);
      cBody.position.y = 0.45;
      cBody.castShadow = true;
      compy.add(cBody);

      var cNeck = new THREE.Group();
      cNeck.position.set(0, 0.52, 0.25);
      var cHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), compyMat);
      cHead.position.set(0, 0.14, 0.1);
      cNeck.add(cHead);
      compy.add(cNeck);

      // Tail
      var cTail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.65, 4), compyMat);
      cTail.position.set(0, 0.48, -0.45);
      cTail.rotation.x = -Math.PI / 2;
      compy.add(cTail);

      this.scene.add(compy);

      this.wildlife.push({
        type: 'compy',
        group: compy,
        neck: cNeck,
        homeX: cx,
        homeZ: cz,
        pos: new THREE.Vector3(cx, cy, cz),
        heading: Math.random() * Math.PI * 2,
        state: 'graze',
        fleeTimer: 0,
        animOffset: Math.random() * 10
      });
    }

    // 2. Soaring High-Altitude Pterosaurs (2 majestic sky gliders)
    var pteraMat = new THREE.MeshStandardMaterial({ color: 0x7a5035, roughness: 0.65 });
    for (var p = 0; p < 2; p++) {
      var pGroup = new THREE.Group();
      var pBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 1.4), pteraMat);
      pGroup.add(pBody);

      var leftWing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.8), pteraMat);
      leftWing.position.set(-1.6, 0, 0);
      pGroup.add(leftWing);

      var rightWing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.8), pteraMat);
      rightWing.position.set(1.6, 0, 0);
      pGroup.add(rightWing);

      var alt = 36 + p * 12;
      pGroup.position.set(0, alt, 0);
      this.scene.add(pGroup);

      this.wildlife.push({
        type: 'pterosaur',
        group: pGroup,
        leftWing: leftWing,
        rightWing: rightWing,
        altitude: alt,
        orbitRadius: 75 + p * 25,
        speed: 0.35 + p * 0.15,
        angle: p * Math.PI
      });
    }
  };

  World3D.prototype.buildCheckpoints = function(){
    var archMat = new THREE.MeshStandardMaterial({
      color: 0x4a4d48,
      roughness: 0.82,
      metalness: 0.15,
      flatShading: true
    });
    var archCount = 6;
    for (var a = 0; a < archCount; a++) {
      var angle = (a / archCount) * Math.PI * 2;
      var dist = 46;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var y = this.getTerrainHeight(x, z);

      var arch = new THREE.Group();
      arch.position.set(x, y, z);
      arch.rotation.y = angle + Math.PI / 2;

      [-3.0, 3.0].forEach(function(px){
        var col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.2, 1.2), archMat);
        col.position.set(px, 3.1, 0);
        col.castShadow = true;
        arch.add(col);
      });
      var lintel = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.4, 1.4), archMat);
      lintel.position.set(0, 6.6, 0);
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
    var count = 350;
    var geom = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var halfSize = this.size * 0.45;

    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * halfSize * 2;
      positions[i * 3 + 1] = 1 + Math.random() * 26;
      positions[i * 3 + 2] = (Math.random() - 0.5) * halfSize * 2;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var pColor = this.map.particleColor || 0x66ff88;
    var mat = new THREE.PointsMaterial({
      color: pColor,
      size: 0.55,
      transparent: true,
      opacity: 0.82
    });

    this.particles = new THREE.Points(geom, mat);
    this.scene.add(this.particles);
  };

  World3D.prototype.update = function(delta, playerPos){
    var time = Date.now() * 0.001;

    // 1. Animate water and lava glow pulsation
    if (this.map.isLava && this.lavaLight) {
      var pulse = Math.sin(time * 5.0) * 0.35 + 1.8;
      this.lavaLight.intensity = pulse;
      this.waterMaterial.emissiveIntensity = 0.7 + Math.sin(time * 4.0) * 0.2;
    }

    // 2. Animate vegetation wind sway
    for (var tr = 0; tr < this.treeMeshes.length; tr++) {
      var tree = this.treeMeshes[tr];
      var sway = Math.sin(time * 2.2 + tree.position.x * 0.1) * 0.035;
      if (tree.children[1]) tree.children[1].rotation.z = sway;
      if (tree.children[2]) tree.children[2].rotation.z = sway * 1.5;
    }

    // 3. Animate and check collectibles (Amber, Eggs, Fossils)
    for (var i = 0; i < this.collectibles.length; i++) {
      var item = this.collectibles[i];
      if (!item.collected) {
        item.mesh.rotation.y += delta * item.rotSpeed;
        item.mesh.position.y = item.baseY + Math.sin(time * 3.0 + i) * 0.32;

        if (playerPos) {
          var dx = playerPos.x - item.mesh.position.x;
          var dz = playerPos.z - item.mesh.position.z;
          var dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 2.6) {
            item.collected = true;
            this.scene.remove(item.mesh);

            if (item.type === 'egg') {
              JDR.Audio3D.playEggCollect();
              if (JDR.SaveManager) {
                JDR.SaveManager.addCoins(item.value);
                JDR.SaveManager.data.eggsCollected = (JDR.SaveManager.data.eggsCollected || 0) + 1;
              }
              if (JDR.simEngine) JDR.simEngine.onEggCollected();
            } else if (item.type === 'fossil') {
              JDR.Audio3D.playFossilCollect();
              if (JDR.SaveManager) {
                JDR.SaveManager.addCoins(item.value);
                JDR.SaveManager.data.fossilsCollected = (JDR.SaveManager.data.fossilsCollected || 0) + 1;
              }
              if (JDR.simEngine) JDR.simEngine.onFossilCollected();
            } else {
              JDR.Audio3D.playAmberCollect();
              if (JDR.SaveManager) {
                JDR.SaveManager.addCoins(item.value);
                if (JDR.SaveManager.data.explorationStats) {
                  JDR.SaveManager.data.explorationStats.amberCollected++;
                }
              }
              if (JDR.simEngine) JDR.simEngine.onAmberCollected();
            }
          }
        }
      }
    }

    // 4. Check exploration landmarks discovery
    if (playerPos) {
      for (var l = 0; l < this.landmarks.length; l++) {
        var lm = this.landmarks[l];
        if (!lm.discovered) {
          var ldx = playerPos.x - lm.position.x;
          var ldz = playerPos.z - lm.position.z;
          if (Math.sqrt(ldx * ldx + ldz * ldz) < lm.radius) {
            lm.discovered = true;
            if (JDR.SaveManager) {
              JDR.SaveManager.discoverLandmark(lm.data);
            }
            if (JDR.simEngine) {
              JDR.simEngine.onLandmarkDiscovered(lm.data);
            }
          }
        }
      }
    }

    // 5. Update Wildlife (Mini-compies & Pterosaurs)
    for (var w = 0; w < this.wildlife.length; w++) {
      var critter = this.wildlife[w];
      if (critter.type === 'compy') {
        var cPos = critter.pos;
        var pDist = playerPos ? Math.sqrt(Math.pow(playerPos.x - cPos.x, 2) + Math.pow(playerPos.z - cPos.z, 2)) : 999;

        if (pDist < 13.0) {
          critter.state = 'flee';
          critter.fleeTimer = 2.5;
          // Run in opposite direction from player
          critter.heading = Math.atan2(cPos.x - playerPos.x, cPos.z - playerPos.z);
        }

        if (critter.state === 'flee') {
          critter.fleeTimer -= delta;
          var fleeSpeed = 10.0;
          cPos.x += Math.sin(critter.heading) * fleeSpeed * delta;
          cPos.z += Math.cos(critter.heading) * fleeSpeed * delta;
          cPos.y = this.getTerrainHeight(cPos.x, cPos.z);
          critter.group.position.copy(cPos);
          critter.group.rotation.y = critter.heading;
          critter.neck.rotation.x = 0.4 + Math.sin(time * 16.0) * 0.15;
          if (critter.fleeTimer <= 0) critter.state = 'graze';
        } else {
          // Graze and gentle head bob
          critter.neck.rotation.x = 0.6 + Math.sin(time * 2.5 + critter.animOffset) * 0.28;
        }
      } else if (critter.type === 'pterosaur') {
        critter.angle += delta * critter.speed;
        var px = Math.cos(critter.angle) * critter.orbitRadius;
        var pz = Math.sin(critter.angle) * critter.orbitRadius;
        critter.group.position.set(px, critter.altitude + Math.sin(critter.angle * 2.0) * 3.5, pz);
        critter.group.rotation.y = -critter.angle - Math.PI / 2;
        var flap = Math.sin(time * 3.5) * 0.22;
        critter.leftWing.rotation.z = flap;
        critter.rightWing.rotation.z = -flap;
      }
    }

    // 6. Animate atmospheric particles
    if (this.particles) {
      var pos = this.particles.geometry.attributes.position.array;
      for (var p = 0; p < pos.length / 3; p++) {
        pos[p * 3 + 1] -= delta * 1.6;
        if (pos[p * 3 + 1] < 0) pos[p * 3 + 1] = 26;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 7. Lava hazard check
    if (this.map.isLava && playerPos) {
      var curY = this.getTerrainHeight(playerPos.x, playerPos.z);
      if (curY <= this.map.waterLevel + 0.3) {
        if (JDR.simEngine) {
          JDR.simEngine.onLavaHazard();
        }
      }
    }
  };

  return World3D;
})();

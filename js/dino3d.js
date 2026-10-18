/* ==================== 3D DINOSAUR BUILDER & ENHANCED VISUALS ==================== */
var JDR = window.JDR || {};

JDR.Dino3D = (function(){
  // Material and texture cache
  var matCache = {};
  var scaleBumpTex = null;
  var leatherTex = null;
  var shadowTex = null;

  // Generate procedural organic reptile scale bump map
  function getScaleBumpTexture(){
    if (scaleBumpTex) return scaleBumpTex;
    var cvs = document.createElement('canvas');
    cvs.width = 256; cvs.height = 256;
    var ctx = cvs.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Draw organic micro-scale cells
    var size = 16;
    for (var y = 0; y < 256; y += size) {
      for (var x = 0; x < 256; x += size) {
        var cx = x + (y % (size * 2) === 0 ? size * 0.5 : 0);
        var cy = y + size * 0.5;
        var r = (size * 0.45) * (0.85 + Math.random() * 0.3);

        var grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#a0a0a0');
        grad.addColorStop(1, '#505050');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    scaleBumpTex = new THREE.CanvasTexture(cvs);
    scaleBumpTex.wrapS = THREE.RepeatWrapping;
    scaleBumpTex.wrapT = THREE.RepeatWrapping;
    scaleBumpTex.repeat.set(6, 6);
    return scaleBumpTex;
  }

  // Generate leather texture for saddles
  function getLeatherTexture(){
    if (leatherTex) return leatherTex;
    var cvs = document.createElement('canvas');
    cvs.width = 128; cvs.height = 128;
    var ctx = cvs.getContext('2d');
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (var i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    leatherTex = new THREE.CanvasTexture(cvs);
    leatherTex.wrapS = THREE.RepeatWrapping;
    leatherTex.wrapT = THREE.RepeatWrapping;
    leatherTex.repeat.set(3, 3);
    return leatherTex;
  }

  // Generate soft contact shadow texture
  function getContactShadowTexture(){
    if (shadowTex) return shadowTex;
    var cvs = document.createElement('canvas');
    cvs.width = 128; cvs.height = 128;
    var ctx = cvs.getContext('2d');
    var grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    shadowTex = new THREE.CanvasTexture(cvs);
    return shadowTex;
  }

  function getMaterial(color, roughness, metalness, useBump){
    var key = color + '_' + (roughness||0.7) + '_' + (metalness||0.08) + '_' + (useBump ? 1 : 0);
    if (!matCache[key]) {
      var opts = {
        color: color,
        roughness: roughness !== undefined ? roughness : 0.72,
        metalness: metalness !== undefined ? metalness : 0.08,
        flatShading: false
      };
      if (useBump) {
        opts.bumpMap = getScaleBumpTexture();
        opts.bumpScale = 0.025;
      }
      matCache[key] = new THREE.MeshStandardMaterial(opts);
    }
    return matCache[key];
  }

  // Prehistoric leather saddle material
  var saddleMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a16,
    roughness: 0.58,
    metalness: 0.15,
    map: getLeatherTexture()
  });
  var saddleTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe0ad38, // polished bronze buckles
    roughness: 0.28,
    metalness: 0.8
  });
  var eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.1,
    metalness: 0.6
  });
  var pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  var toothMat = new THREE.MeshStandardMaterial({ color: 0xfffaea, roughness: 0.22, metalness: 0.1 });

  // Build high-detail articulated dinosaur mesh
  function createDinosaurMesh(dinoConfig){
    var root = new THREE.Group();
    root.name = 'dino_' + dinoConfig.id;

    var baseMat = getMaterial(dinoConfig.color3D, 0.68, 0.08, true);
    var accentMat = getMaterial(dinoConfig.accent3D, 0.55, 0.12, true);
    var bellyMat = getMaterial(dinoConfig.belly3D, 0.75, 0.05, true);

    var parts = {
      root: root,
      body: null,
      hips: null,
      chest: null,
      neck: null,
      head: null,
      jaw: null,
      tailSegments: [],
      legs: [],
      wings: [],
      eyes: [],
      saddle: null,
      mountNode: null,
      contactShadow: null
    };

    var scale = dinoConfig.scale3D || 1.0;
    var isQuad = dinoConfig.quad || false;
    var isFly = dinoConfig.canFly || false;

    // ==================== DYNAMIC CONTACT SHADOW ====================
    var shadowGeom = new THREE.PlaneGeometry(3.2 * scale, 4.8 * scale);
    shadowGeom.rotateX(-Math.PI / 2);
    var shadowMat = new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    var shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.position.set(0, 0.05, 0.4 * scale);
    root.add(shadowMesh);
    parts.contactShadow = shadowMesh;

    // Body / Torso
    var bodyGroup = new THREE.Group();
    root.add(bodyGroup);
    parts.body = bodyGroup;

    // Pelvis / Hips
    var hipGeom = new THREE.CylinderGeometry(0.85, 1.15, 1.85, 12);
    hipGeom.rotateX(Math.PI / 2);
    var hipMesh = new THREE.Mesh(hipGeom, baseMat);
    hipMesh.castShadow = true;
    hipMesh.receiveShadow = true;
    hipMesh.position.set(0, 1.7 * scale, -0.2 * scale);
    bodyGroup.add(hipMesh);
    parts.hips = hipMesh;

    // Chest / Ribcage with pale belly counter-shading
    var chestGeom = new THREE.CylinderGeometry(1.1, 1.3, 2.1, 12);
    chestGeom.rotateX(Math.PI / 2);
    var chestMesh = new THREE.Mesh(chestGeom, bellyMat);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chestMesh.position.set(0, 0.2 * scale, 1.5 * scale);
    hipMesh.add(chestMesh);
    parts.chest = chestMesh;

    // Dorsal spine ridge contrast accent
    var spineRidgeGeom = new THREE.BoxGeometry(0.25 * scale, 0.3 * scale, 2.2 * scale);
    var spineRidge = new THREE.Mesh(spineRidgeGeom, accentMat);
    spineRidge.position.set(0, 1.15 * scale, 0);
    chestMesh.add(spineRidge);

    // Neck & Head
    var neckGroup = new THREE.Group();
    chestMesh.add(neckGroup);
    parts.neck = neckGroup;

    var neckLen = dinoConfig.longNeck ? 3.8 : 1.25;
    var neckGeom = new THREE.CylinderGeometry(0.45, 0.78, neckLen * scale, 10);
    var neckMesh = new THREE.Mesh(neckGeom, baseMat);
    neckMesh.castShadow = true;
    neckMesh.position.set(0, (neckLen * 0.45) * scale, 1.15 * scale);
    neckMesh.rotation.x = isQuad ? Math.PI / 6 : Math.PI / 4;
    neckGroup.add(neckMesh);

    // Head
    var headGroup = new THREE.Group();
    headGroup.position.set(0, (neckLen * 0.5) * scale, 0);
    neckMesh.add(headGroup);
    parts.head = headGroup;

    var headW = (dinoConfig.id === 'spino' ? 0.65 : 0.88) * scale;
    var headL = (dinoConfig.id === 'spino' ? 2.3 : (dinoConfig.longNeck ? 1.05 : 1.65)) * scale;
    var headGeom = new THREE.BoxGeometry(headW, 0.82 * scale, headL);
    var headMesh = new THREE.Mesh(headGeom, baseMat);
    headMesh.castShadow = true;
    headMesh.position.set(0, 0.22 * scale, 0.5 * headL);
    headGroup.add(headMesh);

    // Snout ridge
    var snoutRidge = new THREE.Mesh(new THREE.BoxGeometry(headW * 0.4, 0.18 * scale, headL * 0.9), accentMat);
    snoutRidge.position.set(0, 0.45 * scale, 0.5 * headL);
    headGroup.add(snoutRidge);

    // Jaw (articulated for roaring)
    var jawGeom = new THREE.BoxGeometry(headW * 0.92, 0.32 * scale, headL * 0.92);
    var jawMesh = new THREE.Mesh(jawGeom, bellyMat);
    jawMesh.castShadow = true;
    jawMesh.position.set(0, -0.45 * scale, 0.45 * headL);
    headGroup.add(jawMesh);
    parts.jaw = jawMesh;

    // Teeth for apex predators with glossy specular shine
    if (dinoConfig.id === 'trex' || dinoConfig.id === 'spino' || dinoConfig.id === 'raptor' || dinoConfig.id === 'coelo') {
      for (var t = 0; t < 7; t++) {
        var tooth = new THREE.Mesh(new THREE.ConeGeometry(0.065 * scale, 0.22 * scale, 5), toothMat);
        tooth.rotation.x = Math.PI;
        tooth.position.set((t % 2 === 0 ? 0.36 : -0.36) * headW, -0.16 * scale, (0.25 + (t * 0.13)) * headL);
        headMesh.add(tooth);
      }
    }

    // High-Detail Eyes with specular glint
    [-1, 1].forEach(function(side){
      var eyeSocket = new THREE.Group();
      eyeSocket.position.set(side * (headW * 0.52), 0.28 * scale, 0.38 * headL);

      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.13 * scale, 12, 12), eyeMat);
      eyeSocket.add(eye);

      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.065 * scale, 8, 8), pupilMat);
      pupil.position.set(side * 0.085 * scale, 0, 0.065 * scale);
      eye.add(pupil);

      // Specular reflection glint (gives eyes lifelike spark)
      var glint = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.position.set(side * 0.09 * scale, 0.04 * scale, 0.08 * scale);
      eye.add(glint);

      headMesh.add(eyeSocket);
      parts.eyes.push(eye);
    });

    // ==================== SPECIES-SPECIFIC FEATURES ====================
    // 1. Spinosaurus Sail with contrasting sun-burst pattern
    if (dinoConfig.sail) {
      var sailGeom = new THREE.CylinderGeometry(0.08, 1.9, 3.4 * scale, 16, 1, false, 0, Math.PI);
      sailGeom.rotateZ(Math.PI / 2);
      sailGeom.rotateY(Math.PI / 2);
      var sailMesh = new THREE.Mesh(sailGeom, accentMat);
      sailMesh.castShadow = true;
      sailMesh.position.set(0, 1.45 * scale, 0.2 * scale);
      chestMesh.add(sailMesh);

      // Sail spines
      for (var s = 0; s < 7; s++) {
        var spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.05 * scale, 2.2 * scale, 5), toothMat);
        spine.position.set(0, 1.3 * scale, (-1.2 + s * 0.4) * scale);
        chestMesh.add(spine);
      }
    }

    // 2. Stegosaurus Plates & Thagomizer
    if (dinoConfig.plates) {
      for (var p = 0; p < 9; p++) {
        var plate = new THREE.Mesh(new THREE.ConeGeometry(0.48 * scale, 1.18 * scale, 4), accentMat);
        plate.scale.set(0.18, 1.0, 1.0);
        plate.rotation.y = (p % 2 === 0 ? 0.22 : -0.22);
        plate.position.set((p % 2 === 0 ? 0.32 : -0.32) * scale, 1.05 * scale, (-1.3 + p * 0.52) * scale);
        plate.castShadow = true;
        chestMesh.add(plate);
      }
    }

    // 3. Triceratops Frill & Horns
    if (dinoConfig.frill) {
      var frillGeom = new THREE.CylinderGeometry(1.65 * scale, 1.45 * scale, 0.22 * scale, 10);
      frillGeom.rotateX(Math.PI / 3);
      var frillMesh = new THREE.Mesh(frillGeom, accentMat);
      frillMesh.castShadow = true;
      frillMesh.position.set(0, 0.85 * scale, -0.2 * scale);
      headGroup.add(frillMesh);

      // Polished Horns
      [-0.48, 0.48].forEach(function(xOff){
        var horn = new THREE.Mesh(new THREE.ConeGeometry(0.15 * scale, 1.35 * scale, 8), toothMat);
        horn.rotation.x = Math.PI / 3;
        horn.position.set(xOff * scale, 0.65 * scale, 0.85 * scale);
        horn.castShadow = true;
        headGroup.add(horn);
      });
      var noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.13 * scale, 0.55 * scale, 6), toothMat);
      noseHorn.rotation.x = Math.PI / 4;
      noseHorn.position.set(0, 0.42 * scale, 1.45 * scale);
      noseHorn.castShadow = true;
      headGroup.add(noseHorn);
    }

    // 4. Ankylosaurus Armor & Club
    if (dinoConfig.armor) {
      var carapaceGeom = new THREE.SphereGeometry(1.55 * scale, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      var carapace = new THREE.Mesh(carapaceGeom, accentMat);
      carapace.position.set(0, 0.32 * scale, 0);
      carapace.castShadow = true;
      chestMesh.add(carapace);

      // Bony osteoderm studs
      for (var o = 0; o < 14; o++) {
        var stud = new THREE.Mesh(new THREE.ConeGeometry(0.14 * scale, 0.28 * scale, 4), toothMat);
        var oAngle = (o / 14) * Math.PI * 2;
        stud.position.set(Math.cos(oAngle) * 1.2 * scale, 0.9 * scale, Math.sin(oAngle) * 0.9 * scale);
        chestMesh.add(stud);
      }
    }

    // 5. Pteranodon Wings & Crest
    if (dinoConfig.wings) {
      var crest = new THREE.Mesh(new THREE.ConeGeometry(0.26 * scale, 1.75 * scale, 5), accentMat);
      crest.rotation.x = -Math.PI / 3;
      crest.position.set(0, 0.42 * scale, -0.75 * scale);
      crest.castShadow = true;
      headGroup.add(crest);

      [-1, 1].forEach(function(side){
        var wingPivot = new THREE.Group();
        wingPivot.position.set(side * 0.92 * scale, 0.3 * scale, 0.2 * scale);
        chestMesh.add(wingPivot);

        var wingGeom = new THREE.BoxGeometry(2.9 * scale, 0.08 * scale, 1.45 * scale);
        var wingMesh = new THREE.Mesh(wingGeom, baseMat);
        wingMesh.castShadow = true;
        wingMesh.position.set(side * 1.45 * scale, 0, 0);
        wingPivot.add(wingMesh);
        parts.wings.push({ pivot: wingPivot, mesh: wingMesh, side: side });
      });
    }

    // Articulated Tail (4 segments for smooth swaying)
    var tailParent = hipMesh;
    for (var seg = 0; seg < 4; seg++) {
      var tailGroup = new THREE.Group();
      tailGroup.position.set(0, -0.1 * scale, -0.9 * scale);
      tailParent.add(tailGroup);
      parts.tailSegments.push(tailGroup);

      var tRad = (0.72 - seg * 0.14) * scale;
      var tLen = (1.42 - seg * 0.15) * scale;
      var tGeom = new THREE.CylinderGeometry(tRad * 0.72, tRad, tLen, 8);
      tGeom.rotateX(Math.PI / 2);
      var tMesh = new THREE.Mesh(tGeom, baseMat);
      tMesh.castShadow = true;
      tMesh.position.set(0, 0, -0.5 * tLen);
      tailGroup.add(tMesh);

      // Ankylosaurus Club
      if (dinoConfig.clubTail && seg === 3) {
        var club = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 * scale), toothMat);
        club.castShadow = true;
        club.position.set(0, 0, -tLen);
        tailGroup.add(club);
      }

      // Stegosaurus Spikes
      if (dinoConfig.plates && seg === 3) {
        [-1, 1].forEach(function(side){
          for (var sp = 0; sp < 2; sp++) {
            var spike = new THREE.Mesh(new THREE.ConeGeometry(0.13 * scale, 0.95 * scale, 6), toothMat);
            spike.rotation.z = side * Math.PI / 3;
            spike.position.set(side * 0.42 * scale, 0.1 * scale, (-0.4 - sp * 0.4) * scale);
            spike.castShadow = true;
            tailGroup.add(spike);
          }
        });
      }

      tailParent = tailGroup;
    }

    // Legs: Bipedal or Quadrupedal
    function buildLeg(xOff, yOff, zOff, isFront, isRight){
      var legGroup = new THREE.Group();
      legGroup.position.set(xOff, yOff, zOff);
      (isFront ? chestMesh : hipMesh).add(legGroup);

      var legScale = scale * (isFront && !isQuad ? 0.45 : 1.0);
      var thighLen = (isQuad ? 1.15 : 1.45) * legScale;
      var calfLen = (isQuad ? 1.05 : 1.35) * legScale;

      // Thigh
      var thighGeom = new THREE.CylinderGeometry(0.42 * legScale, 0.52 * legScale, thighLen, 8);
      var thigh = new THREE.Mesh(thighGeom, baseMat);
      thigh.castShadow = true;
      thigh.position.set(0, -0.5 * thighLen, 0);
      legGroup.add(thigh);

      // Knee / Calf
      var kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -thighLen, 0);
      legGroup.add(kneeGroup);

      var calfGeom = new THREE.CylinderGeometry(0.28 * legScale, 0.36 * legScale, calfLen, 8);
      var calf = new THREE.Mesh(calfGeom, bellyMat);
      calf.castShadow = true;
      calf.position.set(0, -0.5 * calfLen, 0);
      kneeGroup.add(calf);

      // Foot & Claws with high-contrast tips
      var footGeom = new THREE.BoxGeometry(0.52 * legScale, 0.26 * legScale, 0.85 * legScale);
      var foot = new THREE.Mesh(footGeom, accentMat);
      foot.castShadow = true;
      foot.position.set(0, -calfLen, 0.22 * legScale);
      kneeGroup.add(foot);

      // Claws
      for (var c = -1; c <= 1; c++) {
        var claw = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.24 * scale, 4), toothMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(c * 0.16 * legScale, -0.05 * legScale, 0.5 * legScale);
        foot.add(claw);
      }

      // Raptor sickle claw
      if (dinoConfig.id === 'raptor' && !isFront) {
        var sickle = new THREE.Mesh(new THREE.ConeGeometry(0.09 * scale, 0.45 * scale, 5), toothMat);
        sickle.rotation.x = -Math.PI / 3;
        sickle.position.set(isRight ? -0.22 * scale : 0.22 * scale, 0.18 * scale, 0.38 * scale);
        sickle.castShadow = true;
        foot.add(sickle);
      }

      parts.legs.push({
        group: legGroup,
        knee: kneeGroup,
        isFront: isFront,
        isRight: isRight,
        phaseOffset: (isRight ? 0 : Math.PI) + (isFront ? Math.PI * 0.5 : 0)
      });
    }

    // Spawn Hind Legs
    buildLeg(-0.92 * scale, -0.2 * scale, 0, false, false);
    buildLeg(0.92 * scale, -0.2 * scale, 0, false, true);

    if (isQuad) {
      buildLeg(-0.88 * scale, -0.3 * scale, 0.85 * scale, true, false);
      buildLeg(0.88 * scale, -0.3 * scale, 0.85 * scale, true, true);
    } else if (!isFly) {
      buildLeg(-0.55 * scale, -0.2 * scale, 1.25 * scale, true, false);
      buildLeg(0.55 * scale, -0.2 * scale, 1.25 * scale, true, true);
    }

    // ==================== SADDLE & MOUNT ANCHOR ====================
    var mountNode = new THREE.Group();
    mountNode.name = 'mount_node';
    var anchor = dinoConfig.mountAnchor || { x: 0, y: 3.0, z: 0.5 };
    mountNode.position.set(anchor.x, anchor.y, anchor.z);
    root.add(mountNode);
    parts.mountNode = mountNode;

    var saddleGroup = new THREE.Group();
    var saddleSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.68 * scale, 0.88 * scale, 0.72 * scale, 10), saddleMat);
    saddleSeat.rotation.x = Math.PI / 2;
    saddleSeat.castShadow = true;
    saddleGroup.add(saddleSeat);

    var pommel = new THREE.Mesh(new THREE.TorusGeometry(0.42 * scale, 0.13 * scale, 6, 10, Math.PI), saddleTrimMat);
    pommel.position.set(0, 0.36 * scale, 0.36 * scale);
    saddleGroup.add(pommel);

    var cantle = new THREE.Mesh(new THREE.TorusGeometry(0.46 * scale, 0.15 * scale, 6, 10, Math.PI), saddleTrimMat);
    cantle.position.set(0, 0.42 * scale, -0.36 * scale);
    saddleGroup.add(cantle);

    [-0.56, 0.56].forEach(function(side){
      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.82 * scale, 0.12 * scale), saddleMat);
      strap.position.set(side * scale, -0.46 * scale, 0);
      var stirrupRing = new THREE.Mesh(new THREE.TorusGeometry(0.13 * scale, 0.045 * scale, 6, 8), saddleTrimMat);
      stirrupRing.position.set(0, -0.42 * scale, 0);
      strap.add(stirrupRing);
      saddleGroup.add(strap);
    });

    saddleGroup.position.set(0, -0.25 * scale, 0);
    mountNode.add(saddleGroup);
    parts.saddle = saddleGroup;

    return {
      root: root,
      parts: parts,
      config: dinoConfig,
      scale: scale
    };
  }

  // Animation controller class
  function DinosaurController(dinoInstance){
    this.instance = dinoInstance;
    this.parts = dinoInstance.parts;
    this.config = dinoInstance.config;
    this.state = 'idle';
    this.speed = 0;
    this.lean = 0; // Dynamic turn banking lean
    this.animTime = 0;
    this.roarTime = 0;
    this.stamina = this.config.staminaMax3D || 100;
    this.isMounted = false;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.heading = 0;
  }

  DinosaurController.prototype.update = function(delta, inputSpeed, isSprinting, isJumping, doRoar, inWater, inMud, turnRate){
    this.animTime += delta;

    if (doRoar && this.roarTime <= 0) {
      this.roarTime = 1.3;
      JDR.Audio3D.playRoar(this.config.roarSound || 'trex');
      if (JDR.SaveManager) {
        JDR.SaveManager.data.roarsPerformed = (JDR.SaveManager.data.roarsPerformed || 0) + 1;
      }
      if (JDR.simEngine) JDR.simEngine.checkMissions();
    }
    if (this.roarTime > 0) {
      this.roarTime -= delta;
    }

    // Mud slowing effect modulated by dinosaur mud resistance
    var mudSlowFactor = 1.0;
    if (inMud) {
      mudSlowFactor = 0.55 + Math.min(0.4, (this.config.mudResistance || 1.0) * 0.25);
    }

    var targetSpeed = inputSpeed > 0 ? (isSprinting && this.stamina > 5 ? this.config.sprintSpeed3D : this.config.walkSpeed3D) : 0;
    targetSpeed *= mudSlowFactor;

    // Distinct acceleration vs deceleration based on mass and terrain grip
    var accelRate = (this.config.acceleration3D || 16.0);
    var decelRate = Math.max(10.0, (26.0 / Math.max(0.6, (this.config.mass3D || 2000) / 2500)) * (this.config.terrainGrip || 1.0));
    var rate = targetSpeed > this.speed ? accelRate : decelRate;
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, delta * rate);

    // Compute dynamic banking lean based on turn rate
    var targetLean = (turnRate || 0) * 0.22;
    targetLean = Math.max(-0.28, Math.min(0.28, targetLean));
    this.lean += (targetLean - this.lean) * Math.min(1.0, delta * 7.0);

    if (isSprinting && this.speed > this.config.walkSpeed3D) {
      var drain = JDR.CONFIG.SIM_3D.STAMINA_DRAIN_SPRINT * delta;
      if (inMud) drain *= 1.3;
      this.stamina = Math.max(0, this.stamina - drain);
    } else {
      this.stamina = Math.min(this.config.staminaMax3D, this.stamina + (JDR.CONFIG.SIM_3D.STAMINA_RECOVERY * delta));
    }

    if (this.roarTime > 0) {
      this.state = 'roar';
    } else if (inWater && this.config.canSwim) {
      this.state = 'swim';
    } else if (!this.isGrounded) {
      this.state = this.config.canFly ? 'fly' : 'jump';
    } else if (this.speed > this.config.runSpeed3D * 0.85) {
      this.state = 'sprint';
    } else if (this.speed > 2.0) {
      this.state = 'run';
    } else if (this.speed > 0.3) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }

    // Update ground contact shadow opacity and scale based on height
    if (this.parts.contactShadow) {
      if (!this.isGrounded) {
        this.parts.contactShadow.material.opacity = Math.max(0.15, 0.7 - Math.abs(this.verticalVelocity) * 0.04);
        this.parts.contactShadow.scale.set(1.3, 1.3, 1.3);
      } else {
        this.parts.contactShadow.material.opacity = 0.7;
        this.parts.contactShadow.scale.set(1.0, 1.0, 1.0);
      }
    }

    this.applyProceduralPose(delta, inWater);
  };

  DinosaurController.prototype.applyProceduralPose = function(delta, inWater){
    var p = this.parts;
    var t = this.animTime;
    var speedRatio = Math.min(2.5, this.speed / (this.config.walkSpeed3D || 7.0));
    var strideFreq = 4.5 * Math.max(0.6, speedRatio);

    if (this.state === 'idle') {
      var breath = Math.sin(t * 1.8) * 0.04;
      p.chest.scale.set(1.0 + breath, 1.0 + breath * 1.4, 1.0);
      p.neck.rotation.x = (this.config.quad ? 0.35 : 0.6) + Math.sin(t * 1.2) * 0.05;
      p.head.rotation.y = Math.sin(t * 0.7) * 0.12;
      p.jaw.rotation.x = Math.max(0, Math.sin(t * 1.8) * 0.04);

      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(t * 1.5 - i * 0.6) * 0.06;
        seg.rotation.x = -0.05 + Math.sin(t * 1.2) * 0.02;
      });

      p.legs.forEach(function(leg){
        leg.group.rotation.x = 0;
        leg.knee.rotation.x = 0;
      });
    } else if (this.state === 'walk' || this.state === 'run' || this.state === 'sprint') {
      var cycle = t * strideFreq;
      var swingAmp = this.state === 'sprint' ? 0.68 : (this.state === 'run' ? 0.50 : 0.36);

      var bounce = Math.sin(cycle * 2.0) * (0.09 * speedRatio);
      p.hips.position.y = (1.7 * this.instance.scale) + bounce;
      p.hips.rotation.x = (this.state === 'sprint' ? 0.18 : 0.09);

      p.neck.rotation.x = (this.config.quad ? 0.3 : 0.5) - Math.sin(cycle * 2.0) * 0.09;
      p.jaw.rotation.x = Math.max(0, Math.sin(cycle) * 0.14);

      p.legs.forEach(function(leg){
        var phase = cycle + leg.phaseOffset;
        var legSwing = Math.sin(phase) * swingAmp;
        var kneeBend = Math.max(0, -Math.sin(phase + Math.PI * 0.25)) * (swingAmp * 1.4);

        leg.group.rotation.x = legSwing;
        leg.knee.rotation.x = kneeBend;

        if (Math.sin(phase) > 0.95) {
          JDR.Audio3D.playFootstep(this.config.mass3D, this.state === 'sprint', inWater);
        }
      }.bind(this));

      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(cycle - i * 0.8) * (0.16 * speedRatio);
        seg.rotation.x = -0.1 + Math.sin(cycle * 2.0 - i * 0.4) * 0.09;
      });
    } else if (this.state === 'roar') {
      var roarProg = 1.0 - (this.roarTime / 1.3);
      var headLift = Math.sin(roarProg * Math.PI) * 0.58;
      p.neck.rotation.x = (this.config.quad ? 0.6 : 0.92) + headLift;
      p.head.rotation.x = -headLift * 0.5;
      p.jaw.rotation.x = Math.sin(roarProg * Math.PI) * 0.72;
      p.chest.scale.set(1.15, 1.2, 1.05);

      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = (Math.random() - 0.5) * 0.28;
      });
    } else if (this.state === 'swim') {
      var swimCycle = t * 3.5;
      p.hips.position.y = 0.4;
      p.hips.rotation.x = 0.12;

      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(swimCycle - i * 0.9) * 0.48;
      });

      p.legs.forEach(function(leg){
        leg.group.rotation.x = Math.sin(swimCycle + leg.phaseOffset) * 0.36;
        leg.knee.rotation.x = Math.abs(Math.sin(swimCycle)) * 0.42;
      });
    } else if (this.state === 'fly') {
      var wingCycle = t * 5.0;
      var flapAmp = 0.58;

      p.wings.forEach(function(wing){
        wing.pivot.rotation.z = Math.sin(wingCycle) * flapAmp * wing.side;
        wing.pivot.rotation.y = Math.sin(wingCycle) * 0.16 * wing.side;
      });

      p.legs.forEach(function(leg){
        leg.group.rotation.x = 0.6;
        leg.knee.rotation.x = 0.4;
      });
    }
  };

  return {
    createDinosaurMesh: createDinosaurMesh,
    DinosaurController: DinosaurController
  };
})();

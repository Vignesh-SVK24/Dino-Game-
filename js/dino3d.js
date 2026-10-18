/* ==================== 3D DINOSAUR BUILDER & ANIMATOR ==================== */
var JDR = window.JDR || {};

JDR.Dino3D = (function(){
  // Material cache for optimal performance
  var matCache = {};

  function getMaterial(color, roughness, metalness, bump){
    var key = color + '_' + (roughness||0.8) + '_' + (metalness||0.1);
    if (!matCache[key]) {
      matCache[key] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness !== undefined ? roughness : 0.8,
        metalness: metalness !== undefined ? metalness : 0.12,
        flatShading: false
      });
    }
    return matCache[key];
  }

  // Prehistoric leather saddle material
  var saddleMat = new THREE.MeshStandardMaterial({
    color: 0x422817,
    roughness: 0.65,
    metalness: 0.2
  });
  var saddleTrimMat = new THREE.MeshStandardMaterial({
    color: 0xcca044, // bronze / gold buckles
    roughness: 0.35,
    metalness: 0.7
  });
  var eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.5
  });
  var pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  var toothMat = new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.4 });

  // Build high-detail articulated dinosaur mesh
  function createDinosaurMesh(dinoConfig){
    var root = new THREE.Group();
    root.name = 'dino_' + dinoConfig.id;

    var baseMat = getMaterial(dinoConfig.color3D, 0.82, 0.08);
    var accentMat = getMaterial(dinoConfig.accent3D, 0.75, 0.1);
    var bellyMat = getMaterial(dinoConfig.belly3D, 0.88, 0.05);

    var parts = {
      root: root,
      body: null,
      hips: null,
      chest: null,
      neck: null,
      head: null,
      jaw: null,
      tailSegments: [],
      legs: [], // array of leg objects { thigh, calf, foot, isQuad, isRight }
      wings: [],
      eyes: [],
      saddle: null,
      mountNode: null
    };

    var scale = dinoConfig.scale3D || 1.0;

    // Body / Torso
    var bodyGroup = new THREE.Group();
    root.add(bodyGroup);
    parts.body = bodyGroup;

    var isQuad = dinoConfig.quad || false;
    var isFly = dinoConfig.canFly || false;

    // Pelvis / Hips
    var hipGeom = new THREE.CylinderGeometry(0.85, 1.1, 1.8, 10);
    hipGeom.rotateX(Math.PI / 2);
    var hipMesh = new THREE.Mesh(hipGeom, baseMat);
    hipMesh.castShadow = true;
    hipMesh.receiveShadow = true;
    hipMesh.position.set(0, 1.7 * scale, -0.2 * scale);
    bodyGroup.add(hipMesh);
    parts.hips = hipMesh;

    // Chest / Ribcage
    var chestGeom = new THREE.CylinderGeometry(1.05, 1.25, 2.0, 10);
    chestGeom.rotateX(Math.PI / 2);
    var chestMesh = new THREE.Mesh(chestGeom, bellyMat);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chestMesh.position.set(0, 0.2 * scale, 1.5 * scale);
    hipMesh.add(chestMesh);
    parts.chest = chestMesh;

    // Neck & Head
    var neckGroup = new THREE.Group();
    chestMesh.add(neckGroup);
    parts.neck = neckGroup;

    var neckLen = dinoConfig.longNeck ? 3.5 : 1.2;
    var neckGeom = new THREE.CylinderGeometry(0.45, 0.75, neckLen * scale, 8);
    var neckMesh = new THREE.Mesh(neckGeom, baseMat);
    neckMesh.castShadow = true;
    neckMesh.position.set(0, (neckLen * 0.45) * scale, 1.1 * scale);
    neckMesh.rotation.x = isQuad ? Math.PI / 6 : Math.PI / 4;
    neckGroup.add(neckMesh);

    // Head
    var headGroup = new THREE.Group();
    headGroup.position.set(0, (neckLen * 0.5) * scale, 0);
    neckMesh.add(headGroup);
    parts.head = headGroup;

    var headW = (dinoConfig.id === 'spino' ? 0.6 : 0.85) * scale;
    var headL = (dinoConfig.id === 'spino' ? 2.2 : (dinoConfig.longNeck ? 1.0 : 1.6)) * scale;
    var headGeom = new THREE.BoxGeometry(headW, 0.8 * scale, headL);
    var headMesh = new THREE.Mesh(headGeom, baseMat);
    headMesh.castShadow = true;
    headMesh.position.set(0, 0.2 * scale, 0.5 * headL);
    headGroup.add(headMesh);

    // Jaw (articulated for roaring)
    var jawGeom = new THREE.BoxGeometry(headW * 0.9, 0.3 * scale, headL * 0.9);
    var jawMesh = new THREE.Mesh(jawGeom, bellyMat);
    jawMesh.castShadow = true;
    jawMesh.position.set(0, -0.45 * scale, 0.45 * headL);
    headGroup.add(jawMesh);
    parts.jaw = jawMesh;

    // Teeth for predators
    if (dinoConfig.id === 'trex' || dinoConfig.id === 'spino' || dinoConfig.id === 'raptor' || dinoConfig.id === 'coelo') {
      for (var t = 0; t < 6; t++) {
        var tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.18 * scale, 4), toothMat);
        tooth.rotation.x = Math.PI;
        tooth.position.set((t % 2 === 0 ? 0.35 : -0.35) * headW, -0.15 * scale, (0.3 + (t * 0.15)) * headL);
        headMesh.add(tooth);
      }
    }

    // Eyes
    [-1, 1].forEach(function(side){
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 8, 8), eyeMat);
      eye.position.set(side * (headW * 0.52), 0.25 * scale, 0.35 * headL);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 6, 6), pupilMat);
      pupil.position.set(side * 0.08 * scale, 0, 0.06 * scale);
      eye.add(pupil);
      headMesh.add(eye);
      parts.eyes.push(eye);
    });

    // Species Specific Features:
    // 1. Spinosaurus Sail
    if (dinoConfig.sail) {
      var sailGeom = new THREE.CylinderGeometry(0.1, 1.8, 3.2 * scale, 12, 1, false, 0, Math.PI);
      sailGeom.rotateZ(Math.PI / 2);
      sailGeom.rotateY(Math.PI / 2);
      var sailMesh = new THREE.Mesh(sailGeom, accentMat);
      sailMesh.castShadow = true;
      sailMesh.position.set(0, 1.4 * scale, 0.2 * scale);
      chestMesh.add(sailMesh);
    }

    // 2. Stegosaurus Plates & Thagomizer
    if (dinoConfig.plates) {
      for (var p = 0; p < 8; p++) {
        var plate = new THREE.Mesh(new THREE.ConeGeometry(0.45 * scale, 1.1 * scale, 4), accentMat);
        plate.scale.set(0.2, 1.0, 1.0);
        plate.rotation.y = (p % 2 === 0 ? 0.2 : -0.2);
        plate.position.set((p % 2 === 0 ? 0.3 : -0.3) * scale, 1.0 * scale, (-1.2 + p * 0.55) * scale);
        chestMesh.add(plate);
      }
    }

    // 3. Triceratops Frill & Horns
    if (dinoConfig.frill) {
      var frillGeom = new THREE.CylinderGeometry(1.6 * scale, 1.4 * scale, 0.2 * scale, 8);
      frillGeom.rotateX(Math.PI / 3);
      var frillMesh = new THREE.Mesh(frillGeom, accentMat);
      frillMesh.castShadow = true;
      frillMesh.position.set(0, 0.8 * scale, -0.2 * scale);
      headGroup.add(frillMesh);

      // 3 Horns
      [-0.45, 0.45].forEach(function(xOff){
        var horn = new THREE.Mesh(new THREE.ConeGeometry(0.14 * scale, 1.2 * scale, 6), toothMat);
        horn.rotation.x = Math.PI / 3;
        horn.position.set(xOff * scale, 0.6 * scale, 0.8 * scale);
        headGroup.add(horn);
      });
      var noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.5 * scale, 6), toothMat);
      noseHorn.rotation.x = Math.PI / 4;
      noseHorn.position.set(0, 0.4 * scale, 1.4 * scale);
      headGroup.add(noseHorn);
    }

    // 4. Ankylosaurus Armor & Club
    if (dinoConfig.armor) {
      var carapaceGeom = new THREE.SphereGeometry(1.5 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      var carapace = new THREE.Mesh(carapaceGeom, accentMat);
      carapace.position.set(0, 0.3 * scale, 0);
      chestMesh.add(carapace);
    }

    // 5. Pteranodon Crest & Wings
    if (dinoConfig.wings) {
      // Cranial crest
      var crest = new THREE.Mesh(new THREE.ConeGeometry(0.25 * scale, 1.6 * scale, 4), accentMat);
      crest.rotation.x = -Math.PI / 3;
      crest.position.set(0, 0.4 * scale, -0.7 * scale);
      headGroup.add(crest);

      // Articulated Wings (Left & Right)
      [-1, 1].forEach(function(side){
        var wingPivot = new THREE.Group();
        wingPivot.position.set(side * 0.9 * scale, 0.3 * scale, 0.2 * scale);
        chestMesh.add(wingPivot);

        var wingGeom = new THREE.BoxGeometry(2.8 * scale, 0.08 * scale, 1.4 * scale);
        var wingMesh = new THREE.Mesh(wingGeom, baseMat);
        wingMesh.castShadow = true;
        wingMesh.position.set(side * 1.4 * scale, 0, 0);
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

      var tRad = (0.7 - seg * 0.14) * scale;
      var tLen = (1.4 - seg * 0.15) * scale;
      var tGeom = new THREE.CylinderGeometry(tRad * 0.7, tRad, tLen, 7);
      tGeom.rotateX(Math.PI / 2);
      var tMesh = new THREE.Mesh(tGeom, baseMat);
      tMesh.castShadow = true;
      tMesh.position.set(0, 0, -0.5 * tLen);
      tailGroup.add(tMesh);

      // Ankylosaurus Club at end of tail
      if (dinoConfig.clubTail && seg === 3) {
        var club = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 * scale), accentMat);
        club.castShadow = true;
        club.position.set(0, 0, -tLen);
        tailGroup.add(club);
      }

      // Stegosaurus Thagomizer Spikes at end of tail
      if (dinoConfig.plates && seg === 3) {
        [-1, 1].forEach(function(side){
          for (var sp = 0; sp < 2; sp++) {
            var spike = new THREE.Mesh(new THREE.ConeGeometry(0.12 * scale, 0.9 * scale, 5), toothMat);
            spike.rotation.z = side * Math.PI / 3;
            spike.position.set(side * 0.4 * scale, 0.1 * scale, (-0.4 - sp * 0.4) * scale);
            tailGroup.add(spike);
          }
        });
      }

      tailParent = tailGroup;
    }

    // Legs: Bipedal (2 hind legs + small arms) or Quadrupedal (4 sturdy legs)
    function buildLeg(xOff, yOff, zOff, isFront, isRight){
      var legGroup = new THREE.Group();
      legGroup.position.set(xOff, yOff, zOff);
      (isFront ? chestMesh : hipMesh).add(legGroup);

      var legScale = scale * (isFront && !isQuad ? 0.45 : 1.0);
      var thighLen = (isQuad ? 1.1 : 1.4) * legScale;
      var calfLen = (isQuad ? 1.0 : 1.3) * legScale;

      // Thigh
      var thighGeom = new THREE.CylinderGeometry(0.4 * legScale, 0.5 * legScale, thighLen, 7);
      var thigh = new THREE.Mesh(thighGeom, baseMat);
      thigh.castShadow = true;
      thigh.position.set(0, -0.5 * thighLen, 0);
      legGroup.add(thigh);

      // Knee / Calf
      var kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -thighLen, 0);
      legGroup.add(kneeGroup);

      var calfGeom = new THREE.CylinderGeometry(0.28 * legScale, 0.35 * legScale, calfLen, 7);
      var calf = new THREE.Mesh(calfGeom, bellyMat);
      calf.castShadow = true;
      calf.position.set(0, -0.5 * calfLen, 0);
      kneeGroup.add(calf);

      // Foot & Claws
      var footGeom = new THREE.BoxGeometry(0.5 * legScale, 0.25 * legScale, 0.8 * legScale);
      var foot = new THREE.Mesh(footGeom, accentMat);
      foot.castShadow = true;
      foot.position.set(0, -calfLen, 0.2 * legScale);
      kneeGroup.add(foot);

      // Raptor sickle claw
      if (dinoConfig.id === 'raptor' && !isFront) {
        var sickle = new THREE.Mesh(new THREE.ConeGeometry(0.08 * scale, 0.4 * scale, 4), toothMat);
        sickle.rotation.x = -Math.PI / 3;
        sickle.position.set(isRight ? -0.2 * scale : 0.2 * scale, 0.15 * scale, 0.35 * scale);
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
    buildLeg(-0.9 * scale, -0.2 * scale, 0, false, false);
    buildLeg(0.9 * scale, -0.2 * scale, 0, false, true);

    if (isQuad) {
      // Spawn Front Legs
      buildLeg(-0.85 * scale, -0.3 * scale, 0.8 * scale, true, false);
      buildLeg(0.85 * scale, -0.3 * scale, 0.8 * scale, true, true);
    } else if (!isFly) {
      // Spawn Small Forelimbs / Arms
      buildLeg(-0.55 * scale, -0.2 * scale, 1.2 * scale, true, false);
      buildLeg(0.55 * scale, -0.2 * scale, 1.2 * scale, true, true);
    }

    // ==================== SADDLE & MOUNT ANCHOR ====================
    var mountNode = new THREE.Group();
    mountNode.name = 'mount_node';
    var anchor = dinoConfig.mountAnchor || { x: 0, y: 3.0, z: 0.5 };
    mountNode.position.set(anchor.x, anchor.y, anchor.z);
    root.add(mountNode);
    parts.mountNode = mountNode;

    // Modeled Prehistoric Saddle
    var saddleGroup = new THREE.Group();
    var saddleSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.65 * scale, 0.85 * scale, 0.7 * scale, 8), saddleMat);
    saddleSeat.rotation.x = Math.PI / 2;
    saddleSeat.castShadow = true;
    saddleGroup.add(saddleSeat);

    // Pommel & Cantle (front/back raised ridges)
    var pommel = new THREE.Mesh(new THREE.TorusGeometry(0.4 * scale, 0.12 * scale, 6, 8, Math.PI), saddleTrimMat);
    pommel.position.set(0, 0.35 * scale, 0.35 * scale);
    saddleGroup.add(pommel);

    var cantle = new THREE.Mesh(new THREE.TorusGeometry(0.45 * scale, 0.14 * scale, 6, 8, Math.PI), saddleTrimMat);
    cantle.position.set(0, 0.4 * scale, -0.35 * scale);
    saddleGroup.add(cantle);

    // Stirrup straps hanging down
    [-0.55, 0.55].forEach(function(side){
      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.08 * scale, 0.8 * scale, 0.12 * scale), saddleMat);
      strap.position.set(side * scale, -0.45 * scale, 0);
      var stirrupRing = new THREE.Mesh(new THREE.TorusGeometry(0.12 * scale, 0.04 * scale, 6, 8), saddleTrimMat);
      stirrupRing.position.set(0, -0.4 * scale, 0);
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

  // Animation controller class to blend states smoothly
  function DinosaurController(dinoInstance){
    this.instance = dinoInstance;
    this.parts = dinoInstance.parts;
    this.config = dinoInstance.config;
    this.state = 'idle'; // idle, walk, run, sprint, jump, roar, swim, fly
    this.speed = 0;
    this.animTime = 0;
    this.roarTime = 0;
    this.stamina = this.config.staminaMax3D || 100;
    this.isMounted = false;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.heading = 0; // yaw angle
  }

  DinosaurController.prototype.update = function(delta, inputSpeed, isSprinting, isJumping, doRoar, inWater){
    this.animTime += delta;

    // Roar trigger
    if (doRoar && this.roarTime <= 0) {
      this.roarTime = 1.3;
      JDR.Audio3D.playRoar(this.config.roarSound || 'trex');
    }
    if (this.roarTime > 0) {
      this.roarTime -= delta;
    }

    // Determine target animation state
    var maxSpeed = isSprinting && this.stamina > 5 ? this.config.sprintSpeed3D : (inputSpeed > 0 ? this.config.runSpeed3D : 0);
    var targetSpeed = inputSpeed > 0 ? (isSprinting && this.stamina > 5 ? this.config.sprintSpeed3D : this.config.walkSpeed3D) : 0;
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, delta * (this.config.acceleration3D || 15.0));

    // Stamina depletion / recovery
    if (isSprinting && this.speed > this.config.walkSpeed3D) {
      this.stamina = Math.max(0, this.stamina - (JDR.CONFIG.SIM_3D.STAMINA_DRAIN_SPRINT * delta));
    } else {
      this.stamina = Math.min(this.config.staminaMax3D, this.stamina + (JDR.CONFIG.SIM_3D.STAMINA_RECOVERY * delta));
    }

    // State determination
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

    this.applyProceduralPose(delta, inWater);
  };

  DinosaurController.prototype.applyProceduralPose = function(delta, inWater){
    var p = this.parts;
    var t = this.animTime;
    var speedRatio = Math.min(2.5, this.speed / (this.config.walkSpeed3D || 7.0));
    var strideFreq = 4.5 * Math.max(0.6, speedRatio);

    // ==================== IDLE / BREATHING ====================
    if (this.state === 'idle') {
      var breath = Math.sin(t * 1.8) * 0.04;
      p.chest.scale.set(1.0 + breath, 1.0 + breath * 1.4, 1.0);
      p.neck.rotation.x = (this.config.quad ? 0.35 : 0.6) + Math.sin(t * 1.2) * 0.05;
      p.head.rotation.y = Math.sin(t * 0.7) * 0.12;
      p.jaw.rotation.x = Math.max(0, Math.sin(t * 1.8) * 0.04);

      // Gentle tail sway
      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(t * 1.5 - i * 0.6) * 0.06;
        seg.rotation.x = -0.05 + Math.sin(t * 1.2) * 0.02;
      });

      // Reset legs
      p.legs.forEach(function(leg){
        leg.group.rotation.x = 0;
        leg.knee.rotation.x = 0;
      });
    }

    // ==================== WALK / RUN / SPRINT ====================
    else if (this.state === 'walk' || this.state === 'run' || this.state === 'sprint') {
      var cycle = t * strideFreq;
      var swingAmp = this.state === 'sprint' ? 0.65 : (this.state === 'run' ? 0.48 : 0.35);

      // Body vertical gallop bounce and forward lean
      var bounce = Math.sin(cycle * 2.0) * (0.08 * speedRatio);
      p.hips.position.y = (1.7 * this.instance.scale) + bounce;
      p.hips.rotation.x = (this.state === 'sprint' ? 0.16 : 0.08);

      // Neck bobbing
      p.neck.rotation.x = (this.config.quad ? 0.3 : 0.5) - Math.sin(cycle * 2.0) * 0.08;
      p.jaw.rotation.x = Math.max(0, Math.sin(cycle) * 0.12);

      // Coordinated leg cycle
      p.legs.forEach(function(leg){
        var phase = cycle + leg.phaseOffset;
        var legSwing = Math.sin(phase) * swingAmp;
        var kneeBend = Math.max(0, -Math.sin(phase + Math.PI * 0.25)) * (swingAmp * 1.4);

        leg.group.rotation.x = legSwing;
        leg.knee.rotation.x = kneeBend;

        // Footstep audio trigger on ground strike
        if (Math.sin(phase) > 0.95) {
          JDR.Audio3D.playFootstep(this.config.mass3D, this.state === 'sprint', inWater);
        }
      }.bind(this));

      // Tail counterbalances movement
      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(cycle - i * 0.8) * (0.15 * speedRatio);
        seg.rotation.x = -0.1 + Math.sin(cycle * 2.0 - i * 0.4) * 0.08;
      });
    }

    // ==================== ROAR ====================
    else if (this.state === 'roar') {
      var roarProg = 1.0 - (this.roarTime / 1.3);
      var headLift = Math.sin(roarProg * Math.PI) * 0.55;
      p.neck.rotation.x = (this.config.quad ? 0.6 : 0.9) + headLift;
      p.head.rotation.x = -headLift * 0.5;
      p.jaw.rotation.x = Math.sin(roarProg * Math.PI) * 0.65; // Wide open jaw!
      p.chest.scale.set(1.15, 1.2, 1.05);

      // Tail shakes violently
      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = (Math.random() - 0.5) * 0.25;
      });
    }

    // ==================== SWIM ====================
    else if (this.state === 'swim') {
      var swimCycle = t * 3.5;
      p.hips.position.y = 0.4;
      p.hips.rotation.x = 0.12;

      // Tail sculling sinusoidal wave
      p.tailSegments.forEach(function(seg, i){
        seg.rotation.y = Math.sin(swimCycle - i * 0.9) * 0.45;
      });

      // Paddle legs
      p.legs.forEach(function(leg){
        leg.group.rotation.x = Math.sin(swimCycle + leg.phaseOffset) * 0.35;
        leg.knee.rotation.x = Math.abs(Math.sin(swimCycle)) * 0.4;
      });
    }

    // ==================== FLY ====================
    else if (this.state === 'fly') {
      var wingCycle = t * 5.0;
      var flapAmp = 0.55;

      p.wings.forEach(function(wing){
        wing.pivot.rotation.z = Math.sin(wingCycle) * flapAmp * wing.side;
        wing.pivot.rotation.y = Math.sin(wingCycle) * 0.15 * wing.side;
      });

      p.legs.forEach(function(leg){
        leg.group.rotation.x = 0.6; // tucked back
        leg.knee.rotation.x = 0.4;
      });
    }
  };

  return {
    createDinosaurMesh: createDinosaurMesh,
    DinosaurController: DinosaurController
  };
})();

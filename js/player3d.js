/* ==================== 3D PLAYER EXPLORER & RIDING CONTROLLER ==================== */
var JDR = window.JDR || {};

JDR.Player3D = (function(){
  function createPlayerMesh(){
    var root = new THREE.Group();
    root.name = 'player_explorer';

    var skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    var clothMat = new THREE.MeshStandardMaterial({ color: 0x3d5a45, roughness: 0.8 }); // Safari jacket
    var pantsMat = new THREE.MeshStandardMaterial({ color: 0xb5996e, roughness: 0.85 }); // Khaki pants
    var bootsMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e, roughness: 0.7 });
    var hatMat = new THREE.MeshStandardMaterial({ color: 0xc4a47c, roughness: 0.8 }); // Pith/safari helmet

    var parts = {
      root: root,
      torso: null,
      head: null,
      hat: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
      leftKnee: null,
      rightKnee: null
    };

    // Torso / Jacket
    var torsoGeom = new THREE.BoxGeometry(0.55, 0.7, 0.35);
    var torso = new THREE.Mesh(torsoGeom, clothMat);
    torso.castShadow = true;
    torso.position.set(0, 0.95, 0);
    root.add(torso);
    parts.torso = torso;

    // Head
    var headGeom = new THREE.SphereGeometry(0.2, 8, 8);
    var head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 0.52, 0);
    torso.add(head);
    parts.head = head;

    // Safari Explorer Hat
    var hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.05, 10), hatMat);
    hatBase.position.set(0, 0.12, 0);
    head.add(hatBase);
    var hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.22, 10), hatMat);
    hatCrown.position.set(0, 0.12, 0);
    hatBase.add(hatCrown);
    parts.hat = hatBase;

    // Arms
    [-1, 1].forEach(function(side){
      var armGroup = new THREE.Group();
      armGroup.position.set(side * 0.38, 0.25, 0);
      torso.add(armGroup);

      var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 6), clothMat);
      arm.position.set(0, -0.3, 0);
      arm.castShadow = true;
      armGroup.add(arm);

      // Hand
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), skinMat);
      hand.position.set(0, -0.65, 0);
      armGroup.add(hand);

      if (side === -1) parts.leftArm = armGroup;
      else parts.rightArm = armGroup;
    });

    // Legs
    [-1, 1].forEach(function(side){
      var legGroup = new THREE.Group();
      legGroup.position.set(side * 0.18, -0.35, 0);
      torso.add(legGroup);

      var thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.5, 6), pantsMat);
      thigh.position.set(0, -0.25, 0);
      thigh.castShadow = true;
      legGroup.add(thigh);

      var kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.5, 0);
      legGroup.add(kneeGroup);

      var shin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 6), pantsMat);
      shin.position.set(0, -0.22, 0);
      shin.castShadow = true;
      kneeGroup.add(shin);

      var boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.25), bootsMat);
      boot.position.set(0, -0.45, 0.05);
      boot.castShadow = true;
      kneeGroup.add(boot);

      if (side === -1) {
        parts.leftLeg = legGroup;
        parts.leftKnee = kneeGroup;
      } else {
        parts.rightLeg = legGroup;
        parts.rightKnee = kneeGroup;
      }
    });

    return {
      root: root,
      parts: parts
    };
  }

  function PlayerController(playerInstance){
    this.instance = playerInstance;
    this.parts = playerInstance.parts;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // facing direction in radians
    this.speed = 0;
    this.animTime = 0;
    this.isGrounded = true;

    // Riding state
    this.isMounted = false;
    this.mountedDino = null;
    this.mountProgress = 0; // 0 to 1 during mounting lerp
    this.isMounting = false;
    this.isDismounting = false;
    this.mountStartPos = new THREE.Vector3();
    this.mountTargetPos = new THREE.Vector3();
  }

  PlayerController.prototype.mountDinosaur = function(dinoController){
    if (this.isMounted || this.isMounting) return;
    this.isMounting = true;
    this.mountProgress = 0;
    this.mountedDino = dinoController;
    this.mountStartPos.copy(this.instance.root.position);
    JDR.Audio3D.playMount();
  };

  PlayerController.prototype.dismountDinosaur = function(world3D){
    if (!this.isMounted || this.isDismounting) return;
    this.isDismounting = true;
    this.mountProgress = 0;

    // Calculate safe ground landing spot beside the dinosaur
    var dinoRoot = this.mountedDino.instance.root;
    var sideOffset = new THREE.Vector3(2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), dinoRoot.rotation.y);
    var targetLanding = dinoRoot.position.clone().add(sideOffset);
    var groundY = world3D ? world3D.getTerrainHeight(targetLanding.x, targetLanding.z) : 0;
    targetLanding.y = groundY;

    this.mountStartPos.copy(this.instance.root.position);
    this.mountTargetPos.copy(targetLanding);

    // Detach from dinosaur mount node to world scene
    var scene = dinoRoot.parent;
    if (scene) {
      scene.attach(this.instance.root);
    }
    JDR.Audio3D.playDismount();
  };

  PlayerController.prototype.update = function(delta, inputVec, isSprinting, isJumping, world3D){
    this.animTime += delta;

    // ==================== MOUNTING ANIMATION INTERPOLATION ====================
    if (this.isMounting) {
      this.mountProgress += delta / (JDR.CONFIG.SIM_3D.MOUNT_TRANSITION_TIME || 0.7);
      var mountNode = this.mountedDino.parts.mountNode;
      var worldTarget = new THREE.Vector3();
      mountNode.getWorldPosition(worldTarget);

      if (this.mountProgress >= 1.0) {
        this.mountProgress = 1.0;
        this.isMounting = false;
        this.isMounted = true;
        this.mountedDino.isMounted = true;

        // Parent player directly to dinosaur mountNode
        mountNode.add(this.instance.root);
        this.instance.root.position.set(0, 0.45, 0); // seated in saddle
        this.instance.root.rotation.set(0, 0, 0);
        this.setRidingPose();
      } else {
        // Smooth ease-out arc onto the saddle
        var t = this.mountProgress;
        var arc = Math.sin(t * Math.PI) * 1.5;
        this.instance.root.position.lerpVectors(this.mountStartPos, worldTarget, t);
        this.instance.root.position.y += arc;
      }
      return;
    }

    // ==================== DISMOUNTING ANIMATION INTERPOLATION ====================
    if (this.isDismounting) {
      this.mountProgress += delta / (JDR.CONFIG.SIM_3D.MOUNT_TRANSITION_TIME || 0.6);
      if (this.mountProgress >= 1.0) {
        this.mountProgress = 1.0;
        this.isDismounting = false;
        this.isMounted = false;
        this.mountedDino.isMounted = false;
        this.mountedDino = null;
        this.instance.root.position.copy(this.mountTargetPos);
        this.resetStandPose();
      } else {
        var t = this.mountProgress;
        this.instance.root.position.lerpVectors(this.mountStartPos, this.mountTargetPos, t);
      }
      return;
    }

    // If fully mounted, rider moves synchronously with dinosaur
    if (this.isMounted && this.mountedDino) {
      this.setRidingPose();
      return;
    }

    // ==================== ON-FOOT EXPLORATION PHYSICS ====================
    var targetSpeed = inputVec.length() > 0 ? (isSprinting ? JDR.CONFIG.SIM_3D.PLAYER_RUN_SPEED : JDR.CONFIG.SIM_3D.PLAYER_WALK_SPEED) : 0;
    this.speed += (targetSpeed - this.speed) * Math.min(1.0, delta * 12.0);

    if (inputVec.length() > 0.05) {
      this.heading = Math.atan2(inputVec.x, inputVec.z);
      this.instance.root.rotation.y = this.heading;

      var moveStep = inputVec.clone().normalize().multiplyScalar(this.speed * delta);
      this.instance.root.position.add(moveStep);
    }

    // Terrain ground detection & gravity
    var curPos = this.instance.root.position;
    var terrainY = world3D ? world3D.getTerrainHeight(curPos.x, curPos.z) : 0;

    if (isJumping && this.isGrounded) {
      this.velocity.y = JDR.CONFIG.SIM_3D.PLAYER_JUMP_IMPULSE || 10.0;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y += (JDR.CONFIG.SIM_3D.GRAVITY || -24.0) * delta;
      curPos.y += this.velocity.y * delta;
      if (curPos.y <= terrainY) {
        curPos.y = terrainY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      curPos.y = terrainY;
    }

    // On-foot walk/run procedural animation
    this.applyOnFootAnimation(delta);
  };

  PlayerController.prototype.setRidingPose = function(){
    var p = this.parts;
    // Seated posture with knees bent outwards around saddle
    p.torso.position.y = 0.65;
    p.torso.rotation.x = 0.12;

    p.leftLeg.rotation.x = 1.35;
    p.leftLeg.rotation.z = -0.35;
    p.leftKnee.rotation.x = -1.4;

    p.rightLeg.rotation.x = 1.35;
    p.rightLeg.rotation.z = 0.35;
    p.rightKnee.rotation.x = -1.4;

    // Hands forward holding the dinosaur reins
    p.leftArm.rotation.x = 1.1;
    p.leftArm.rotation.y = -0.2;
    p.rightArm.rotation.x = 1.1;
    p.rightArm.rotation.y = 0.2;
  };

  PlayerController.prototype.resetStandPose = function(){
    var p = this.parts;
    p.torso.position.y = 0.95;
    p.torso.rotation.set(0, 0, 0);
    p.leftLeg.rotation.set(0, 0, 0);
    p.rightLeg.rotation.set(0, 0, 0);
    p.leftKnee.rotation.set(0, 0, 0);
    p.rightKnee.rotation.set(0, 0, 0);
    p.leftArm.rotation.set(0, 0, 0);
    p.rightArm.rotation.set(0, 0, 0);
  };

  PlayerController.prototype.applyOnFootAnimation = function(delta){
    var p = this.parts;
    if (this.speed > 0.5) {
      var walkCycle = this.animTime * (this.speed > 8 ? 12 : 7.5);
      var swing = Math.sin(walkCycle) * 0.65;

      p.leftLeg.rotation.x = swing;
      p.rightLeg.rotation.x = -swing;
      p.leftArm.rotation.x = -swing * 0.8;
      p.rightArm.rotation.x = swing * 0.8;

      p.leftKnee.rotation.x = Math.max(0, -Math.sin(walkCycle)) * 0.8;
      p.rightKnee.rotation.x = Math.max(0, Math.sin(walkCycle)) * 0.8;

      p.torso.position.y = 0.95 + Math.abs(Math.sin(walkCycle)) * 0.06;
    } else {
      this.resetStandPose();
      p.torso.position.y = 0.95 + Math.sin(this.animTime * 2.0) * 0.02; // Breathing
    }
  };

  return {
    createPlayerMesh: createPlayerMesh,
    PlayerController: PlayerController
  };
})();

/* ==================== 3D MULTIPLAYER WITH FRIENDS ==================== */
var JDR = window.JDR || {};

JDR.Multiplayer3D = (function(){
  var channel = null;
  var roomCode = null;
  var localId = 'player_' + Math.floor(Math.random() * 8999 + 1000);
  var remotePlayers = {}; // id -> { data, mesh, controller }
  var isHost = false;
  var onPlayerListChange = null;

  function init(code, isCreating, callback){
    roomCode = code.toUpperCase().trim();
    isHost = isCreating;
    onPlayerListChange = callback;

    try {
      // Real-time peer broadcast channel for browser clients
      channel = new BroadcastChannel('jdr_multiplayer_' + roomCode);
      channel.onmessage = handleNetworkMessage;

      // Announce arrival
      broadcast({
        type: 'player_join',
        id: localId,
        isHost: isHost,
        name: 'Rider #' + localId.slice(-4),
        dinoId: JDR.SaveManager.data.selectedDino || 'trex',
        x: 0, y: 0, z: 0,
        yaw: 0,
        isMounted: true
      });

      console.log('Multiplayer room connected:', roomCode, 'as', localId);
      return true;
    } catch(e) {
      console.warn('BroadcastChannel unavailable:', e);
      return false;
    }
  }

  function broadcast(data){
    if (channel) {
      data.senderId = localId;
      data.timestamp = Date.now();
      channel.postMessage(data);
    }
  }

  function handleNetworkMessage(event){
    var msg = event.data;
    if (!msg || msg.senderId === localId) return;

    if (msg.type === 'player_join') {
      if (!remotePlayers[msg.senderId]) {
        createRemotePlayerAvatar(msg);
      }
      // Reply with our presence so the new player knows about us
      broadcast({
        type: 'player_presence',
        id: localId,
        name: 'Rider #' + localId.slice(-4),
        dinoId: JDR.SaveManager.data.selectedDino || 'trex',
        x: JDR.simEngine ? JDR.simEngine.currentDinoPos.x : 0,
        y: JDR.simEngine ? JDR.simEngine.currentDinoPos.y : 0,
        z: JDR.simEngine ? JDR.simEngine.currentDinoPos.z : 0,
        yaw: JDR.simEngine ? JDR.simEngine.currentDinoYaw : 0,
        isMounted: JDR.simEngine ? JDR.simEngine.playerCtrl.isMounted : true
      });
      notifyChange();
    } else if (msg.type === 'player_presence') {
      if (!remotePlayers[msg.senderId]) {
        createRemotePlayerAvatar(msg);
      }
      notifyChange();
    } else if (msg.type === 'player_sync') {
      updateRemotePlayer(msg);
    } else if (msg.type === 'player_roar') {
      JDR.Audio3D.playRoar(msg.roarType || 'trex');
    } else if (msg.type === 'player_leave') {
      removeRemotePlayer(msg.senderId);
      notifyChange();
    }
  }

  function createRemotePlayerAvatar(data){
    var dinoConf = JDR.DINOS.find(function(d){ return d.id === data.dinoId; }) || JDR.DINOS[0];
    var dinoInstance = JDR.Dino3D.createDinosaurMesh(dinoConf);
    var dinoCtrl = new JDR.Dino3D.DinosaurController(dinoInstance);

    // Create Rider avatar
    var riderInstance = JDR.Player3D.createPlayerMesh();
    dinoInstance.parts.mountNode.add(riderInstance.root);
    riderInstance.root.position.set(0, 0.45, 0);

    // Nametag
    var canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(25, 45, 30, 0.85)';
    ctx.roundRect(10, 10, 236, 44, 16);
    ctx.fill();
    ctx.fillStyle = '#f5e4bd';
    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.name || 'Friend Rider', 128, 40);

    var tagTex = new THREE.CanvasTexture(canvas);
    var tagMat = new THREE.SpriteMaterial({ map: tagTex, depthTest: false });
    var tagSprite = new THREE.Sprite(tagMat);
    tagSprite.scale.set(3.5, 0.9, 1);
    tagSprite.position.set(0, (dinoConf.scale3D || 1.2) * 3.8, 0);
    dinoInstance.root.add(tagSprite);

    if (JDR.simEngine && JDR.simEngine.scene) {
      JDR.simEngine.scene.add(dinoInstance.root);
    }

    remotePlayers[data.senderId] = {
      id: data.senderId,
      name: data.name,
      dinoId: data.dinoId,
      dino: dinoInstance,
      controller: dinoCtrl,
      rider: riderInstance,
      targetPos: new THREE.Vector3(data.x, data.y, data.z),
      targetYaw: data.yaw || 0
    };
  }

  function updateRemotePlayer(msg){
    var p = remotePlayers[msg.senderId];
    if (!p) return;
    p.targetPos.set(msg.x, msg.y, msg.z);
    p.targetYaw = msg.yaw;
    p.speed = msg.speed || 0;
  }

  function removeRemotePlayer(id){
    var p = remotePlayers[id];
    if (p && JDR.simEngine && JDR.simEngine.scene) {
      JDR.simEngine.scene.remove(p.dino.root);
    }
    delete remotePlayers[id];
  }

  function update(delta){
    for (var id in remotePlayers) {
      var p = remotePlayers[id];
      // Smooth interpolation of position and yaw
      p.dino.root.position.lerp(p.targetPos, Math.min(1.0, delta * 12.0));
      p.dino.root.rotation.y += (p.targetYaw - p.dino.root.rotation.y) * Math.min(1.0, delta * 10.0);
      p.controller.update(delta, p.speed || 0, false, false, false, false);
    }
  }

  function syncLocal(pos, yaw, speed, isMounted){
    if (!channel) return;
    broadcast({
      type: 'player_sync',
      x: pos.x, y: pos.y, z: pos.z,
      yaw: yaw,
      speed: speed,
      isMounted: isMounted
    });
  }

  function sendRoar(type){
    broadcast({
      type: 'player_roar',
      roarType: type
    });
  }

  function leave(){
    broadcast({ type: 'player_leave' });
    for (var id in remotePlayers) {
      removeRemotePlayer(id);
    }
    if (channel) {
      channel.close();
      channel = null;
    }
    roomCode = null;
  }

  function notifyChange(){
    if (typeof onPlayerListChange === 'function') {
      var list = [{ id: localId, name: 'You (Host)', isLocal: true }];
      for (var id in remotePlayers) {
        list.push({ id: id, name: remotePlayers[id].name, isLocal: false });
      }
      onPlayerListChange(list);
    }
  }

  return {
    init: init,
    update: update,
    syncLocal: syncLocal,
    sendRoar: sendRoar,
    leave: leave,
    getRoomCode: function(){ return roomCode; },
    getRemotePlayers: function(){ return remotePlayers; }
  };
})();

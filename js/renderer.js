/* ==================== RENDERER: Backgrounds & Dinosaurs ==================== */
var JDR = window.JDR || {};

/* --- Parallax Background --- */
JDR.Background = {
  offsets: [0,0,0,0],
  bgCache: {},

  drawSky: function(ctx, map, w, h){
    var grd = ctx.createLinearGradient(0,0,0,h);
    map.skyGrad.forEach(function(s){ grd.addColorStop(s[1], s[0]); });
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);
  },

  drawLayer: function(ctx, layer, offset, w, h, mapId){
    var y0 = h * layer.y;
    ctx.fillStyle = layer.color;
    var t = layer.type;

    if(t.indexOf('mountain')>=0 || t==='volcano' || t.indexOf('dune')>=0 || t.indexOf('glacier')>=0){
      for(var i=-1;i<6;i++){
        var bx = i*260 - (offset%260);
        var bh = 80 + Math.sin(i*2.3)*40;
        ctx.beginPath();
        ctx.moveTo(bx, y0+bh);
        ctx.lineTo(bx+60, y0);
        ctx.lineTo(bx+130, y0-bh*0.4);
        ctx.lineTo(bx+200, y0+10);
        ctx.lineTo(bx+260, y0+bh);
        ctx.closePath();
        ctx.fill();
      }
      if(t==='volcano'){
        ctx.fillStyle='#ff4400';
        ctx.globalAlpha=0.3+Math.sin(Date.now()/500)*0.15;
        ctx.beginPath();
        ctx.arc(w/2 - (offset%260)*0.08+130, y0-30, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;
      }
    } else if(t.indexOf('tree')>=0 || t.indexOf('swamp_tree')>=0){
      for(var i=-1;i<8;i++){
        var tx = i*180 - (offset%180);
        var th = t==='trees_tall'?120:80;
        // trunk
        ctx.fillStyle = layer.color;
        ctx.fillRect(tx+35, y0-th+40, 12, th);
        // canopy
        ctx.beginPath();
        ctx.arc(tx+41, y0-th+30, 30+Math.sin(i)*10, 0, Math.PI*2);
        ctx.fill();
        if(t==='trees_tall'){
          ctx.beginPath();
          ctx.arc(tx+50, y0-th+10, 22, 0, Math.PI*2);
          ctx.fill();
        }
      }
    } else if(t.indexOf('bush')>=0 || t.indexOf('snowdrift')>=0 || t.indexOf('puddle')>=0){
      for(var i=-1;i<10;i++){
        var bx = i*140 - (offset%140);
        ctx.beginPath();
        ctx.ellipse(bx+70, y0+10, 40+Math.sin(i)*15, 18+Math.cos(i)*6, 0, 0, Math.PI*2);
        ctx.fill();
      }
    } else if(t.indexOf('rock')>=0 || t.indexOf('ruins')>=0 || t.indexOf('ice_pillar')>=0 || t.indexOf('pillar')>=0){
      for(var i=-1;i<6;i++){
        var rx = i*220 - (offset%220);
        var rh = 40 + Math.sin(i*1.7)*20;
        ctx.fillRect(rx+20, y0-rh+20, 30+i%2*15, rh);
        ctx.fillRect(rx+70, y0-rh*0.6+20, 25, rh*0.6);
      }
    } else if(t.indexOf('mushroom')>=0 || t.indexOf('vine')>=0){
      for(var i=-1;i<8;i++){
        var mx = i*160 - (offset%160);
        ctx.fillRect(mx+30, y0-30, 8, 35);
        ctx.beginPath();
        ctx.ellipse(mx+34, y0-32, 20+i%3*5, 12, 0, 0, Math.PI*2);
        ctx.fill();
        if(t.indexOf('glow')>=0){
          ctx.fillStyle='rgba(120,255,120,0.15)';
          ctx.beginPath();
          ctx.arc(mx+34, y0-32, 28, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle=layer.color;
        }
      }
    } else if(t==='bones'){
      for(var i=-1;i<5;i++){
        var bx=i*280-(offset%280);
        ctx.fillStyle=layer.color;
        ctx.fillRect(bx+20,y0,60,8);
        ctx.fillRect(bx+30,y0-15,8,20);
        ctx.fillRect(bx+60,y0-12,8,16);
        ctx.beginPath();ctx.arc(bx+34,y0-18,8,0,Math.PI*2);ctx.fill();
      }
    } else if(t==='embers' || t==='lava_rocks'){
      ctx.fillStyle=layer.color;
      for(var i=0;i<12;i++){
        var ex=((i*107+offset*0.5)%w);
        var ey=y0+Math.sin(i*2.1+Date.now()/600)*15;
        ctx.globalAlpha=0.4+Math.sin(i+Date.now()/300)*0.3;
        ctx.beginPath();ctx.arc(ex,ey,3+i%3,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  },

  drawGround: function(ctx, map, w, h, gy){
    var grd = ctx.createLinearGradient(0,gy,0,h);
    grd.addColorStop(0, map.groundColor);
    grd.addColorStop(1, map.groundAccent);
    ctx.fillStyle = grd;
    ctx.fillRect(0, gy, w, h-gy);
    // ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,gy);
    ctx.lineTo(w,gy);
    ctx.stroke();
  },

  draw: function(ctx, map, w, h, speed){
    var self = this;
    // Calculate gy relative to the current height (to support both fullscreen and thumbnails)
    var gy = h - Math.min(100, h * 0.15);
    
    if (map.bgImage) {
      if (!this.bgCache[map.bgImage]) {
        var img = new Image();
        img.src = map.bgImage;
        img.loaded = false;
        img.onload = function() { img.loaded = true; };
        this.bgCache[map.bgImage] = img;
      }
      
      var bgImg = this.bgCache[map.bgImage];
      if (bgImg.loaded) {
        // Scale image to cover the screen while maintaining aspect ratio
        var scale = Math.max(w / bgImg.width, h / bgImg.height);
        var dw = bgImg.width * scale;
        var dh = bgImg.height * scale;
        
        // Align to bottom so dinosaurs in the background are visible
        var dy = h - dh;
        
        // Parallax scrolling
        this.offsets[0] = (this.offsets[0] || 0) + speed * 0.15;
        var offset = this.offsets[0] % dw;
        
        ctx.drawImage(bgImg, -offset, dy, dw, dh);
        // Draw second copy for seamless looping
        ctx.drawImage(bgImg, dw - offset, dy, dw, dh);
      } else {
        this.drawSky(ctx, map, w, h);
      }
    } else {
      this.drawSky(ctx, map, w, h);
      map.layers.forEach(function(layer, i){
        self.offsets[i] = (self.offsets[i] || 0) + speed * layer.speed;
        self.drawLayer(ctx, layer, self.offsets[i], w, h, map.id);
      });
    }

    // ambient fog
    if(map.fogDensity > 0){
      ctx.fillStyle = map.fogColor;
      for(var i=0;i<3;i++){
        var fx = Math.sin(Date.now()/3000+i*2)*w*0.3 + w*0.5;
        ctx.globalAlpha = map.fogDensity * 0.15;
        ctx.beginPath();
        ctx.ellipse(fx, gy*0.6+i*30, 200+i*50, 60, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    
    // ground is always drawn on top of background
    this.drawGround(ctx, map, w, h, gy);
  },

  reset: function(){ this.offsets = [0,0,0,0]; }
};

/* --- Dinosaur Renderer --- */
JDR.DinoRenderer = {
  draw: function(ctx, dino, x, y, frame, state, flip){
    ctx.save();
    ctx.translate(x, y);
    if(flip) { ctx.scale(-1,1); ctx.translate(-dino.w,0); }
    var d = dino;
    var legPhase = frame * 0.25;
    var isDuck = state === 'duck';
    var isJump = state === 'jump';
    var isHurt = state === 'hurt';
    var bodyY = isDuck ? 12 : 0;
    var bodyH = isDuck ? d.body.h * 0.65 : d.body.h;
    
    // Breathing animation
    var breath = Math.sin(frame * 0.1) * 1.5;
    bodyY += breath;

    if(isHurt && Math.floor(frame/3)%2===0){ ctx.globalAlpha=0.5; }

    // --- 0. Ground Shadow ---
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(d.body.w*0.5, bodyY+bodyH+d.legLen-5, d.body.w*0.6, 5, 0, 0, Math.PI*2);
    ctx.fill();

    // --- 1. Legs (Back-side) ---
    this.drawLegs(ctx, d, bodyY, bodyH, legPhase, isJump, isDuck, true);

    // --- 2. Tail ---
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.moveTo(0, bodyY + bodyH*0.4);
    var tailWag = Math.sin(frame*0.15)*6;
    ctx.quadraticCurveTo(-d.tail*0.6, bodyY+bodyH*0.2+tailWag, -d.tail, bodyY+tailWag*0.5);
    ctx.quadraticCurveTo(-d.tail*0.7, bodyY+bodyH*0.7, 0, bodyY+bodyH*0.6);
    ctx.fill();
    
    // Tail Detail
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if(d.clubTail){
      ctx.fillStyle = d.accent;
      ctx.beginPath();
      ctx.arc(-d.tail, bodyY+tailWag*0.5, 9, 0, Math.PI*2);
      ctx.fill();
      // add some spikes to club
      ctx.fillStyle = '#444';
      for(var i=0; i<4; i++){
        ctx.beginPath();
        ctx.arc(-d.tail + Math.cos(i)*6, bodyY+tailWag*0.5 + Math.sin(i)*6, 2, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // --- 3. Body ---
    // Main Body Shading
    var grd = ctx.createLinearGradient(0, bodyY, 0, bodyY+bodyH);
    grd.addColorStop(0, d.color);
    grd.addColorStop(1, d.accent);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(d.body.w*0.5, bodyY+bodyH*0.5, d.body.w*0.5, bodyH*0.5, 0, 0, Math.PI*2);
    ctx.fill();

    // Muscle Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(d.body.w*0.4, bodyY+bodyH*0.4, d.body.w*0.25, bodyH*0.2, -0.3, 0, Math.PI*2);
    ctx.fill();
    
    // Rim Light
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(d.body.w*0.5, bodyY+bodyH*0.5, d.body.w*0.48, bodyH*0.48, 0, -Math.PI, 0);
    ctx.stroke();

    // Skin Patterns
    this.drawSkin(ctx, d, bodyY, bodyH);

    // Belly
    var bGrd = ctx.createLinearGradient(0, bodyY+bodyH*0.5, 0, bodyY+bodyH*0.9);
    bGrd.addColorStop(0, d.belly);
    bGrd.addColorStop(1, d.accent);
    ctx.fillStyle = bGrd;
    ctx.beginPath();
    ctx.ellipse(d.body.w*0.45, bodyY+bodyH*0.7, d.body.w*0.35, bodyH*0.25, 0, 0, Math.PI*2);
    ctx.fill();

    // --- 4. Special Features (Plates, Sail, Armor) ---
    if(d.plates && !isDuck){
      ctx.fillStyle = d.accent;
      for(var i=0;i<6;i++){
        var px = 5+i*(d.body.w/6);
        var ps = 10+Math.sin(i*1.5)*3;
        ctx.beginPath();
        ctx.moveTo(px, bodyY-ps);
        ctx.lineTo(px+ps*0.6, bodyY+4);
        ctx.lineTo(px-ps*0.6, bodyY+4);
        ctx.fill();
      }
    }
    if(d.sail && !isDuck){
      var sGrd = ctx.createLinearGradient(0, bodyY-30, 0, bodyY);
      sGrd.addColorStop(0, '#ff4400');
      sGrd.addColorStop(1, d.accent);
      ctx.fillStyle = sGrd;
      ctx.globalAlpha=0.85;
      ctx.beginPath();
      ctx.moveTo(5, bodyY+2);
      ctx.quadraticCurveTo(d.body.w*0.45, bodyY-32, d.body.w*0.85, bodyY+2);
      ctx.fill();
      ctx.globalAlpha=1;
    }
    if(d.armor){
      ctx.fillStyle = d.accent;
      for(var i=0;i<5;i++){
        for(var j=0;j<3;j++){
          ctx.beginPath();
          ctx.arc(8+i*10, bodyY+bodyH*0.2+j*6, 3, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    // --- 5. Neck + Head ---
    var neckLen = d.longNeck ? 35 : 12;
    var headX = d.body.w + neckLen - 8;
    var headY = bodyY - (isDuck?0:8) + (d.longNeck?-25:0);

    if(d.longNeck && !isDuck){
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(d.body.w-10, bodyY+8);
      ctx.quadraticCurveTo(d.body.w+5, bodyY-15, headX-5, headY+d.head.h*0.5);
      ctx.lineTo(d.body.w-5, bodyY+18);
      ctx.fill();
    } else if(!d.longNeck) {
      // Normal neck
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(d.body.w-5, bodyY+5);
      ctx.lineTo(headX, headY+5);
      ctx.lineTo(d.body.w-5, bodyY+bodyH*0.5);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(headX, headY+d.head.h*0.4, d.head.w*0.55, d.head.h*0.5, 0, 0, Math.PI*2);
    ctx.fill();

    // Jaw
    ctx.fillStyle = d.accent;
    var jawOpen = (state==='duck'||isHurt) ? 6 : Math.abs(Math.sin(frame*0.15)*4);
    ctx.beginPath();
    ctx.moveTo(headX-d.head.w*0.2, headY+d.head.h*0.6);
    ctx.lineTo(headX+d.head.jaw, headY+d.head.h*0.6+jawOpen);
    ctx.lineTo(headX, headY+d.head.h*0.8+jawOpen);
    ctx.fill();

    // Eye + Blinking
    var isBlink = Math.floor(frame/120)%10 === 0 && (frame%10 < 3);
    if(isBlink){
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headX+2, headY+d.head.h*0.3);
      ctx.lineTo(headX+8, headY+d.head.h*0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(headX+4, headY+d.head.h*0.3, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = isHurt?'#ff0000':'#000';
      ctx.beginPath();
      ctx.arc(headX+5.5, headY+d.head.h*0.3, 2, 0, Math.PI*2);
      ctx.fill();
    }

    // Triceratops Features
    if(d.frill && !isDuck){
      ctx.fillStyle = d.accent;
      ctx.beginPath();
      ctx.ellipse(headX-d.head.w*0.4, headY+d.head.h*0.2, d.head.w*0.6, d.head.h*0.8, -0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#444'; ctx.lineWidth=1; ctx.stroke();
    }
    if(d.horns){
      ctx.fillStyle = '#eee';
      // Top horns
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(headX+15, headY-12);
      ctx.lineTo(headX+5, headY+5);
      ctx.fill();
      // Nose horn
      ctx.beginPath();
      ctx.moveTo(headX+d.head.w*0.4, headY+d.head.h*0.5);
      ctx.lineTo(headX+d.head.w*0.6, headY+d.head.h*0.1);
      ctx.lineTo(headX+d.head.w*0.6, headY+d.head.h*0.6);
      ctx.fill();
    }

    // Velociraptor Feathers
    if(d.feathers && !isDuck){
      ctx.fillStyle = d.accent;
      for(var i=0;i<4;i++){
        ctx.beginPath();
        ctx.moveTo(2, bodyY+5+i*4);
        ctx.lineTo(-15, bodyY-8+i*2);
        ctx.lineTo(-2, bodyY+12+i*4);
        ctx.fill();
      }
    }

    // --- 6. Arms ---
    if(d.armLen > 5 && !isDuck){
      ctx.fillStyle = d.color;
      var armSwing = Math.sin(frame*0.2)*4;
      ctx.beginPath();
      ctx.roundRect(d.body.w*0.6, bodyY+bodyH*0.4, 6, d.armLen+armSwing, 3);
      ctx.fill();
      ctx.fillStyle = '#000'; // claws
      ctx.fillRect(d.body.w*0.6+1, bodyY+bodyH*0.4+d.armLen+armSwing, 4, 3);
    }

    // --- 7. Legs (Front-side) ---
    this.drawLegs(ctx, d, bodyY, bodyH, legPhase, isJump, isDuck, false);

    ctx.restore();
  },

  drawLegs: function(ctx, d, bodyY, bodyH, phase, isJump, isDuck, isBackLayer){
    var legX1 = d.body.w*0.25, legX2 = d.body.w*0.75;
    var legLen = isDuck ? d.legLen*0.5 : d.legLen;
    var color = isBackLayer ? d.accent : d.color;
    ctx.fillStyle = color;
    
    var phases = isBackLayer ? [phase+Math.PI, phase+Math.PI*1.5] : [phase, phase+Math.PI*0.5];
    
    if(d.quad){
      // Quadrupedal (4 legs)
      this.drawSingleLeg(ctx, legX1, bodyY+bodyH-5, legLen, phases[0], isJump, color, d.legW);
      this.drawSingleLeg(ctx, legX2, bodyY+bodyH-5, legLen, phases[1], isJump, color, d.legW);
    } else {
      // Bipedal (2 legs)
      // Front side layer gets the front-most leg
      if(!isBackLayer) this.drawSingleLeg(ctx, legX1+10, bodyY+bodyH-5, legLen, phases[0], isJump, color, d.legW);
      // Back side layer gets the back-most leg
      else this.drawSingleLeg(ctx, legX1+10, bodyY+bodyH-5, legLen, phases[1], isJump, color, d.legW);
    }
  },

  drawSingleLeg: function(ctx, x, y, len, phase, isJump, color, legW){
    ctx.save();
    ctx.translate(x, y);
    var thighAng = isJump ? 0.8 : Math.sin(phase)*0.4;
    var kneeAng = isJump ? -1.2 : Math.sin(phase + 1)*0.6 - 0.5;
    
    ctx.rotate(thighAng);
    // Thigh
    ctx.fillRect(-legW*0.5, 0, legW, len*0.6);
    
    ctx.translate(0, len*0.6);
    ctx.rotate(kneeAng);
    // Shin
    ctx.fillRect(-legW*0.4, 0, legW*0.8, len*0.5);
    
    ctx.translate(0, len*0.5);
    // Foot
    ctx.fillRect(-legW*0.4, 0, legW*1.4, 5);
    
    ctx.restore();
  },

  drawSkin: function(ctx, d, bodyY, bodyH){
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    if(d.skin === 'spots'){
      for(var i=0; i<8; i++){
        ctx.beginPath();
        ctx.arc(d.body.w*(0.2+i*0.1), bodyY+bodyH*(0.3+Math.sin(i)*0.2), 3, 0, Math.PI*2);
        ctx.fill();
      }
    } else if(d.skin === 'stripes'){
      for(var i=0; i<6; i++){
        ctx.fillRect(d.body.w*(0.2+i*0.12), bodyY+5, 3, bodyH*0.4);
      }
    } else if(d.skin === 'scales' || d.skin === 'bumpy'){
      for(var i=0; i<12; i++){
        ctx.fillRect(d.body.w*Math.random(), bodyY+bodyH*Math.random(), 3, 3);
      }
    }
    ctx.restore();
  }
};

/* --- Particle System --- */
JDR.Particles = {
  list: [],
  maxParticles: 200,

  emit: function(x,y,count,opts){
    for(var i=0;i<count;i++){
      if(this.list.length >= this.maxParticles) break;
      this.list.push({
        x: x + (Math.random()-0.5)*(opts.spread||10),
        y: y + (Math.random()-0.5)*(opts.spread||10),
        vx: (opts.vx||0) + (Math.random()-0.5)*(opts.vxRand||2),
        vy: (opts.vy||-1) + (Math.random()-0.5)*(opts.vyRand||2),
        life: opts.life || 60,
        maxLife: opts.life || 60,
        size: opts.size || 3,
        color: opts.color || '#fff',
        gravity: opts.gravity || 0.02,
        alpha: 1,
        shape: opts.shape || 'circle'
      });
    }
  },

  emitDust: function(x, y, color){
    this.emit(x, y, 2, { vx:-2, vy:-0.5, vxRand:1, vyRand:1, life:25, size:2.5, color:color||'#aa9977', gravity:0.03 });
  },

  emitCoinCollect: function(x, y){
    this.emit(x, y, 8, { vx:0, vy:-2, vxRand:4, vyRand:3, life:30, size:3, color:'#ffd700', gravity:-0.01 });
  },

  emitHit: function(x, y){
    this.emit(x, y, 15, { vx:0, vy:-1, vxRand:6, vyRand:4, life:40, size:4, color:'#ff4444', gravity:0.05 });
  },

  emitWeather: function(map, w, h){
    var t = map.particleType;
    if(!t || t==='none') return;
    var c = map.particleColor;
    if(t==='leaves'){ this.emit(w+10, Math.random()*h*0.7, 1, { vx:-3, vy:0.5, vxRand:1, vyRand:1, life:120, size:3, color:c, gravity:0.01 }); }
    else if(t==='ash'){ this.emit(Math.random()*w, -5, 1, { vx:-0.5, vy:1, vxRand:1, vyRand:0.5, life:150, size:2, color:c, gravity:0.005 }); }
    else if(t==='sand'){ this.emit(w+10, h*0.5+Math.random()*h*0.3, 1, { vx:-5, vy:0, vxRand:2, vyRand:1, life:80, size:2, color:c, gravity:0.01 }); }
    else if(t==='snow'){ this.emit(Math.random()*w, -5, 1, { vx:-0.5, vy:1, vxRand:1, vyRand:0.5, life:200, size:2.5, color:c, gravity:0 }); }
    else if(t==='spores'){ this.emit(Math.random()*w, h*0.7, 1, { vx:0, vy:-0.5, vxRand:0.5, vyRand:0.3, life:180, size:2, color:c, gravity:-0.005 }); }
  },

  update: function(){
    for(var i=this.list.length-1;i>=0;i--){
      var p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if(p.life<=0) this.list.splice(i,1);
    }
  },

  draw: function(ctx){
    for(var i=0;i<this.list.length;i++){
      var p = this.list[i];
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  clear: function(){ this.list = []; },

  setMax: function(quality){
    this.maxParticles = quality==='high'?300 : quality==='medium'?150 : quality==='low'?50 : 0;
  }
};

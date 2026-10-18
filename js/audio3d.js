/* ==================== 3D PREHISTORIC AUDIO SYSTEM ==================== */
var JDR = window.JDR || {};

JDR.Audio3D = (function(){
  var ctx = null;
  var masterGain = null;
  var sfxGain = null;
  var ambientGain = null;
  var musicGain = null;
  var initialized = false;
  var ambientSource = null;
  var footstepThrottle = 0;

  function init(){
    if (initialized) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      ctx = new AudioContextClass();
      
      masterGain = ctx.createGain();
      sfxGain = ctx.createGain();
      ambientGain = ctx.createGain();
      musicGain = ctx.createGain();

      sfxGain.connect(masterGain);
      ambientGain.connect(masterGain);
      musicGain.connect(masterGain);
      masterGain.connect(ctx.destination);

      masterGain.gain.value = 0.9;
      sfxGain.gain.value = 0.85;
      ambientGain.gain.value = 0.45;
      musicGain.gain.value = 0.6;

      initialized = true;
    } catch(e) {
      console.warn('Audio3D WebAudio unavailable:', e);
    }
  }

  function resume(){
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setVolumes(sfx, music){
    if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, sfx / 100));
    if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, music / 100));
    if (ambientGain) ambientGain.gain.value = Math.max(0, Math.min(0.8, (music / 100) * 0.7));
  }

  // Synthesize rich noise buffer
  function createNoiseBuffer(duration){
    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var output = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Massive dinosaur footstep
  function playFootstep(mass, isRunning, inWater){
    if (!initialized) init();
    resume();
    var now = Date.now();
    if (now - footstepThrottle < (isRunning ? 180 : 320)) return;
    footstepThrottle = now;

    var t = ctx.currentTime;
    var weightFactor = Math.min(2.5, Math.max(0.6, (mass || 2000) / 3000));

    if (inWater) {
      // Water splash thud
      var splash = ctx.createBufferSource();
      splash.buffer = createNoiseBuffer(0.25);
      var splashFilter = ctx.createBiquadFilter();
      splashFilter.type = 'lowpass';
      splashFilter.frequency.setValueAtTime(1400, t);
      splashFilter.frequency.exponentialRampToValueAtTime(300, t + 0.25);
      var splashGain = ctx.createGain();
      splashGain.gain.setValueAtTime(0.35, t);
      splashGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(sfxGain);
      splash.start(t);
      return;
    }

    // Low rumble oscillator (sub-bass ground shake)
    var osc = ctx.createOscillator();
    var oscGain = ctx.createGain();
    osc.type = 'sine';
    var baseFreq = 85 / weightFactor;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.18);

    oscGain.gain.setValueAtTime(0.45 * Math.min(1.2, weightFactor), t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);

    // Gravel/dirt impact crunch
    var noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.14);
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450 / weightFactor, t);
    filter.Q.value = 1.2;

    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25 * weightFactor, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    noise.start(t);
  }

  // Prehistoric Dinosaur Roar with formant modulation
  function playRoar(type){
    if (!initialized) init();
    resume();
    var t = ctx.currentTime;

    var duration = 1.2;
    var baseFreq = 160;
    var endFreq = 65;

    if (type === 'trex') {
      duration = 1.5; baseFreq = 140; endFreq = 45;
    } else if (type === 'raptor' || type === 'coelo') {
      duration = 0.8; baseFreq = 420; endFreq = 220;
    } else if (type === 'ptera') {
      duration = 0.9; baseFreq = 540; endFreq = 340;
    } else if (type === 'diplo') {
      duration = 1.8; baseFreq = 95; endFreq = 40;
    } else if (type === 'trice' || type === 'stego' || type === 'ankylo') {
      duration = 1.1; baseFreq = 120; endFreq = 60;
    }

    // Modulated sawtooth oscillator for vocal fold rasp
    var osc1 = ctx.createOscillator();
    var osc2 = ctx.createOscillator();
    var roarGain = ctx.createGain();
    var filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(baseFreq, t);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 1.35, t + duration * 0.25);
    osc1.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    osc2.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.8, t + duration * 0.25);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.2, t + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.linearRampToValueAtTime(1400, t + duration * 0.3);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);
    filter.Q.value = 2.5;

    roarGain.gain.setValueAtTime(0.01, t);
    roarGain.gain.linearRampToValueAtTime(0.55, t + duration * 0.15);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(roarGain);
    roarGain.connect(sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);

    // Breath / air hiss accompanying roar
    var hiss = ctx.createBufferSource();
    hiss.buffer = createNoiseBuffer(duration);
    var hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.setValueAtTime(900, t);
    var hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.05, t);
    hissGain.gain.linearRampToValueAtTime(0.2, t + duration * 0.2);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(sfxGain);
    hiss.start(t);
  }

  // Mount dinosaur saddle sound
  function playMount(){
    if (!initialized) init();
    resume();
    var t = ctx.currentTime;
    // Leather stretch + metallic stirrup buckle
    var noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(0.25);
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    noise.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    noise.start(t);

    // Chime
    var osc = ctx.createOscillator();
    var og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
    og.gain.setValueAtTime(0.15, t);
    og.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(og);
    og.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Dismount sound
  function playDismount(){
    if (!initialized) init();
    resume();
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.18);
    og.gain.setValueAtTime(0.15, t);
    og.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(og);
    og.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Amber gemstone pickup
  function playAmberCollect(){
    if (!initialized) init();
    resume();
    var t = ctx.currentTime;
    [659, 880, 1046, 1318].forEach(function(freq, index){
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.12, t + index * 0.045);
      g.gain.exponentialRampToValueAtTime(0.001, t + index * 0.045 + 0.25);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(t + index * 0.045);
      osc.stop(t + index * 0.045 + 0.26);
    });
  }

  // Soft Claymorphism UI click
  function playClayClick(){
    if (!initialized) init();
    resume();
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.06);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Ambient soundscapes for 3D biomes
  function setBiomeAmbience(biomeType){
    if (!initialized) init();
    resume();
    if (ambientSource) {
      try { ambientSource.stop(); } catch(e){}
      ambientSource = null;
    }

    var dur = 4.0;
    var buf = createNoiseBuffer(dur);
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buf;
    ambientSource.loop = true;

    var filter = ctx.createBiquadFilter();
    if (biomeType === 'volcano') {
      filter.type = 'lowpass';
      filter.frequency.value = 180; // deep subterranean lava rumble
      ambientGain.gain.value = 0.5;
    } else if (biomeType === 'ice') {
      filter.type = 'bandpass';
      filter.frequency.value = 850; // howling wind
      ambientGain.gain.value = 0.35;
    } else if (biomeType === 'desert') {
      filter.type = 'bandpass';
      filter.frequency.value = 520; // sandy gust
      ambientGain.gain.value = 0.3;
    } else if (biomeType === 'swamp') {
      filter.type = 'lowpass';
      filter.frequency.value = 320; // bubbling murky swamp
      ambientGain.gain.value = 0.4;
    } else {
      // Jungle canopy wind
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      ambientGain.gain.value = 0.35;
    }

    ambientSource.connect(filter);
    filter.connect(ambientGain);
    ambientSource.start();
  }

  return {
    init: init,
    resume: resume,
    setVolumes: setVolumes,
    playFootstep: playFootstep,
    playRoar: playRoar,
    playMount: playMount,
    playDismount: playDismount,
    playAmberCollect: playAmberCollect,
    playClayClick: playClayClick,
    setBiomeAmbience: setBiomeAmbience
  };
})();

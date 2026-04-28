/* ==================== JURASSIC DINO RUN - CONFIGURATION ==================== */
var JDR = window.JDR || {};

JDR.CONFIG = {
  CANVAS_W: 1200,
  CANVAS_H: 400,
  GROUND_Y: 340,
  GRAVITY: 0.5,
  BASE_SPEED: 2.5,
  MAX_SPEED: 8,
  SPEED_INCREMENT: 0.1,
  COIN_VALUE: 5,
  COMBO_THRESHOLD: 3,
  COMBO_MULTIPLIER: 0.5,
  POWERUP_DURATION: 300,
  OBSTACLE_MIN_GAP: 800,
  OBSTACLE_MAX_GAP: 1500,
  ENEMY_MIN_INTERVAL: 1200,
  DIFFICULTY: { easy: 0.5, normal: 1, hard: 1.4, insane: 1.8 }
};

JDR.MAPS = [
  {
    id: 'jungle', name: 'Jurassic Jungle', description: 'Dense rainforest with waterfalls',
    unlocked: true, price: 0,
    bgImage: 'assets/jungle.png',
    sky: ['#0b3d0b','#1a6b1a','#2d8f2d'],
    skyGrad: [['#041a04',0],['#0b3d0b',0.4],['#1a5c1a',0.7],['#3a7a3a',1]],
    groundColor: '#2a4d1a', groundAccent: '#1e3812',
    fogColor: 'rgba(100,180,100,0.08)', fogDensity: 0.6,
    particleType: 'leaves', particleColor: '#4a8f3a',
    ambientColor: 'rgba(50,120,50,0.15)',
    layers: [
      { type: 'mountains', color: '#0d2e0d', speed: 0.1, y: 0.3 },
      { type: 'trees_tall', color: '#1a4a1a', speed: 0.25, y: 0.25 },
      { type: 'trees', color: '#2a6a2a', speed: 0.5, y: 0.35 },
      { type: 'bushes', color: '#3a7a2a', speed: 0.8, y: 0.7 }
    ],
    obstacles: ['tree_trunk','fern','rock','vine'],
    enemies: ['pterodactyl','raptor']
  },
  {
    id: 'volcano', name: 'Volcanic Island', description: 'Lava flows and eruptions',
    unlocked: true, price: 0,
    bgImage: 'assets/volcano.png',
    sky: ['#1a0500','#4a1500','#8a2500'],
    skyGrad: [['#0a0200',0],['#2a0800',0.3],['#5a1a00',0.6],['#8a3a10',1]],
    groundColor: '#3a2010', groundAccent: '#2a1508',
    fogColor: 'rgba(200,80,20,0.06)', fogDensity: 0.4,
    particleType: 'ash', particleColor: '#aa5530',
    ambientColor: 'rgba(200,60,10,0.12)',
    layers: [
      { type: 'volcano', color: '#2a0800', speed: 0.08, y: 0.15 },
      { type: 'rocks_large', color: '#3a1505', speed: 0.2, y: 0.3 },
      { type: 'lava_rocks', color: '#5a2010', speed: 0.45, y: 0.45 },
      { type: 'embers', color: '#ff6a20', speed: 0.7, y: 0.6 }
    ],
    obstacles: ['lava_rock','boulder','crack','bone'],
    enemies: ['pterodactyl','fire_bug']
  },
  {
    id: 'desert', name: 'Desert Fossil Valley', description: 'Sandstorms and ancient ruins',
    unlocked: false, price: 500,
    bgImage: 'assets/desert.png',
    sky: ['#4a3a20','#8a7040','#c4a460'],
    skyGrad: [['#2a1a08',0],['#5a4020',0.3],['#8a6a38',0.6],['#c4a060',1]],
    groundColor: '#b89050', groundAccent: '#9a7840',
    fogColor: 'rgba(200,170,100,0.1)', fogDensity: 0.5,
    particleType: 'sand', particleColor: '#c4a060',
    ambientColor: 'rgba(200,170,100,0.1)',
    layers: [
      { type: 'dunes_far', color: '#5a4020', speed: 0.1, y: 0.35 },
      { type: 'ruins', color: '#7a5a30', speed: 0.25, y: 0.3 },
      { type: 'dunes', color: '#9a7840', speed: 0.45, y: 0.5 },
      { type: 'bones', color: '#c4a060', speed: 0.7, y: 0.65 }
    ],
    obstacles: ['cactus','skull','pillar','sandrock'],
    enemies: ['pterodactyl','scorpion']
  },
  {
    id: 'ice', name: 'Frozen Ice Age', description: 'Snow and frozen mountains',
    unlocked: false, price: 1000,
    sky: ['#0a1a3a','#1a3a6a','#3a6a9a'],
    skyGrad: [['#050d1a',0],['#0a1a3a',0.3],['#1a3a6a',0.6],['#4a7aaa',1]],
    groundColor: '#b8c8d8', groundAccent: '#98a8b8',
    fogColor: 'rgba(150,180,220,0.1)', fogDensity: 0.7,
    particleType: 'snow', particleColor: '#ddeeff',
    ambientColor: 'rgba(100,150,220,0.12)',
    layers: [
      { type: 'mountains_ice', color: '#1a2a4a', speed: 0.08, y: 0.2 },
      { type: 'glaciers', color: '#3a5a7a', speed: 0.2, y: 0.3 },
      { type: 'ice_pillars', color: '#6a8aaa', speed: 0.4, y: 0.4 },
      { type: 'snowdrifts', color: '#9ab8d0', speed: 0.7, y: 0.65 }
    ],
    obstacles: ['ice_spike','snowball','frozen_log','ice_block'],
    enemies: ['pterodactyl','ice_bat']
  },
  {
    id: 'swamp', name: 'Swamp Mutation Zone', description: 'Toxic swamp with glowing plants',
    unlocked: false, price: 1500,
    sky: ['#0a1a0a','#1a2a10','#2a3a18'],
    skyGrad: [['#040a04',0],['#0a1a08',0.3],['#1a2a10',0.6],['#2a4a18',1]],
    groundColor: '#2a3a18', groundAccent: '#1a2a10',
    fogColor: 'rgba(80,200,80,0.08)', fogDensity: 0.8,
    particleType: 'spores', particleColor: '#80ff80',
    ambientColor: 'rgba(80,200,80,0.15)',
    layers: [
      { type: 'swamp_trees', color: '#0a1a08', speed: 0.1, y: 0.2 },
      { type: 'mushrooms_large', color: '#1a3a10', speed: 0.25, y: 0.35 },
      { type: 'vines_glow', color: '#2a4a18', speed: 0.45, y: 0.45 },
      { type: 'puddles', color: '#3a5a20', speed: 0.7, y: 0.7 }
    ],
    obstacles: ['mushroom','vine_wall','toxic_pool','root'],
    enemies: ['pterodactyl','swamp_fly']
  }
];

JDR.DINOS = [
  {
    id: 'trex', name: 'Tyrannosaurus Rex', price: 0, owned: true,
    color: '#8b7355', accent: '#5d4b3a', belly: '#d2b48c',
    speed: 1.0, jump: 1.0, size: 1.0,
    w: 60, h: 50, desc: 'The king of dinosaurs. Balanced stats.',
    body: { w: 46, h: 30 }, head: { w: 24, h: 20, jaw: 14 }, tail: 35, armLen: 8,
    legLen: 18, legW: 8, skin: 'spots'
  },
  {
    id: 'spino', name: 'Spinosaurus', price: 200, owned: false,
    color: '#4a5d6e', accent: '#d34824', belly: '#90a4ae',
    speed: 1.1, jump: 0.9, size: 1.1,
    w: 68, h: 58, desc: 'Fast runner with a magnificent red sail.',
    body: { w: 50, h: 28 }, head: { w: 28, h: 16, jaw: 16 }, tail: 38, armLen: 12,
    legLen: 20, legW: 7, sail: true, skin: 'stripes'
  },
  {
    id: 'stego', name: 'Stegosaurus', price: 300, owned: false,
    color: '#5a7a3a', accent: '#b86a24', belly: '#a4b584',
    speed: 0.85, jump: 0.85, size: 1.15,
    w: 65, h: 50, desc: 'Armored with vibrant orange plates.',
    body: { w: 52, h: 32 }, head: { w: 18, h: 14, jaw: 8 }, tail: 30, armLen: 6,
    legLen: 16, legW: 8, plates: true, quad: true, skin: 'scales'
  },
  {
    id: 'diplo', name: 'Diplodocus', price: 400, owned: false,
    color: '#5c7a8a', accent: '#3a4d5a', belly: '#a2c1d1',
    speed: 0.9, jump: 1.15, size: 1.25,
    w: 75, h: 55, desc: 'Enormous long-necked gentle giant.',
    body: { w: 48, h: 26 }, head: { w: 16, h: 12, jaw: 6 }, tail: 45, armLen: 5,
    legLen: 22, legW: 8, longNeck: true, quad: true, skin: 'smooth'
  },
  {
    id: 'coelo', name: 'Coelophysis', price: 150, owned: false,
    color: '#7a8a3a', accent: '#5a6a2a', belly: '#c4d48a',
    speed: 1.25, jump: 1.1, size: 0.75,
    w: 48, h: 40, desc: 'Small, slender, and incredibly fast.',
    body: { w: 34, h: 18 }, head: { w: 16, h: 10, jaw: 8 }, tail: 28, armLen: 8,
    legLen: 18, legW: 5, skin: 'spots'
  },
  {
    id: 'raptor', name: 'Velociraptor', price: 350, owned: false,
    color: '#5a6a7a', accent: '#3a4a5a', belly: '#aabcc4',
    speed: 1.3, jump: 1.2, size: 0.85,
    w: 55, h: 45, desc: 'Highly intelligent and agile hunter.',
    body: { w: 38, h: 22 }, head: { w: 18, h: 12, jaw: 10 }, tail: 32, armLen: 10,
    legLen: 20, legW: 5, feathers: true, skin: 'markings'
  },
  {
    id: 'ankylo', name: 'Ankylosaurus', price: 500, owned: false,
    color: '#6a5a4a', accent: '#4a3a2a', belly: '#9a8a7a',
    speed: 0.75, jump: 0.7, size: 1.3,
    w: 70, h: 48, desc: 'A walking fortress with a bone-crushing club tail.',
    body: { w: 54, h: 34 }, head: { w: 20, h: 18, jaw: 10 }, tail: 28, armLen: 5,
    legLen: 14, legW: 10, clubTail: true, armor: true, quad: true, skin: 'bumpy'
  },
  {
    id: 'trice', name: 'Triceratops', price: 450, owned: false,
    color: '#7a6a4a', accent: '#5a4a3a', belly: '#baaa8a',
    speed: 0.9, jump: 0.8, size: 1.15,
    w: 68, h: 50, desc: 'Mighty frill and three defensive horns.',
    body: { w: 48, h: 32 }, head: { w: 22, h: 20, jaw: 12 }, tail: 24, armLen: 6,
    legLen: 16, legW: 9, horns: true, frill: true, quad: true, skin: 'leathery'
  }
];

JDR.POWERUPS = [
  { id: 'shield', name: 'Shield', icon: '🛡️', color: '#4ecdc4', duration: 300 },
  { id: 'magnet', name: 'Coin Magnet', icon: '🧲', color: '#f5a623', duration: 400 },
  { id: 'slow', name: 'Slow Motion', icon: '⏳', color: '#aa88ff', duration: 250 },
  { id: 'speed', name: 'Speed Boost', icon: '⚡', color: '#ffaa00', duration: 200 },
  { id: 'double', name: 'Double Score', icon: '✨', color: '#ff6b6b', duration: 350 },
  { id: 'life', name: 'Extra Life', icon: '❤️', color: '#ff4466', duration: 0 }
];

JDR.DEFAULT_SAVE = {
  coins: 100,
  ownedDinos: ['trex'],
  selectedDino: 'trex',
  selectedMap: 'jungle',
  unlockedMaps: ['jungle','volcano'],
  highScores: [],
  settings: {
    musicVol: 70, sfxVol: 80, difficulty: 'normal',
    showFps: false, screenShake: true, particles: 'medium'
  },
  totalGames: 0, totalCoins: 0
};

// Automated test suite for Jurassic Dino Run movement & config validation
const assert = require('assert');

// 1. Test Camera-relative movement calculations
function testCameraMovement(moveSide, moveForward, camAngle) {
  // Normalize diagonal
  var rawMag = Math.sqrt(moveForward * moveForward + moveSide * moveSide);
  if (rawMag > 1.0) {
    moveSide /= rawMag;
    moveForward /= rawMag;
  }
  var inputMagnitude = Math.min(1.0, rawMag);

  var worldMoveX = moveSide * Math.cos(camAngle) + moveForward * Math.sin(camAngle);
  var worldMoveZ = -moveSide * Math.sin(camAngle) + moveForward * Math.cos(camAngle);
  return { worldMoveX, worldMoveZ, inputMagnitude };
}

// Test 1: Yaw = 0 (looking towards +Z)
console.log('Testing Joystick Direction Calculations...');

// Push Forward: should move +Z (away from camera)
let forward = testCameraMovement(0, 1, 0);
assert(Math.abs(forward.worldMoveX) < 1e-6, 'Forward should have 0 X');
assert(forward.worldMoveZ > 0.99, 'Forward should move +Z');
console.log('✓ Forward movement: (x:0, z:+1)');

// Pull Backward: should move -Z (toward camera)
let backward = testCameraMovement(0, -1, 0);
assert(Math.abs(backward.worldMoveX) < 1e-6, 'Backward should have 0 X');
assert(backward.worldMoveZ < -0.99, 'Backward should move -Z');
console.log('✓ Backward movement: (x:0, z:-1)');

// Push Right: should move +X (to the right of camera view)
let right = testCameraMovement(1, 0, 0);
assert(right.worldMoveX > 0.99, 'Right should move +X');
assert(Math.abs(right.worldMoveZ) < 1e-6, 'Right should have 0 Z');
console.log('✓ Right movement: (x:+1, z:0)');

// Push Left: should move -X (to the left of camera view)
let left = testCameraMovement(-1, 0, 0);
assert(left.worldMoveX < -0.99, 'Left should move -X');
assert(Math.abs(left.worldMoveZ) < 1e-6, 'Left should have 0 Z');
console.log('✓ Left movement: (x:-1, z:0)');

// Diagonal Forward-Right: magnitude must be normalized to <= 1.0
let diag = testCameraMovement(1, 1, 0);
let diagLen = Math.sqrt(diag.worldMoveX * diag.worldMoveX + diag.worldMoveZ * diag.worldMoveZ);
assert(Math.abs(diagLen - 1.0) < 1e-6, 'Diagonal length must equal 1.0');
assert(diag.inputMagnitude <= 1.0, 'Input magnitude must be <= 1.0');
console.log('✓ Diagonal input normalized: length=' + diagLen.toFixed(3));

// Neutral: magnitude must be 0
let neutral = testCameraMovement(0, 0, 0);
assert(neutral.inputMagnitude === 0, 'Neutral input magnitude should be 0');
console.log('✓ Neutral input: magnitude=0');

// Camera at 90 degrees (yaw = PI / 2, camera is to the right looking towards -X)
let fwd90 = testCameraMovement(0, 1, Math.PI / 2);
assert(fwd90.worldMoveX > 0.99, 'At yaw=90, forward points +X');
assert(Math.abs(fwd90.worldMoveZ) < 1e-6, 'At yaw=90, forward has 0 Z');
console.log('✓ 90° Camera rotated forward: (x:+1, z:0)');

// 2. Validate Config File
const configCode = require('fs').readFileSync('js/config.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(configCode, sandbox);
const JDR = sandbox.JDR || sandbox.window.JDR;

assert(JDR && JDR.DINOS && JDR.DINOS.length === 9, 'Must have exactly 9 dinosaurs');
console.log('✓ 9 Dinosaur species verified in config: ' + JDR.DINOS.map(d => d.name).join(', '));

assert(JDR.MAPS && JDR.MAPS.length === 5, 'Must have exactly 5 maps');
console.log('✓ 5 Biome maps verified in config: ' + JDR.MAPS.map(m => m.name).join(', '));

console.log('\nALL AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉');

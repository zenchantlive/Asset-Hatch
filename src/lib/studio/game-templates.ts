/**
 * Game Templates for Babylon.js Code Generation
 * 
 * Pre-built, crash-resistant game templates that agents can use
 * as starting points. All templates follow safe coding patterns.
 */

import type { GameFileData } from './types';

/**
 * Base template metadata
 */
export interface GameTemplate {
    id: string;
    name: string;
    description: string;
    category: 'platformer' | 'shooter' | 'puzzle' | 'exploration' | 'racing';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    files: GameFileData[];
    tags: string[];
}

/**
 * Platformer Template - Basic 3D platformer with jumping
 */
export const platformerTemplate: GameTemplate = {
    id: 'platformer-basic',
    name: 'Basic Platformer',
    description: '3D platformer with WASD movement, jumping, and gravity physics',
    category: 'platformer',
    difficulty: 'beginner',
    tags: ['physics', 'movement', 'gravity', 'jumping'],
    files: [
        {
            name: 'main.js',
            orderIndex: 0,
            content: `// ===== main.js =====
'use strict';

// Dependencies: scene (from engine setup)
if (typeof scene === 'undefined') {
    throw new Error("scene required - Babylon.js engine must initialize first");
}

// Global game state
let player = null;
let playerAggregate = null;
let inputMap = {};
let score = 0;
let isGrounded = false;

// Initialize engine and physics
async function initGame() {
    console.log('🚀 Starting platformer game...');

    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 50, height: 50 }, scene);
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
    ground.material = groundMat;
    ground.receiveShadows = true;

    // Add some platforms
    createPlatforms();

    // Initialize physics on ground and platforms
    if (scene.getPhysicsEngine()) {
        new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
        
        // Physics ready - now safe to create player
        scene.onPhysicsReadyObservable.addOnce(() => {
            createPlayer();
        });
    } else {
        // Fallback: create player without physics
        createPlayer();
    }

    // Setup input
    setupInput();

    // Setup camera to follow player
    setupCamera();

    console.log('✅ Game initialized');
}

function createPlatforms() {
    const platformMat = new BABYLON.StandardMaterial('platMat', scene);
    platformMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const positions = [
        { x: 0, y: 1, z: 5, w: 5, d: 3 },
        { x: 5, y: 2, z: 8, w: 4, d: 3 },
        { x: -4, y: 3, z: 10, w: 4, d: 3 },
        { x: 2, y: 4, z: 14, w: 6, d: 3 },
    ];

    positions.forEach((pos, i) => {
        const platform = BABYLON.MeshBuilder.CreateBox('platform' + i, { 
            width: pos.w, height: 0.5, depth: pos.d 
        }, scene);
        platform.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
        platform.material = platformMat;

        // Add physics if ready
        if (scene.getPhysicsEngine()) {
            new BABYLON.PhysicsAggregate(platform, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
        }
    });
}

function createPlayer() {
    if (!scene) return;

    console.log('🎮 Creating player...');

    // Create player mesh (capsule for physics)
    player = BABYLON.MeshBuilder.CreateCapsule('player', { height: 2, radius: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 3, 0);

    const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
    playerMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    playerMat.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);
    player.material = playerMat;

    // Add physics if engine is ready
    if (scene.getPhysicsEngine()) {
        try {
            playerAggregate = new BABYLON.PhysicsAggregate(
                player,
                BABYLON.PhysicsShapeType.CAPSULE,
                { mass: 1, friction: 0.5, restitution: 0.1 },
                scene
            );
            // Lock rotation to prevent tipping over
            if (playerAggregate.body) {
                playerAggregate.body.setMassProperties({
                    inertia: new BABYLON.Vector3(0, 0, 0)
                });
            }
        } catch (e) {
            console.warn('Physics not available:', e);
        }
    }

    // Start game loop
    startGameLoop();
}

function setupInput() {
    if (!scene?.actionManager) return;

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = true; }
    ));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = false; }
    ));

    console.log('⌨️ Input initialized');
}

function setupCamera() {
    const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 15, new BABYLON.Vector3(0, 2, 0), scene);
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;

    // Lock camera to player
    if (player) {
        camera.lockedTarget = player;
    }
}

function startGameLoop() {
    if (!scene) return;

    const JUMP_FORCE = 8;
    const MOVE_SPEED = 0.15;
    const GRAVITY = new BABYLON.Vector3(0, -0.5, 0);

    scene.onBeforeRenderObservable.add(() => {
        if (!player) return;

        // Movement
        let moveX = 0;
        let moveZ = 0;

        if (inputMap['w'] || inputMap['arrowup']) moveZ = 1;
        if (inputMap['s'] || inputMap['arrowdown']) moveZ = -1;
        if (inputMap['a'] || inputMap['arrowleft']) moveX = -1;
        if (inputMap['d'] || inputMap['arrowright']) moveX = 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= len;
            moveZ /= len;
        }

        // Apply movement
        if (playerAggregate?.body) {
            // Physics-based movement
            const velocity = playerAggregate.body.getLinearVelocity();
            const targetVel = new BABYLON.Vector3(moveX * MOVE_SPEED * 60, velocity.y, moveZ * MOVE_SPEED * 60);
            playerAggregate.body.setLinearVelocity(targetVel);

            // Jumping
            if ((inputMap[' '] || inputMap['space']) && isGrounded) {
                playerAggregate.body.applyImpulse(new BABYLON.Vector3(0, JUMP_FORCE, 0), player.getAbsolutePosition());
                isGrounded = false;
            }

            // Check if grounded
            const ray = new BABYLON.Ray(player.position, new BABYLON.Vector3(0, -1, 0), 1.1);
            const hit = scene.pickWithRay(ray, (mesh) => mesh !== player);
            isGrounded = hit.hit;
        } else {
            // Simple movement without physics
            player.position.x += moveX * MOVE_SPEED;
            player.position.z += moveZ * MOVE_SPEED;

            // Simple gravity
            if (player.position.y > 1) {
                player.position.y -= 0.1;
            } else {
                player.position.y = 1;
                isGrounded = true;
            }

            // Jumping
            if ((inputMap[' '] || inputMap['space']) && isGrounded) {
                player.position.y += 0.5;
                isGrounded = false;
            }
        }

        // Reset if fell off
        if (player.position.y < -10) {
            player.position = new BABYLON.Vector3(0, 3, 0);
            if (playerAggregate?.body) {
                playerAggregate.body.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
            }
        }
    });

    console.log('🔄 Game loop started');
}

// Auto-start
initGame();
`,
        },
        {
            name: 'game.js',
            orderIndex: 1,
            content: `// ===== game.js =====
'use strict';

// Dependencies: scene, player, score, inputMap (from other files)
if (typeof scene === 'undefined') {
    throw new Error("scene required - main.js must run first");
}

// Game UI
function createUI() {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Score display
    const scoreText = new BABYLON.GUI.TextBlock();
    scoreText.text = 'Score: 0';
    scoreText.color = 'white';
    scoreText.fontSize = 24;
    scoreText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scoreText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    scoreText.paddingLeft = 20;
    scoreText.paddingTop = 20;
    ui.addControl(scoreText);

    // Instructions
    const helpText = new BABYLON.GUI.TextBlock();
    helpText.text = 'WASD to move, SPACE to jump';
    helpText.color = '#aaaaaa';
    helpText.fontSize = 14;
    helpText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    helpText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    helpText.paddingLeft = 20;
    helpText.paddingBottom = 20;
    ui.addControl(helpText);

    console.log('🎨 UI created');
}

// Initialize UI after scene is ready
if (scene?.onReadyObservable) {
    scene.onReadyObservable.addOnce(() => {
        createUI();
    });
} else {
    setTimeout(createUI, 100);
}
`,
        },
    ],
};

/**
 * Space Shooter Template - Simple space shooter with enemies
 */
export const spaceShooterTemplate: GameTemplate = {
    id: 'space-shooter-basic',
    name: 'Space Shooter',
    description: 'Top-down space shooter with WASD movement, shooting, and enemies',
    category: 'shooter',
    difficulty: 'beginner',
    tags: ['shooting', 'enemies', 'scoring', 'movement'],
    files: [
        {
            name: 'main.js',
            orderIndex: 0,
            content: `// ===== main.js =====
'use strict';

// Dependencies: none (first file)
if (typeof scene === 'undefined') {
    throw new Error("scene required - Babylon.js engine must initialize first");
}

// Game state
let player = null;
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;
let inputMap = {};
let lastShot = 0;

// Initialize game
async function initGame() {
    console.log('🚀 Starting space shooter...');

    // Create player ship
    createPlayer();

    // Create stars
    createStarfield();

    // Setup input
    setupInput();

    // Start spawning enemies
    startEnemySpawner();

    console.log('✅ Game initialized');
}

function createPlayer() {
    if (!scene) return;

    // Create ship mesh
    player = BABYLON.MeshBuilder.CreateCylinder('player', {
        diameterTop: 0,
        diameterBottom: 2,
        height: 3,
        tessellation: 4
    }, scene);
    player.rotation.x = Math.PI / 2;
    player.position = new BABYLON.Vector3(0, 0, -10);

    const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    playerMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    player.material = playerMat;

    // Add glow layer effect
    if (scene.getEffectLayer) {
        const gl = new BABYLON.GlowLayer('glow', scene);
        gl.intensity = 0.5;
    }

    console.log('🎮 Player created');
}

function createStarfield() {
    if (!scene) return;

    const starMat = new BABYLON.StandardMaterial('starMat', scene);
    starMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    starMat.disableLighting = true;

    for (let i = 0; i < 100; i++) {
        const star = BABYLON.MeshBuilder.CreateBox('star' + i, { size: 0.1 }, scene);
        star.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        star.material = starMat;
    }
}

function setupInput() {
    if (!scene?.actionManager) return;

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = true; }
    ));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = false; }
    ));

    console.log('⌨️ Input initialized');
}

function startEnemySpawner() {
    if (!scene) return;

    // Spawn enemy every 2 seconds
    setInterval(() => {
        if (gameOver) return;
        createEnemy();
    }, 2000);

    console.log('👾 Enemy spawner started');
}

function createEnemy() {
    if (!scene || !player) return;

    const enemy = BABYLON.MeshBuilder.CreateBox('enemy', { size: 2 }, scene);
    enemy.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 20,
        0,
        30
    );

    const enemyMat = new BABYLON.StandardMaterial('enemyMat', scene);
    enemyMat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    enemyMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
    enemy.material = enemyMat;

    enemies.push(enemy);
    console.log('👾 Enemy spawned');
}

function shootBullet() {
    if (!scene || !player || gameOver) return;

    const now = Date.now();
    if (now - lastShot < 200) return; // Rate limit
    lastShot = now;

    const bullet = BABYLON.MeshBuilder.CreateSphere('bullet', { diameter: 0.5 }, scene);
    bullet.position = player.position.clone();
    bullet.position.z += 1;

    const bulletMat = new BABYLON.StandardMaterial('bulletMat', scene);
    bulletMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    bullet.material = bulletMat;

    bullets.push({ mesh: bullet, speed: 1 });

    // Cleanup bullet after 3 seconds
    setTimeout(() => {
        if (bullet && !bullet.isDisposed()) {
            bullet.dispose();
        }
    }, 3000);

    console.log('💥 Bullet fired');
}

function updateGame() {
    if (!scene || gameOver) return;

    const speed = 0.3;

    // Player movement
    if (player) {
        if (inputMap['w'] || inputMap['arrowup']) player.position.z -= speed;
        if (inputMap['s'] || inputMap['arrowdown']) player.position.z += speed;
        if (inputMap['a'] || inputMap['arrowleft']) player.position.x -= speed;
        if (inputMap['d'] || inputMap['arrowright']) player.position.x += speed;

        // Shooting
        if (inputMap[' '] || inputMap['space']) {
            shootBullet();
        }

        // Clamp position
        player.position.x = Math.max(-15, Math.min(15, player.position.x));
        player.position.z = Math.max(-20, Math.min(5, player.position.z));
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.mesh || b.mesh.isDisposed()) {
            bullets.splice(i, 1);
            continue;
        }

        b.mesh.position.z += b.speed;

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.isDisposed()) continue;

            if (b.mesh.intersectsMesh(e, false)) {
                // Hit!
                e.dispose();
                enemies.splice(j, 1);
                b.mesh.dispose();
                bullets.splice(i, 1);
                score += 10;
                updateScore();
                console.log('🎯 Enemy destroyed!');
                break;
            }
        }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e || e.isDisposed()) {
            enemies.splice(i, 1);
            continue;
        }

        e.position.z -= 0.1;

        // Check collision with player
        if (player && e.intersectsMesh(player, false)) {
            endGame();
            return;
        }

        // Remove if passed player
        if (e.position.z < -30) {
            e.dispose();
            enemies.splice(i, 1);
        }
    }
}

function updateScore() {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) {
        scoreEl.textContent = 'Score: ' + score;
    }
}

function endGame() {
    gameOver = true;
    console.log('💀 Game Over! Final score: ' + score);

    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) {
        gameOverEl.style.display = 'flex';
        gameOverEl.querySelector('p').textContent = 'Game Over! Score: ' + score;
    }
}

// Start game loop
if (scene) {
    scene.onBeforeRenderObservable.add(updateGame);
}

// Auto-start
initGame();
`,
        },
        {
            name: 'game.js',
            orderIndex: 1,
            content: `// ===== game.js =====
'use strict';

// Dependencies: scene, score, gameOver (from main.js)
if (typeof scene === 'undefined') {
    throw new Error("scene required - main.js must run first");
}

// Create game UI
function createUI() {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Score display
    const scoreDisplay = new BABYLON.GUI.TextBlock();
    scoreDisplay.id = 'score-display';
    scoreDisplay.text = 'Score: 0';
    scoreDisplay.color = 'white';
    scoreDisplay.fontSize = 28;
    scoreDisplay.top = '-45%';
    ui.addControl(scoreDisplay);

    // Instructions
    const helpText = new BABYLON.GUI.TextBlock();
    helpText.text = 'WASD to move, SPACE to shoot';
    helpText.color = '#888888';
    helpText.fontSize = 16;
    helpText.top = '45%';
    ui.addControl(helpText);

    console.log('🎨 Game UI created');
}

// Game over overlay
const overlayHtml = \`
<div id="game-over" style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 1000;
    color: white;
    font-family: sans-serif;
">
    <h1 style="font-size: 48px; color: #ff4444;">GAME OVER</h1>
    <p style="font-size: 24px;"></p>
    <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 30px;
        font-size: 18px;
        cursor: pointer;
        background: #4488ff;
        color: white;
        border: none;
        border-radius: 5px;
    ">Play Again</button>
</div>
\`;

// Inject overlay
document.body.insertAdjacentHTML('beforeend', overlayHtml);

// Initialize UI
if (scene?.onReadyObservable) {
    scene.onReadyObservable.addOnce(() => {
        setTimeout(createUI, 100);
    });
} else {
    setTimeout(createUI, 500);
}
`,
        },
    ],
};

/**
 * Get all available templates
 */
export function getAllTemplates(): GameTemplate[] {
    return [platformerTemplate, spaceShooterTemplate];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: GameTemplate['category']): GameTemplate[] {
    return getAllTemplates().filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): GameTemplate | undefined {
    return getAllTemplates().find(t => t.id === id);
}

/**
 * Generate game files from a template
 */
export function useTemplate(template: GameTemplate): GameFileData[] {
    return template.files as any[];
}

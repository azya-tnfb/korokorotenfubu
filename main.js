import { FRUITS, PHYSICS_SETTINGS, GAME_SETTINGS } from './constants.js';

// Matter.js 
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Body = Matter.Body,
    Vector = Matter.Vector;

// Game State
const state = {
    score: 0,
    currFruitIdx: 0,
    nextFruitIdx: 0,
    isDropping: false,
    gameOver: false,
    gameOverTimer: 0,
    items: [] // Track created items
};

// DOM Elements
const scoreEl = document.getElementById('score-display');
const nextFruitPreview = document.getElementById('next-fruit-preview');
const gameOverScreen = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const uiLayer = document.getElementById('ui-layer');

// Initialize
const engine = Engine.create({
    enableSleeping: false // As requested: sleep logic managed by physics or generally off for "avalanche"
});
// Custom sleep threshold if needed, but 'enableSleeping: false' disables it globally which is what was requested ("Off").
// If "Low", we could set specific properties. Prompt says "Off or Low". Off is safest for avalanche.

const world = engine.world;

// Create Renderer
const render = Render.create({
    element: document.getElementById('game-container'),
    engine: engine,
    options: {
        width: GAME_SETTINGS.WIDTH,
        height: GAME_SETTINGS.HEIGHT,
        wireframes: false,
        background: '#2d2d2d',
        pixelRatio: window.devicePixelRatio
    }
});

// Walls
const wallOptions = { isStatic: true, render: { fillStyle: '#444' } };
const ground = Bodies.rectangle(GAME_SETTINGS.WIDTH / 2, GAME_SETTINGS.HEIGHT, GAME_SETTINGS.WIDTH, GAME_SETTINGS.WALL_THICKNESS, wallOptions);
const leftWall = Bodies.rectangle(0, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions);
const rightWall = Bodies.rectangle(GAME_SETTINGS.WIDTH, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions);
// Top sensor (Game Over Line) - purely visual or sensor? 
// Let's make a visual line using a static body that is a sensor (doesn't collide physically but triggers events? No, visual only for now).
// Actually, I'll draw the line in afterRender.

Composite.add(world, [ground, leftWall, rightWall]);

// Input Handling
let currentX = GAME_SETTINGS.WIDTH / 2;
const dropY = 50; // Height where fruit spawns

// Helper to create fruit body
function createFruitBody(x, y, idx, isStatic = false) {
    const fruit = FRUITS[idx];
    const radius = fruit.radius * GAME_SETTINGS.BASE_RADIUS_SCALE;

    return Bodies.circle(x, y, radius, {
        isStatic: isStatic,
        label: `fruit_${idx}`,
        friction: PHYSICS_SETTINGS.FRICTION,
        restitution: PHYSICS_SETTINGS.RESTITUTION,
        slop: PHYSICS_SETTINGS.SLOP,
        render: {
            fillStyle: fruit.color,
            strokeStyle: '#fff',
            lineWidth: 2
        },
        plugin: {
            born: Date.now() // Custom property to track age
        }
    });
}

// Next Fruit Logic
function updateNextFruit() {
    state.nextFruitIdx = Math.floor(Math.random() * 5); // Tsubumaru to Chori (0-4) typically
    // Update UI Preview
    const fruit = FRUITS[state.nextFruitIdx];
    nextFruitPreview.style.backgroundColor = fruit.color;
    nextFruitPreview.style.borderRadius = '50%';
    nextFruitPreview.style.width = `${fruit.radius * 10}px`; // Scaled for UI
    nextFruitPreview.style.height = `${fruit.radius * 10}px`;
    nextFruitPreview.textContent = state.nextFruitIdx + 1; // Just a number for ID
    nextFruitPreview.style.color = '#fff';
    nextFruitPreview.style.display = 'flex';
    nextFruitPreview.style.justifyContent = 'center';
    nextFruitPreview.style.alignItems = 'center';
    nextFruitPreview.style.fontSize = '12px';
}

function spawnCurrentFruit() {
    state.currFruitIdx = state.nextFruitIdx;
    updateNextFruit();
    state.isDropping = false;

    // Create a "ghost" or guide fruit at the top
    // We don't add it to the physics world yet, just render it or track it.
    // For simplicity, let's track the position and draw it in afterRender.
}

// Input Events
const container = document.getElementById('game-container');

container.addEventListener('mousemove', (e) => {
    if (state.gameOver || state.isDropping) return;
    const rect = render.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Clamp
    const currentRadius = FRUITS[state.currFruitIdx].radius * GAME_SETTINGS.BASE_RADIUS_SCALE;
    const minX = GAME_SETTINGS.WALL_THICKNESS / 2 + currentRadius;
    const maxX = GAME_SETTINGS.WIDTH - GAME_SETTINGS.WALL_THICKNESS / 2 - currentRadius;
    currentX = Math.max(minX, Math.min(maxX, x));
});

container.addEventListener('click', (e) => {
    if (state.gameOver || state.isDropping) return;
    dropFruit();
});

function dropFruit() {
    state.isDropping = true;
    const body = createFruitBody(currentX, dropY, state.currFruitIdx);
    Composite.add(world, body);

    // Slight cooldown
    setTimeout(() => {
        spawnCurrentFruit();
    }, 500);
}

// Collision Handling
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // Check if both are fruits and same type
        if (bodyA.label.startsWith('fruit_') && bodyB.label.startsWith('fruit_')) {
            const idxA = parseInt(bodyA.label.split('_')[1]);
            const idxB = parseInt(bodyB.label.split('_')[1]);

            if (idxA === idxB && idxA < FRUITS.length - 1) {
                // Merge!
                handleMerge(bodyA, bodyB, idxA);
            }
        }
    }
});

function handleMerge(bodyA, bodyB, currentIdx) {
    // Prevent double processing
    if (bodyA.isRemoved || bodyB.isRemoved) return;
    bodyA.isRemoved = true;
    bodyB.isRemoved = true;

    // Midpoint
    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    // Remove old bodies
    Composite.remove(world, [bodyA, bodyB]);

    // Create new body
    const newIdx = currentIdx + 1;
    const newBody = createFruitBody(midX, midY, newIdx);

    // Momentum Cancellation & Pop Effect
    // "Pop": Apply force to neighbors?
    // Matter.js doesn't have "blast" built-in, but creating a body that expands rapidly is one way, 
    // or just applying a radial force to nearby bodies.

    // Reset velocity (mostly)
    Body.setVelocity(newBody, { x: 0, y: -2 }); // Slight upward hop

    Composite.add(world, newBody);

    // Apply "Pop" force to nearby bodies
    // Simple implementation: iterate all bodies, if close, apply vector away from center.
    const blastRadius = newBody.circleRadius * 3;
    const blastForce = 0.05 * newBody.mass; // Scale force

    const allBodies = Composite.allBodies(world);
    allBodies.forEach(b => {
        if (b === newBody || b.isStatic) return;
        const d = Vector.magnitude(Vector.sub(b.position, newBody.position));
        if (d < blastRadius) {
            const forceVec = Vector.normalise(Vector.sub(b.position, newBody.position));
            Body.applyForce(b, b.position, Vector.mult(forceVec, blastForce));
        }
    });

    // Score
    state.score += FRUITS[newIdx].score * 2; // Arbitrary scoring
    scoreEl.textContent = state.score;
}

// Game Over Check
// Logic: Check if any fruit is above the line, stable, for X seconds.
Events.on(engine, 'afterUpdate', () => {
    if (state.gameOver) return;

    let danger = false;
    const bodies = Composite.allBodies(world);

    for (const body of bodies) {
        if (body.isStatic) continue;
        if (body.label.startsWith('fruit_')) {
            // Ignore young bodies (prevent game over on spawn)
            if (Date.now() - (body.plugin.born || 0) < 1000) continue;

            // Check position (Y-axis is 0 at top)
            if (body.position.y - body.circleRadius < GAME_SETTINGS.GAME_OVER_LINE_Y) {
                // Check velocity (is almost static?)
                if (body.speed < 0.2) {
                    danger = true;
                    if (!body.dangerTimer) {
                        body.dangerTimer = Date.now();
                    } else if (Date.now() - body.dangerTimer > GAME_SETTINGS.GAME_OVER_DURATION_MS) {
                        triggerGameOver();
                    }
                } else {
                    body.dangerTimer = null;
                }
            } else {
                body.dangerTimer = null;
            }
        }
    }
});

function triggerGameOver() {
    state.gameOver = true;
    gameOverScreen.classList.remove('hidden');
    engine.enabled = false; // Stop physics? Or just stop input.
    // Usually Stop physics to freeze the scene
    Runner.stop(runner);
}

restartBtn.addEventListener('click', () => {
    // Reset
    Composite.clear(world, false, true); // Keep static? No, clear all non-static
    // Actually simpler to clear everything and rebuild walls
    Composite.clear(world);
    Composite.add(world, [
        Bodies.rectangle(GAME_SETTINGS.WIDTH / 2, GAME_SETTINGS.HEIGHT, GAME_SETTINGS.WIDTH, GAME_SETTINGS.WALL_THICKNESS, wallOptions),
        Bodies.rectangle(0, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions),
        Bodies.rectangle(GAME_SETTINGS.WIDTH, GAME_SETTINGS.HEIGHT / 2, GAME_SETTINGS.WALL_THICKNESS, GAME_SETTINGS.HEIGHT, wallOptions)
    ]);

    state.score = 0;
    scoreEl.textContent = '0';
    state.gameOver = false;
    gameOverScreen.classList.add('hidden');
    Runner.start(runner, engine);

    // Initial spawn
    state.nextFruitIdx = 0;
    spawnCurrentFruit();
});

// Custom Rendering (lines, guide)
Events.on(render, 'afterRender', () => {
    const ctx = render.context;

    // Draw Game Over Line
    ctx.beginPath();
    ctx.moveTo(0, GAME_SETTINGS.GAME_OVER_LINE_Y);
    ctx.lineTo(GAME_SETTINGS.WIDTH, GAME_SETTINGS.GAME_OVER_LINE_Y);
    ctx.strokeStyle = '#ff6b6b';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Guide Fruit (if not dropping)
    if (!state.isDropping && !state.gameOver) {
        const fruit = FRUITS[state.currFruitIdx];
        const radius = fruit.radius * GAME_SETTINGS.BASE_RADIUS_SCALE;
        ctx.beginPath();
        ctx.arc(currentX, dropY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fruit.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Draw drop line
        ctx.beginPath();
        ctx.moveTo(currentX, dropY + radius);
        ctx.lineTo(currentX, GAME_SETTINGS.HEIGHT);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
});

// Start
spawnCurrentFruit();
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

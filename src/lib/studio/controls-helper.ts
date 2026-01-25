/**
 * Controls Helper for Babylon.js Game Preview
 * 
 * Provides pre-built, bulletproof input handling patterns that are
 * injected into the preview iframe as a global CONTROLS object.
 * Agents use CONTROLS.keyboard(), CONTROLS.mouse(), etc. instead
 * of writing input handling from scratch.
 * 
 * @see src/lib/studio/asset-loader.ts - Injected alongside ASSETS
 * @see src/components/studio/PreviewFrame.tsx - Where injection happens
 */

/**
 * Input state for keyboard controls
 */
export interface KeyboardState {
    /** True if key is currently pressed */
    [key: string]: boolean;
}

/**
 * Input state for mouse controls
 */
export interface MouseState {
    /** X position relative to canvas (0-1) */
    x: number;
    /** Y position relative to canvas (0-1) */
    y: number;
    /** Delta X since last frame */
    deltaX: number;
    /** Delta Y since last frame */
    deltaY: number;
    /** True if left button is pressed */
    leftDown: boolean;
    /** True if right button is pressed */
    rightDown: boolean;
    /** True if middle button is pressed */
    middleDown: boolean;
    /** Wheel delta (positive = up, negative = down) */
    wheel: number;
}

/**
 * Touch point information
 */
export interface TouchPoint {
    /** Unique identifier for this touch */
    id: number;
    /** X position relative to canvas (0-1) */
    x: number;
    /** Y position relative to canvas (0-1) */
    y: number;
}

/**
 * Input state for touch controls
 */
export interface TouchState {
    /** All current touch points */
    touches: TouchPoint[];
    /** Primary touch (first finger), null if no touch */
    primary: TouchPoint | null;
    /** True if at least one touch is active */
    active: boolean;
    /** Number of active touches */
    count: number;
}

/**
 * Generate the CONTROLS helper script for injection into iframe
 * 
 * This creates a self-contained script that sets up global CONTROLS
 * object with keyboard(), mouse(), and touch() methods.
 * 
 * @returns JavaScript code string to inject into iframe
 */
export function generateControlsHelperScript(): string {
    return `
// =============================================================================
// CONTROLS HELPER (Pre-built input handling - use instead of writing from scratch!)
// =============================================================================

(function() {
  'use strict';
  
  // Internal state (not exposed directly)
  const _keyState = {};
  const _mouseState = {
    x: 0, y: 0,
    deltaX: 0, deltaY: 0,
    leftDown: false, rightDown: false, middleDown: false,
    wheel: 0,
  };
  const _touchState = {
    touches: [],
    primary: null,
    active: false,
    count: 0,
  };
  
  let _lastMouseX = 0;
  let _lastMouseY = 0;
  
  // Helper to normalize position to 0-1 range
  function normalizePos(x, y) {
    const rect = document.body.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, x / rect.width)),
      y: Math.max(0, Math.min(1, y / rect.height)),
    };
  }
  
  // Keyboard event handlers
  document.addEventListener('keydown', (e) => {
    _keyState[e.key.toLowerCase()] = true;
    _keyState[e.code.toLowerCase()] = true;
  });
  
  document.addEventListener('keyup', (e) => {
    _keyState[e.key.toLowerCase()] = false;
    _keyState[e.code.toLowerCase()] = false;
  });
  
  // Mouse event handlers
  document.addEventListener('mousemove', (e) => {
    const pos = normalizePos(e.clientX, e.clientY);
    _mouseState.deltaX = e.clientX - _lastMouseX;
    _mouseState.deltaY = e.clientY - _lastMouseY;
    _mouseState.x = pos.x;
    _mouseState.y = pos.y;
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
  });
  
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) _mouseState.leftDown = true;
    if (e.button === 1) _mouseState.middleDown = true;
    if (e.button === 2) _mouseState.rightDown = true;
  });
  
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) _mouseState.leftDown = false;
    if (e.button === 1) _mouseState.middleDown = false;
    if (e.button === 2) _mouseState.rightDown = false;
  });
  
  document.addEventListener('wheel', (e) => {
    _mouseState.wheel = e.deltaY > 0 ? -1 : e.deltaY < 0 ? 1 : 0;
    // Reset after a short delay
    setTimeout(() => { _mouseState.wheel = 0; }, 100);
  });
  
  // Touch event handlers
  function updateTouches(e) {
    _touchState.touches = [];
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const pos = normalizePos(touch.clientX, touch.clientY);
      _touchState.touches.push({
        id: touch.identifier,
        x: pos.x,
        y: pos.y,
      });
    }
    _touchState.count = _touchState.touches.length;
    _touchState.active = _touchState.count > 0;
    _touchState.primary = _touchState.touches[0] || null;
  }
  
  document.addEventListener('touchstart', updateTouches);
  document.addEventListener('touchmove', updateTouches);
  document.addEventListener('touchend', updateTouches);
  document.addEventListener('touchcancel', updateTouches);
  
  // Prevent context menu on right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Create global CONTROLS object
  window.CONTROLS = {
    /**
     * Get current keyboard state
     * Usage: const input = CONTROLS.keyboard();
     *        if (input.w) player.moveForward();
     *        if (input.space || input[' ']) player.jump();
     */
    keyboard: function() {
      return Object.assign({}, _keyState);
    },
    
    /**
     * Check if a specific key is pressed
     * Usage: if (CONTROLS.isPressed('w')) player.moveForward();
     */
    isPressed: function(key) {
      return !!_keyState[key.toLowerCase()];
    },
    
    /**
     * Get current mouse state
     * Usage: const mouse = CONTROLS.mouse();
     *        if (mouse.leftDown) shoot();
     *        lookAt(mouse.x, mouse.y);
     */
    mouse: function() {
      const state = Object.assign({}, _mouseState);
      // Reset deltas after reading (frame-based)
      _mouseState.deltaX = 0;
      _mouseState.deltaY = 0;
      return state;
    },
    
    /**
     * Get current touch state
     * Usage: const touch = CONTROLS.touch();
     *        if (touch.active) handleTouch(touch.primary);
     */
    touch: function() {
      return {
        touches: _touchState.touches.slice(),
        primary: _touchState.primary ? Object.assign({}, _touchState.primary) : null,
        active: _touchState.active,
        count: _touchState.count,
      };
    },
    
    /**
     * Combined input for movement (works with keyboard and touch)
     * Usage: const move = CONTROLS.movement();
     *        player.position.x += move.x * speed;
     *        player.position.z += move.y * speed;
     */
    movement: function() {
      let x = 0, y = 0;
      
      // Keyboard WASD/Arrows
      if (_keyState['w'] || _keyState['arrowup']) y += 1;
      if (_keyState['s'] || _keyState['arrowdown']) y -= 1;
      if (_keyState['a'] || _keyState['arrowleft']) x -= 1;
      if (_keyState['d'] || _keyState['arrowright']) x += 1;
      
      // Touch: treat primary touch position as direction
      if (_touchState.active && _touchState.primary) {
        // Map touch position to -1 to 1 range from center
        x = (_touchState.primary.x - 0.5) * 2;
        y = (0.5 - _touchState.primary.y) * 2;
      }
      
      // Normalize for diagonal movement
      const length = Math.sqrt(x * x + y * y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      
      return { x, y };
    },
    
    /**
     * Check if action button is pressed (space, left mouse, or touch)
     * Usage: if (CONTROLS.action()) player.jump();
     */
    action: function() {
      return _keyState[' '] || _keyState['space'] || 
             _mouseState.leftDown || _touchState.active;
    },
  };
  
  console.log('✅ CONTROLS helper initialized');
})();
`;
}

/**
 * Get documentation for the CONTROLS helper to include in system prompt
 * 
 * @returns Markdown documentation string
 */
export function getControlsDocumentation(): string {
    return `
**CONTROLS HELPER (Pre-built, bulletproof input):**

\`\`\`javascript
// Instead of writing input handling, use CONTROLS:

// Keyboard state (all keys lowercase)
const keys = CONTROLS.keyboard();
if (keys.w) player.moveForward();
if (keys.space) player.jump();

// Check specific key
if (CONTROLS.isPressed('shift')) player.run();

// Mouse position and buttons
const mouse = CONTROLS.mouse();
if (mouse.leftDown) fireWeapon();
aimAt(mouse.x, mouse.y); // 0-1 normalized

// Touch support
const touch = CONTROLS.touch();
if (touch.active) handleTouch(touch.primary.x, touch.primary.y);

// Combined movement (keyboard + touch)
const move = CONTROLS.movement();
player.position.x += move.x * speed;
player.position.z += move.y * speed;

// Action button (space/click/touch)
if (CONTROLS.action()) player.jump();
\`\`\`
`;
}

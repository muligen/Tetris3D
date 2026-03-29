/**
 * Gamepad Service - Handles gamepad input using the Gamepad API
 */

export interface GamepadState {
  connected: boolean;
  id: string | null;
  buttons: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    start: boolean;
    select: boolean;
  };
}

export type GamepadAction = 'moveLeft' | 'moveRight' | 'rotate' | 'hardDrop' | 'togglePause' | null;

export class GamepadService {
  private connected: boolean = false;
  private gamepadIndex: number = -1;
  private lastState: GamepadState | null = null;
  private actionCallback: ((action: GamepadAction) => void) | null = null;
  private pollInterval: number | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup gamepad connection event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (e) => {
      this.onGamepadConnected(e);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.onGamepadDisconnected(e);
    });
  }

  /**
   * Handle gamepad connection
   */
  private onGamepadConnected(event: GamepadEvent): void {
    const gamepad = event.gamepad;
    this.gamepadIndex = gamepad.index;
    this.connected = true;
    console.log('Gamepad connected:', gamepad.id);

    // Start polling
    this.startPolling();
  }

  /**
   * Handle gamepad disconnection
   */
  private onGamepadDisconnected(event: GamepadEvent): void {
    if (event.gamepad.index === this.gamepadIndex) {
      this.connected = false;
      this.gamepadIndex = -1;
      this.lastState = null;
      console.log('Gamepad disconnected');

      // Stop polling
      this.stopPolling();
    }
  }

  /**
   * Start polling gamepad state
   */
  private startPolling(): void {
    if (this.pollInterval !== null) return;

    this.pollInterval = window.setInterval(() => {
      this.poll();
    }, 16); // ~60fps
  }

  /**
   * Stop polling gamepad state
   */
  private stopPolling(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Poll gamepad state and trigger callbacks
   */
  private poll(): void {
    if (!this.connected || this.gamepadIndex === -1) return;

    // Get gamepads from navigator
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];

    if (!gamepad) {
      this.connected = false;
      this.gamepadIndex = -1;
      return;
    }

    // Map gamepad buttons and axes to our state
    const state = this.mapGamepadToState(gamepad);

    // Check for state changes and trigger actions
    if (this.lastState && this.actionCallback) {
      this.detectActions(this.lastState, state);
    }

    this.lastState = state;
  }

  /**
   * Map gamepad input to our state format
   */
  private mapGamepadToState(gamepad: Gamepad): GamepadState {
    // Standard button mapping (Xbox/PlayStation style)
    const buttons = gamepad.buttons;
    const axes = gamepad.axes;

    return {
      connected: true,
      id: gamepad.id,
      buttons: {
        // D-Pad or left stick
        left:
          axes[0] < -0.5 ||
          buttons[14]?.pressed ||
          buttons[12]?.pressed, // D-pad left or left stick left
        right:
          axes[0] > 0.5 ||
          buttons[15]?.pressed ||
          buttons[13]?.pressed, // D-pad right or left stick right
        up:
          axes[1] < -0.5 ||
          buttons[12]?.pressed, // D-pad up or left stick up
        down:
          axes[1] > 0.5 ||
          buttons[13]?.pressed, // D-pad down or left stick down

        // Face buttons
        a: buttons[0]?.pressed || false, // A / Cross
        b: buttons[1]?.pressed || false, // B / Circle
        x: buttons[2]?.pressed || false, // X / Square
        y: buttons[3]?.pressed || false, // Y / Triangle

        // Menu buttons
        start: buttons[9]?.pressed || buttons[6]?.pressed || false, // Start
        select: buttons[8]?.pressed || buttons[4]?.pressed || false, // Select / Back
      },
    };
  }

  /**
   * Detect game actions based on state changes
   */
  private detectActions(
    prev: GamepadState,
    curr: GamepadState
  ): void {
    const { buttons: prevBtn } = prev;
    const { buttons: currBtn } = curr;

    // Move left (press)
    if (!prevBtn.left && currBtn.left) {
      this.triggerAction('moveLeft');
    }

    // Move right (press)
    if (!prevBtn.right && currBtn.right) {
      this.triggerAction('moveRight');
    }

    // Rotate (A button or D-pad up)
    if ((!prevBtn.a && currBtn.a) || (!prevBtn.up && currBtn.up)) {
      this.triggerAction('rotate');
    }

    // Hard drop (B button or X button)
    if (!prevBtn.b && currBtn.b) {
      this.triggerAction('hardDrop');
    }
    if (!prevBtn.x && currBtn.x) {
      this.triggerAction('hardDrop');
    }

    // Pause (Start button)
    if (!prevBtn.start && currBtn.start) {
      this.triggerAction('togglePause');
    }
  }

  /**
   * Trigger action callback
   */
  private triggerAction(action: GamepadAction): void {
    if (this.actionCallback) {
      this.actionCallback(action);
    }
  }

  /**
   * Set action callback
   */
  onAction(callback: (action: GamepadAction) => void): void {
    this.actionCallback = callback;
  }

  /**
   * Check if a gamepad is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current gamepad state
   */
  getState(): GamepadState | null {
    return this.lastState;
  }

  /**
   * Get connected gamepad info
   */
  getGamepadInfo(): { index: number; id: string | null } | null {
    if (!this.connected) return null;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];

    if (gamepad) {
      return {
        index: this.gamepadIndex,
        id: gamepad.id,
      };
    }

    return null;
  }

  /**
   * Manually check for connected gamepads
   */
  checkForGamepads(): void {
    const gamepads = navigator.getGamepads();

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad && !this.connected) {
        this.gamepadIndex = i;
        this.connected = true;
        console.log('Gamepad found:', gamepad.id);
        this.startPolling();
        break;
      }
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopPolling();
    this.actionCallback = null;
    this.lastState = null;
  }
}

// Singleton instance
let gamepadServiceInstance: GamepadService | null = null;

export function getGamepadService(): GamepadService {
  if (!gamepadServiceInstance) {
    gamepadServiceInstance = new GamepadService();
  }
  return gamepadServiceInstance;
}

/**
 * Check if Gamepad API is supported
 */
export function isGamepadSupported(): boolean {
  return 'getGamepads' in navigator;
}

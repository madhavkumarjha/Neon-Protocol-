export interface InputState {
  moveVector: { x: number; y: number };
  aimVector?: { x: number; y: number };
  isDashPressed: boolean;
  isPausePressed: boolean;
}

export class InputManager {
  private static touchMoveVector: { x: number; y: number } = { x: 0, y: 0 };
  private static touchAimVector: { x: number; y: number } = { x: 0, y: 0 };
  private static touchDashTriggered: boolean = false;

  public static setTouchMove(x: number, y: number): void {
    this.touchMoveVector.x = x;
    this.touchMoveVector.y = y;
  }

  public static setTouchAim(x: number, y: number): void {
    this.touchAimVector.x = x;
    this.touchAimVector.y = y;
  }

  public static triggerTouchDash(): void {
    this.touchDashTriggered = true;
  }

  public static consumeTouchDash(): boolean {
    if (this.touchDashTriggered) {
      this.touchDashTriggered = false;
      return true;
    }
    return false;
  }

  public static getTouchMoveVector() {
    return { ...this.touchMoveVector };
  }
}

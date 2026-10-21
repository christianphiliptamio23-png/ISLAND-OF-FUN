export class GameStateManager {
  constructor() { this.current = 'MENU'; }
  set(state) { this.current = state; }
  is(state) { return this.current === state; }
}

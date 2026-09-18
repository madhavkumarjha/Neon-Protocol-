type Listener = (...args: any[]) => void;

class EventBusInstance {
  private events: Map<string, Listener[]> = new Map();

  public on(event: string, fn: Listener, context?: any): void {
    const boundFn = context ? fn.bind(context) : fn;
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(boundFn);
  }

  public emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(fn => fn(...args));
    }
  }

  public off(event: string, fn?: Listener): void {
    if (!fn) {
      this.events.delete(event);
    } else {
      const listeners = this.events.get(event);
      if (listeners) {
        this.events.set(event, listeners.filter(l => l !== fn));
      }
    }
  }
}

export const EventBus = new EventBusInstance();

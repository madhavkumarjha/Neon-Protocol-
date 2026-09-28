type Listener = (...args: any[]) => void;

interface EventListenerEntry {
  fn: Listener;
  context?: any;
  boundFn: Listener;
}

class EventBusInstance {
  private events: Map<string, EventListenerEntry[]> = new Map();

  public on(event: string, fn: Listener, context?: any): void {
    const boundFn = context ? fn.bind(context) : fn;
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ fn, context, boundFn });
  }

  public emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(entry => entry.boundFn(...args));
    }
  }

  public off(event: string, fn?: Listener, context?: any): void {
    if (!fn && !context) {
      this.events.delete(event);
      return;
    }

    const listeners = this.events.get(event);
    if (listeners) {
      const filtered = listeners.filter(entry => {
        if (fn && entry.fn !== fn) return true;
        if (context && entry.context !== context) return true;
        return false;
      });

      if (filtered.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, filtered);
      }
    }
  }

  public offAll(context?: any): void {
    if (!context) {
      this.events.clear();
      return;
    }

    this.events.forEach((listeners, event) => {
      const filtered = listeners.filter(entry => entry.context !== context);
      if (filtered.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, filtered);
      }
    });
  }
}

export const EventBus = new EventBusInstance();


import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../src/systems/EventBus';

describe('EventBus Unit Tests', () => {
  beforeEach(() => {
    EventBus.offAll();
  });

  it('should trigger subscribed listeners on emit', () => {
    const callback = vi.fn();
    EventBus.on('test:event', callback);
    EventBus.emit('test:event', { payload: 123 });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ payload: 123 });
  });

  it('should correctly remove bound listeners using off with function and context', () => {
    const obj = {
      count: 0,
      increment() {
        this.count++;
      }
    };

    EventBus.on('test:inc', obj.increment, obj);
    EventBus.emit('test:inc');
    expect(obj.count).toBe(1);

    EventBus.off('test:inc', obj.increment, obj);
    EventBus.emit('test:inc');
    expect(obj.count).toBe(1);
  });

  it('should remove all listeners associated with a context using offAll(context)', () => {
    const ctxA = { id: 'A', fn1: vi.fn(), fn2: vi.fn() };
    const ctxB = { id: 'B', fn1: vi.fn() };

    EventBus.on('event:one', ctxA.fn1, ctxA);
    EventBus.on('event:two', ctxA.fn2, ctxA);
    EventBus.on('event:one', ctxB.fn1, ctxB);

    EventBus.offAll(ctxA);

    EventBus.emit('event:one');
    EventBus.emit('event:two');

    expect(ctxA.fn1).not.toHaveBeenCalled();
    expect(ctxA.fn2).not.toHaveBeenCalled();
    expect(ctxB.fn1).toHaveBeenCalledTimes(1);
  });

  it('should safely allow a listener to unregister itself during emit without index skipping', () => {
    const calls: string[] = [];

    const listener1 = () => {
      calls.push('l1');
      EventBus.off('test:self', listener1);
    };
    const listener2 = () => {
      calls.push('l2');
    };

    EventBus.on('test:self', listener1);
    EventBus.on('test:self', listener2);

    EventBus.emit('test:self');
    expect(calls).toEqual(['l1', 'l2']);

    calls.length = 0;
    EventBus.emit('test:self');
    expect(calls).toEqual(['l2']);
  });
});

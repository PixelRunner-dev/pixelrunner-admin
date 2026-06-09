import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { provideNotifications, useNotifications } from '@/composables/useNotifications.ts';
import type { Notification } from '@/utils/notifications.ts';

afterEach(() => {
  vi.useRealTimers();
});

const createNotification = (
  message: string,
  options: Partial<Notification> = {}
): Notification => ({
  type: 'info',
  message,
  ...options
});

const mountNotificationsProvider = () => {
  let provided: ReturnType<typeof provideNotifications>;
  let injected: ReturnType<typeof useNotifications>;

  const Consumer = defineComponent({
    setup() {
      injected = useNotifications();

      return () => null;
    }
  });

  const Provider = defineComponent({
    setup() {
      provided = provideNotifications();

      return () => h(Consumer);
    }
  });

  mount(Provider);

  return {
    provided: provided!,
    injected: injected!
  };
};

describe('notification type contract', () => {
  it('supports action and close metadata on notifications', () => {
    const onAction = vi.fn();
    const notification: Notification = createNotification('retry', {
      type: 'error',
      actionLabel: 'Retry',
      onAction,
      timeoutToClose: 100,
      hasCloseButton: true
    });

    expectTypeOf<Notification>().toMatchTypeOf<{
      type: 'error' | 'warning' | 'info' | 'success';
      message: string;
      actionLabel?: string;
      onAction?: () => void;
      timeoutToClose?: number;
      persistent?: boolean;
      hasCloseButton?: boolean;
    }>();
    expect(notification).toMatchObject({
      type: 'error',
      message: 'retry',
      actionLabel: 'Retry',
      onAction,
      timeoutToClose: 100,
      hasCloseButton: true
    });
  });
});

describe('useNotifications', () => {
  it('returns undefined without a provider', () => {
    let injected: ReturnType<typeof useNotifications>;
    const Consumer = defineComponent({
      setup() {
        injected = useNotifications();

        return () => null;
      }
    });

    mount(Consumer);

    expect(injected!).toBeUndefined();
  });

  it('provides and injects the same notification state', () => {
    const { provided, injected } = mountNotificationsProvider();

    expect(injected).toBe(provided);
    expect(provided.notifications.value).toEqual([]);
  });

  it('adds newest notifications first and replaces duplicates by type and message', () => {
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('first', { type: 'info' }));
    provided.addNotification(createNotification('second', { type: 'success' }));
    provided.addNotification(createNotification('first', { type: 'info', hasCloseButton: true }));

    expect(provided.notifications.value).toEqual([
      createNotification('first', { type: 'info', hasCloseButton: true }),
      createNotification('second', { type: 'success' })
    ]);
  });

  it('keeps notifications with the same message and different types', () => {
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('shared', { type: 'info' }));
    provided.addNotification(createNotification('shared', { type: 'error' }));

    expect(provided.notifications.value).toEqual([
      createNotification('shared', { type: 'error' }),
      createNotification('shared', { type: 'info' })
    ]);
  });

  it('removes notifications by message string or object', () => {
    const { provided } = mountNotificationsProvider();
    const first = createNotification('first');
    const second = createNotification('second');

    provided.addNotification(first);
    provided.addNotification(second);
    provided.removeNotification('first');
    provided.removeNotification(second);
    provided.removeNotification('missing');

    expect(provided.notifications.value).toEqual([]);
  });

  it('sets immediate visibility without duplicating existing notifications', () => {
    const { provided } = mountNotificationsProvider();
    const notification = createNotification('visible');

    provided.setNotification(true, notification);
    provided.setNotification(true, notification);
    provided.setNotification(false, createNotification('missing'));

    expect(provided.notifications.value).toEqual([notification]);

    provided.setNotification(false, notification);

    expect(provided.notifications.value).toEqual([]);
  });

  it('adds delayed notifications and clears completed timers', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();
    const notification = createNotification('delayed');

    provided.setNotification(true, notification, { delay: 50 });
    expect(provided.notifications.value).toEqual([]);

    vi.advanceTimersByTime(49);
    expect(provided.notifications.value).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(provided.notifications.value).toEqual([notification]);
  });

  it('cancels delayed notifications when they are removed before the timer fires', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();
    const notification = createNotification('cancelled');

    provided.setNotification(true, notification, { delay: 50 });
    provided.removeNotification(notification);
    vi.advanceTimersByTime(50);

    expect(provided.notifications.value).toEqual([]);
  });

  it('replaces pending delayed notifications with the same type and message', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();

    provided.setNotification(true, createNotification('replace', { type: 'info' }), {
      delay: 50
    });
    provided.setNotification(
      true,
      createNotification('replace', { type: 'info', hasCloseButton: true }),
      { delay: 50 }
    );
    vi.advanceTimersByTime(50);

    expect(provided.notifications.value).toEqual([
      createNotification('replace', { type: 'info', hasCloseButton: true })
    ]);
  });

  it('auto-dismisses non-error notifications after 8 seconds by default', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('temporary'));
    vi.advanceTimersByTime(7999);
    expect(provided.notifications.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(provided.notifications.value).toEqual([]);
  });

  it('does not auto-dismiss error notifications, including with a custom timeout', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('failure', { type: 'error', timeoutToClose: 250 }));
    vi.advanceTimersByTime(60_000);

    expect(provided.notifications.value).toHaveLength(1);
  });

  it.each([{ timeoutToClose: 0 }, { persistent: true }])(
    'does not auto-dismiss notifications with persistence metadata: %o',
    (options) => {
      vi.useFakeTimers();
      const { provided } = mountNotificationsProvider();

      provided.addNotification(createNotification('persistent', options));
      vi.advanceTimersByTime(60_000);

      expect(provided.notifications.value).toHaveLength(1);
    }
  );

  it('uses a custom auto-dismiss duration', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('custom', { timeoutToClose: 250 }));
    vi.advanceTimersByTime(249);
    expect(provided.notifications.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(provided.notifications.value).toEqual([]);
  });

  it('resets the auto-dismiss timer when a duplicate is re-added', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();
    const notification = createNotification('reset');

    provided.addNotification(notification);
    vi.advanceTimersByTime(7000);
    provided.addNotification(notification);
    vi.advanceTimersByTime(7999);
    expect(provided.notifications.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(provided.notifications.value).toEqual([]);
  });

  it('clears the auto-dismiss timer when manually removed', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { provided } = mountNotificationsProvider();
    const notification = createNotification('removed');

    provided.addNotification(notification);
    provided.removeNotification(notification);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.advanceTimersByTime(8000);
    expect(provided.notifications.value).toEqual([]);
  });
});

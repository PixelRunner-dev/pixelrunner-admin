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

  it('adds newest notifications first and replaces duplicates by message', () => {
    const { provided } = mountNotificationsProvider();

    provided.addNotification(createNotification('first', { type: 'info' }));
    provided.addNotification(createNotification('second', { type: 'success' }));
    provided.addNotification(createNotification('first', { type: 'error' }));

    expect(provided.notifications.value).toEqual([
      createNotification('first', { type: 'error' }),
      createNotification('second', { type: 'success' })
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

  it('replaces pending delayed notifications for the same message', () => {
    vi.useFakeTimers();
    const { provided } = mountNotificationsProvider();

    provided.setNotification(true, createNotification('replace', { type: 'info' }), {
      delay: 50
    });
    provided.setNotification(true, createNotification('replace', { type: 'success' }), {
      delay: 50
    });
    vi.advanceTimersByTime(50);

    expect(provided.notifications.value).toEqual([
      createNotification('replace', { type: 'success' })
    ]);
  });
});

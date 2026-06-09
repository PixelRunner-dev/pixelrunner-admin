import { inject, onScopeDispose, provide, ref, type InjectionKey, type Ref } from 'vue';

import type { Notification } from '@/utils/notifications.ts';

interface NotificationsState {
  notifications: Ref<Notification[]>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notification: Notification | string) => void;
  setNotification: (
    isVisible: boolean,
    notification: Notification,
    options?: SetNotificationOptions
  ) => void;
}

const notificationsInjectionKey = Symbol('notifications') as InjectionKey<NotificationsState>;

interface SetNotificationOptions {
  delay?: number;
}

const DEFAULT_NOTIFICATION_TIMEOUT_MS = 8000;

function getNotificationMessage(notification: Notification | string) {
  return typeof notification === 'string' ? notification : notification.message;
}

function getNotificationKey(notification: Notification) {
  return `${notification.type}:${notification.message}`;
}

function getAutoDismissDelay(notification: Notification): number | null {
  if (
    notification.type === 'error' ||
    notification.persistent ||
    notification.timeoutToClose === 0
  ) {
    return null;
  }

  if (notification.timeoutToClose !== undefined) {
    return notification.timeoutToClose > 0 ? notification.timeoutToClose : null;
  }

  return DEFAULT_NOTIFICATION_TIMEOUT_MS;
}

function createNotificationsState(): NotificationsState {
  const notifications = ref<Notification[]>([]);
  const delayedNotificationTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const autoDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function clearTimer(timers: Map<string, ReturnType<typeof setTimeout>>, key: string) {
    const timer = timers.get(key);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    timers.delete(key);
  }

  function clearNotificationTimers(notification: Notification) {
    const key = getNotificationKey(notification);
    clearTimer(delayedNotificationTimers, key);
    clearTimer(autoDismissTimers, key);
  }

  function scheduleAutoDismiss(notification: Notification) {
    const key = getNotificationKey(notification);
    const delay = getAutoDismissDelay(notification);

    clearTimer(autoDismissTimers, key);
    if (delay === null) {
      return;
    }

    const timer = setTimeout(() => {
      autoDismissTimers.delete(key);
      notifications.value = notifications.value.filter((item) => getNotificationKey(item) !== key);
    }, delay);

    autoDismissTimers.set(key, timer);
  }

  function addNotification(notification: Notification) {
    const key = getNotificationKey(notification);
    clearNotificationTimers(notification);
    notifications.value = [
      notification,
      ...notifications.value.filter((item) => getNotificationKey(item) !== key)
    ];
    scheduleAutoDismiss(notification);
  }

  function removeNotification(notification: Notification | string) {
    const message = getNotificationMessage(notification);
    const matches = (item: Notification) =>
      typeof notification === 'string'
        ? item.message === message
        : getNotificationKey(item) === getNotificationKey(notification);

    if (typeof notification === 'string') {
      const keySuffix = `:${message}`;
      for (const key of delayedNotificationTimers.keys()) {
        if (key.endsWith(keySuffix)) {
          clearTimer(delayedNotificationTimers, key);
        }
      }
      for (const key of autoDismissTimers.keys()) {
        if (key.endsWith(keySuffix)) {
          clearTimer(autoDismissTimers, key);
        }
      }
    }

    for (const item of notifications.value.filter(matches)) {
      clearNotificationTimers(item);
    }

    if (typeof notification !== 'string') {
      clearNotificationTimers(notification);
    }

    notifications.value = notifications.value.filter((item) => !matches(item));
  }

  function setNotification(
    isVisible: boolean,
    notification: Notification,
    options: SetNotificationOptions = {}
  ) {
    const hasNotification = notifications.value.some(
      (item) => getNotificationKey(item) === getNotificationKey(notification)
    );
    const delay = options.delay ?? 0;
    const key = getNotificationKey(notification);

    clearTimer(delayedNotificationTimers, key);

    if (isVisible) {
      if (delay > 0) {
        if (hasNotification) {
          removeNotification(notification);
        }

        const timer = setTimeout(() => {
          delayedNotificationTimers.delete(key);
          addNotification(notification);
        }, delay);

        delayedNotificationTimers.set(key, timer);
        return;
      }

      addNotification(notification);
      return;
    }

    if (!isVisible && hasNotification) {
      removeNotification(notification);
    }
  }

  onScopeDispose(() => {
    for (const timer of [...delayedNotificationTimers.values(), ...autoDismissTimers.values()]) {
      clearTimeout(timer);
    }
    delayedNotificationTimers.clear();
    autoDismissTimers.clear();
  });

  return {
    notifications,
    addNotification,
    removeNotification,
    setNotification
  };
}

export function provideNotifications() {
  const notificationsState = createNotificationsState();
  provide(notificationsInjectionKey, notificationsState);

  return notificationsState;
}

export function useNotifications() {
  return inject(notificationsInjectionKey, undefined);
}

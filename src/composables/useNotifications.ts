import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

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

function getNotificationMessage(notification: Notification | string) {
  return typeof notification === 'string' ? notification : notification.message;
}

function createNotificationsState(): NotificationsState {
  const notifications = ref<Notification[]>([]);
  const delayedNotificationTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function clearDelayedNotification(message: string) {
    const timer = delayedNotificationTimers.get(message);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    delayedNotificationTimers.delete(message);
  }

  function addNotification(notification: Notification) {
    clearDelayedNotification(notification.message);
    notifications.value = [
      notification,
      ...notifications.value.filter((item) => item.message !== notification.message)
    ];
  }

  function removeNotification(notification: Notification | string) {
    const message = getNotificationMessage(notification);
    clearDelayedNotification(message);
    notifications.value = notifications.value.filter((item) => item.message !== message);
  }

  function setNotification(
    isVisible: boolean,
    notification: Notification,
    options: SetNotificationOptions = {}
  ) {
    const hasNotification = notifications.value.some(
      (item) => item.message === notification.message
    );
    const delay = options.delay ?? 0;

    clearDelayedNotification(notification.message);

    if (isVisible && !hasNotification) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          delayedNotificationTimers.delete(notification.message);
          addNotification(notification);
        }, delay);

        delayedNotificationTimers.set(notification.message, timer);
        return;
      }

      addNotification(notification);
      return;
    }

    if (!isVisible && hasNotification) {
      removeNotification(notification);
    }
  }

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
  return inject(notificationsInjectionKey);
}

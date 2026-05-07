import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

import type { Notification } from '@/utils/notifications.ts';

interface NotificationsState {
  notifications: Ref<Notification[]>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notification: Notification | string) => void;
  setNotification: (isVisible: boolean, notification: Notification) => void;
}

const notificationsInjectionKey = Symbol('notifications') as InjectionKey<NotificationsState>;

function getNotificationMessage(notification: Notification | string) {
  return typeof notification === 'string' ? notification : notification.message;
}

function createNotificationsState(): NotificationsState {
  const notifications = ref<Notification[]>([]);

  function addNotification(notification: Notification) {
    notifications.value = [
      notification,
      ...notifications.value.filter((item) => item.message !== notification.message)
    ];
  }

  function removeNotification(notification: Notification | string) {
    const message = getNotificationMessage(notification);
    notifications.value = notifications.value.filter((item) => item.message !== message);
  }

  function setNotification(isVisible: boolean, notification: Notification) {
    const hasNotification = notifications.value.some(
      (item) => item.message === notification.message
    );

    if (isVisible && !hasNotification) {
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

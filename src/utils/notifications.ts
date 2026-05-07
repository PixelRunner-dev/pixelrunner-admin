export interface Notification {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timeoutToClose?: number;
  hasCloseButton?: boolean;
}

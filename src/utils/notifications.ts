export interface Notification {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  timeoutToClose?: number;
  persistent?: boolean;
  hasCloseButton?: boolean;
}

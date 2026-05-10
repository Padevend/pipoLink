export interface NotificationModel {
  id: string;
  title: string;
  body: string;
  kind: 'success' | 'error' | 'warning' | 'info';
  createdAt: string;
  read: boolean;
}

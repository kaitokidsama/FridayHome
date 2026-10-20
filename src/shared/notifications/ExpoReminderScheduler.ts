import * as Notifications from 'expo-notifications';

import type { ReminderRequest, ReminderScheduler } from './ReminderScheduler';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

/** Shows reminders as banners even when the app is in the foreground. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermission;
}

export class ExpoReminderScheduler implements ReminderScheduler {
  async schedule(request: ReminderRequest): Promise<string | null> {
    try {
      const permission = await getNotificationPermission();
      if (permission === 'denied') return null;
      if (permission === 'undetermined' && (await requestNotificationPermission()) !== 'granted') {
        return null;
      }
      return await Notifications.scheduleNotificationAsync({
        content: { title: request.title, body: request.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: request.at },
      });
    } catch (error) {
      console.warn('Failed to schedule reminder', error);
      return null;
    }
  }

  async cancel(reminderId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (error) {
      console.warn('Failed to cancel reminder', error);
    }
  }
}

const mockExpoGo = { value: true };

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  isRunningInExpoGo: () => mockExpoGo.value,
}));

import { Platform } from 'react-native';
import { notificationsBlocked } from '../../src/features/notifications/notificationService';

function setOS(os: 'android' | 'ios'): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

describe('notificationsBlocked', () => {
  beforeEach(() => {
    mockExpoGo.value = true;
    setOS('android');
  });

  it('blocks on Android inside Expo Go', () => {
    expect(notificationsBlocked()).toBe(true);
  });

  it('does not block on iOS inside Expo Go', () => {
    setOS('ios');
    expect(notificationsBlocked()).toBe(false);
  });

  it('does not block on Android in a development build', () => {
    mockExpoGo.value = false;
    expect(notificationsBlocked()).toBe(false);
  });
});

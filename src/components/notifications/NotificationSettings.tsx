'use client'

import React, { useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { NotificationSettings as NotificationSettingsType } from '../../types/notification';

export const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    email_notifications: true,
    push_notifications: true,
    trade_notifications: true,
    league_announcements: true,
    chat_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSettingChange = async (key: keyof NotificationSettingsType, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    setIsLoading(true);
    try {
      await notificationService.updateNotificationSettings({ [key]: value });
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setMessage('Failed to update settings');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const settingLabels = {
    email_notifications: 'Email Notifications',
    push_notifications: 'Push Notifications',
    trade_notifications: 'Trade Notifications',
    league_announcements: 'League Announcements',
    chat_notifications: 'Chat Notifications',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Notification Preferences</h2>
        {message && (
          <div className={`p-3 rounded-md mb-4 ${
            message.includes('success') ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(settingLabels).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {key === 'email_notifications' && 'Receive notifications via email'}
                {key === 'push_notifications' && 'Receive browser push notifications'}
                {key === 'trade_notifications' && 'Get notified about trade offers and updates'}
                {key === 'league_announcements' && 'Get notified about league announcements'}
                {key === 'chat_notifications' && 'Get notified about new chat messages'}
              </p>
            </div>
            
            <button
              onClick={() => handleSettingChange(key as keyof NotificationSettingsType, !settings[key as keyof NotificationSettingsType])}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[key as keyof NotificationSettingsType] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[key as keyof NotificationSettingsType] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface AdminNotification {
  id: string;
  type: 'new_report' | 'ticket_reply';
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useAdminNotifications = (isAdmin: boolean) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching admin notifications:", error);
      showError("Impossibile caricare le notifiche.");
      setNotifications([]);
      setUnreadCount(0);
    } else {
      const unread = data.filter(n => !n.is_read);
      setNotifications(data as AdminNotification[]);
      setUnreadCount(unread.length);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('admin_notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          console.log('New notification received:', payload);
          fetchNotifications(); // Re-fetch all notifications on new insert
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      showError("Impossibile marcare la notifica come letta.");
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      showError("Impossibile marcare tutte le notifiche come lette.");
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [notifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead };
};
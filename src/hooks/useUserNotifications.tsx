import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface UserNotification {
  id: string;
  type: 'ticket_reply' | 'ticket_resolved'; // Added 'ticket_resolved' type
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string; // Added user_id to filter
}

export const useUserNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('admin_notifications') // Using the same table
      .select('*')
      .eq('user_id', userId) // Filter by user_id
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user notifications:", error);
      showError("Impossibile caricare le tue notifiche.");
      setNotifications([]);
      setUnreadCount(0);
    } else {
      const unread = data.filter(n => !n.is_read);
      setNotifications(data as UserNotification[]);
      setUnreadCount(unread.length);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for new notifications for this user
    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'admin_notifications',
          filter: `user_id=eq.${userId}` // Filter for specific user
        },
        (payload) => {
          console.log('New user notification received:', payload);
          fetchNotifications(); // Re-fetch all notifications on new insert
        }
      )
      .on( // Also listen for updates to mark as read
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'admin_notifications',
          filter: `user_id=eq.${userId}` // Filter for specific user
        },
        (payload) => {
          console.log('User notification updated:', payload);
          fetchNotifications(); // Re-fetch all notifications on update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user can only mark their own

    if (error) {
      console.error("Error marking user notification as read:", error);
      showError("Impossibile marcare la notifica come letta.");
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .eq('user_id', userId); // Ensure user can only mark their own

    if (error) {
      console.error("Error marking all user notifications as read:", error);
      showError("Impossibile marcare tutte le notifiche come lette.");
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, [notifications, userId]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead };
};
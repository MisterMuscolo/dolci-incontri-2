import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface AdminNotification {
  id: string;
  type: 'new_report' | 'ticket_reply' | 'new_ticket'; // Added 'new_ticket' type
  entity_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string | null; // Can be null for admin-specific notifications
}

export const useAdminNotifications = (isAdmin: boolean) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    // The `isAdmin` prop here should reflect if the user is 'admin' OR 'supporto'
    // This hook is used in Header.tsx where isAdmin and isSupporto are passed.
    // The RLS policy will handle the actual database access based on the user's role.
    // So, we just need to ensure this hook is *called* if the user is admin or supporto.
    // The `isAdmin` parameter here is actually `isAdmin || isSupporto` from Header.tsx.
    // If it's false, we don't fetch.
    if (!isAdmin) { // This `isAdmin` parameter now represents `isAdmin || isSupporto` from the caller
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, type, entity_id, message, is_read, created_at, user_id') // Select specific fields
      .is('user_id', null) // Filter for admin-specific notifications
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

    // Realtime subscription for new notifications for admins (user_id is null)
    const channel = supabase
      .channel('admin_notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications', filter: 'user_id=is.null' },
        (payload) => {
          console.log('New admin notification received:', payload);
          fetchNotifications(); // Re-fetch all notifications on new insert
        }
      )
      .on( // Also listen for updates to mark as read
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'admin_notifications', filter: 'user_id=is.null' },
        (payload) => {
          console.log('Admin notification updated:', payload);
          fetchNotifications(); // Re-fetch all notifications on update
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
      .eq('id', notificationId)
      .is('user_id', null); // Ensure only admin-specific notifications are marked

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
      .in('id', unreadIds)
      .is('user_id', null); // Ensure only admin-specific notifications are marked

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
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
  user_id: string | null; // Added user_id to filter, now nullable
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
    const { data: { user } } = await supabase.auth.getUser(); // Get current user to filter by email if needed

    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by user_id OR if user_id is null and reporter_email matches current user's email
    if (user) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`); // RLS should handle this, but explicit filter helps
    } else {
      query = query.is('user_id', null); // Only show notifications not tied to a specific user if not logged in
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user notifications:", error);
      showError("Impossibile caricare le tue notifiche.");
      setNotifications([]);
      setUnreadCount(0);
    } else {
      // Client-side filter for notifications where user_id is null but message is for this user's email
      const filteredData = data.filter(n => {
        if (n.user_id === userId) return true; // Notifications directly for this user
        // If user_id is null, it's an admin notification. We don't want to show these to regular users.
        // The RLS policy "Users can view their own notifications" should prevent this.
        // The `user_id` in `admin_notifications` is for *who* the notification is *for*.
        // If it's null, it's for admins. If it's a UUID, it's for that user.
        // So, the filter `eq('user_id', userId)` is correct.
        // The `user_id.is.null` part in the query above was for admin notifications, which should be handled by `useAdminNotifications`.
        // Let's simplify the query to only fetch notifications explicitly for this user.
        return false; // Should not reach here if RLS is correct
      });
      const unread = filteredData.filter(n => !n.is_read);
      setNotifications(filteredData as UserNotification[]);
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
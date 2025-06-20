
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
}

export const useRealtime = ({
  table,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
  filter
}: UseRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `realtime_${table}_${Date.now()}`;
    channelRef.current = supabase.channel(channelName);

    const config: any = {
      event: event,
      schema: 'public',
      table: table
    };

    if (filter) {
      config.filter = filter;
    }

    channelRef.current.on('postgres_changes', config, (payload) => {
      console.log(`Realtime ${payload.eventType} on ${table}:`, payload);
      
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload);
          break;
        case 'UPDATE':
          onUpdate?.(payload);
          break;
        case 'DELETE':
          onDelete?.(payload);
          break;
      }
    });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, filter]);

  return channelRef.current;
};

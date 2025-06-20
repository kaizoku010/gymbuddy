
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LocationData {
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setLocation(newLocation);
        
        // Update user's location in database
        if (user) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                location_updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
              
            if (error) {
              console.error('Error updating location:', error);
            }
          } catch (err) {
            console.error('Error updating location:', err);
          }
        }
        
        setIsLoading(false);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, [user]);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation
  };
};

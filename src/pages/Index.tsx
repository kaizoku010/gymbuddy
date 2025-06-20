
import React, { useState, useEffect } from 'react';
import AuthStack from '../components/AuthStack';
import OnboardingStack from '../components/OnboardingStack';
import MainTabs from '../components/MainTabs';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('hasSeenOnboarding');
    setShowOnboarding(true);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't seen it and isn't authenticated
  if (!user && showOnboarding) {
    return <OnboardingStack onComplete={handleOnboardingComplete} />;
  }

  // Show auth if user isn't authenticated
  if (!user) {
    return <AuthStack onAuthComplete={() => {}} />;
  }

  // Show main app if user is authenticated
  return <MainTabs onLogout={handleLogout} />;
};

export default Index;

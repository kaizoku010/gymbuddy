
import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthStackProps {
  onAuthComplete: () => void;
}

const AuthStack: React.FC<AuthStackProps> = ({ onAuthComplete }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  // Test user credentials
  const testUsers = [
    { email: 'test1@gymie.com', password: 'test123456', name: 'Alex Fitness' },
    { email: 'test2@gymie.com', password: 'test123456', name: 'Sarah Strong' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.phoneNumber
        );
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        
        onAuthComplete();
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async (testUser: typeof testUsers[0]) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(testUser.email, testUser.password);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          // User likely doesn't exist, so let's create them
          const { error: signUpError } = await signUp(
            testUser.email,
            testUser.password,
            testUser.name,
            '' // Phone number is not available for test users
          );

          if (signUpError) {
            // Handle cases where signup might fail (e.g. password policy)
            throw signUpError;
          }

          toast({
            title: "Test Account Created",
            description: "The test account has been set up. Please click the button again to log in. If login still fails, you may need to disable 'Confirm email' in your Supabase project's auth settings for testing.",
          });

        } else {
          // Another type of error occurred during sign-in
          throw error;
        }
      } else {
        // Sign in successful
        onAuthComplete();
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-orange-500 mb-2">Gymie</div>
          <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Join the fitness community' : 'Sign in to continue your journey'}
          </p>
        </div>

        {/* Test Users Section - Only show for sign in */}
        {!isSignUp && (
          <div className="mb-6 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="text-xs font-medium text-orange-700 mb-2 text-center">Quick Test Login</h3>
            <div className="grid grid-cols-2 gap-2">
              {testUsers.map((user, index) => (
                <button
                  key={index}
                  onClick={() => handleTestLogin(user)}
                  disabled={isLoading}
                  className="text-xs bg-white hover:bg-orange-50 text-orange-700 py-2 px-3 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your full name"
                required={isSignUp}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your phone number"
                required={isSignUp}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors pr-12"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="text-right">
              <button type="button" className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors">
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold text-base hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Social Login
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <button className="flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">🍎</span>
            </button>
            <button className="flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📧</span>
            </button>
            <button className="flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">👥</span>
            </button>
          </div>
        </div> */}

        {/* Switch Auth Mode */}
        <div className="mt-6 text-center">
          <span className="text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-orange-500 font-medium hover:text-orange-600 transition-colors"
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {isSignUp && (
          <div className="mt-4 text-center text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <button className="text-orange-500 underline hover:text-orange-600 transition-colors">Terms of Service</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthStack;

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      await login(data.username, data.password);
    } catch (error: any) {
      setLoginError(
        error.response?.data?.message || 'Invalid username or password'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 dark:bg-gray-700 text-white w-12 h-12 rounded flex items-center justify-center text-2xl font-bold">
            DTS
          </div>
        </div>
        
        {/* Sign in text */}
        <h1 className="text-center text-2xl font-semibold text-gray-900 dark:text-white mb-8">
          Login
        </h1>
        
        {/* Login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {loginError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {loginError}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Username/Email field */}
          <div>
            <div className="relative">
              <input
                id="username"
                type="text"
                placeholder="Email address"
                autoComplete="username"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                  errors.username ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                {...register('username')}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username.message}
              </p>
            )}
          </div>
          
          {/* Password field */}
          <div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                  errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>
          
          {/* Sign in button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium transition-colors duration-200 mt-6"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          {/* Forgot password link
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              Forgot your password?
            </button>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 
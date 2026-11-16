import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data) => {
    const result = await login({
      email: data.email,
      password: data.password
    });

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs mb-3">
          <Layers className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back to StockFlow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to access your organization workspace
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200/90 rounded-2xl shadow-xs">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5" noValidate>
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              leftIcon={Mail}
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={Lock}
              required
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  {...register('rememberMe')}
                />
                <span>Remember me</span>
              </label>

              <span className="text-slate-400 select-none">
                Default: 7-day session
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isSubmitting}
                rightIcon={ArrowRight}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an organization account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Multi-tenant note footer */}
        <p className="mt-5 text-center text-[11px] text-slate-400">
          Protected by Row-Level Logical Tenant Isolation and JWT verification.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

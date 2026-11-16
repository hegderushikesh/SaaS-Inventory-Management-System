import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Building2, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { signupSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';

export const SignupPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      organizationName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    const result = await registerUser({
      name: data.name,
      organizationName: data.organizationName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs mb-3">
          <Layers className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Create your StockFlow organization
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Get started with modern inventory control and low-stock alerts
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200/90 rounded-2xl shadow-xs">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Jane Doe"
              leftIcon={User}
              required
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Organization Name */}
            <Input
              label="Organization Name"
              type="text"
              placeholder="e.g. Acme Electronics Inc."
              leftIcon={Building2}
              required
              helperText="Your isolated multi-tenant company workspace"
              error={errors.organizationName?.message}
              {...register('organizationName')}
            />

            {/* Email Address */}
            <Input
              label="Work Email"
              type="email"
              placeholder="you@company.com"
              leftIcon={Mail}
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              leftIcon={Lock}
              required
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              leftIcon={CheckCircle2}
              required
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

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
                Create Account
              </Button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Multi-tenant note footer */}
        <p className="mt-5 text-center text-[11px] text-slate-400">
          StockFlow guarantees row-level logical data isolation per organization.
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

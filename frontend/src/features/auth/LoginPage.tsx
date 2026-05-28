import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { Keyboard, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useLogin } from "@/hooks/useAuthMutations";

const schema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    login.mutate(data);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 mb-3">
            <Keyboard className="size-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Typeshala account</p>
        </div>

        {location.state && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            Please sign in to access that page.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Username or Email"
            placeholder="your_username or you@example.com"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register("password")}
          />

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-brand-600 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={login.isPending}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Sign up for free
          </Link>
        </div>
      </Card>
    </div>
  );
}

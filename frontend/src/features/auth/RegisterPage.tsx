import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Keyboard, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useRegister } from "@/hooks/useAuthMutations";

const schema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
    email: z.string().email("Enter a valid email address"),
    fullName: z.string().optional(),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/\d/, "Must contain at least one digit"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch("password", "");

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    });
  };

  // Password strength indicator
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 mb-3">
            <Keyboard className="size-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join Typeshala — it&apos;s free</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Username"
            placeholder="cool_typist"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Full Name (optional)"
            placeholder="Jane Doe"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
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
            {/* Strength bar */}
            {password && (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength ? strengthColors[strength] : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{strengthLabels[strength]}</span>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={registerMutation.isPending}
          >
            Create Account
          </Button>

          <p className="text-center text-xs text-gray-400">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-gray-600">Terms</Link> and{" "}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Keyboard, Zap, Trophy, BarChart2, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/auth.store";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time Feedback",
    description: "Instant WPM, accuracy, and error highlighting as you type — zero lag.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn XP, unlock badges, climb leaderboards, and maintain streaks.",
  },
  {
    icon: BarChart2,
    title: "Deep Analytics",
    description: "Track progress over time with WPM trends, heatmaps, and mistake analysis.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description: "Practice in English, Nepali, Hindi — with more languages coming.",
  },
];

const STATS = [
  { label: "Active Users", value: "10K+" },
  { label: "Lessons", value: "500+" },
  { label: "Languages", value: "3" },
  { label: "Avg. WPM Gain", value: "+25%" },
];

export function HomePage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-400">
            🚀 Free to use. No credit card required.
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Type faster.{" "}
            <span className="text-brand-500">Think clearer.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Typeshala is a production-grade typing tutor with multi-language support, gamification,
            and deep analytics — built for beginners and advanced typists alike.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" as={Link} to="/lessons" rightIcon={<ArrowRight className="size-5" />}>
              Start Typing Now
            </Button>
            {isAuthenticated ? (
              <Button size="lg" variant="outline" as={Link} to="/game">
                ⚔️ Play Ramayana Battle
              </Button>
            ) : (
              <Button size="lg" variant="outline" as={Link} to="/register">
                Create Free Account
              </Button>
            )}
          </div>
        </motion.div>

        {/* Inline typing preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-yellow-400" />
            <span className="size-3 rounded-full bg-green-400" />
          </div>
          <p className="font-mono text-lg leading-relaxed">
            <span className="text-correct">The quick brown fox </span>
            <span className="text-incorrect">j</span>
            <span className="border-r-2 border-cursor animate-cursor-blink text-pending">
              umps over the lazy dog.
            </span>
          </p>
          <div className="mt-6 flex gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-500">72</p>
              <p className="text-xs text-gray-500">WPM</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">97%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">0:30</p>
              <p className="text-xs text-gray-500">Time</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-brand-50 p-6 text-center dark:bg-brand-950/30">
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{value}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Everything you need to master typing
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Built like a real SaaS product — because practice deserves great tooling.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-brand-100 p-3 dark:bg-brand-950">
                  <Icon className="size-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-brand-500 px-8 py-16 text-center text-white">
        <Keyboard className="mx-auto mb-4 size-12 opacity-80" />
        <h2 className="text-3xl font-bold">Ready to type faster?</h2>
        <p className="mt-3 text-brand-100">
          {isAuthenticated
            ? "Keep practising to climb the leaderboard and hit new records."
            : "Join thousands of typists improving their speed and accuracy every day."}
        </p>
        {isAuthenticated ? (
          <Button
            size="lg"
            variant="secondary"
            as={Link}
            to="/lessons"
            className="mt-8 text-brand-700"
          >
            Browse Lessons
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            as={Link}
            to="/register"
            className="mt-8 text-brand-700"
          >
            Get Started for Free
          </Button>
        )}
      </section>
    </div>
  );
}

/**
 * Typing practice page — placeholder for Phase 3 engine.
 */
import { Keyboard } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

export function TypingPage() {
  return (
    <div className="space-y-6">
      <CardHeader title="Practice" description="Choose a lesson and start typing" />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Keyboard className="mb-4 size-16 text-brand-400 opacity-50" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
            Typing Engine — Phase 3
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            The full typing engine with WPM, accuracy, and real-time feedback will be built in Phase 3.
          </p>
        </div>
      </Card>
    </div>
  );
}

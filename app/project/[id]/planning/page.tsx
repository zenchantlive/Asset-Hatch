import { ChatInterface } from "@/components/planning/ChatInterface";

export default function PlanningPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          Planning Phase
        </h2>
        <ChatInterface />
      </div>
    </div>
  );
}

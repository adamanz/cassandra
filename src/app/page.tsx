import { CalendarClock, LogIn } from 'lucide-react';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { auth0 } from '@/lib/auth0';


export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-2">
        <CalendarClock className="h-12 w-12 text-blue-500" />
        <h2 className="text-xl font-medium">Calendar Assistant</h2>
        <Button asChild variant="default" size="lg">
          <a href="/auth/login?connection=google-oauth2&access_type=offline&prompt=consent" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>Login with Google</span>
          </a>
        </Button>
      </div>
    );
  }

  const InfoCard = (
    <div className="bg-gray-50 p-4 rounded-lg border max-w-lg mx-auto">
      <div className="mb-2 font-medium">Try these commands:</div>
      <ul className="space-y-1 text-sm">
        <li><code>What meetings do I have tomorrow?</code></li>
        <li><code>Schedule team meeting Tuesday at 2pm</code></li>
        <li><code>Do I have any conflicts this week?</code></li>
        <li><code>sendblue</code> (find meetings with company name)</li>
        <li><code>acme</code> (works with just a keyword)</li>
      </ul>
    </div>
  );

  return (
    <>
      <ChatWindow
        endpoint="api/chat"
        emoji="📅"
        placeholder="Ask me about your calendar..."
        emptyStateComponent={InfoCard}
      />
    </>
  );
}

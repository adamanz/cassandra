import { ChatArea } from '@/components/playground/ChatArea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { auth0 } from '@/lib/auth0';


export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-2">
        <Icon type="calendar" size="lg" className="text-blue-500 h-12 w-12" />
        <h2 className="text-xl font-medium">Calendar Assistant</h2>
        <Button asChild variant="default" size="lg">
          <a href="/auth/login?connection=google-oauth2&access_type=offline&prompt=consent" className="flex items-center gap-2">
            <Icon type="login" size="sm" />
            <span>Login with Google</span>
          </a>
        </Button>
      </div>
    );
  }

  const InfoCard = (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-primary/10 shadow-lg max-w-lg mx-auto">
      <div className="mb-3 font-semibold text-lg text-primary flex items-center gap-2">
        <Icon type="agent" size="sm" />
        Try these commands:
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">What meetings do I have tomorrow?</code>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">Schedule team meeting Tuesday at 2pm</code>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">Do I have any conflicts this week?</code>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">sendblue</code>
          <span className="text-muted-foreground">(find meetings with company)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">acme</code>
          <span className="text-muted-foreground">(works with just a keyword)</span>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ChatArea />
    </div>
  );
}

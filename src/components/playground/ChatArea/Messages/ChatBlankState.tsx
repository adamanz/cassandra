import { CalendarClock } from 'lucide-react'

const ChatBlankState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarClock className="mb-4 h-12 w-12 text-blue-500" />
      <h2 className="mb-2 text-xl font-semibold">Cassandra: Your Calendar Assistant</h2>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        I can help you manage your calendar events. Try asking me to find meetings or create new events.
      </p>
      <div className="space-y-2 text-left">
        <p className="text-sm text-gray-600 dark:text-gray-400">Examples:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>What meetings do I have tomorrow?</li>
          <li>Find my SendBlue meeting</li>
          <li>Schedule a team meeting on Tuesday at 2pm</li>
          <li>Show me my calendar for next week</li>
        </ul>
      </div>
    </div>
  )
}

export default ChatBlankState
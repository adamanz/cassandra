import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface AgentThinkingLoaderProps {
  className?: string;
}

export const AgentThinkingLoader: React.FC<AgentThinkingLoaderProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <motion.div
        className="flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
      <span className="text-sm text-muted animate-pulse">Thinking...</span>
    </div>
  );
};

AgentThinkingLoader.displayName = 'AgentThinkingLoader';
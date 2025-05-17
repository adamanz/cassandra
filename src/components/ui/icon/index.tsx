import React from 'react';
import { cn } from '@/utils/cn';
import { CalendarClock, LogIn, User, Bot, Loader2 } from 'lucide-react';

export type IconType = 'calendar' | 'login' | 'user' | 'agent' | 'loader';

interface IconProps {
  type: IconType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const iconComponents = {
  calendar: CalendarClock,
  login: LogIn,
  user: User,
  agent: Bot,
  loader: Loader2,
};

export const Icon: React.FC<IconProps> = ({ type, size = 'md', className }) => {
  const IconComponent = iconComponents[type];
  
  if (!IconComponent) {
    console.warn(`Icon type "${type}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      className={cn(
        sizeClasses[size],
        type === 'loader' && 'animate-spin',
        className
      )} 
    />
  );
};

export default Icon;
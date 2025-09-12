import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTheme } from '../contexts/ThemeContext';

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export const ThemeToggle = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const CurrentIcon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 border border-border/40 hover:border-border/80 transition-all duration-200"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CurrentIcon className={`h-4 w-4 ${
                actualTheme === 'dark' ? 'text-neon-cyan' : 'text-primary'
              }`} />
            </motion.div>
          </AnimatePresence>
          
          {/* Animated background */}
          <motion.div
            className={`absolute inset-0 rounded-md ${
              actualTheme === 'dark' 
                ? 'bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10' 
                : 'bg-gradient-to-br from-primary/10 to-secondary/20'
            }`}
            initial={false}
            animate={{
              opacity: theme === 'system' ? 0.8 : 0.5,
            }}
            transition={{ duration: 0.2 }}
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-36">
        {(Object.entries(themeIcons) as Array<[keyof typeof themeIcons, any]>).map(([themeOption, Icon]) => (
          <DropdownMenuItem
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            className={`cursor-pointer ${
              theme === themeOption ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <span>{themeLabels[themeOption]}</span>
              {theme === themeOption && (
                <motion.div
                  className="ml-auto w-1 h-1 bg-neon-cyan rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
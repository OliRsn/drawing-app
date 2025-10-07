import { useEffect } from 'react';
import { useTheme } from '@heroui/use-theme';

export const ForceLightTheme = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return <>{children}</>;
};

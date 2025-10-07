import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

import { AuthProvider } from '@/contexts/AuthContext';
import { ForceLightTheme } from "@/components/ForceLightTheme";

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ForceLightTheme>
        <AuthProvider>{children}</AuthProvider>
      </ForceLightTheme>
    </HeroUIProvider>
  );
}

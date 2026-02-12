'use client';

import { useInstallPrompt } from '@/lib/hooks/use-install-prompt';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function PWAInstallButton() {
  const { isInstallable, promptInstall } = useInstallPrompt();

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={promptInstall}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      <Download className="mr-2 h-4 w-4" />
      Ilovani o'rnatish
    </Button>
  );
}

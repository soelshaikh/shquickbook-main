import { forwardRef } from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Sun, Moon, Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePagePerformance } from '@/hooks/usePerformance';

const Settings = forwardRef<HTMLDivElement>((_, ref) => {
  usePagePerformance('Settings');
  const { theme, toggleTheme } = useThemeContext();
  const { disconnect } = useConnection();

  return (
    <div ref={ref} className="p-4 max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">Settings</h1>
      
      <div className="space-y-4">
        {/* Theme Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Appearance</CardTitle>
            <CardDescription className="text-xs">
              Customize how the app looks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Toggle
                <span className="ml-2 kbd text-[10px]">⌘L</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QBO Connection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">QuickBooks Online</CardTitle>
            <CardDescription className="text-xs">
              Manage your QuickBooks connection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Connected</p>
                  <p className="text-xs text-muted-foreground">Demo Company</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={disconnect}
              >
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';

export default Settings;

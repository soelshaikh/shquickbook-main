import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConnection } from '@/contexts/ConnectionContext';
import { usePagePerformance } from '@/hooks/usePerformance';

export default function Connect() {
  usePagePerformance('Connect');
  const { connect } = useConnection();

  const handleConnect = () => {
    // Simulate OAuth flow
    connect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LinkIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Connect to QuickBooks</CardTitle>
          <CardDescription className="text-xs">
            Link your QuickBooks Online account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="sm" onClick={handleConnect}>
            Connect to QuickBooks Online
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            You'll be redirected to Intuit to authorize access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

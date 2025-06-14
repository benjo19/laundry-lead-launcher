
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class LanguageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('LanguageErrorBoundary: Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LanguageErrorBoundary: Component error:', error, errorInfo);
  }

  handleReset = () => {
    console.log('LanguageErrorBoundary: Resetting error state');
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-sm sm:max-w-md w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl">
                <AlertTriangle className="h-5 w-5" />
                <span>Language System Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm sm:text-base">
                There was an error with the language system. The app will continue in basic mode.
              </p>
              {this.state.error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-medium break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LanguageErrorBoundary;

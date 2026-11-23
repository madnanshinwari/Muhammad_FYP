import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto card-elevation-2 rounded-3xl p-8 bg-white border border-red-200 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-[#111d23] mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                  An unexpected error occurred. Our team has been notified. Please try refreshing the page or returning to home.
                </p>

                {this.state.error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-mono mb-4">
                    <p className="font-bold mb-1">Error Details:</p>
                    <p>{this.state.error.toString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>

              <Button
                variant="secondary"
                onClick={this.handleReload}
                className="flex-1"
              >
                <span>Return Home</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

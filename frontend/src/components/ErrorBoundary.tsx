'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatWindow Error Boundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#16161a] border border-red-900/50 rounded-2xl p-8 text-center text-white shadow-2xl flex flex-col items-center justify-center h-[500px]">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-500 text-2xl mb-4 animate-pulse">
            ⚠️
          </div>
          <h3 className="text-xl font-bold mb-2">Voice Session Interrupted</h3>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            An unexpected error occurred in the audio/chat renderer.
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-red-900 hover:bg-red-800 text-white font-medium text-sm rounded-xl transition-colors shadow-lg"
          >
            🔄 Restart Session
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
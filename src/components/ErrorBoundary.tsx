import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode; // Specify that children is a React node
  msg: string; // Error message to display in case of an error
}

interface ErrorBoundaryState {
  hasError: boolean; // State to track errors
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>{this.props.msg}</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <span className="text-red-400 text-3xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Une erreur est survenue'}
          </h2>
          <p className="text-white/50 mb-6 max-w-sm">
            {this.props.fallbackMessage || 'Veuillez réessayer ou retourner au menu.'}
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button
              variant="gold"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              {this.props.retryLabel || "Retour à l'accueil"}
            </Button>
            {this.props.onRetry && (
              <Button variant="outline" onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onRetry();
              }}>
                {this.props.retryLabel || 'Réessayer'}
              </Button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-fallback">
          <h1>Something went wrong while opening this chat.</h1>
          <p>{this.state.error.message}</p>
          <button className="button primary" onClick={() => window.location.reload()} type="button">
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

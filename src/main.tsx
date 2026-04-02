import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const RELOAD_KEY = 'shivai_chunk_reload';

// Layer 1: Vite module preload error — fires before React rendering even starts.
// This catches the earliest possible chunk failure (e.g. stale module preload link).
window.addEventListener('vite:preloadError', (event) => {
  (event as Event).preventDefault?.();
  if (!sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, '1');
    window.location.reload();
  }
});

// Layer 2: React error boundary — catches ChunkLoadError thrown inside React's
// render tree (lazy() import rejections that bubble up through Suspense).
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  // Clear the reload guard once the app renders successfully so that a second
  // deployment in the same browser session can also auto-reload.
  componentDidMount() {
    sessionStorage.removeItem(RELOAD_KEY);
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /loading chunk|failed to fetch dynamically imported module|importing a module script failed/i.test(
        error?.message || ''
      );
    if (isChunkError) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    }
    this.setState({ hasError: true });
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <p style={{ color: '#475569', marginBottom: '12px' }}>Something went wrong loading the page.</p>
          <button
            onClick={() => { sessionStorage.removeItem(RELOAD_KEY); window.location.reload(); }}
            style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ChunkErrorBoundary>
    <App />
  </ChunkErrorBoundary>
);

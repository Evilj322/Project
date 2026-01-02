import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error Boundary to prevent blank screens on crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0A0A0C',
          color: 'white',
          padding: 20,
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#FF6B6B', marginBottom: 16 }}>😵 Что-то пошло не так</h2>
          <p style={{ color: '#94A3B8', marginBottom: 24 }}>
            Произошла ошибка. Попробуйте обновить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '50px',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Обновить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  componentName?: string;
}

/**
 * Zentrale Fallback-UI für schwerwiegende Fehler
 *
 * Wird angezeigt, wenn eine kritische Komponente crashed
 * und bietet Optionen zum Neuladen oder Zurücksetzen
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  componentName = 'Anwendung',
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      handleReload();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          border: '2px solid #ff4444',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>⚠️</div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#ff4444' }}>
            Ein Fehler ist aufgetreten
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#cccccc' }}>
            Die {componentName} konnte nicht geladen werden.
          </p>
        </div>

        {error && (
          <details
            style={{
              marginBottom: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#ff8888',
              }}
            >
              Fehlerdetails anzeigen
            </summary>
            <pre
              style={{
                margin: '10px 0 0 0',
                padding: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '12px',
                color: '#ffcccc',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff6666')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff4444')}
          >
            🔄 Erneut versuchen
          </button>

          <button
            onClick={handleReload}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')
            }
          >
            ↻ Seite neu laden
          </button>
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#cccccc',
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>💡 Tipps:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Versuche die Seite neu zu laden</li>
            <li>Prüfe deine Internetverbindung</li>
            <li>Lösche den Browser-Cache</li>
            <li>Öffne die Konsole (F12) für detaillierte Fehlerinfos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Kompakte Fehlermeldung für kleinere Komponenten
 */
export const CompactErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  componentName = 'Komponente',
}) => {
  return (
    <div
      style={{
        padding: '15px',
        margin: '10px 0',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        border: '1px solid #ff4444',
        borderRadius: '8px',
        color: '#ff4444',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <strong>{componentName} konnte nicht geladen werden</strong>
      </div>

      {error && (
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#ffaaaa' }}>
          {error.message}
        </p>
      )}

      {resetError && (
        <button
          onClick={resetError}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
          }}
        >
          🔄 Erneut versuchen
        </button>
      )}
    </div>
  );
};

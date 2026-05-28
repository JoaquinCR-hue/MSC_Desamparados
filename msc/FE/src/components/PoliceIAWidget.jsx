/**
 * Police-IA Widget
 * Chat flotante inteligente para seguridad comunitaria
 * Integrado en todas las páginas del sistema MSC Desamparados
 */

import React, { useState, useEffect, useRef } from 'react';
import { runPoliceIA } from '../agents/policeIAAgent';
import { getUserLocation } from '../services/gpsService';
import policeIAImage from '../agents/ChatGPT Image 23 may 2026, 09_16_36.png';
import '../styles/PoliceIAWidget.css';

const PoliceIAWidget = () => {
  // Estado del widget
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showSOSAlert, setShowSOSAlert] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [userSession, setUserSession] = useState(null); // Para forzar re-render

  // Referencias
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  /**
   * Obtener usuario del sessionStorage
   */
  const getUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  // Monitorear cambios en sessionStorage (cuando el usuario hace login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const newUser = getUser();
      setUserSession(newUser);
    };

    // Crear un observer para sessionStorage usando MutationObserver en window
    // Alternativa: usar un evento custom
    window.addEventListener('user-login', handleStorageChange);
    window.addEventListener('user-logout', handleStorageChange);
    
    // También revisar al montar el componente
    const initialUser = getUser();
    setUserSession(initialUser);

    return () => {
      window.removeEventListener('user-login', handleStorageChange);
      window.removeEventListener('user-logout', handleStorageChange);
    };
  }, []);

  const user = userSession || getUser();
  const userRole = user?.role || 'ciudadano';
  const userId = user?.id || 0;

  /**
   * Scroll automático al último mensaje
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Monitorear cambios de tema
   */
  useEffect(() => {
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme') || 'dark';
      setTheme(newTheme);
    };

    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  /**
   * Obtener ubicación al abrir el widget
   */
  useEffect(() => {
    if (isOpen && !userLocation) {
      getUserLocation()
        .then(location => {
          setUserLocation(location);
          setHasError(false);
          
          // Agregar mensaje de bienvenida
          const welcomeMsg = `Hola, soy Police-IA. Detecté tu ubicación en Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}. ¿Cómo puedo ayudarte hoy?`;
          setMessages([
            {
              role: 'assistant',
              text: welcomeMsg,
              timestamp: new Date()
            }
          ]);
        })
        .catch(error => {
          setHasError(true);
          setMessages([
            {
              role: 'assistant',
              text: `Error: ${error.message}. Puedo ayudarte sin ubicación, pero algunas funciones serán limitadas.`,
              timestamp: new Date()
            }
          ]);
        });
    }
  }, [isOpen, userLocation]);

  /**
   * Enviar mensaje al agente
   */
  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMsg = {
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Actualizar historial de conversación
      const newHistory = [
        ...conversationHistory,
        {
          role: 'user',
          content: text
        }
      ];

      // Llamar al agente Police-IA
      const response = await runPoliceIA({
        userMessage: text,
        userLocation: userLocation || { lat: 9.795, lng: -84.087 }, // Desamparados default
        userRole: userRole,
        conversationHistory: newHistory
      });

      // Agregar respuesta del agente
      const assistantMsg = {
        role: 'assistant',
        text: response.text,
        timestamp: new Date(),
        toolsUsed: response.toolsUsed || []
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Actualizar historial
      const updatedHistory = [
        ...newHistory,
        {
          role: 'assistant',
          content: response.text
        }
      ];
      setConversationHistory(updatedHistory);

      // Detectar si hay SOS o peligro inmediato
      if (
        response.text.toLowerCase().includes('sos') ||
        response.text.toLowerCase().includes('peligro inmediato') ||
        response.text.toLowerCase().includes('botón sos')
      ) {
        setShowSOSAlert(true);
      }

      setHasError(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMsg = {
        role: 'assistant',
        text: `Error: ${error.message}. Por favor intenta de nuevo.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Acciones rápidas
   */
  const quickActions = [
    {
      icon: '📍',
      label: '¿Qué tan segura es mi ubicación actual?',
      action: () => sendMessage('📍 ¿Qué tan segura es mi ubicación actual?')
    },
    {
      icon: '🛡️',
      label: 'Necesito calcular una ruta segura a mi destino',
      action: () => sendMessage('🛡️ Necesito calcular una ruta segura a mi destino')
    },
    {
      icon: '⚠️',
      label: 'Quiero reportar un incidente en mi ubicación actual',
      action: () => sendMessage('⚠️ Quiero reportar un incidente en mi ubicación actual')
    }
  ];

  // No renderizar si el usuario no está autenticado
  if (!user) {
    return null;
  }

  const isDarkMode = theme === 'dark';

  return (
    <>
      {/* Alerta SOS */}
      {showSOSAlert && (
        <div 
          className="police-ia-sos-alert"
          style={{
            backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
            borderColor: isDarkMode ? '#dc2626' : '#fca5a5'
          }}
        >
          <div className="police-ia-sos-content">
            <span style={{ fontSize: '20px', marginRight: '10px' }}>🚨</span>
            <div>
              <strong>¡Situación de Emergencia Detectada!</strong>
              <p style={{ marginTop: '5px', fontSize: '14px' }}>
                Mantén presionado el botón SOS en la parte superior derecha o llama al 911
              </p>
            </div>
          </div>
          <button
            className="police-ia-sos-close"
            onClick={() => setShowSOSAlert(false)}
            style={{ color: isDarkMode ? '#dc2626' : '#dc2626' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Botón flotante - Cerrado */}
      {!isOpen && (
        <button
          className="police-ia-button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Police-IA"
          title="Abre Police-IA para obtener ayuda"
          style={{
            backgroundColor: 'transparent',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
            padding: 0,
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          <img 
            src={policeIAImage} 
            alt="Police-IA" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={(e) => {
              // Si falla la imagen, mostrar emoji como respaldo
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="font-size: 24px;">🛡️</span>';
            }}
          />
        </button>
      )}

      {/* Panel de chat - Abierto */}
      {isOpen && (
        <div
          className="police-ia-widget"
          style={{
            backgroundColor: isDarkMode ? '#111111' : '#ffffff',
            borderColor: isDarkMode ? '#1a1a1a' : '#e5e7eb'
          }}
        >
          {/* Header */}
          <div
            className="police-ia-header"
            style={{
              backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
              borderBottomColor: isDarkMode ? '#2a2a2a' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px'
            }}
          >
            {/* Imagen del agente */}
            <img 
              src={policeIAImage} 
              alt="Police-IA" 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
            
            {/* Información del agente */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#1f2937' }}>
                Police-IA
              </h3>
              <div
                className="police-ia-status"
                style={{ color: isDarkMode ? '#86efac' : '#22c55e', fontSize: '12px' }}
              >
                ● En línea
              </div>
            </div>
            
            <button
              className="police-ia-close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar Police-IA"
              style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div
            className="police-ia-messages"
            ref={messagesContainerRef}
            style={{
              backgroundColor: isDarkMode ? '#111111' : '#ffffff'
            }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div
                className="police-ia-welcome"
                style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}
              >
                <p>Bienvenido a Police-IA</p>
                <small>Selecciona una acción rápida abajo o escribe tu consulta</small>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`police-ia-message police-ia-${msg.role}`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="police-ia-bubble police-ia-assistant"
                    style={{
                      backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      borderLeftColor: '#F97316'
                    }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className="police-ia-bubble police-ia-user"
                    style={{
                      backgroundColor: '#F97316',
                      color: 'white'
                    }}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="police-ia-message police-ia-assistant">
                <div
                  className="police-ia-bubble police-ia-assistant police-ia-typing"
                  style={{
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937'
                  }}
                >
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              </div>
            )}

            {hasError && (
              <div
                className="police-ia-error"
                style={{
                  backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                  borderColor: isDarkMode ? '#dc2626' : '#fca5a5',
                  color: isDarkMode ? '#fca5a5' : '#991b1b'
                }}
              >
                ⚠️ Error de conexión. Intenta de nuevo.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Acciones rápidas */}
          <div
            className="police-ia-quick-actions"
            style={{
              backgroundColor: isDarkMode ? '#0a0a0a' : '#f9fafb',
              borderTopColor: isDarkMode ? '#1a1a1a' : '#e5e7eb'
            }}
          >
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="police-ia-quick-btn"
                onClick={action.action}
                disabled={isLoading}
                title={action.label}
                style={{
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                  color: '#F97316',
                  borderColor: isDarkMode ? '#1a1a1a' : '#d1d5db'
                }}
              >
                <span>{action.icon}</span>
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="police-ia-input-area"
            style={{
              backgroundColor: isDarkMode ? '#0a0a0a' : '#f9fafb',
              borderTopColor: isDarkMode ? '#1a1a1a' : '#e5e7eb'
            }}
          >
            <input
              type="text"
              className="police-ia-input"
              placeholder="Escribe tu mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              style={{
                backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                borderColor: isDarkMode ? '#2a2a2a' : '#d1d5db'
              }}
            />
            <button
              className="police-ia-send"
              onClick={() => sendMessage()}
              disabled={isLoading || !inputText.trim()}
              aria-label="Enviar mensaje"
              style={{
                backgroundColor: '#F97316',
                opacity: isLoading || !inputText.trim() ? 0.5 : 1
              }}
            >
              ➜
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PoliceIAWidget;

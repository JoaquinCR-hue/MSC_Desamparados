import React, { useState, useEffect } from 'react';
import '../../styles/VoiceInput.css'; 

const VoiceInput = ({ onResult, placeholder = "Habla ahora..." }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'es-CR'; // Set to Spanish (Costa Rica)

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [onResult]);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      if (recognition) {
        recognition.start();
      } else {
        alert("Tu navegador no soporta el dictado por voz.");
      }
    }
  };

  return (
    <button
      type="button"
      className={`voice-input-btn ${isListening ? 'listening' : ''}`}
      onClick={toggleListening}
      title={isListening ? 'Detener dictado' : 'Dictar por voz'}
    >
      <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
    </button>
  );
};

export default VoiceInput;

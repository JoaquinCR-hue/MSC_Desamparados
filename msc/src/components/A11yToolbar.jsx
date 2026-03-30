import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/A11yToolbar.css';

const A11yToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => JSON.parse(localStorage.getItem('a11y_largeText')) || false);
  const [highContrast, setHighContrast] = useState(() => JSON.parse(localStorage.getItem('a11y_highContrast')) || false);
  const [grayscale, setGrayscale] = useState(() => JSON.parse(localStorage.getItem('a11y_grayscale')) || false);
  const [highlightLinks, setHighlightLinks] = useState(() => JSON.parse(localStorage.getItem('a11y_highlightLinks')) || false);
  const [textToSpeech, setTextToSpeech] = useState(() => JSON.parse(localStorage.getItem('a11y_textToSpeech')) || false);

  // Persistir el estado cada vez que cambie
  useEffect(() => {
    localStorage.setItem('a11y_largeText', JSON.stringify(largeText));
    localStorage.setItem('a11y_highContrast', JSON.stringify(highContrast));
    localStorage.setItem('a11y_grayscale', JSON.stringify(grayscale));
    localStorage.setItem('a11y_highlightLinks', JSON.stringify(highlightLinks));
    localStorage.setItem('a11y_textToSpeech', JSON.stringify(textToSpeech));
  }, [largeText, highContrast, grayscale, highlightLinks, textToSpeech]);

  // Apply classes to DOM dynamically
  useEffect(() => {
    const htmlObj = document.documentElement;
    const bodyObj = document.body;
    const rootObj = document.getElementById('root');

    // Large text on HTML (so rem scales)
    if (largeText) htmlObj.classList.add('a11y-large-text');
    else htmlObj.classList.remove('a11y-large-text');

    // High Contrast on #root
    if (highContrast) rootObj?.classList.add('a11y-high-contrast');
    else rootObj?.classList.remove('a11y-high-contrast');

    // Grayscale on #root
    if (grayscale) rootObj?.classList.add('a11y-grayscale');
    else rootObj?.classList.remove('a11y-grayscale');

    // Highlight links on Body
    if (highlightLinks) bodyObj.classList.add('a11y-highlight-links');
    else bodyObj.classList.remove('a11y-highlight-links');

  }, [largeText, highContrast, grayscale, highlightLinks]);

  // Handle Text-to-Speech on hover
  useEffect(() => {
    let speakTimeout;

    const handleMouseOver = (e) => {
      if (!textToSpeech) return;
      
      const target = e.target;
      const validTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'BUTTON', 'SPAN', 'LABEL', 'LI', 'STRONG', 'B', 'INPUT', 'SELECT', 'TEXTAREA'];
      
      if (validTags.includes(target.tagName) || target.role === 'button' || target.role === 'link') {
        // Prevent reading massive body blocks, get specific text
        let text = target.getAttribute('aria-label') || 
                   (target.getAttribute('data-no-tts-placeholder') ? null : target.placeholder) || 
                   target.title || 
                   target.innerText;
        
        if (text && text.trim().length > 0 && text.length < 300) {
          window.speechSynthesis.cancel(); // Stop current speaking
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-ES'; // Spanish voice
          utterance.rate = 1.0;
          
          speakTimeout = setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 400); // 400ms delay to avoid stuttering on quick movements
        }
      }
    };

    const handleMouseOut = () => {
      clearTimeout(speakTimeout);
    };

    if (textToSpeech) {
      document.body.addEventListener('mouseover', handleMouseOver);
      document.body.addEventListener('mouseout', handleMouseOut);
    } else {
      window.speechSynthesis.cancel();
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
    }

    return () => {
      clearTimeout(speakTimeout);
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
      window.speechSynthesis.cancel();
    };
  }, [textToSpeech]);

  const resetAll = () => {
    setLargeText(false);
    setHighContrast(false);
    setGrayscale(false);
    setHighlightLinks(false);
    setTextToSpeech(false);
  };

  return createPortal(
    <div className={`a11y-toolbar-container ${isOpen ? 'open' : ''}`}>
      <button 
        className="a11y-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Herramientas de Accesibilidad"
        aria-label="Abrir panel de accesibilidad"
      >
        <i className="fa-solid fa-wheelchair"></i>
      </button>

      <div className="a11y-menu-panel">
        <h3>Accesibilidad</h3>
        
        <button 
          className={`a11y-option-btn ${largeText ? 'active' : ''}`}
          onClick={() => setLargeText(!largeText)}
        >
          <i className="fa-solid fa-text-height"></i> Texto Grande
        </button>

        <button 
          className={`a11y-option-btn ${highContrast ? 'active' : ''}`}
          onClick={() => setHighContrast(!highContrast)}
        >
          <i className="fa-solid fa-circle-half-stroke"></i> Alto Contraste
        </button>

        <button 
          className={`a11y-option-btn ${grayscale ? 'active' : ''}`}
          onClick={() => setGrayscale(!grayscale)}
        >
          <i className="fa-solid fa-droplet-slash"></i> Escala de Grises
        </button>

        <button 
          className={`a11y-option-btn ${highlightLinks ? 'active' : ''}`}
          onClick={() => setHighlightLinks(!highlightLinks)}
        >
          <i className="fa-solid fa-link"></i> Resaltar Enlaces
        </button>

        <button 
          className={`a11y-option-btn ${textToSpeech ? 'active' : ''}`}
          onClick={() => {
             setTextToSpeech(!textToSpeech);
             if(!textToSpeech) {
               const utterance = new SpeechSynthesisUtterance("Lectura por voz activada.");
               utterance.lang = 'es-ES';
               window.speechSynthesis.speak(utterance);
             } else {
               window.speechSynthesis.cancel();
             }
          }}
        >
          <i className="fa-solid fa-volume-high"></i> Lectura por Voz
        </button>

        <button 
          className="a11y-option-btn mt-2"  
          onClick={resetAll}
          style={{ justifyContent: 'center', borderStyle: 'dashed' }}
        >
          <i className="fa-solid fa-rotate-right"></i> Restablecer
        </button>
      </div>
    </div>,
    document.body
  );
};

export default A11yToolbar;

import React from 'react';
import '../../styles/InputGroup.css';

const InputGroup = ({ label, value, onChange, type = "text", placeholder, isSearching, maxLength, onBlur, error, className = "" }) => {
  return (
    <div className="input-group">
      <label>
        {label} 
        {isSearching && <span className="loading-text">(Buscando...)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        onBlur={onBlur}
        className={`${error ? "input-error" : ""} ${className}`.trim()}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default InputGroup;

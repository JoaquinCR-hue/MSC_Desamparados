import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/AuthFooter.css';

const AuthFooter = ({ text, linkText, linkTo, onClickExtra, extraLinkText }) => {
  return (
    <>
      {onClickExtra && (
        <p className="forgot-password">
          <span onClick={onClickExtra} className="forgot-password-link">
            {extraLinkText}
          </span>
        </p>
      )}
      <p className="auth-footer">
        {text} <Link to={linkTo}>{linkText}</Link>
      </p>
    </>
  );
};

export default AuthFooter;

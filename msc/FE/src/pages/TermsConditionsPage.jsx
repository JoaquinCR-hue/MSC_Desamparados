import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TermsConditionsContent from '../components/TermsConditionsContent';
import '../styles/TermsConditions.css';

/**
 * TermsConditionsPage - Página de términos y condiciones de uso.
 * Proporciona el marco legal y de privacidad para los usuarios del sistema.
 */
function TermsConditionsPage() {
  return (
    <div className="terms-conditions-page-container">
      <Navbar />
      <TermsConditionsContent />
      <Footer />
    </div>
  );
}

export default TermsConditionsPage;

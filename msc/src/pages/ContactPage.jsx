import React from 'react';
import ContactForm from '../components/ContactForm';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * ContactPage - Página de contacto para consultas ciudadanas.
 */
function ContactPage() {
    return (
        <div className="contact-page-container">
            <Navbar />
            <ContactForm />
            <Footer />
        </div>
    );
}

export default ContactPage;
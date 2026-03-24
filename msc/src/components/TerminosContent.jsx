import React from 'react';

function TerminosContent() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '40px auto', backgroundColor: '#1e1e1e', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', flex: 1 }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#ff8c00' }}>TÉRMINOS Y CONDICIONES DE USO</h1>
      <p><strong>Última actualización:</strong> {(new Date()).toLocaleDateString()}</p>
      
      <p>Bienvenido(a) a <strong>MSC Desamparados</strong>. Al registrarse y utilizar este sitio web, usted acepta cumplir con los presentes Términos y Condiciones. Si no está de acuerdo con ellos, le recomendamos no utilizar la plataforma.</p>

      <p><strong>MSC Desamparados</strong> es un servicio digital que permite a los usuarios reportar incidentes relacionados con la seguridad ciudadana, incluyendo robos, asesinatos, maltrato doméstico, feminicidio, personas sospechosas y otros hechos similares. Asimismo, la plataforma cuenta con un sistema de inteligencia artificial que analiza dichos reportes para sugerir rutas más seguras y eficientes, similar a aplicaciones de navegación, priorizando tanto la seguridad como la rapidez del desplazamiento.</p>

      <p>Para utilizar la plataforma, el usuario debe registrarse proporcionando información verídica, incluyendo su número de cédula de identidad. El usuario acepta que la información proporcionada podrá ser verificada y que el uso de datos falsos, la suplantación de identidad o la manipulación de información será motivo de suspensión o eliminación de la cuenta. Además, la plataforma podrá compartir información con las autoridades competentes en caso de investigaciones legales.</p>

      <p>El usuario se compromete a utilizar la plataforma de manera responsable, reportando únicamente información verídica y verificable, y absteniéndose de difundir contenido falso, alarmista o malintencionado. Asimismo, se prohíbe el acoso, amenazas o cualquier conducta que perjudique a otros usuarios, así como el uso de la plataforma para fines ilegales. El incumplimiento de estas normas podrá resultar en la suspensión o eliminación permanente de la cuenta.</p>

      <p>Todos los reportes realizados podrán ser revisados tanto por los administradores como por las autoridades correspondientes. En caso de determinarse que un reporte es falso, este podrá ser eliminado o marcado como tal. Los usuarios reconocen que la veracidad de los reportes es fundamental, ya que estos influyen directamente en el sistema automatizado de recomendaciones de rutas.</p>

      <p>La plataforma incluye un sistema de inteligencia artificial que sugiere rutas más seguras y eficientes utilizando información generada por los usuarios y las autoridades. Sin embargo, dichas recomendaciones son orientativas y no garantizan la seguridad absoluta en ningún trayecto.</p>

      <p>Los administradores de la plataforma tienen el derecho de eliminar reportes falsos o engañosos, suspender o eliminar cuentas sospechosas, y tomar acciones contra usuarios que incumplan estos términos, incluso cuando sus conductas fuera de la plataforma afecten la integridad o el propósito del servicio.</p>

      <p>La plataforma colabora con la Fuerza Pública de Costa Rica, especialmente en la zona de Desamparados. En este sentido, las autoridades podrán revisar reportes, marcar incidentes como falsos o confirmados, y analizar perfiles sospechosos cuando sea necesario.</p>

      <p>En relación con la privacidad, el usuario acepta que su información personal será almacenada y protegida conforme a la legislación vigente. El número de cédula será utilizado exclusivamente para fines de verificación de identidad y seguridad. No obstante, la información podrá ser compartida con autoridades cuando sea requerido por ley.</p>

      <p><strong>MSC Desamparados</strong> no se hace responsable por decisiones tomadas por los usuarios basadas en reportes o rutas sugeridas, ni por daños derivados de información incorrecta proporcionada por terceros. Tampoco se garantiza la disponibilidad continua del servicio, pudiendo existir fallos técnicos o interrupciones.</p>

      <p>La plataforma se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Cualquier cambio será publicado oportunamente en el sitio web.</p>

      <p style={{ marginTop: '30px', fontWeight: 'bold' }}>Al registrarse en la plataforma, el usuario declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones.</p>
    </div>
  );
}

export default TerminosContent;

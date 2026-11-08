// Utilidades compartidas de QuiroApp (sin dependencias de React).
const openWhatsApp = (phone, message = "") => {
  if (!phone) return;
  let cleanPhone = String(phone).replace(/\D/g, '');
  // Números mexicanos guardados a 10 dígitos: se agrega el código de país (52)
  if (cleanPhone.length === 10) cleanPhone = '52' + cleanPhone;
  window.open(`https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank');
};

// Generador de códigos PRO: azar seguro del navegador, 8 caracteres sin confusos (sin O/0 ni I/1)
const generateSecureCode = (prefix) => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  let suffix = '';
  for (const n of arr) suffix += chars[n % chars.length];
  return prefix + suffix;
};

// Mensajes de error reales y humanos según el código de Firebase Auth
const authErrorMessage = (err) => {
  switch (err?.code) {
    case 'auth/unauthorized-domain': return 'Este dominio no está autorizado en Firebase. Avísale al administrador.';
    case 'auth/network-request-failed': return 'Sin conexión a internet. Revisa tu señal e inténtalo de nuevo.';
    case 'auth/operation-not-allowed': return 'El acceso por correo no está activado para esta app. Entra con Google.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use': return 'Ese correo ya tiene una cuenta. Mejor inicia sesión.';
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email': return 'Ese correo no parece válido.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/popup-blocked': return 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.';
    default: return `Algo salió mal (${err?.code || 'error desconocido'}). Inténtalo de nuevo.`;
  }
};

const safeFormatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (e) { return String(dateStr); }
};

const calculateAge = (dobStr) => {
  if (!dobStr) return '';
  const [year, month, day] = dobStr.split('-');
  const dob = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

// 🌟 MOTOR DE GENERACIÓN DE EXPEDIENTES CLÍNICOS (HTML/PDF/WORD)
const generateClinicalHTML = (patient, doctorInfo) => {
  const edadActual = patient.birthDate ? calculateAge(patient.birthDate) : patient.age;
  const logoHtml = doctorInfo.logo ? `<img src="${doctorInfo.logo}" style="max-height: 90px; border-radius: 8px; margin-bottom: 10px; object-fit: contain;" />` : '';
  const historiesHtml = (patient.histories || []).map(h => `
    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Fecha:</strong> ${safeFormatDate(h.date)} &nbsp;|&nbsp; <strong style="color: #e11d48;">Dolor: ${h.painLevel}/10</strong></p>
      <p style="margin: 0 0 5px 0;"><strong>Zonas Ajustadas:</strong> ${h.areas?.join(', ') || 'Ninguna especificada'}</p>
      ${h.redFlags && h.redFlags.length > 0 ? `<p style="margin: 0 0 5px 0; color: #e11d48;"><strong>Banderas Rojas:</strong> ${h.redFlags.join(', ')}</p>` : ''}
      <p style="margin: 0; font-style: italic; color: #475569;">" ${h.notes || 'Sin notas de evolución'} "</p>
    </div>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Expediente - ${patient.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: auto; }
          h1 { color: #0f172a; margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          h2 { color: #0f172a; margin: 0 0 15px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;}
          h3 { color: #64748b; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;}
          .header { text-align: center; border-bottom: 4px solid #06b6d4; padding-bottom: 30px; margin-bottom: 40px; }
          .section { margin-bottom: 30px; padding: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
          .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 900; letter-spacing: 1px; display: block; margin-bottom: 2px;}
          .value { font-size: 14px; font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px;}
          td { padding: 8px 15px 8px 0; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>${doctorInfo.clinic || 'Clínica Quiropráctica'}</h1>
          <h3>${doctorInfo.name || 'Especialista'} - ${doctorInfo.title || 'Doctor'}</h3>
        </div>
        
        <div class="section">
          <h2>Ficha de Identificación</h2>
          <table>
            <tr>
              <td><span class="label">Nombre del Paciente</span><span class="value">${patient.name}</span></td>
              <td><span class="label">Teléfono</span><span class="value">${patient.phone || '--'}</span></td>
            </tr>
            <tr>
              <td><span class="label">Edad y Fecha Nac.</span><span class="value">${edadActual ? edadActual + ' años' : '--'} (${patient.birthDate || '--'})</span></td>
              <td><span class="label">Sexo</span><span class="value">${patient.gender || '--'}</span></td>
            </tr>
            <tr>
              <td colspan="2"><span class="label">Dirección Completa</span><span class="value">${patient.address || '--'}</span></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Evaluación Clínica Inicial</h2>
          <table>
            <tr>
              <td colspan="2"><span class="label">Motivo de Consulta</span><span class="value">${patient.consultationReason || '--'}</span></td>
            </tr>
            <tr>
              <td><span class="label">Ant. Patológicos</span><span class="value">${patient.pathological || '--'}</span></td>
              <td><span class="label">Ant. No Patológicos</span><span class="value">${patient.nonPathological || '--'}</span></td>
            </tr>
            <tr>
              <td><span class="label">Diagnóstico Quiropráctico</span><span class="value" style="color: #0284c7;">${patient.chiropracticDiagnosis || '--'}</span></td>
              <td><span class="label">Morfología</span><span class="value">Peso: ${patient.weight ? patient.weight + ' kg' : '--'} | Altura: ${patient.height ? patient.height + ' cm' : '--'}</span></td>
            </tr>
            <tr>
              <td colspan="2"><span class="label">Plan de Tratamiento</span><span class="value">${patient.treatmentPlan || '--'}</span></td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;" />
          <span class="label">Análisis Postural</span>
          <span class="value" style="font-size: 13px; font-weight: normal;">
            <b>Anterior:</b> ${patient.postureAnterior || '--'} <br/>
            <b>Lateral:</b> ${patient.postureLateral || '--'} <br/>
            <b>Posterior:</b> ${patient.posturePosterior || '--'}
          </span>
        </div>

        <div class="section">
          <h2>Historial de Sesiones y Ajustes</h2>
          ${patient.histories && patient.histories.length > 0 ? historiesHtml : '<p style="color: #64748b; font-style: italic;">Sin registros clínicos documentados aún.</p>'}
        </div>
        
        <div style="text-align: center; margin-top: 50px; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">
          Expediente Clínico Digital Generado por QuiroApp
        </div>
      </body>
    </html>
  `;
};

const CLINIC_THEMES = {
  azul: { bg: 'bg-gradient-to-br from-cyan-600 to-blue-900', text: 'text-white', name: 'Azul Clínico' },
  esmeralda: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-900', text: 'text-white', name: 'Esmeralda' },
  indigo: { bg: 'bg-gradient-to-br from-indigo-500 to-purple-900', text: 'text-white', name: 'Índigo Premium' },
  carbon: { bg: 'bg-gradient-to-br from-slate-700 to-black', text: 'text-white', name: 'Carbón Élite' },
  blanco: { bg: 'bg-gradient-to-br from-slate-50 to-slate-200', text: 'text-slate-800', name: 'Blanco Elegante' }
};

const RED_FLAGS = ['Tumor','Infecciones','Fractura','Problema neurológico','Problemas nerviosos','Herida abierta local','Quemadura','Sangrado prolongado','Implantes artificiales','Marcapasos','Infección articular'];
const CHIRO_TECHNIQUES = ['Diversified','Gonstead','Thompson','Activador','Toggle Recoil','SOT (Sacro Occipital)','Cox Flexion-Distraction','Miofascial / Graston','Ajuste Cervical Específico'];
const POSTURAL_DEVIATIONS = ['Cabeza Adelantada','Hombro Elevado','Escápula Alada','Hipercifosis Dorsal','Hiperlordosis Lumbar','Rectificación Cervical','Pelvis Basculada','Escoliosis','Genu Valgo (X)','Genu Varo (O)','Pie Plano/Cavo'];

export { openWhatsApp, generateSecureCode, authErrorMessage, safeFormatDate, calculateAge, generateClinicalHTML, CLINIC_THEMES, RED_FLAGS, CHIRO_TECHNIQUES, POSTURAL_DEVIATIONS };

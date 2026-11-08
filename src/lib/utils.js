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
      <p style="margin: 0 0 5px 0;"><strong>Fecha:</strong> ${safeFormatDate(h.date)} &nbsp;|&nbsp; <strong style="color: #e11d48;">Dolor: ${h.painLevel}/10</strong>${h.painOut !== null && h.painOut !== undefined ? ` &nbsp;|&nbsp; <strong style="color: #0e7c5b;">Al salir: ${h.painOut}/10</strong>` : ''}</p>
      ${h.visitReason ? `<p style="margin: 0 0 5px 0;"><strong>Motivo de la visita:</strong> ${h.visitReason}${h.response ? ` &nbsp;|&nbsp; <strong>Respuesta:</strong> ${h.response}` : ''}</p>` : ''}
      <p style="margin: 0 0 5px 0;"><strong>Zonas Ajustadas:</strong> ${h.areas?.join(', ') || 'Ninguna especificada'}</p>
      ${h.techniques && h.techniques.length > 0 ? `<p style="margin: 0 0 5px 0;"><strong>Técnicas:</strong> ${h.techniques.join(', ')}</p>` : ''}
      ${h.redFlags && h.redFlags.length > 0 ? `<p style="margin: 0 0 5px 0; color: #e11d48;"><strong>Banderas Rojas:</strong> ${h.redFlags.join(', ')}</p>` : ''}
      <p style="margin: 0; font-style: italic; color: #475569;">" ${h.notes || 'Sin notas de evolución'} "</p>
      ${h.recommendations && h.recommendations.length > 0 ? `<p style="margin: 5px 0 0 0;"><strong>Recomendaciones:</strong> ${h.recommendations.join(', ')}</p>` : ''}
      ${h.nextVisit ? `<p style="margin: 5px 0 0 0;"><strong>Próxima cita sugerida:</strong> ${h.nextVisit}</p>` : ''}
    </div>
  `).join('');

  const ci = patient.currentIllness || {};
  const ciRows = [['Motivos', (ci.motivos || []).join(', ')], ['Evolución', [ci.tiempoValor, ci.tiempoUnidad].filter(Boolean).join(' ')], ['Inicio', ci.inicio || ''], ['Irradiación', (ci.irradiacion || []).join(', ')], ['Empeora con', (ci.empeora || []).join(', ')], ['Mejora con', (ci.mejora || []).join(', ')], ['Tratamientos previos', (ci.previos || []).join(', ')], ['Descripción', ci.descripcion || '']].filter(r => r[1]);
  const ex = patient.exploration || {};
  const exRom = Object.entries(ex.rom || {}).filter(r => r[1]).map(r => r[0] + ': ' + r[1]).join(' · ');
  const exTests = (ex.tests || []).map(t => t.name + ' (' + t.result + ')').join(', ');
  const pl = patient.planes || {};
  const plMarks = Object.entries(pl.marks || {}).map(([b, n]) => { const note = n ? [...(n.s || []), n.t || ''].filter(Boolean).join(' · ') : ''; return note ? b + ' (' + note + ')' : b; }).join(', ');
  const plCurve = pl.curve && pl.curve.type && pl.curve.type !== 'none' ? 'Escoliosis en ' + pl.curve.type + ' · ' + (pl.curve.from || '') + '–' + (pl.curve.to || '') + (pl.curve.cobb ? ' · Cobb ' + pl.curve.cobb + '°' : '') : '';
  let extraSections = '';
  if (ciRows.length > 0) extraSections += `<div class="section"><h2>Padecimiento Actual</h2><table>${ciRows.map(r => `<tr><td style="width:35%"><span class="label">${r[0]}</span></td><td><span class="value">${r[1]}</span></td></tr>`).join('')}</table></div>`;
  if (exRom || exTests || (ex.palpation && ex.palpation.length > 0) || ex.detail) extraSections += `<div class="section"><h2>Exploración Física</h2>${exRom ? `<p style="margin: 0 0 5px 0;"><strong>Movimiento:</strong> ${exRom}</p>` : ''}${exTests ? `<p style="margin: 0 0 5px 0;"><strong>Pruebas especiales:</strong> ${exTests}</p>` : ''}${ex.palpation && ex.palpation.length > 0 ? `<p style="margin: 0 0 5px 0;"><strong>Palpación:</strong> ${ex.palpation.join(', ')}</p>` : ''}${ex.detail ? `<p style="margin: 0; font-style: italic; color: #475569;">" ${ex.detail} "</p>` : ''}</div>`;
  if (plMarks || plCurve || (pl.sagittal && pl.sagittal.length > 0)) extraSections += `<div class="section"><h2>Planos Anatómicos (Rayos X)</h2>${plMarks ? `<p style="margin: 0 0 5px 0;"><strong>Huesos marcados:</strong> ${plMarks}</p>` : ''}${plCurve ? `<p style="margin: 0 0 5px 0;"><strong>${plCurve}</strong></p>` : ''}${pl.sagittal && pl.sagittal.length > 0 ? `<p style="margin: 0;"><strong>Curvas sagitales:</strong> ${pl.sagittal.join(', ')}</p>` : ''}</div>`;
  if (patient.consent && patient.consent.accepted) extraSections += `<div class="section"><p style="margin: 0;"><strong>Consentimiento informado:</strong> el paciente aceptó el tratamiento el ${safeFormatDate((patient.consent.date || '').split('T')[0])}.</p></div>`;
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
            ${patient.occupation ? `<tr><td><span class="label">Ocupación</span><span class="value">${patient.occupation}</span></td><td><span class="label">¿Cómo nos conoció?</span><span class="value">${(patient.origin || []).join(', ') || '--'}</span></td></tr>` : ''}
            ${patient.emergencyName ? `<tr><td colspan="2"><span class="label">Contacto de Emergencia</span><span class="value">${patient.emergencyName}${patient.emergencyPhone ? ' · ' + patient.emergencyPhone : ''}</span></td></tr>` : ''}
            ${patient.allergies && patient.allergies.length > 0 ? `<tr><td colspan="2"><span class="label">Alergias</span><span class="value">${patient.allergies.join(', ')}</span></td></tr>` : ''}
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

        ${extraSections}
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

const RED_FLAGS = ['Tumor','Infecciones','Fractura','Problema neurológico','Problemas nerviosos','Herida abierta local','Quemadura','Sangrado prolongado','Implantes artificiales','Marcapasos','Infección articular','Pérdida de peso inexplicable','Dolor nocturno que no cede','Pérdida de control de esfínteres','Debilidad progresiva','Fiebre reciente','Antecedente de cáncer','Trauma / accidente reciente','Uso de anticoagulantes','Embarazo'];
const CHIRO_TECHNIQUES = ['Diversified','Gonstead','Thompson','Activador','Toggle Recoil','SOT (Sacro Occipital)','Cox Flexion-Distraction','Miofascial / Graston','Ajuste Cervical Específico'];
const POSTURAL_DEVIATIONS = ['Cabeza Adelantada','Hombro Elevado','Escápula Alada','Hipercifosis Dorsal','Hiperlordosis Lumbar','Rectificación Cervical','Pelvis Basculada','Escoliosis','Genu Valgo (X)','Genu Varo (O)','Pie Plano/Cavo'];


const MOTIVOS_CONSULTA = ['Dolor lumbar','Cervicalgia','Dolor dorsal','Ciática','Cefalea / Migraña','Dolor de hombro','Tortícolis','Contractura muscular','Esguince','Dolor de rodilla','Hormigueo / Adormecimiento','Mareo / Vértigo','Dolor de cadera'];
const LIST_IRRADIACION = ['No irradia','Brazo derecho','Brazo izquierdo','Pierna derecha','Pierna izquierda','Glúteo','Entre los omóplatos'];
const LIST_EMPEORA = ['Estar sentado','Estar de pie','Caminar','Levantar peso','Girar / inclinarse','Frío','Estrés','Al despertar'];
const LIST_MEJORA = ['Reposo','Movimiento','Calor','Hielo','Medicamento','Masaje','Nada lo alivia'];
const LIST_PREVIOS = ['Ninguno','Medicamentos','Fisioterapia','Quiropráctica','Masaje','Infiltraciones','Cirugía'];
const LIST_PATOLOGICOS = ['Hipertensión','Diabetes','Artritis / Artrosis','Osteoporosis','Hernia discal','Fibromialgia','Asma','Problemas de tiroides','Cardiopatía','Epilepsia','Cáncer','Cirugías previas','Fracturas','Ninguno'];
const LIST_MEDICAMENTOS = ['Ninguno','AINEs (antiinflamatorios)','Relajantes musculares','Analgésicos','Antihipertensivos','Antidiabéticos','Anticoagulantes'];
const LIST_DIAGNOSTICOS = ['Lumbalgia mecánica','Cervicalgia','Dorsalgia','Ciatalgia','Síndrome facetario','Contractura muscular','Subluxación','Escoliosis postural','Rectificación cervical','Rectificación lumbar','Tendinitis'];
const LIST_OBJETIVOS = ['Disminuir el dolor','Mejorar la movilidad','Corrección postural','Fortalecer','Mantenimiento / prevención'];
const LIST_FRECUENCIAS = ['3× semana (inicio)','2× semana','1× semana','Cada 15 días','Mensual (mantenimiento)'];
const LIST_RECOMENDACIONES = ['Hielo local 15 min','Calor local','Ejercicios de movilidad','Higiene postural','Evitar cargar peso','Caminar 20 min diarios','Buena hidratación'];
const LIST_PRUEBAS = ['Lasègue','Slump','Spurling','Compresión cervical','Distracción cervical','Adam (escoliosis)','FABER','Thomas','Valsalva'];
const LIST_PALPACION = ['Contractura','Puntos gatillo','Inflamación local','Espasmo muscular','Hipersensibilidad'];
const BONE_NOTE_SUGGESTIONS = ['Subluxación','Espacio disminuido','Desviación','Dolor a la palpación','Inflamación','Fractura consolidada','Desgaste / artrosis'];
const LIST_HALLAZGOS = ['Cavitación en…','Liberación miofascial en…','Se trabajó movilidad de…','Persiste restricción en…'];
const LIST_VISITA = ['Primera vez','Seguimiento','Dolor agudo','Mantenimiento','Revaloración'];
const LIST_RESPUESTA = ['No aplica (primera vez)','Mejoría notable','Leve mejoría','Sin cambio','Empeoró transitoriamente'];
const LIST_PROXIMA = ['En 2 días','En 1 semana','En 2 semanas','En 1 mes','Según evolución'];
export { openWhatsApp, generateSecureCode, authErrorMessage, safeFormatDate, calculateAge, generateClinicalHTML, CLINIC_THEMES, RED_FLAGS, CHIRO_TECHNIQUES, POSTURAL_DEVIATIONS, MOTIVOS_CONSULTA, LIST_IRRADIACION, LIST_EMPEORA, LIST_MEJORA, LIST_PREVIOS, LIST_PATOLOGICOS, LIST_MEDICAMENTOS, LIST_DIAGNOSTICOS, LIST_OBJETIVOS, LIST_FRECUENCIAS, LIST_RECOMENDACIONES, LIST_PRUEBAS, LIST_PALPACION, BONE_NOTE_SUGGESTIONS, LIST_HALLAZGOS, LIST_VISITA, LIST_RESPUESTA, LIST_PROXIMA };

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
  // Parte 10.1: sin logo propio, el documento sale sin imagen (membrete de texto).
  // Tamaño con atributos width/height porque Word ignora los topes CSS de las imágenes.
  const logoHtml = doctorInfo.logo ? `<img src="${doctorInfo.logo}" width="54" height="54" style="width: 54px; height: 54px; object-fit: contain; border-radius: 10px;" />` : '';
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const hoy = new Date();
  const fechaEmision = hoy.getDate() + ' de ' + meses[hoy.getMonth()] + ' de ' + hoy.getFullYear();
  const folio = 'EXP-' + String(patient.id || '').slice(0, 6).toUpperCase();

  const chrono = [...(patient.histories || [])].reverse();
  const sessRows = chrono.map(h => `<tr>
      <td style="white-space: nowrap;">${safeFormatDate(h.date)}</td>
      <td>${h.visitReason || '—'}</td>
      <td style="color: #b91c1c; font-weight: 700;">${h.painLevel ?? '—'}${h.painLevel !== null && h.painLevel !== undefined ? '/10' : ''}</td>
      <td style="color: #15803d; font-weight: 700;">${h.painOut !== null && h.painOut !== undefined ? h.painOut + '/10' : '—'}</td>
      <td>${h.response || '—'}</td>
    </tr>`).join('');
  const sessDetails = chrono.filter(h => h.notes || (h.techniques && h.techniques.length > 0) || (h.areas && h.areas.length > 0) || (h.recommendations && h.recommendations.length > 0) || h.nextVisit || (h.redFlags && h.redFlags.length > 0)).map(h => `
    <div style="border-bottom: 1px solid #eef2f4; padding: 8px 0;">
      <p style="margin: 0 0 3px 0;"><strong>${safeFormatDate(h.date)}</strong>${h.areas && h.areas.length > 0 ? ` · <strong>Zonas ajustadas:</strong> ${h.areas.join(', ')}` : ''}${h.techniques && h.techniques.length > 0 ? ` · <strong>Técnicas:</strong> ${h.techniques.join(', ')}` : ''}</p>
      ${h.redFlags && h.redFlags.length > 0 ? `<p style="margin: 0 0 3px 0; color: #b91c1c;"><strong>Banderas rojas:</strong> ${h.redFlags.join(', ')}</p>` : ''}
      ${h.notes ? `<p style="margin: 0 0 3px 0; font-style: italic; color: #475569;">"${h.notes}"</p>` : ''}
      ${h.recommendations && h.recommendations.length > 0 ? `<p style="margin: 0 0 3px 0;"><strong>Recomendaciones:</strong> ${h.recommendations.join(', ')}</p>` : ''}
      ${h.nextVisit ? `<p style="margin: 0;"><strong>Próxima cita sugerida:</strong> ${h.nextVisit}</p>` : ''}
    </div>`).join('');

  const ci = patient.currentIllness || {};
  const ciRows = [['Motivos', (ci.motivos || []).join(', ')], ['Evolución', [ci.tiempoValor, ci.tiempoUnidad].filter(Boolean).join(' ')], ['Inicio', ci.inicio || ''], ['Irradiación', (ci.irradiacion || []).join(', ')], ['Empeora con', (ci.empeora || []).join(', ')], ['Mejora con', (ci.mejora || []).join(', ')], ['Tratamientos previos', (ci.previos || []).join(', ')], ['Descripción', ci.descripcion || '']].filter(r => r[1]);
  const ex = patient.exploration || {};
  const exRom = Object.entries(ex.rom || {}).filter(r => r[1]).map(r => r[0] + ': ' + r[1]).join(' · ');
  const exTests = (ex.tests || []).map(t => t.name + ' (' + t.result + ')').join(', ');
  const pl = patient.planes || {};
  const plMarks = Object.entries(pl.marks || {}).map(([b, n]) => { const note = n ? [...(n.s || []), n.t || ''].filter(Boolean).join(' · ') : ''; return note ? b + ' (' + note + ')' : b; }).join(', ');
  const plCurve = pl.curve && pl.curve.type && pl.curve.type !== 'none' ? 'Escoliosis en ' + pl.curve.type + ' · ' + (pl.curve.from || '') + '–' + (pl.curve.to || '') + (pl.curve.cobb ? ' · Cobb ' + pl.curve.cobb + '°' : '') : '';
  const life = patient.lifestyle || {};
  const lifeRows = [['Actividad física', life.actividad || ''], ['Trabajo', life.trabajo || ''], ['Tabaco', life.tabaco || ''], ['Alcohol', life.alcohol || ''], ['Sueño', life.sueno || ''], ['Estrés', life.estres || '']].filter(r => r[1]);

  let extraSections = '';
  if (ciRows.length > 0) extraSections += `<div class="section"><h2><span class="gold">▸</span> Padecimiento Actual</h2><table>${ciRows.map(r => `<tr><td style="width:35%"><span class="label">${r[0]}</span></td><td><span class="value">${r[1]}</span></td></tr>`).join('')}</table></div>`;
  if ((patient.pathologicalList && patient.pathologicalList.length > 0) || (patient.medications && patient.medications.length > 0) || lifeRows.length > 0) extraSections += `<div class="section"><h2><span class="gold">▸</span> Antecedentes y Estilo de Vida</h2><table>
    ${patient.pathologicalList && patient.pathologicalList.length > 0 ? `<tr><td style="width:35%"><span class="label">Antecedentes patológicos</span></td><td><span class="value">${patient.pathologicalList.join(', ')}</span></td></tr>` : ''}
    ${patient.medications && patient.medications.length > 0 ? `<tr><td><span class="label">Medicamentos actuales</span></td><td><span class="value">${patient.medications.join(', ')}</span></td></tr>` : ''}
    ${lifeRows.map(r => `<tr><td><span class="label">${r[0]}</span></td><td><span class="value">${r[1]}</span></td></tr>`).join('')}
  </table></div>`;
  if (exRom || exTests || (ex.palpation && ex.palpation.length > 0) || ex.detail) extraSections += `<div class="section"><h2><span class="gold">▸</span> Exploración Física</h2>${exRom ? `<p style="margin: 0 0 5px 0;"><strong>Movimiento:</strong> ${exRom}</p>` : ''}${exTests ? `<p style="margin: 0 0 5px 0;"><strong>Pruebas especiales:</strong> ${exTests}</p>` : ''}${ex.palpation && ex.palpation.length > 0 ? `<p style="margin: 0 0 5px 0;"><strong>Palpación:</strong> ${ex.palpation.join(', ')}</p>` : ''}${ex.detail ? `<p style="margin: 0; font-style: italic; color: #475569;">" ${ex.detail} "</p>` : ''}</div>`;
  if (plMarks || plCurve || (pl.sagittal && pl.sagittal.length > 0)) extraSections += `<div class="section"><h2><span class="gold">▸</span> Planos Anatómicos (Rayos X)</h2>${plMarks ? `<p style="margin: 0 0 5px 0;"><strong>Huesos marcados:</strong> ${plMarks}</p>` : ''}${plCurve ? `<p style="margin: 0 0 5px 0;"><strong>${plCurve}</strong></p>` : ''}${pl.sagittal && pl.sagittal.length > 0 ? `<p style="margin: 0;"><strong>Curvas sagitales:</strong> ${pl.sagittal.join(', ')}</p>` : ''}</div>`;
  if ((patient.diagnosisList && patient.diagnosisList.length > 0) || (patient.objectives && patient.objectives.length > 0) || patient.frequency || patient.estimatedSessions || (patient.homeRecommendations && patient.homeRecommendations.length > 0)) extraSections += `<div class="section"><h2><span class="gold">▸</span> Diagnóstico y Plan de Tratamiento</h2><table>
    ${patient.diagnosisList && patient.diagnosisList.length > 0 ? `<tr><td style="width:35%"><span class="label">Diagnóstico</span></td><td><span class="value">${patient.diagnosisList.join(', ')}</span></td></tr>` : ''}
    ${patient.objectives && patient.objectives.length > 0 ? `<tr><td><span class="label">Objetivos</span></td><td><span class="value">${patient.objectives.join(', ')}</span></td></tr>` : ''}
    ${patient.frequency ? `<tr><td><span class="label">Frecuencia</span></td><td><span class="value">${patient.frequency}</span></td></tr>` : ''}
    ${patient.estimatedSessions ? `<tr><td><span class="label">Sesiones estimadas</span></td><td><span class="value">${patient.estimatedSessions}</span></td></tr>` : ''}
    ${patient.homeRecommendations && patient.homeRecommendations.length > 0 ? `<tr><td><span class="label">Recomendaciones en casa</span></td><td><span class="value">${patient.homeRecommendations.join(', ')}</span></td></tr>` : ''}
  </table></div>`;
  if (patient.consent && patient.consent.accepted) extraSections += `<div class="section"><h2><span class="gold">▸</span> Consentimiento Informado</h2><p style="margin: 0;">El paciente aceptó el tratamiento y su consentimiento informado quedó registrado el <strong>${safeFormatDate((patient.consent.date || '').split('T')[0])}</strong>.</p></div>`;

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>Expediente - ${patient.name}</title>
        <style>
          @page { margin: 16mm 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.55; padding: 34px 38px; max-width: 800px; margin: auto; font-size: 13px; }
          .header { border-bottom: 3px solid #b08d3e; padding-bottom: 14px; margin-bottom: 6px; }
          .clinic { font-size: 20px; font-weight: 900; color: #0b3b42; margin: 0; letter-spacing: 0.5px; }
          .docTitle { font-size: 15px; font-weight: 900; color: #0b3b42; text-transform: uppercase; letter-spacing: 3px; margin: 20px 0 2px 0; }
          .meta { font-size: 11px; color: #94a3b8; margin: 0 0 6px 0; }
          .section { margin-bottom: 24px; page-break-inside: avoid; }
          h2 { color: #0b3b42; margin: 0 0 11px 0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; font-size: 12.5px; text-transform: uppercase; letter-spacing: 1.5px; }
          h2 .gold { color: #b08d3e; }
          .label { font-size: 9.5px; text-transform: uppercase; color: #94a3b8; font-weight: 800; letter-spacing: 1px; display: block; margin-bottom: 2px; }
          .value { font-size: 13.5px; font-weight: 600; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 5px 14px 5px 0; vertical-align: top; }
          table.sess th { background: #0b3b42; color: #ffffff; text-align: left; padding: 7px 9px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
          table.sess td { padding: 6px 9px; border-bottom: 1px solid #e8eef0; font-size: 12px; }
          .sig { margin-top: 46px; text-align: center; }
          .sigLine { width: 280px; margin: 0 auto; border-top: 1.5px solid #0b3b42; padding-top: 6px; font-size: 12px; color: #334155; }
          .foot { margin-top: 26px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <table class="header" style="border-bottom: 3px solid #b08d3e;">
          <tr>
            <td style="padding: 0 14px 12px 0;">
              <table><tr>
                ${logoHtml ? `<td style="width: 66px; padding: 0 12px 0 0;">${logoHtml}</td>` : ''}
                <td style="padding: 0;">
                  <p class="clinic">${doctorInfo.clinic || 'Clínica Quiropráctica'}</p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #b08d3e; font-weight: 800; letter-spacing: 2.5px;">SALUD · COLUMNA · BIENESTAR</p>
                </td>
              </tr></table>
            </td>
            <td style="text-align: right; padding: 0 0 12px 0; font-size: 11.5px; color: #64748b; line-height: 1.65;">
              <strong style="color: #0b3b42; font-size: 12.5px;">${doctorInfo.name || 'Especialista'}</strong> · ${doctorInfo.title || 'Doctor'}<br/>
              ${doctorInfo.licenseNumber ? `Céd. Prof. ${doctorInfo.licenseNumber}<br/>` : ''}
              ${doctorInfo.officeAddress ? `${doctorInfo.officeAddress}<br/>` : ''}
              ${doctorInfo.officePhone ? `Tel. ${doctorInfo.officePhone}` : ''}
            </td>
          </tr>
        </table>

        <p class="docTitle">Expediente Clínico</p>
        <p class="meta">Fecha de emisión: ${fechaEmision} · Folio: ${folio}</p>

        <div class="section">
          <h2><span class="gold">▸</span> Ficha de Identificación</h2>
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
          <h2><span class="gold">▸</span> Evaluación Clínica Inicial</h2>
          <table>
            <tr>
              <td colspan="2"><span class="label">Motivo de Consulta</span><span class="value">${patient.consultationReason || '--'}</span></td>
            </tr>
            <tr>
              <td><span class="label">Ant. Patológicos</span><span class="value">${patient.pathological || '--'}</span></td>
              <td><span class="label">Ant. No Patológicos</span><span class="value">${patient.nonPathological || '--'}</span></td>
            </tr>
            <tr>
              <td><span class="label">Diagnóstico Quiropráctico</span><span class="value" style="color: #0b3b42;">${patient.chiropracticDiagnosis || '--'}</span></td>
              <td><span class="label">Morfología</span><span class="value">Peso: ${patient.weight ? patient.weight + ' kg' : '--'} | Altura: ${patient.height ? patient.height + ' cm' : '--'}</span></td>
            </tr>
            <tr>
              <td colspan="2"><span class="label">Plan de Tratamiento</span><span class="value">${patient.treatmentPlan || '--'}</span></td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 13px 0;" />
          <span class="label">Análisis Postural</span>
          <span class="value" style="font-size: 12.5px; font-weight: normal;">
            <b>Anterior:</b> ${patient.postureAnterior || '--'} <br/>
            <b>Lateral:</b> ${patient.postureLateral || '--'} <br/>
            <b>Posterior:</b> ${patient.posturePosterior || '--'}
          </span>
        </div>

        ${extraSections}
        <div class="section">
          <h2><span class="gold">▸</span> Historial de Sesiones</h2>
          ${chrono.length > 0 ? `<table class="sess">
            <tr><th>Fecha</th><th>Motivo</th><th>EVA entra</th><th>EVA sale</th><th>Respuesta</th></tr>
            ${sessRows}
          </table>
          ${sessDetails ? `<p class="label" style="margin-top: 14px;">Notas de evolución</p>${sessDetails}` : ''}` : '<p style="color: #64748b; font-style: italic;">Sin registros clínicos documentados aún.</p>'}
        </div>

        <div class="sig">
          <div class="sigLine">${doctorInfo.name || 'Especialista'} · ${doctorInfo.title || ''}${doctorInfo.licenseNumber ? ' · Céd. Prof. ' + doctorInfo.licenseNumber : ''}<br/><span style="color: #94a3b8; font-size: 10px;">Firma y sello</span></div>
        </div>

        <table class="foot"><tr>
          <td style="padding: 0;">Documento generado con QuiroApp</td>
          <td style="padding: 0; text-align: right;">Confidencial · Uso clínico</td>
        </tr></table>
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

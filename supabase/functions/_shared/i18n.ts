export type BotLocale = 'es' | 'en';

// Whole words only ("no" and "menu" are Spanish too, so they don't count as English).
const EN_HINTS = [
  'i spent', 'i paid', 'i bought', 'spent', 'paid', 'bought', 'expense',
  'i earned', 'i received', 'received', 'salary', 'income',
  'balance', 'report', 'summary', 'help', 'link', 'yes', 'edit',
  'cancel', 'save', 'hello', 'hi', 'at', 'on', 'with', 'dollars', 'usd', 'accept',
];

const ES_HINTS = [
  'gaste', 'pague', 'compre', 'cobre', 'recibi', 'saldo', 'resumen', 'reporte',
  'ayuda', 'vincular', 'si', 'editar', 'cancelar', 'hola', 'pesos', 'en', 'con',
  'de', 'el', 'la', 'acepto',
];

function countWords(text: string, hints: string[]): number {
  return hints.filter((h) => new RegExp(`(^|[^a-z])${h}($|[^a-z])`).test(text)).length;
}

/** Detecta idioma del mensaje (default es). */
export function detectLocale(text: string): BotLocale {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const en = countWords(lower, EN_HINTS);
  const es = countWords(lower, ES_HINTS);
  if (en > es) return 'en';
  if (es > en) return 'es';
  // Bare "no" / "ok" are just as Spanish, so they stay in the default.
  if (/^(yes|edit|help|balance|report|summary|link|hi|hello|cancel)\b/i.test(lower.trim())) {
    return 'en';
  }
  return 'es';
}

type Dict = Record<string, string>;

const es: Dict = {
  needLink:
    'Hi! Soy el bot de *Moni Financiera* / I\'m the *Moni* bot.\n\n*ES:* Perfil → WhatsApp → código → *VINCULAR 123456*\n*EN:* Profile → WhatsApp → code → *LINK 123456*\n\nThen: expenses/income, *SALDO*/*BALANCE*, *RESUMEN*/*REPORT*.',
  savings:
    'Savings goals: open the MONI app → Budgets / Goals.\n\nHere I log *expenses* & *income*, and answer *SALDO*/*BALANCE* or *RESUMEN*/*REPORT*.',
  typePrompt: 'Reply *gasto* / *expense* or *ingreso* / *income*.',
  editPrompt:
    'OK — send the corrected entry.\nEx: *I spent 95 at Starbucks* / *Gasté 95 en Starbucks*\nOr type *expense* / *income* to change the type.',
  audioFail: 'Couldn\'t read the audio. Try again.',
  listening: 'Listening to your voice note…',
  transcribeFail: 'Couldn\'t understand the voice note. Try again or type the entry.',
  audioError: 'Error processing audio. Try again.',
  imageFail: 'Couldn\'t read the image.',
  readingReceipt: 'Reading the receipt…',
  receiptError: 'Error reading the receipt. Try again or type the amount.',
  fallbackHelp:
    'I can log *expenses* & *income* (text, voice, or receipt).\nQueries: *BALANCE*, *REPORT*, *HELP*.\nEx: I spent 80 at Oxxo',
  linkInvalid: 'Invalid or used code. Generate a new one in MONI → Profile → WhatsApp.',
  linkExpired: 'That code expired. Generate a new one in the app.',
  linkFail: 'Couldn\'t link. If this number is on another account, unlink it first.',
  linkOk:
    '✅ WhatsApp linked to MONI.\n\nLog:\n• I spent 80 at Starbucks / Gasté 80 en Starbucks\n• I received 5000 salary / Cobré 5000 de sueldo\n• Voice or receipt photo\n\nAsk:\n• *BALANCE* / *SALDO*\n• *REPORT* / *RESUMEN*\n• *HELP* / *AYUDA*',
  noAmount: 'I didn\'t catch the amount. Ex:\n• I spent 80 at Starbucks\n• Gasté 80 en Starbucks',
  noAccount: 'Create an account in MONI → Profile → Accounts before logging entries.',
  draftFail: 'Couldn\'t create the draft. Try again.',
  ambiguous: 'I detected {amount}{merchant}.\nIs it an *expense* or *income*?',
  confirm: 'Save *{kind}* {parts}?\n💳 Account: *{account}*{picker}\n\nReply *Yes* / *Sí*, *No*, or *Edit* / *Editar*.\n_To change the category, type its name, e.g. Salud._',
  accountPicker: '\n\nDifferent account? Reply with its number (or *2 yes* to pick and save at once):\n{list}',
  accountInvalid: 'I don\'t have account {n}. Pick a number from the list.',
  draftAlreadySaved: 'That entry was already saved.',
  draftAlreadyCancelled: 'That entry was already cancelled. Send it again if you want to log it.',
  kindExpense: 'expense',
  kindIncome: 'income',
  nothingPending: 'Nothing pending to confirm.',
  draftIncomplete: 'Draft is incomplete. Send the entry again.',
  saveFail: 'Couldn\'t save. Check your session or try in the app.',
  saved: '✅ {kind} {amount} saved to *{account}*.\nIt\'s already in MONI.',
  cancelled: 'Cancelled. Send another entry whenever you want.',
  kindExpenseCap: 'Expense',
  kindIncomeCap: 'Income',
};

const esOnly: Dict = {
  needLink:
    'Hola, soy el bot de *Moni Financiera*.\n\nPara vincular:\n1. MONI → Perfil → WhatsApp\n2. Genera un código\n3. Escríbeme: *VINCULAR 123456*\n\nLuego: gastos/ingresos, *SALDO* o *RESUMEN*.',
  savings:
    'Para *ahorros y metas* ábrelo en la app MONI → Presupuestos / Metas.\n\nAquí registro *gastos* e *ingresos*, y consultas *SALDO* / *RESUMEN*.',
  typePrompt: 'Responde *gasto* o *ingreso*.',
  editPrompt:
    'Ok, mándame el movimiento corregido.\nEj: *Gasté 95 en Starbucks* o *Cobré 3000 de freelance*\nTambién *gasto* / *ingreso* para cambiar el tipo.',
  audioFail: 'No pude leer el audio. Intenta de nuevo.',
  listening: 'Escuchando tu nota de voz…',
  transcribeFail: 'No entendí la nota de voz. Intenta de nuevo o escribe el movimiento.',
  audioError: 'Error al procesar el audio. Intenta otra vez.',
  imageFail: 'No pude leer la imagen.',
  readingReceipt: 'Leyendo el ticket…',
  receiptError: 'Error al leer el ticket. Intenta otra vez o escribe el monto.',
  fallbackHelp:
    'Puedo registrar *gastos* e *ingresos* (texto, voz o ticket).\nConsultas: *SALDO*, *RESUMEN*, *AYUDA*.\nEj: Gasté 80 en Oxxo',
  linkInvalid: 'Código inválido o ya usado. Genera uno nuevo en MONI → Perfil → WhatsApp.',
  linkExpired: 'Ese código expiró. Genera uno nuevo en la app.',
  linkFail: 'No pude vincular. Si el número ya está en otra cuenta, desvincúlalo primero.',
  linkOk:
    '✅ WhatsApp vinculado a MONI.\n\nRegistra:\n• Gasté 80 en Starbucks\n• Gasté 150 en Uber con BBVA\n• Cobré 5000 de sueldo\n• Audio o foto de ticket\n\nConsulta:\n• *SALDO*\n• *RESUMEN* / *REPORTE*\n• *AYUDA*',
  noAmount: 'No detecté el monto. Ejemplo:\n• Gasté 80 en Starbucks\n• Cobré 2500 de freelance',
  noAccount: 'Crea una cuenta en MONI → Perfil → Cuentas antes de registrar movimientos.',
  draftFail: 'No pude crear el borrador. Intenta de nuevo.',
  ambiguous: 'Detecté {amount}{merchant}.\n¿Es *gasto* o *ingreso*?',
  confirm: '¿Guardo *{kind}* {parts}?\n💳 Cuenta: *{account}*{picker}\n\nResponde *Sí*, *No* o *Editar*.\n_Para cambiar la categoría escribe su nombre, ej. Salud._',
  accountPicker: '\n\n¿Otra cuenta? Responde con el número (o *2 sí* para elegir y guardar de una vez):\n{list}',
  accountInvalid: 'No tengo la cuenta {n}. Elige un número de la lista.',
  draftAlreadySaved: 'Ese movimiento ya estaba guardado.',
  draftAlreadyCancelled: 'Ese movimiento ya estaba cancelado. Mándalo de nuevo si quieres registrarlo.',
  kindExpense: 'gasto',
  kindIncome: 'ingreso',
  nothingPending: 'No hay nada pendiente por confirmar.',
  draftIncomplete: 'El borrador está incompleto. Mándame el movimiento de nuevo.',
  saveFail: 'No pude guardar el movimiento. Revisa tu sesión o intenta en la app.',
  saved: '✅ {kind} {amount} guardado en *{account}*.\nYa aparece en MONI.',
  cancelled: 'Cancelado. Cuando quieras, mándame otro movimiento.',
  kindExpenseCap: 'Gasto',
  kindIncomeCap: 'Ingreso',
  termsPrompt:
    '📄 Para usar el bot de MONI necesitas aceptar:\n\n{docs}\n\nTus mensajes, audios y fotos se procesan (vía WhatsApp de Meta y, para audios y tickets, OpenAI) solo para registrar tus movimientos.\n\n¿Aceptas? Responde *ACEPTO* o *NO*.',
  termsDocs: '• Términos y condiciones: {terms}\n• Aviso de privacidad: {privacy}',
  termsDocsSingle: '• Términos y aviso de privacidad: {terms}',
  termsDeclined: 'No vinculé tu WhatsApp. Si cambias de opinión, genera un código nuevo en MONI → Perfil → WhatsApp.',
  termsRequired: 'Sin aceptar los términos no puedo registrar movimientos. Escribe *ACEPTO* cuando quieras, o desvincula WhatsApp en la app.',
  termsAccepted: '✅ Gracias. Ya puedes seguir registrando gastos e ingresos.',
};

const en: Dict = {
  needLink:
    'Hi! I\'m the *Moni Financiera* bot.\n\nTo link your account:\n1. MONI → Profile → WhatsApp\n2. Generate a code\n3. Send: *LINK 123456*\n\nThen log expenses/income and ask *BALANCE* or *REPORT*.',
  savings:
    'For *savings goals*, open the MONI app → Budgets / Goals.\n\nHere I log *expenses* & *income*, and answer *BALANCE* / *REPORT*.',
  typePrompt: 'Reply *expense* or *income*.',
  editPrompt:
    'OK — send the corrected entry.\nEx: *I spent 95 at Starbucks* or *I received 3000 freelance*\nYou can also type *expense* / *income* to change the type.',
  audioFail: 'Couldn\'t read the audio. Try again.',
  listening: 'Listening to your voice note…',
  transcribeFail: 'Couldn\'t understand the voice note. Try again or type the entry.',
  audioError: 'Error processing audio. Try again.',
  imageFail: 'Couldn\'t read the image.',
  readingReceipt: 'Reading the receipt…',
  receiptError: 'Error reading the receipt. Try again or type the amount.',
  fallbackHelp:
    'I can log *expenses* & *income* (text, voice, or receipt).\nQueries: *BALANCE*, *REPORT*, *HELP*.\nEx: I spent 80 at Oxxo',
  linkInvalid: 'Invalid or used code. Generate a new one in MONI → Profile → WhatsApp.',
  linkExpired: 'That code expired. Generate a new one in the app.',
  linkFail: 'Couldn\'t link. If this number is on another account, unlink it first.',
  linkOk:
    '✅ WhatsApp linked to MONI.\n\nLog:\n• I spent 80 at Starbucks\n• I spent 150 on Uber with BBVA\n• I received 5000 salary\n• Voice note or receipt photo\n\nAsk:\n• *BALANCE*\n• *REPORT* / *SUMMARY*\n• *HELP*',
  noAmount: 'I didn\'t catch the amount. Ex:\n• I spent 80 at Starbucks\n• I received 2500 freelance',
  noAccount: 'Create an account in MONI → Profile → Accounts before logging entries.',
  draftFail: 'Couldn\'t create the draft. Try again.',
  ambiguous: 'I detected {amount}{merchant}.\nIs it an *expense* or *income*?',
  confirm: 'Save *{kind}* {parts}?\n💳 Account: *{account}*{picker}\n\nReply *Yes*, *No*, or *Edit*.\n_To change the category, type its name, e.g. Salud._',
  accountPicker: '\n\nDifferent account? Reply with its number (or *2 yes* to pick and save at once):\n{list}',
  accountInvalid: 'I don\'t have account {n}. Pick a number from the list.',
  draftAlreadySaved: 'That entry was already saved.',
  draftAlreadyCancelled: 'That entry was already cancelled. Send it again if you want to log it.',
  kindExpense: 'expense',
  kindIncome: 'income',
  nothingPending: 'Nothing pending to confirm.',
  draftIncomplete: 'Draft is incomplete. Send the entry again.',
  saveFail: 'Couldn\'t save. Check your session or try in the app.',
  saved: '✅ {kind} {amount} saved to *{account}*.\nIt\'s already in MONI.',
  cancelled: 'Cancelled. Send another entry whenever you want.',
  kindExpenseCap: 'Expense',
  kindIncomeCap: 'Income',
  termsPrompt:
    '📄 To use the MONI bot you need to accept:\n\n{docs}\n\nYour messages, voice notes and photos are processed (via Meta\'s WhatsApp and, for voice notes and receipts, OpenAI) only to log your transactions.\n\nDo you accept? Reply *ACCEPT* or *NO*.',
  termsDocs: '• Terms and conditions: {terms}\n• Privacy notice: {privacy}',
  termsDocsSingle: '• Terms and privacy notice: {terms}',
  termsDeclined: 'I didn\'t link your WhatsApp. If you change your mind, generate a new code in MONI → Profile → WhatsApp.',
  termsRequired: 'Without accepting the terms I can\'t log transactions. Type *ACCEPT* whenever you want, or unlink WhatsApp in the app.',
  termsAccepted: '✅ Thanks. You can keep logging expenses and income.',
};

export function t(
  locale: BotLocale,
  key: string,
  vars?: Record<string, string>,
): string {
  const table = locale === 'en' ? en : esOnly;
  let out = table[key] ?? es[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, v);
    }
  }
  return out;
}

/** Unlinked welcome: bilingual so either language works. */
export function welcomeUnlinked(): string {
  return es.needLink;
}

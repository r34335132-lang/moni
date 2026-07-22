import type { Movement } from '@/context/MovementsContext';
import type { UserProfile } from '@/context/ProfileContext';

function fmt(amount: number, profile: UserProfile): string {
  return `${profile.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getMonthMovements(movements: Movement[], month: number, year: number) {
  return movements.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

export function generateAIResponse(question: string, movements: Movement[], profile: UserProfile): string {
  const lower = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const now = new Date();
  const thisMonth = getMonthMovements(movements, now.getMonth(), now.getFullYear());

  const income = thisMonth.filter((m) => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const expenses = thisMonth.filter((m) => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
  const balance = income - expenses;

  const catTotals: Record<string, number> = {};
  thisMonth
    .filter((m) => m.type === 'expense')
    .forEach((m) => {
      catTotals[m.category] = (catTotals[m.category] || 0) + m.amount;
    });
  const sortedCats = Object.entries(catTotals).sort(([, a], [, b]) => b - a);

  const allIncome = movements.filter((m) => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const allExpenses = movements.filter((m) => m.type === 'expense').reduce((s, m) => s + m.amount, 0);

  // Greetings
  if (/^(hola|buenos|buenas|hi|hey)/.test(lower)) {
    return `Hola ${profile.name}! Soy Moni, tu asistente financiera personal.\n\nPuedes preguntarme:\n\n• ¿Cuánto gasté este mes?\n• ¿Cuánto tengo disponible?\n• ¿En qué gasto más?\n• ¿Estoy ahorrando?\n• ¿Qué gasto puedo reducir?`;
  }

  // Total expenses this month
  if ((lower.includes('cuanto') || lower.includes('cuantos')) && (lower.includes('gaste') || lower.includes('gasto') || lower.includes('gaste'))) {
    if (expenses === 0) return 'Este mes no tienes gastos registrados. ¡Empieza registrando tu primer gasto!';
    let r = `Este mes has gastado ${fmt(expenses, profile)} en total.`;
    if (sortedCats.length > 0) {
      r += `\n\nTu mayor gasto fue en ${sortedCats[0][0]}: ${fmt(sortedCats[0][1], profile)}.`;
    }
    return r;
  }

  // Available balance
  if (lower.includes('disponible') || lower.includes('me queda') || lower.includes('cuanto tengo') || lower.includes('tengo disponible')) {
    if (income === 0) return 'No tienes ingresos registrados este mes. Registra tus ingresos para ver tu balance disponible.';
    const mood = balance > 0 ? '¡Vas muy bien!' : 'Cuidado, tus gastos superan tus ingresos.';
    return `Tu balance disponible es ${fmt(balance, profile)}.\n\n• Ingresos: ${fmt(income, profile)}\n• Gastos: ${fmt(expenses, profile)}\n\n${mood}`;
  }

  // Where I spend the most
  if (lower.includes('en que gasto') || lower.includes('gasto mas') || lower.includes('mayor gasto') || lower.includes('gasto mucho')) {
    if (sortedCats.length === 0) return 'No tienes gastos registrados este mes.';
    const top = sortedCats.slice(0, 3);
    return `Tus principales gastos este mes:\n\n${top.map(([cat, amt], i) => `${i + 1}. ${cat}: ${fmt(amt, profile)}`).join('\n')}`;
  }

  // Savings
  if (lower.includes('ahorrando') || lower.includes('ahorro') || lower.includes('ahorrar') || lower.includes('puedo ahorrar')) {
    if (income === 0) return 'Registra tus ingresos para calcular tu capacidad de ahorro.';
    if (balance <= 0) {
      return `Este mes estás gastando más de lo que ganas.\n\nTe recomiendo revisar tus gastos en ${sortedCats[0]?.[0] ?? 'las categorías principales'}.`;
    }
    const rate = ((balance / income) * 100).toFixed(0);
    const good = Number(rate) >= 20;
    return `Estás ahorrando el ${rate}% de tus ingresos (${fmt(balance, profile)}).\n\n${good ? '¡Excelente! Superas el 20% recomendado.' : 'Lo ideal es ahorrar al menos el 20% de tus ingresos.'}`;
  }

  // Weekly budget
  if (lower.includes('semana') || lower.includes('esta semana') || lower.includes('gastar esta semana')) {
    if (income === 0) return 'Registra tus ingresos para calcular tu presupuesto semanal.';
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - now.getDate();
    const weeksLeft = Math.max(1, remainingDays / 7);
    if (balance <= 0) return 'Tu balance está en negativo. Te recomiendo no hacer gastos adicionales esta semana.';
    return `Puedes gastar aproximadamente ${fmt(balance / weeksLeft, profile)} esta semana, basado en tu balance de ${fmt(balance, profile)} para los próximos ${remainingDays} días.`;
  }

  // Reduce spending
  if (lower.includes('reducir') || lower.includes('recortar') || lower.includes('ahorrar mas')) {
    if (sortedCats.length === 0) return '¡No tienes gastos este mes! Estás haciéndolo de maravilla.';
    const top = sortedCats[0];
    return `Tu mayor oportunidad de ahorro está en ${top[0]}, donde has gastado ${fmt(top[1], profile)} este mes.\n\nReducir un 20% aquí te daría ${fmt(top[1] * 0.2, profile)} adicionales al mes.`;
  }

  // Income this month
  if (lower.includes('ingreso') || lower.includes('gane') || lower.includes('cobré') || lower.includes('cobre') || lower.includes('sueldo')) {
    if (income === 0) return 'No tienes ingresos registrados este mes.';
    return `Este mes has registrado ${fmt(income, profile)} en ingresos.`;
  }

  // Restaurants
  if (lower.includes('restaurante') || lower.includes('comi') || lower.includes('comida')) {
    const total = (catTotals['restaurantes'] || 0) + (catTotals['comida'] || 0);
    if (total === 0) return 'No tienes gastos en comida o restaurantes este mes.';
    return `Este mes has gastado ${fmt(total, profile)} en comida y restaurantes.`;
  }

  // Gas
  if (lower.includes('gasolina') || lower.includes('gas')) {
    const total = catTotals['gasolina'] || 0;
    if (total === 0) return 'No tienes gastos en gasolina este mes.';
    return `Este mes has gastado ${fmt(total, profile)} en gasolina.`;
  }

  // Global history
  if (lower.includes('total') || lower.includes('historial') || lower.includes('todo')) {
    return `Historial completo:\n\n• Total ingresos: ${fmt(allIncome, profile)}\n• Total gastos: ${fmt(allExpenses, profile)}\n• Balance total: ${fmt(allIncome - allExpenses, profile)}\n• Movimientos registrados: ${movements.length}`;
  }

  // Default
  return `Hola ${profile.name}! Puedo ayudarte con:\n\n• ¿Cuánto gasté este mes?\n• ¿Cuánto tengo disponible?\n• ¿En qué gasto más?\n• ¿Estoy ahorrando?\n• ¿Cuánto puedo gastar esta semana?\n• ¿Qué gasto puedo reducir?\n\n¿Sobre qué quieres saber?`;
}

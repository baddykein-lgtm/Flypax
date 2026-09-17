// Configuración de reservas y preguntas de alta por tipo de negocio.
// Esto es exactamente lo que validamos en el prototipo — la fuente
// de verdad para el onboarding, el modal de reserva y la app de cliente.

export const CATEGORIES = [
  { id: "restaurante", label: "Restaurante / bar", em: "🍽️" },
  { id: "peluqueria", label: "Peluquería / barbería", em: "💈" },
  { id: "clinica", label: "Clínica / consulta", em: "🩺" },
  { id: "taller", label: "Taller", em: "🔧" },
  { id: "tienda", label: "Tienda", em: "🛍️" },
  { id: "otro", label: "Otro negocio", em: "🏪" },
];

export const CATEGORY_CONFIG = {
  restaurante: {
    resLabel: "Reservar mesa",
    showPeople: true,
    hasTableOrders: true,
    onboardQ: [
      { key: "tables", label: "¿Cuántas mesas tenéis?", type: "number", placeholder: "Ej. 12" },
      { key: "takeaway", label: "¿Aceptáis pedidos para llevar?", type: "bool" },
    ],
  },
  peluqueria: {
    resLabel: "Pedir cita",
    showPeople: false,
    extraFields: [{ key: "service", label: "¿Qué servicio necesitas?", placeholder: "Ej. Corte + barba" }],
    onboardQ: [
      { key: "staff", label: "¿Cuántos profesionales atendéis a la vez?", type: "number", placeholder: "Ej. 3" },
      { key: "duration", label: "Duración media de una cita", type: "select", options: ["15 min", "30 min", "45 min", "60 min"] },
    ],
  },
  clinica: {
    resLabel: "Pedir cita",
    showPeople: false,
    extraFields: [{ key: "reason", label: "Motivo de la consulta", placeholder: "Ej. Revisión general" }],
    onboardQ: [
      { key: "specialty", label: "Especialidad principal", type: "text", placeholder: "Ej. Fisioterapia" },
      { key: "duration", label: "Duración media de consulta", type: "select", options: ["15 min", "30 min", "45 min", "60 min"] },
    ],
  },
  taller: {
    resLabel: "Pedir cita",
    showPeople: false,
    extraFields: [
      { key: "vehicle", label: "Vehículo (marca, modelo, matrícula)", placeholder: "Ej. Seat León 4521 ABC" },
      { key: "need", label: "¿Qué necesita?", placeholder: "Ej. Ruido en el motor, cambio de frenos" },
    ],
    onboardQ: [
      { key: "vehicleTypes", label: "¿Qué tipo de vehículos atendéis?", type: "text", placeholder: "Ej. Coches y furgonetas" },
      { key: "pickup", label: "¿Ofrecéis recogida del vehículo?", type: "bool" },
    ],
  },
  tienda: {
    resLabel: "Reservar producto",
    showPeople: false,
    extraFields: [{ key: "item", label: "Producto a recoger", placeholder: "Ej. Vale regalo 20€" }],
    onboardQ: [{ key: "online", label: "¿Vendéis también online?", type: "bool" }],
  },
  otro: {
    resLabel: "Reservar",
    showPeople: true,
    onboardQ: [{ key: "notes", label: "Cuéntanos algo más sobre tu negocio", type: "text", placeholder: "Opcional" }],
  },
};

export function getCategoryConfig(categoryId) {
  return CATEGORY_CONFIG[categoryId] || CATEGORY_CONFIG.otro;
}

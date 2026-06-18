const STORAGE_KEY = "mi-ganancia-diaria:v2";
const OLD_STORAGE_KEY = "mi-ganancia-diaria:v1";

const state = {
  movements: loadMovements(),
  filter: "all",
  period: "day",
  anchorDate: new Date(),
};

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const longDateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
});

const monthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
});

const elements = {
  currentDate: document.querySelector("#currentDate"),
  periodLabel: document.querySelector("#periodLabel"),
  netProfit: document.querySelector("#netProfit"),
  grossProfit: document.querySelector("#grossProfit"),
  totalSales: document.querySelector("#totalSales"),
  totalExpenses: document.querySelector("#totalExpenses"),
  saleForm: document.querySelector("#saleForm"),
  saleProduct: document.querySelector("#saleProduct"),
  saleDate: document.querySelector("#saleDate"),
  saleAmount: document.querySelector("#saleAmount"),
  saleCost: document.querySelector("#saleCost"),
  saleProfitPreview: document.querySelector("#saleProfitPreview"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseName: document.querySelector("#expenseName"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseAmount: document.querySelector("#expenseAmount"),
  movementList: document.querySelector("#movementList"),
  emptyState: document.querySelector("#emptyState"),
  breakdownList: document.querySelector("#breakdownList"),
  breakdownTitle: document.querySelector("#breakdownTitle"),
  historyTitle: document.querySelector("#historyTitle"),
  filterButtons: document.querySelectorAll(".filter-button"),
  periodButtons: document.querySelectorAll(".period-button"),
  previousPeriodBtn: document.querySelector("#previousPeriodBtn"),
  nextPeriodBtn: document.querySelector("#nextPeriodBtn"),
  clearPeriodBtn: document.querySelector("#clearPeriodBtn"),
};

elements.currentDate.textContent = capitalize(longDateFormatter.format(new Date()));
elements.saleDate.value = getDateKey(new Date());
elements.expenseDate.value = getDateKey(new Date());
updateSaleProfitPreview();
render();

elements.saleForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const product = elements.saleProduct.value.trim();
  const amount = toNumber(elements.saleAmount.value);
  const cost = toNumber(elements.saleCost.value);
  const profit = amount - cost;
  const date = parseDateInput(elements.saleDate.value);

  if (!product || amount <= 0 || cost < 0 || profit <= 0 || !date) return;

  addMovement({
    type: "sale",
    title: product,
    amount,
    cost,
    profit,
    createdAt: createMovementDate(date).toISOString(),
  });

  elements.saleForm.reset();
  elements.saleDate.value = getDateKey(new Date());
  updateSaleProfitPreview();
  elements.saleProduct.focus();
});

elements.saleAmount.addEventListener("input", updateSaleProfitPreview);
elements.saleCost.addEventListener("input", updateSaleProfitPreview);

elements.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = elements.expenseName.value.trim();
  const amount = toNumber(elements.expenseAmount.value);
  const date = parseDateInput(elements.expenseDate.value);

  if (!name || amount <= 0 || !date) return;

  addMovement({
    type: "expense",
    title: name,
    amount,
    createdAt: createMovementDate(date).toISOString(),
  });

  elements.expenseForm.reset();
  elements.expenseDate.value = getDateKey(new Date());
  elements.expenseName.focus();
});

elements.movementList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  state.movements = state.movements.filter((movement) => movement.id !== button.dataset.deleteId);
  saveMovements();
  render();
});

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    elements.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

elements.periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.period = button.dataset.period;
    state.anchorDate = new Date();
    elements.periodButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

elements.previousPeriodBtn.addEventListener("click", () => {
  state.anchorDate = shiftPeriod(state.anchorDate, state.period, -1);
  render();
});

elements.nextPeriodBtn.addEventListener("click", () => {
  state.anchorDate = shiftPeriod(state.anchorDate, state.period, 1);
  render();
});

elements.clearPeriodBtn.addEventListener("click", () => {
  const { start, end } = getPeriodRange(state.anchorDate, state.period);
  const periodMovements = getMovementsInRange(start, end);
  if (!periodMovements.length) return;

  const confirmed = window.confirm("Quieres borrar todos los movimientos de este periodo?");
  if (!confirmed) return;

  state.movements = state.movements.filter((movement) => !isInRange(new Date(movement.createdAt), start, end));
  saveMovements();
  render();
});

function addMovement(movement) {
  state.movements.unshift({
    id: crypto.randomUUID(),
    ...movement,
  });

  state.anchorDate = new Date(movement.createdAt);
  saveMovements();
  render();
}

function render() {
  const { start, end } = getPeriodRange(state.anchorDate, state.period);
  const periodMovements = getMovementsInRange(start, end);
  const totals = calculateTotals(periodMovements);
  const visibleMovements = periodMovements.filter((movement) => {
    return state.filter === "all" || movement.type === state.filter;
  });

  elements.periodLabel.textContent = getPeriodLabel(start, end, state.period);
  elements.historyTitle.textContent = getHistoryTitle(state.period);
  elements.breakdownTitle.textContent = state.period === "month" ? "Dias del mes" : "Dias del periodo";
  elements.netProfit.textContent = formatMoney(totals.profit - totals.expenses);
  elements.grossProfit.textContent = formatMoney(totals.profit);
  elements.totalSales.textContent = formatMoney(totals.sales);
  elements.totalExpenses.textContent = formatMoney(totals.expenses);

  elements.emptyState.classList.toggle("visible", visibleMovements.length === 0);
  elements.movementList.innerHTML = visibleMovements.map(createMovementTemplate).join("");
  elements.breakdownList.innerHTML = createBreakdownTemplate(start, end, periodMovements);
}

function createMovementTemplate(movement) {
  const createdAt = new Date(movement.createdAt);
  const isSale = movement.type === "sale";
  const mainAmount = isSale ? movement.profit : movement.amount;
  const sign = isSale ? "+" : "-";
  const secondaryText = isSale
    ? `Vendido en ${formatMoney(movement.amount)} | Costo ${formatMoney(getMovementCost(movement))}`
    : "Gasto registrado";

  return `
    <li class="movement-item ${movement.type}">
      <div>
        <p class="movement-title">${escapeHtml(movement.title)}</p>
        <p class="movement-meta">${secondaryText} | ${capitalize(shortDateFormatter.format(createdAt))} ${timeFormatter.format(createdAt)}</p>
      </div>
      <div class="movement-amount">
        <strong>${sign}${formatMoney(mainAmount)}</strong>
        <span>${isSale ? "Ganancia" : "Restado"}</span>
      </div>
      <button class="delete-button" type="button" data-delete-id="${movement.id}" aria-label="Eliminar ${escapeHtml(movement.title)}" title="Eliminar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>
      </button>
    </li>
  `;
}

function createBreakdownTemplate(start, end, movements) {
  const rows = [];
  const cursor = startOfDay(start);

  while (cursor <= end) {
    const key = getDateKey(cursor);
    const dayMovements = movements.filter((movement) => getDateKey(new Date(movement.createdAt)) === key);
    const totals = calculateTotals(dayMovements);

    if (dayMovements.length || state.period === "day") {
      rows.push(`
        <article class="breakdown-item">
          <div>
            <strong>${capitalize(shortDateFormatter.format(cursor))}</strong>
            <span>${dayMovements.length} movimiento${dayMovements.length === 1 ? "" : "s"}</span>
          </div>
          <div class="breakdown-money">
            <strong>${formatMoney(totals.profit - totals.expenses)}</strong>
            <span>Ventas ${formatMoney(totals.sales)} | Gastos ${formatMoney(totals.expenses)}</span>
          </div>
        </article>
      `);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (!rows.length) {
    return `
      <div class="empty-state visible">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
        <p>No hay resumen para este periodo.</p>
      </div>
    `;
  }

  return rows.join("");
}

function calculateTotals(movements) {
  return movements.reduce(
    (summary, movement) => {
      if (movement.type === "sale") {
        summary.sales += movement.amount;
        summary.profit += movement.profit;
      } else {
        summary.expenses += movement.amount;
      }

      return summary;
    },
    { sales: 0, profit: 0, expenses: 0 },
  );
}

function getMovementsInRange(start, end) {
  return state.movements
    .filter((movement) => isInRange(new Date(movement.createdAt), start, end))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getPeriodRange(date, period) {
  if (period === "week") {
    return getWeekRange(date);
  }

  if (period === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    return { start, end };
  }

  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

function getWeekRange(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysFromMonday);

  const end = endOfDay(new Date(start));
  end.setDate(start.getDate() + 6);

  return { start, end };
}

function shiftPeriod(date, period, direction) {
  const nextDate = new Date(date);

  if (period === "month") {
    nextDate.setMonth(nextDate.getMonth() + direction);
  } else if (period === "week") {
    nextDate.setDate(nextDate.getDate() + direction * 7);
  } else {
    nextDate.setDate(nextDate.getDate() + direction);
  }

  return nextDate;
}

function getPeriodLabel(start, end, period) {
  if (period === "day") {
    return capitalize(longDateFormatter.format(start));
  }

  if (period === "month") {
    return capitalize(monthFormatter.format(start));
  }

  return `${capitalize(shortDateFormatter.format(start))} - ${capitalize(shortDateFormatter.format(end))}`;
}

function getHistoryTitle(period) {
  if (period === "month") return "Movimientos del mes";
  if (period === "week") return "Movimientos de la semana";
  return "Movimientos del dia";
}

function loadMovements() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) return normalizeMovements(saved);

    const oldSaved = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || "[]");
    return Array.isArray(oldSaved) ? normalizeMovements(oldSaved) : [];
  } catch {
    return [];
  }
}

function normalizeMovements(movements) {
  return movements
    .filter((movement) => movement && movement.id && movement.type && movement.createdAt)
    .map((movement) => ({
      ...movement,
      amount: toNumber(movement.amount),
      cost: movement.type === "sale" ? getMovementCost(movement) : 0,
      profit: movement.type === "sale" ? toNumber(movement.profit) : 0,
    }));
}

function saveMovements() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movements));
}

function isInRange(date, start, end) {
  return date >= start && date <= end;
}

function createMovementDate(date) {
  const now = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
}

function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toNumber(value) {
  return Number.parseFloat(value) || 0;
}

function updateSaleProfitPreview() {
  const profit = toNumber(elements.saleAmount.value) - toNumber(elements.saleCost.value);
  elements.saleProfitPreview.textContent = formatMoney(Math.max(profit, 0));
}

function getMovementCost(movement) {
  if (movement.type !== "sale") return 0;
  const savedCost = toNumber(movement.cost);
  if (savedCost > 0 || movement.cost === 0) return savedCost;

  return Math.max(toNumber(movement.amount) - toNumber(movement.profit), 0);
}

function formatMoney(value) {
  return moneyFormatter.format(value);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

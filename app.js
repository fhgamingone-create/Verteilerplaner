const STORAGE_KEY = "schaltschrank-planer-v1";

const state = {
  cabinet: {
    name: "Unterverteilung",
    rows: 5,
    tePerRow: 12
  },
  devices: []
};

const els = {
  cabinetPreset: document.querySelector("#cabinetPreset"),
  rowCount: document.querySelector("#rowCount"),
  tePerRow: document.querySelector("#tePerRow"),
  cabinetName: document.querySelector("#cabinetName"),
  applyCabinetBtn: document.querySelector("#applyCabinetBtn"),
  deviceType: document.querySelector("#deviceType"),
  deviceLabel: document.querySelector("#deviceLabel"),
  deviceWidth: document.querySelector("#deviceWidth"),
  targetRow: document.querySelector("#targetRow"),
  circuitNumber: document.querySelector("#circuitNumber"),
  deviceFunction: document.querySelector("#deviceFunction"),
  connectedLoad: document.querySelector("#connectedLoad"),
  deviceNote: document.querySelector("#deviceNote"),
  addDeviceBtn: document.querySelector("#addDeviceBtn"),
  cabinet: document.querySelector("#cabinet"),
  planTitle: document.querySelector("#planTitle"),
  totalTe: document.querySelector("#totalTe"),
  usedTe: document.querySelector("#usedTe"),
  freeTe: document.querySelector("#freeTe"),
  warningBox: document.querySelector("#warningBox"),
  deviceTableBody: document.querySelector("#deviceTableBody"),
  searchInput: document.querySelector("#searchInput"),
  saveBtn: document.querySelector("#saveBtn"),
  printBtn: document.querySelector("#printBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  clearBtn: document.querySelector("#clearBtn"),
  editDialog: document.querySelector("#editDialog"),
  editForm: document.querySelector("#editForm"),
  editId: document.querySelector("#editId"),
  editLabel: document.querySelector("#editLabel"),
  editWidth: document.querySelector("#editWidth"),
  editRow: document.querySelector("#editRow"),
  editCircuit: document.querySelector("#editCircuit"),
  editFunction: document.querySelector("#editFunction"),
  editConnected: document.querySelector("#editConnected"),
  editNote: document.querySelector("#editNote"),
  saveEditBtn: document.querySelector("#saveEditBtn")
};

function normalizeHalfTe(value) {
  return Math.round(Number(value) * 2) / 2;
}

function formatTe(value) {
  return `${Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  })} TE`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function getRowDevices(rowIndex) {
  return state.devices
    .filter(device => device.row === rowIndex)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function usedInRow(rowIndex) {
  return getRowDevices(rowIndex).reduce((sum, device) => sum + Number(device.width), 0);
}

function totalUsed() {
  return state.devices.reduce((sum, device) => sum + Number(device.width), 0);
}

function updateRowSelectors() {
  const options = Array.from({ length: state.cabinet.rows }, (_, index) =>
    `<option value="${index}">Reihe ${index + 1}</option>`
  ).join("");

  els.targetRow.innerHTML = options;
  els.editRow.innerHTML = options;
}

function render() {
  updateRowSelectors();
  renderOverview();
  renderCabinet();
  renderTable();
  saveToLocalStorage();
}

function renderOverview() {
  const total = state.cabinet.rows * state.cabinet.tePerRow;
  const used = totalUsed();
  const free = total - used;

  els.planTitle.textContent = state.cabinet.name || "Unbenannter Verteiler";
  els.totalTe.textContent = formatTe(total);
  els.usedTe.textContent = formatTe(used);
  els.freeTe.textContent = formatTe(free);

  const overloadedRows = Array.from({ length: state.cabinet.rows }, (_, row) => ({
    row,
    over: usedInRow(row) - state.cabinet.tePerRow
  })).filter(item => item.over > 0);

  if (overloadedRows.length) {
    els.warningBox.classList.remove("hidden");
    els.warningBox.textContent = overloadedRows
      .map(item => `Reihe ${item.row + 1} ist um ${formatTe(item.over)} überbelegt.`)
      .join(" ");
  } else {
    els.warningBox.classList.add("hidden");
    els.warningBox.textContent = "";
  }
}

function renderCabinet() {
  els.cabinet.innerHTML = "";

  for (let rowIndex = 0; rowIndex < state.cabinet.rows; rowIndex += 1) {
    const devices = getRowDevices(rowIndex);
    const used = usedInRow(rowIndex);
    const free = state.cabinet.tePerRow - used;
    const halfUnits = Math.round(state.cabinet.tePerRow * 2);

    const row = document.createElement("section");
    row.className = "rail-row";

    const label = document.createElement("div");
    label.className = "row-label";
    label.innerHTML = `<strong>Reihe ${rowIndex + 1}</strong><span>${formatTe(state.cabinet.tePerRow)}</span>`;

    const grid = document.createElement("div");
    grid.className = "rail-grid";
    grid.dataset.row = String(rowIndex);
    grid.style.gridTemplateColumns = `repeat(${halfUnits}, minmax(26px, 1fr))`;
    grid.style.backgroundSize = `calc(100% / ${halfUnits}) 100%, 100% 100%`;

    grid.addEventListener("dragover", event => {
      event.preventDefault();
      grid.classList.add("drag-over");
    });

    grid.addEventListener("dragleave", () => grid.classList.remove("drag-over"));

    grid.addEventListener("drop", event => {
      event.preventDefault();
      grid.classList.remove("drag-over");
      const id = event.dataTransfer.getData("text/plain");
      moveDeviceToRow(id, rowIndex);
    });

    if (!devices.length) {
      const empty = document.createElement("span");
      empty.className = "empty-rail";
      empty.textContent = "Geräte hier ablegen";
      grid.appendChild(empty);
    }

    devices.forEach(device => {
      const card = document.createElement("article");
      card.className = "device";
      card.dataset.id = device.id;
      card.dataset.kind = device.kind;
      card.draggable = true;
      card.style.gridColumn = `span ${Math.max(1, Math.round(device.width * 2))}`;
      card.title = [
        device.label,
        device.circuit && `Stromkreis: ${device.circuit}`,
        device.function && `Funktion: ${device.function}`,
        device.connected && `Angeschlossen: ${device.connected}`,
        device.note && `Notiz: ${device.note}`
      ].filter(Boolean).join("\n");

      card.innerHTML = `
        <strong class="device-title">${escapeHtml(device.label)}</strong>
        <span class="device-meta">${escapeHtml(device.circuit || formatTe(device.width))}</span>
        <div class="device-actions">
          <button type="button" data-action="edit">Bearbeiten</button>
          <button type="button" data-action="delete">Löschen</button>
        </div>
      `;

      card.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", device.id);
        event.dataTransfer.effectAllowed = "move";
      });

      card.querySelector('[data-action="edit"]').addEventListener("click", () => openEdit(device.id));
      card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteDevice(device.id));

      grid.appendChild(card);
    });

    const status = document.createElement("div");
    status.className = "row-status";
    status.innerHTML = `
      <strong>${formatTe(used)} belegt</strong>
      <span>${free >= 0 ? `${formatTe(free)} frei` : `${formatTe(Math.abs(free))} zu viel`}</span>
    `;

    row.append(label, grid, status);
    els.cabinet.appendChild(row);
  }
}

function renderTable() {
  const term = els.searchInput.value.trim().toLowerCase();
  const rows = [...state.devices]
    .sort((a, b) => a.row - b.row || (a.order ?? 0) - (b.order ?? 0))
    .filter(device => {
      if (!term) return true;
      return [
        device.label,
        device.circuit,
        device.function,
        device.connected,
        device.note,
        `reihe ${device.row + 1}`
      ].join(" ").toLowerCase().includes(term);
    });

  els.deviceTableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7"><div class="empty-state"><strong>Keine passenden Geräte.</strong><span>Geräte hinzufügen oder Suche ändern.</span></div></td>`;
    els.deviceTableBody.appendChild(tr);
    return;
  }

  rows.forEach(device => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${device.row + 1}</td>
      <td>${escapeHtml(device.circuit || "–")}</td>
      <td><strong>${escapeHtml(device.label)}</strong>${device.note ? `<br><small>${escapeHtml(device.note)}</small>` : ""}</td>
      <td>${formatTe(device.width)}</td>
      <td>${escapeHtml(device.function || "–")}</td>
      <td>${escapeHtml(device.connected || "–")}</td>
      <td>
        <button type="button" class="table-action" data-edit="${device.id}">Bearbeiten</button>
      </td>
    `;
    tr.querySelector("[data-edit]").addEventListener("click", () => openEdit(device.id));
    els.deviceTableBody.appendChild(tr);
  });
}

function addDevice() {
  const width = normalizeHalfTe(els.deviceWidth.value);
  const row = Number(els.targetRow.value);

  if (!els.deviceLabel.value.trim()) {
    alert("Bitte eine Gerätebezeichnung eingeben.");
    return;
  }

  if (!Number.isFinite(width) || width < 0.5) {
    alert("Die Gerätebreite muss mindestens 0,5 TE betragen.");
    return;
  }

  const rowDevices = getRowDevices(row);
  state.devices.push({
    id: uid(),
    kind: els.deviceType.value,
    label: els.deviceLabel.value.trim(),
    width,
    row,
    order: rowDevices.length,
    circuit: els.circuitNumber.value.trim(),
    function: els.deviceFunction.value.trim(),
    connected: els.connectedLoad.value.trim(),
    note: els.deviceNote.value.trim()
  });

  els.circuitNumber.value = "";
  els.deviceFunction.value = "";
  els.connectedLoad.value = "";
  els.deviceNote.value = "";

  render();
}

function moveDeviceToRow(id, targetRow) {
  const device = state.devices.find(item => item.id === id);
  if (!device) return;

  device.row = targetRow;
  device.order = getRowDevices(targetRow).length;
  normalizeOrders();
  render();
}

function normalizeOrders() {
  for (let row = 0; row < state.cabinet.rows; row += 1) {
    getRowDevices(row).forEach((device, index) => {
      device.order = index;
    });
  }
}

function deleteDevice(id) {
  const device = state.devices.find(item => item.id === id);
  if (!device) return;

  if (!confirm(`„${device.label}“ wirklich löschen?`)) return;

  state.devices = state.devices.filter(item => item.id !== id);
  normalizeOrders();
  render();
}

function openEdit(id) {
  const device = state.devices.find(item => item.id === id);
  if (!device) return;

  els.editId.value = device.id;
  els.editLabel.value = device.label;
  els.editWidth.value = device.width;
  els.editRow.value = device.row;
  els.editCircuit.value = device.circuit || "";
  els.editFunction.value = device.function || "";
  els.editConnected.value = device.connected || "";
  els.editNote.value = device.note || "";

  els.editDialog.showModal();
}

function saveEdit(event) {
  event.preventDefault();

  const device = state.devices.find(item => item.id === els.editId.value);
  if (!device) return;

  const width = normalizeHalfTe(els.editWidth.value);
  if (!els.editLabel.value.trim() || !Number.isFinite(width) || width < 0.5) {
    alert("Bitte Bezeichnung und gültige TE-Breite eingeben.");
    return;
  }

  device.label = els.editLabel.value.trim();
  device.width = width;
  device.row = Number(els.editRow.value);
  device.circuit = els.editCircuit.value.trim();
  device.function = els.editFunction.value.trim();
  device.connected = els.editConnected.value.trim();
  device.note = els.editNote.value.trim();
  device.order = getRowDevices(device.row).length;

  normalizeOrders();
  els.editDialog.close();
  render();
}

function applyCabinet() {
  const rows = Math.max(1, Math.min(20, Number(els.rowCount.value)));
  const tePerRow = normalizeHalfTe(els.tePerRow.value);

  if (!Number.isFinite(rows) || !Number.isFinite(tePerRow) || tePerRow < 1) {
    alert("Bitte gültige Werte für Reihen und TE je Reihe eingeben.");
    return;
  }

  const affected = state.devices.filter(device => device.row >= rows);
  if (affected.length) {
    const proceed = confirm(
      `${affected.length} Gerät(e) liegen in Reihen, die entfernt würden. Diese Geräte werden in die letzte verbleibende Reihe verschoben.`
    );
    if (!proceed) return;
    affected.forEach(device => {
      device.row = rows - 1;
    });
  }

  state.cabinet = {
    name: els.cabinetName.value.trim() || "Unbenannter Verteiler",
    rows,
    tePerRow
  };

  normalizeOrders();
  render();
}

function applyPreset() {
  const value = els.cabinetPreset.value;
  if (value === "custom") return;

  const [rows, te] = value.split("x").map(Number);
  els.rowCount.value = rows;
  els.tePerRow.value = te;
}

function syncDeviceTemplate() {
  const option = els.deviceType.selectedOptions[0];
  els.deviceLabel.value = option.dataset.label || "";
  els.deviceWidth.value = option.dataset.width || "1";
  if (els.deviceType.value === "custom") {
    els.deviceLabel.select();
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data?.cabinet || !Array.isArray(data?.devices)) return;

    state.cabinet = {
      name: String(data.cabinet.name || "Unterverteilung"),
      rows: Math.max(1, Number(data.cabinet.rows) || 5),
      tePerRow: normalizeHalfTe(data.cabinet.tePerRow || 12)
    };

    state.devices = data.devices.map((device, index) => ({
      id: String(device.id || uid()),
      kind: String(device.kind || "custom"),
      label: String(device.label || "Gerät"),
      width: normalizeHalfTe(device.width || 1),
      row: Math.max(0, Math.min(state.cabinet.rows - 1, Number(device.row) || 0)),
      order: Number(device.order ?? index),
      circuit: String(device.circuit || ""),
      function: String(device.function || ""),
      connected: String(device.connected || ""),
      note: String(device.note || "")
    }));

    els.rowCount.value = state.cabinet.rows;
    els.tePerRow.value = state.cabinet.tePerRow;
    els.cabinetName.value = state.cabinet.name;
  } catch (error) {
    console.warn("Gespeicherter Plan konnte nicht geladen werden.", error);
  }
}

function exportJson() {
  const payload = JSON.stringify({
    app: "Schaltschrank-Planer",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...state
  }, null, 2);

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = state.cabinet.name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-|-$/g, "") || "verteiler";

  link.href = url;
  link.download = `${safeName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data.cabinet || !Array.isArray(data.devices)) {
      throw new Error("Ungültiges Dateiformat");
    }

    state.cabinet = {
      name: String(data.cabinet.name || "Importierter Verteiler"),
      rows: Math.max(1, Number(data.cabinet.rows) || 1),
      tePerRow: normalizeHalfTe(data.cabinet.tePerRow || 12)
    };

    state.devices = data.devices.map((device, index) => ({
      id: String(device.id || uid()),
      kind: String(device.kind || "custom"),
      label: String(device.label || "Gerät"),
      width: normalizeHalfTe(device.width || 1),
      row: Math.max(0, Math.min(state.cabinet.rows - 1, Number(device.row) || 0)),
      order: Number(device.order ?? index),
      circuit: String(device.circuit || ""),
      function: String(device.function || ""),
      connected: String(device.connected || ""),
      note: String(device.note || "")
    }));

    els.rowCount.value = state.cabinet.rows;
    els.tePerRow.value = state.cabinet.tePerRow;
    els.cabinetName.value = state.cabinet.name;
    els.cabinetPreset.value = "custom";
    render();
  } catch (error) {
    alert("Die JSON-Datei konnte nicht importiert werden.");
    console.error(error);
  } finally {
    els.importInput.value = "";
  }
}

function clearPlan() {
  if (!confirm("Alle eingeplanten Geräte löschen?")) return;
  state.devices = [];
  render();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

els.cabinetPreset.addEventListener("change", applyPreset);
els.applyCabinetBtn.addEventListener("click", applyCabinet);
els.deviceType.addEventListener("change", syncDeviceTemplate);
els.addDeviceBtn.addEventListener("click", addDevice);
els.searchInput.addEventListener("input", renderTable);
els.saveBtn.addEventListener("click", () => {
  saveToLocalStorage();
  const oldText = els.saveBtn.textContent;
  els.saveBtn.textContent = "Gespeichert";
  setTimeout(() => {
    els.saveBtn.textContent = oldText;
  }, 1200);
});
els.printBtn.addEventListener("click", () => window.print());
els.exportBtn.addEventListener("click", exportJson);
els.importInput.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) importJson(file);
});
els.clearBtn.addEventListener("click", clearPlan);
els.editForm.addEventListener("submit", saveEdit);

loadFromLocalStorage();
render();

let clientes = [];
const PASSWORD = "Lex5213";

fetch("base_clientes.json")
  .then((r) => r.json())
  .then((data) => {
    clientes = data || [];
  })
  .catch((err) => {
    console.error("Error cargando base_clientes.json", err);
  });

function login() {
  const input = document.getElementById("passwordInput");
  const errorEl = document.getElementById("loginError");
  const value = (input.value || "").trim();

  if (value === PASSWORD) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    input.value = "";
    errorEl.style.display = "none";
    errorEl.textContent = "";
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.focus();
  } else {
    errorEl.textContent = "Contraseña incorrecta. Verifica e intenta nuevamente.";
    errorEl.style.display = "block";
  }
}

/* ======================================================
   🔧 **BUSCADOR CORREGIDO**
   Ahora DPI, NIT y teléfonos se convierten siempre a STRING.
   Esto evita fallos cuando el JSON trae números en vez de texto.
   ====================================================== */
function buscar() {
  const termInput = document.getElementById("searchInput");
  const term = (termInput.value || "").trim();
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsCount = document.getElementById("resultsCount");

  if (!term) {
    resultsContainer.innerHTML = "<p class='result-empty'>Ingresa un valor para buscar en la base.</p>";
    resultsCount.textContent = "Sin búsqueda activa.";
    renderExternalInsights(term, null);
    return;
  }

  const lowerTerm = term.toLowerCase();
  const isNumeric = /^[0-9]+$/.test(term);

  const resultados = clientes.filter((c) => {
    // 🔧 Convertir SIEMPRE a string
    const dpi = (c.dpi || "").toString();
    const nombre = (c.nombre || "").toLowerCase();
    const nit = (c.nit || "").toString().toLowerCase();
    const email = (c.email || "").toLowerCase();
    const telefonos = Array.isArray(c.telefonos)
      ? c.telefonos.map((t) => (t || "").toString()) // ← FIX IMPORTANTE
      : [];

    let match = false;

    if (isNumeric) {
      if (dpi.includes(term)) match = true;
      if (nit.includes(term)) match = true;

      if (!match) {
        match = telefonos.some((t) => t.includes(term));
      }
    } else if (term.includes("@")) {
      if (email.includes(lowerTerm)) match = true;
    } else {
      if (nombre.includes(lowerTerm)) match = true;
      if (email.includes(lowerTerm)) match = true;
      if (dpi.includes(lowerTerm)) match = true;
      if (nit.includes(lowerTerm)) match = true;

      if (!match) {
        match = telefonos.some((t) => t.includes(lowerTerm));
      }
    }

    return match;
  });

  if (!resultados.length) {
    resultsContainer.innerHTML = "<p class='result-empty'>No se encontraron clientes con el criterio indicado.</p>";
    resultsCount.textContent = "0 resultados.";
  } else {
    resultsCount.textContent =
      resultados.length === 1 ? "1 resultado encontrado." : resultados.length + " resultados encontrados.";

    const fragment = document.createDocumentFragment();

    resultados.slice(0, 50).forEach((c) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const rowMain = document.createElement("div");
      rowMain.className = "result-row-main";

      const nameEl = document.createElement("div");
      nameEl.className = "result-name";
      nameEl.textContent = c.nombre || "(Sin nombre)";

      const idEl = document.createElement("div");
      idEl.className = "result-id";
      idEl.textContent = `DPI: ${c.dpi || "—"}`;

      rowMain.appendChild(nameEl);
      rowMain.appendChild(idEl);

      const metaEl = document.createElement("div");
      metaEl.className = "result-meta";
      const nit = c.nit || "—";
      const email = c.email || "—";
      metaEl.textContent = `NIT: ${nit} · Correo: ${email}`;

      const phonesWrapper = document.createElement("div");
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = "Teléfonos base interna";
      phonesWrapper.appendChild(label);

      const phonesGrid = document.createElement("div");
      phonesGrid.className = "phones-grid";

      const telefonos = Array.isArray(c.telefonos)
        ? c.telefonos.map((t) => (t || "").toString())
        : [];

      if (telefonos.length) {
        telefonos.forEach((t) => {
          const pill = document.createElement("span");
          pill.className = "phone-pill";
          pill.textContent = t;
          phonesGrid.appendChild(pill);
        });
      } else {
        const emptyText = document.createElement("span");
        emptyText.className = "result-empty";
        emptyText.textContent = "Sin teléfonos registrados.";
        phonesGrid.appendChild(emptyText);
      }

      phonesWrapper.appendChild(phonesGrid);

      card.appendChild(rowMain);
      card.appendChild(metaEl);
      card.appendChild(phonesWrapper);

      fragment.appendChild(card);
    });

    resultsContainer.innerHTML = "";
    resultsContainer.appendChild(fragment);
  }

  const referencia = resultados.length ? resultados[0] : null;
  renderExternalInsights(term, referencia);
}

function titleCase(str) {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function simplifyHandle(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 18);
}

function renderExternalInsights(term, clienteRef) {
  // Tu sección externa queda igual (no tiene relación con el fallo)
  // No la toqué para NO alterar tu diseño ni estructura.
  // Solo dependía del término y referencia, no del problema del JSON.

  const subtitleEl = document.getElementById("externalSubtitle");
  const container = document.getElementById("externalContent");

  const limpio = term.trim();
  if (!limpio) {
    subtitleEl.textContent =
      "Ingresa un criterio de búsqueda para generar contexto externo sugerido.";
    container.innerHTML =
      "<p class='result-empty'>Aún no se ha generado análisis externo. Realiza una búsqueda para ver sugerencias contextuales.</p>";
    return;
  }

  const nombreBase =
    (clienteRef && clienteRef.nombre) ||
    (isNaN(Number(limpio)) ? titleCase(limpio) : "");
  const telefonoBase =
    clienteRef && Array.isArray(clienteRef.telefonos) && clienteRef.telefonos.length
      ? clienteRef.telefonos[0]
      : "";

  const handleBase = simplifyHandle(nombreBase || limpio || "cliente");
  const telLimpio = (telefonoBase || "").toString().replace(/\D/g, "");
  const prefijoTel = telLimpio.slice(0, 4) || "5555";

  subtitleEl.textContent = nombreBase
    ? `Análisis generado a partir del criterio de búsqueda y el contexto del cliente «${nombreBase}».`
    : "Análisis generado a partir del criterio de búsqueda ingresado.";

  const telefonosRelacionados = [];

  if (telLimpio.length >= 8) {
    const baseNum = telLimpio.slice(0, 8);
    const numInt = parseInt(baseNum, 10);
    if (!isNaN(numInt)) {
      telefonosRelacionados.push(baseNum);
      telefonosRelacionados.push(String(numInt + 1).padStart(baseNum.length, "0"));
      telefonosRelacionados.push(String(numInt - 1).padStart(baseNum.length, "0"));
    }
  } else {
    telefonosRelacionados.push(prefijoTel + "0011");
    telefonosRelacionados.push(prefijoTel + "2277");
    telefonosRelacionados.push(prefijoTel + "9933");
  }

  const html = `
    <div class="external-grid">
      <div class="external-block">
        <div class="external-block-title">
          <span class="external-block-title-icon">📞</span>
          Contactos relacionados
        </div>
        <ul class="external-list">
          ${telefonosRelacionados
            .slice(0, 3)
            .map(
              (t) =>
                `<li><span class="external-list-strong">${t}</span> · Patrón similar.</li>`
            )
            .join("")}
        </ul>
      </div>

      <div class="external-block">
        <div class="external-block-title">
          <span class="external-block-title-icon">🌐</span>
          Coincidencias en la web
        </div>
        <ul class="external-list">
          <li>Búsquedas relacionadas con nombre, correo o teléfonos.</li>
        </ul>
      </div>

      <div class="external-block">
        <div class="external-block-title">
          <span class="external-block-title-icon">📱</span>
          Perfiles en plataformas digitales
        </div>
        <ul class="external-list">
          <li>Facebook: facebook.com/${handleBase}</li>
          <li>Instagram: instagram.com/${handleBase}.gt</li>
          <li>TikTok: tiktok.com/@${handleBase}</li>
          <li>LinkedIn: linkedin.com/in/${handleBase}</li>
        </ul>
      </div>

      <div class="external-block">
        <div class="external-block-title">
          <span class="external-block-title-icon">📍</span>
          Información adicional
        </div>
        <ul class="external-list">
          <li>Contexto sugerido para apoyar la gestión.</li>
        </ul>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  const pwdInput = document.getElementById("passwordInput");
  if (pwdInput) {
    pwdInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") login();
    });
  }
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") buscar();
    });
  }
});

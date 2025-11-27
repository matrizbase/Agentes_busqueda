let clientesDashboard = [];
const PASSWORD = "Lex5213";

fetch("base_clientes.json")
  .then((r) => r.json())
  .then((data) => {
    clientesDashboard = data || [];
  })
  .catch((err) => {
    console.error("Error cargando base_clientes.json", err);
  });

function loginDashboard() {
  const input = document.getElementById("passwordInput");
  const errorEl = document.getElementById("loginError");
  const value = (input.value || "").trim();

  if (value === PASSWORD) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("dashboardApp").classList.remove("hidden");
    input.value = "";
    errorEl.style.display = "none";
    errorEl.textContent = "";
    inicializarDashboard();
  } else {
    errorEl.textContent = "Contraseña incorrecta. Verifica e intenta nuevamente.";
    errorEl.style.display = "block";
  }
}

function calcularEdad(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) {
    edad--;
  }
  return edad;
}

function inicializarDashboard() {
  const total = clientesDashboard.length;

  let conEmail = 0;
  let conTelefono = 0;
  let sumaEdad = 0;
  let conteoEdad = 0;

  const rangosEdad = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56+": 0,
    "Sin dato": 0,
  };

  const prefijos = {};

  clientesDashboard.forEach((c) => {
    const email = (c.email || "").trim();
    if (email) conEmail++;

    const telefonos = Array.isArray(c.telefonos) ? c.telefonos : [];
    if (telefonos.length > 0) conTelefono++;

    const edad = calcularEdad(c.fecha_nacimiento);
    if (edad !== null && edad >= 0 && edad < 120) {
      sumaEdad += edad;
      conteoEdad++;

      if (edad >= 18 && edad <= 25) rangosEdad["18-25"]++;
      else if (edad >= 26 && edad <= 35) rangosEdad["26-35"]++;
      else if (edad >= 36 && edad <= 45) rangosEdad["36-45"]++;
      else if (edad >= 46 && edad <= 55) rangosEdad["46-55"]++;
      else if (edad >= 56) rangosEdad["56+"]++;
      else rangosEdad["Sin dato"]++;
    } else {
      rangosEdad["Sin dato"]++;
    }

    telefonos.forEach((t) => {
      const tel = (t || "").toString().replace(/\D/g, "");
      if (tel.length >= 2) {
        const pref = tel.slice(0, 2);
        prefijos[pref] = (prefijos[pref] || 0) + 1;
      }
    });
  });

  const kpiTotal = document.getElementById("kpiTotal");
  const kpiEmail = document.getElementById("kpiEmail");
  const kpiEmailPct = document.getElementById("kpiEmailPct");
  const kpiPhone = document.getElementById("kpiPhone");
  const kpiPhonePct = document.getElementById("kpiPhonePct");
  const kpiEdad = document.getElementById("kpiEdad");

  kpiTotal.textContent = total.toLocaleString("es-GT");
  kpiEmail.textContent = conEmail.toLocaleString("es-GT");
  kpiPhone.textContent = conTelefono.toLocaleString("es-GT");

  const pctEmail = total ? Math.round((conEmail / total) * 100) : 0;
  const pctPhone = total ? Math.round((conTelefono / total) * 100) : 0;

  kpiEmailPct.textContent = `${pctEmail}% con correo`;
  kpiPhonePct.textContent = `${pctPhone}% con al menos un teléfono`;

  const edadProm = conteoEdad ? Math.round(sumaEdad / conteoEdad) : null;
  kpiEdad.textContent = edadProm ? `${edadProm} años` : "Sin dato";

  const lastList = document.getElementById("lastClientsList");
  lastList.innerHTML = "";
  const muestra = clientesDashboard.slice(-8);
  if (!muestra.length) {
    lastList.innerHTML = "<li>No hay registros en la base.</li>";
  } else {
    muestra.reverse().forEach((c) => {
      const li = document.createElement("li");
      const nombre = c.nombre || "(Sin nombre)";
      const dpi = c.dpi || "—";
      const tel = Array.isArray(c.telefonos) && c.telefonos.length ? c.telefonos[0] : "Sin teléfono";
      li.textContent = `${nombre} · DPI ${dpi} · Tel: ${tel}`;
      lastList.appendChild(li);
    });
  }

  const ageCanvas = document.getElementById("ageChart");
  if (ageCanvas && window.Chart) {
    const labels = Object.keys(rangosEdad);
    const data = Object.values(rangosEdad);

    new Chart(ageCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Clientes",
            data,
            backgroundColor: "rgba(37, 99, 235, 0.7)",
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  }

  const prefixCanvas = document.getElementById("prefixChart");
  if (prefixCanvas && window.Chart) {
    const entries = Object.entries(prefijos);
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 6);
    const labels = top.map((x) => x[0]);
    const data = top.map((x) => x[1]);

    new Chart(prefixCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "rgba(37, 99, 235, 0.82)",
              "rgba(59, 130, 246, 0.82)",
              "rgba(96, 165, 250, 0.82)",
              "rgba(37, 99, 235, 0.55)",
              "rgba(59, 130, 246, 0.55)",
              "rgba(96, 165, 250, 0.55)",
            ],
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 14,
            },
          },
        },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pwdInput = document.getElementById("passwordInput");
  if (pwdInput) {
    pwdInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        loginDashboard();
      }
    });
  }
});

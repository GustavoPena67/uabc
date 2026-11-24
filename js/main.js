// Interacciones de la página: aparición al hacer scroll, índice activo,
// filtros de la línea del tiempo, validación del formulario y avisos (toast).

(function () {
  "use strict";

  // 1) Aparición suave de cada sección al entrar en pantalla (una sola vez)
  var secciones = document.querySelectorAll(".seccion");
  if ("IntersectionObserver" in window) {
    secciones.forEach(function (s) { s.classList.add("revelar"); });
    var obsRevelar = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obsRevelar.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    secciones.forEach(function (s) { obsRevelar.observe(s); });

    // 2) Marca en el índice la sección que se está leyendo
    var enlaces = document.querySelectorAll(".indice__lista a");
    var obsIndice = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) {
          var activo = a.getAttribute("href") === "#" + e.target.id;
          a.setAttribute("aria-current", activo ? "true" : "false");
          if (activo) a.scrollIntoView({ block: "nearest", inline: "nearest" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    secciones.forEach(function (s) { obsIndice.observe(s); });
  }

  // 3) Filtros de la línea del tiempo
  var filtros = document.querySelectorAll(".filtro");
  var filas = document.querySelectorAll("#tabla-tiempo tbody tr");
  filtros.forEach(function (boton) {
    boton.addEventListener("click", function () {
      var valor = boton.dataset.filtro;
      filtros.forEach(function (b) { b.setAttribute("aria-pressed", String(b === boton)); });
      filas.forEach(function (fila) {
        var mostrar = valor === "todos" || fila.dataset.ambito === valor;
        fila.classList.toggle("oculta", !mostrar);
      });
    });
  });

  // 4) Avisos tipo toast
  var contenedor = document.getElementById("avisos");
  function aviso(titulo, descripcion) {
    var el = document.createElement("div");
    el.className = "aviso";
    el.setAttribute("role", "status");
    var t = document.createElement("strong");
    t.textContent = titulo;
    el.appendChild(t);
    if (descripcion) el.appendChild(document.createTextNode(descripcion));
    contenedor.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("mostrar"); });
    });
    setTimeout(function () {
      el.classList.add("salir");
      setTimeout(function () { el.remove(); }, 250);
    }, 4000);
  }

  // 5) Validación del formulario
  var form = document.getElementById("form-comentarios");
  var reglas = {
    nombre: function (v) { return v.trim().length >= 3 ? "" : "Escribe tu nombre (mínimo 3 letras)."; },
    correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Escribe un correo válido."; },
    mensaje: function (v) { return v.trim().length >= 10 ? "" : "Tu comentario debe tener al menos 10 caracteres."; }
  };

  function validar(campo) {
    var error = reglas[campo.name](campo.value);
    campo.setAttribute("aria-invalid", error ? "true" : "false");
    document.getElementById("error-" + campo.name).textContent = error;
    return !error;
  }

  Object.keys(reglas).forEach(function (nombre) {
    var campo = form.elements[nombre];
    campo.addEventListener("blur", function () { if (campo.value) validar(campo); });
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ok = true;
    var primero = null;
    Object.keys(reglas).forEach(function (nombre) {
      var campo = form.elements[nombre];
      if (!validar(campo)) { ok = false; if (!primero) primero = campo; }
    });
    if (!ok) {
      form.classList.remove("sacudir");
      void form.offsetWidth;
      form.classList.add("sacudir");
      primero.focus();
      aviso("Revisa el formulario", "Hay campos que necesitan corrección.");
      return;
    }
    var nombre = form.elements.nombre.value.trim().split(" ")[0];
    aviso("¡Gracias, " + nombre + "!", "Tu comentario fue registrado.");
    form.reset();
  });

  form.addEventListener("reset", function () {
    form.querySelectorAll(".campo__error").forEach(function (e) { e.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); });
  });
})();

// Interacciones de la página: índice activo,
// filtros de la línea del tiempo, validación del formulario y avisos (toast).

(function () {
  "use strict";

  // 1) Marca en el índice la sección que se está leyendo
  var secciones = document.querySelectorAll("main > section[id]");
  var enlaces = document.querySelectorAll(".indice__lista a");
  if ("IntersectionObserver" in window) {
    var obsIndice = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        enlaces.forEach(function (a) {
          var activo = a.getAttribute("href") === "#" + e.target.id;
          a.setAttribute("aria-current", activo ? "true" : "false");
          if (activo && a.parentElement.parentElement.scrollWidth > a.parentElement.parentElement.clientWidth) {
            var lista = a.parentElement.parentElement;
            lista.scrollTo({ left: a.offsetLeft - lista.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
          }
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secciones.forEach(function (s) { obsIndice.observe(s); });
  }

  // 2) Filtros de la línea del tiempo: una pastilla se desliza al botón elegido
  //    y las filas que no aplican se atenúan (la tabla no cambia de alto).
  var filtros = document.querySelectorAll(".filtro");
  var pastilla = document.querySelector(".filtros__pastilla");
  var filas = document.querySelectorAll("#tabla-tiempo tbody tr");
  function moverPastilla(boton) {
    if (!pastilla) return;
    pastilla.style.width = boton.offsetWidth + "px";
    pastilla.style.transform = "translateX(" + boton.offsetLeft + "px)";
  }
  filtros.forEach(function (boton) {
    boton.addEventListener("click", function () {
      var valor = boton.dataset.filtro;
      filtros.forEach(function (b) { b.setAttribute("aria-pressed", String(b === boton)); });
      moverPastilla(boton);
      filas.forEach(function (fila) {
        var mostrar = valor === "todos" || fila.dataset.ambito === valor;
        fila.classList.toggle("atenuada", !mostrar);
      });
    });
  });
  function pastillaInicial() {
    var activo = document.querySelector('.filtro[aria-pressed="true"]');
    if (!activo || !pastilla) return;
    var t = pastilla.style.transition; pastilla.style.transition = "none";
    moverPastilla(activo);
    pastilla.offsetWidth; pastilla.style.transition = t;
  }
  pastillaInicial();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pastillaInicial);
  window.addEventListener("resize", pastillaInicial);

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

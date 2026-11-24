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

// ===== Animaciones extra: contadores, sellos, línea del tiempo y visor de fotos =====
(function () {
  "use strict";
  var html = document.documentElement;
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1) Las fechas de la portada cuentan hasta su año (una vez, al cargar)
  if (!reducido) {
    document.querySelectorAll("[data-contar]").forEach(function (el, i) {
      var fin = +el.dataset.contar, inicio = fin - 60, t0 = 0, dur = 1300;
      el.textContent = inicio;
      setTimeout(function () {
        function paso(t) {
          if (!t0) t0 = t;
          var u = Math.min(1, (t - t0) / dur);
          var e = 1 - Math.pow(1 - u, 4);
          el.textContent = Math.round(inicio + (fin - inicio) * e);
          if (u < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      }, 800 + i * 120);
    });
  }

  // 2) El kanji de cada sección se "estampa" como un sello (hanko) la primera vez que aparece,
  //    y la línea del tiempo se dibuja punto por punto.
  if ("IntersectionObserver" in window && !reducido) {
    html.classList.add("sello-listo");
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.matches(".tabla--tiempo") ? "trazada" : "estampado");
        obs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    document.querySelectorAll(".seccion__encabezado, .tabla--tiempo").forEach(function (el) { obs.observe(el); });
  }

  // 3) Visor de fotos: la foto crece desde su miniatura (y regresa a ella al cerrar)
  var visor = document.getElementById("visor");
  if (!visor) return;
  var vImg = visor.querySelector(".visor__img");
  var vCred = visor.querySelector(".visor__credito");
  var origen = null;

  function delta(desde, hasta) {
    return "translate(" + (desde.left - hasta.left) + "px," + (desde.top - hasta.top) + "px) scale(" +
      (desde.width / hasta.width) + "," + (desde.height / hasta.height) + ")";
  }

  function abrir(boton) {
    var img = boton.querySelector("img");
    origen = boton;
    vImg.src = img.currentSrc || img.src;
    vImg.alt = img.alt;
    vCred.textContent = boton.dataset.credito || "";
    visor.hidden = false;
    document.body.style.overflow = "hidden";
    var listo = function () {
      var a = img.getBoundingClientRect(), b = vImg.getBoundingClientRect();
      if (!reducido) {
        vImg.style.transition = "none";
        vImg.style.transform = delta(a, b);
        vImg.offsetWidth;
        vImg.style.transition = "transform 420ms cubic-bezier(0.32, 0.72, 0, 1)";
        vImg.style.transform = "none";
      }
      visor.classList.add("abierto");
      visor.querySelector(".visor__cerrar").focus({ preventScroll: true });
    };
    if (vImg.complete && vImg.naturalWidth) listo(); else vImg.onload = listo;
  }

  function cerrar() {
    if (visor.hidden) return;
    visor.classList.remove("abierto");
    var img = origen && origen.querySelector("img");
    var fin = function () {
      visor.hidden = true; vImg.style.transform = ""; vImg.style.transition = "";
      document.body.style.overflow = "";
      if (origen) origen.focus({ preventScroll: true });
    };
    if (img && !reducido) {
      var a = img.getBoundingClientRect(), b = vImg.getBoundingClientRect();
      vImg.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
      vImg.style.transform = delta(a, b);
      setTimeout(fin, 300);
    } else fin();
  }

  document.querySelectorAll(".foto-ampliable").forEach(function (b) {
    b.addEventListener("click", function () { abrir(b); });
  });
  visor.querySelectorAll("[data-cerrar]").forEach(function (el) { el.addEventListener("click", cerrar); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
})();

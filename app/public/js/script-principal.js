const casillas = document.querySelectorAll('.casilla');
const startButton = document.getElementById('startButton');

// Precargar y optimizar sonidos
function crearSonido(src) {
  const sonido = new Audio(src);
  sonido.preload = 'auto';
  sonido.volume = 1.0;
  return sonido;
}

const sonidoMovimientoRuleta = crearSonido('/music/ruletaInicio.mp3');
const sonidoMovimiento = crearSonido('/music/ruletaFinal.mp3');
const sonidoCelebracion = crearSonido('/music/win.mp3');
const sonidoClick = crearSonido('/music/click.mp3');

// Consultar créditos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/consultarCreditos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then(response => response.json())
    .then(data => {
      const creditosElement = document.getElementById("creditos");
      if (creditosElement) creditosElement.textContent = data.creditos[0].creditos;
    })
    .catch(console.error);
});

const perimetroIndices = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 23, 22, 21, 20, 19, 18, 17, 15, 13, 11, 9, 7];

let tiradaAnterior = null;
let gano = false;

startButton.addEventListener('click', girarRuleta);

function girarRuleta() {
  sonidoCelebracion.pause();
  sonidoCelebracion.currentTime = 0;
  
  const vueltas = 3;
  let recorridosRestantes = 0;
  
  const Recompensa = document.getElementById("creditos");
  const Premio = document.getElementById("premio");
  
  const valorActual = parseFloat(Recompensa.textContent) || 0;
  const valorActualRecompensa = parseFloat(Premio.textContent) || 0;
  
  Recompensa.textContent = valorActual + valorActualRecompensa;
  Premio.textContent = 0;
  
  if (gano) {
    resetFiguras();
    gano = false;
    return;
  }
  
  const figuras = obtenerFiguras();
  const sumaFiguras = Object.values(figuras).reduce((acc, valor) => acc + valor, 0);
  
  if (sumaFiguras === 0) {
    handleTiradaAnterior();
    return;
  }
  
  startButton.disabled = true;
  fetch("/api/actualizarCreditos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(figuras),
  })
    .then(response => response.json())
    .then(data => {
      const figuraIndex = perimetroIndices.indexOf(data.figura);
      if (figuraIndex !== -1) {
        recorridosRestantes = figuraIndex + vueltas * perimetroIndices.length;
        iluminarCasilla(recorridosRestantes, data);
        tiradaAnterior = { figuras };
      } else {
        console.error("Figura no válida recibida del servidor");
      }
    })
    .catch(console.error);
}

function iluminarCasilla(recorridosRestantes, data) {
  let index = 0;
  const totalPasos = recorridosRestantes;
  const tiempoInicial = 20;
  const tiempoFinal = 350;
  sonidoMovimientoRuleta.play();

  function iluminar() {
    casillas.forEach(casilla => casilla.classList.remove('selected'));
    const currentIndex = perimetroIndices[index];
    casillas[currentIndex].classList.add('selected');
    
    if (recorridosRestantes > 0) {
      index = (index + 1) % perimetroIndices.length;
      recorridosRestantes--;
      const progreso = (totalPasos - recorridosRestantes) / totalPasos;
      const tiempoPaso = tiempoInicial + (tiempoFinal - tiempoInicial) * Math.pow(progreso, 11);
      
      if (recorridosRestantes === 13) {
        sonidoMovimientoRuleta.pause();
        sonidoMovimiento.play();
      }
      setTimeout(iluminar, tiempoPaso);
    } else {
      startButton.disabled = false;
      if (data.premio === 'repite') {
        setTimeout(girarRuleta, 500);
      } else {
        handlePremio(data.premio);
      }
    }
  }
  iluminar();
}

function resetFiguras() {
  ["manzana", "sandia", "estrella", "siete", "bar", "campana", "limon", "naranja", "cereza"].forEach(id => {
    document.getElementById(id).textContent = 0;
  });
}

function obtenerFiguras() {
  return Object.fromEntries(["manzana", "sandia", "estrella", "siete", "bar", "campana", "limon", "naranja", "cereza"].map(id => [id, parseInt(document.getElementById(id).textContent, 10)]));
}

function handleTiradaAnterior() {
  if (tiradaAnterior) {
    sonidoClick.play();
    Object.entries(tiradaAnterior.figuras).forEach(([id, valor]) => {
      document.getElementById(id).textContent = valor;
    });
  } else {
    console.log("No hay tirada anterior.");
  }
}

function handlePremio(premio) {
  if (premio === 0) {
    resetFiguras();
    document.getElementById("premio").textContent = premio;
  } else {
    gano = true;
    sonidoCelebracion.play();
    document.getElementById("premio").textContent = premio;
  }
}

document.querySelectorAll(".contenedor-boton").forEach(button => {
  button.addEventListener("click", () => {
    const creditos = document.getElementById('creditos');
    if (parseInt(creditos.textContent, 10) === 0) return;
    sonidoClick.play();
    const fruit = button.dataset.fruit;
    const labelFruit = document.getElementById(fruit);
    labelFruit.textContent = parseInt(labelFruit.textContent, 10) + 1;
    creditos.textContent = parseInt(creditos.textContent, 10) - 1;
  });
});

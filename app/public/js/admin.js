document.getElementById("cerrar").addEventListener("click", () => {
  document.cookie = 'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.location.href = "/";
});

document.getElementById("cerrar-footer").addEventListener("click", () => {
  document.cookie = 'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.location.href = "/";
});

document.getElementById("comprar").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/transaccionPendiente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const resJson = await response.json();
    if (response.status === 200) { 
      window.location.href = resJson.redirect;
    } else {
      throw new Error("Error en la transacción pendiente");
    }
  } catch (error) {
    const comprar = document.getElementById('Comprar-creditos');
    comprar.style.display = "flex";
  }
});

document.getElementById("comprar-footer").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/transaccionPendiente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const resJson = await response.json();
    if (response.status === 200) { 
      window.location.href = resJson.redirect;
    } else {
      throw new Error("Error en la transacción pendiente");
    }
  } catch (error) {
    const comprar = document.getElementById('Comprar-creditos');
    comprar.style.display = "flex";
  }
});

function cerrar(event){
  const comprar = document.getElementById('Comprar-creditos');
  if (event.target === comprar) {
    comprar.style.display = "none";
  }
}
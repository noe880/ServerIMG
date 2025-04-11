document.addEventListener("DOMContentLoaded", async () => {
    const { createQR } = await import("https://esm.sh/@solana/pay");
    await fetchAndGenerateQR(createQR);
});

let referenceTotal = "";

async function fetchAndGenerateQR(createQR) {
    try {
        const response = await fetch("/api/QR", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta: ${response.status} - ${response.statusText}`);
        }
        const { url, amount, reference } = await response.json();
        if (url) {
            generateQR(url, createQR);
            const cantidad = document.getElementById('cantidad')
            const referencia = document.getElementById('referencia')
            cantidad.textContent = amount;
            referencia.textContent = reference;
            referenceTotal = reference[0];
            await waitForConfirmation(reference[0], amount);
        } else {
            console.error("No se recibió una URL válida para el QR.");
        }
    } catch (error) {
        console.error("Error al consultar el QR:", error);
    }
}

function generateQR(url, createQR) {
    const qrContainer = document.getElementById("qrContainer");

    if (!qrContainer) {
        console.error("Elemento #qrContainer no encontrado en el DOM.");
        return;
    }
    qrContainer.innerHTML = ""; // Limpiar el contenedor antes de generar un nuevo QR
    createQR(url, 400, "transparent", '#fff').append(qrContainer);
}


async function waitForConfirmation(reference, amount) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/check-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await res.json(); // Solo llamamos a res.json() una vez

                if (res.status === 200) {
                    const container = document.getElementById('container');
                    const containerConfirmacion = document.getElementById('container-confirmar');
                    container.style.display = 'none';
                    containerConfirmacion.style.display = 'flex';
                    
                    clearInterval(interval);
                    resolve(data);
                }

                if (data.redirect) { 
                    clearInterval(interval); // Detenemos la verificación antes de redirigir
                    setTimeout(() => { // Esperamos 5 segundos antes de redirigir
                        window.location.href = data.redirect;
                    }, 5000);
                }

            } catch (error) {
                console.error("Error verificando transacción:", error);
                clearInterval(interval);
                reject(error);
            }
        }, 8000); // Verifica cada 8 segundos
    });
}


document.getElementById('cancelar').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/cancelar-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referenceTotal })
        });

        const data = await response.json();

        if (response.status === 200) {
            window.history.replaceState({}, document.title, data.redirect);
            window.location.href = data.redirect;
        }
    } catch (error) {
        console.error("Error al cancelar:", error);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const urlButton = document.getElementById("url");

    if (!urlButton) {
        console.error("Elemento con ID 'url' no encontrado.");
        return;
    }

    urlButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/QR", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.status} - ${response.statusText}`);
            }

            const { url } = await response.json();


            // Detectar si el usuario está en un dispositivo móvil
            const isMobile = navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) || navigator.maxTouchPoints > 0;

            // Construir la URL de Phantom en caso de ser necesario
            const phantomUrl = isMobile 
                ? url 
                : data.url;

            console.log("Phantom URL usada:", phantomUrl);

            // Intentar abrir la URL en una nueva pestaña
            const win = window.open(phantomUrl, "_blank");

            // Si el navegador bloquea la apertura, redirigir al usuario directamente
            if (!win || win.closed || typeof win.closed === "undefined") {
                console.warn("El navegador bloqueó la apertura del enlace, redirigiendo...");
                setTimeout(() => {
                    window.location.href = phantomUrl;
                }, 500);
            }
        } catch (error) {
            console.error("Error al obtener la URL:", error);
            alert("Ocurrió un error al intentar abrir la aplicación de Phantom. Revisa la consola para más detalles.");
        }
    });
});









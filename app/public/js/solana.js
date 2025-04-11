const tasaConversion = 0.00031;
const sonidoMovimientos = new Audio('/music/cobrar.mp3');

document.addEventListener("DOMContentLoaded", async () => {
    waitForConfirmation();
});

function calcularTotal() {
    let cantidad = parseFloat(document.getElementById("amount").value) || 0;
    let totalSOL = cantidad * tasaConversion;
    document.getElementById("totalSol").innerText = `${totalSOL.toFixed(6)} SOL`;
}

async function generarPago() {
    const amountMXN = document.getElementById('amount').value;
    const amountSOL = convertirAMXNtoSOL(amountMXN);

    try {
        const response = await fetch('/api/generate-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: parseFloat(amountSOL) })
        });

        if (!response.ok) {
            const errorLabel = document.getElementById('errorConfirmPassword');
            errorLabel.textContent = "Usuario o contraseña incorrectos. Por favor, verifica tus datos.";
            errorLabel.classList.add('visible');
            return;
        }

        const resJson = await response.json();
        if (resJson.redirect) {
            const comprar = document.getElementById('Comprar-creditos');
            comprar.style.display = "none";
            window.location.href = resJson.redirect;
        }
    } catch (error) {
        console.error("Error al generar el pago", error);
        alert("Ingrese una cantidad valida");
    }
}

function convertirAMXNtoSOL(amountMXN) {
    return (amountMXN * tasaConversion).toFixed(4);  // Convertir MXN a SOL
}

async function cobrar() {
    const sonidoClone = sonidoMovimientos.cloneNode();
    sonidoClone.play();
    try {
        const response = await fetch('/api/cobrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data) {
            const creditosElement = document.getElementById('creditos');
            const premioElement = document.getElementById('premio');

            let creditos = parseInt(creditosElement.textContent) || 0;
            let premio = parseInt(premioElement.textContent) || 0;

            const reducirValor = (element, valorInicial) => {
                return new Promise(resolve => {
                    const intervalo = setInterval(() => {
                        let decremento = Math.max(1, Math.ceil(valorInicial * 0.05));
                        valorInicial -= decremento;
                        element.textContent = Math.max(0, valorInicial);

                        if (valorInicial <= 0) {
                            clearInterval(intervalo);
                            resolve();
                        }
                    }, 500);
                });
            };

            // Reducir créditos y premios en paralelo
            await Promise.all([
                reducirValor(creditosElement, creditos),
                reducirValor(premioElement, premio)
            ]);
        }
    } catch (error) {
        console.error("Error al generar cobro", error);
        alert("Ocurrió un error al generar el cobro");
    }
}


async function waitForConfirmation() {
    try {
        const res = await fetch('/api/check-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (data.redirect) {
            clearInterval(interval);
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 500);
        }

    } catch (error) {
        clearInterval(interval);
        reject(error);
    }
}


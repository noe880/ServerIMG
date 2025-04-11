const mensajeError = document.getElementsByClassName("error")[0];

// Función para ocultar los mensajes de error
function ocultarErrores() {
  const erroresVisibles = document.querySelectorAll(".error.visible");
  erroresVisibles.forEach((error) => {
    error.classList.remove("visible");
    error.textContent = "";
  });
}

// Escuchar el evento submit del formulario
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Ocultar mensajes de error al inicio
  ocultarErrores();

  // Obtener los valores del formulario
  const user = e.target.children.user.value.trim();
  const password = e.target.children.password.value;
  const confirm = e.target.children.confirmpassword.value;
  const wallet = e.target.children.wallet.value;

  let formularioValido = true;

  // Validar el nombre de usuario
  if (user.length < 6) {
    const errorLabel = document.getElementById('errorUser');
    errorLabel.textContent = "El nombre de usuario debe tener al menos 6 caracteres.";
    errorLabel.classList.add('visible');
    formularioValido = false;
  }

  // Validar la contraseña con requisitos de seguridad
  if (password.length < 8) {
    const errorLabel = document.getElementById('errorPassword');
    errorLabel.textContent = "La contraseña debe tener al menos 8 caracteres.";
    errorLabel.classList.add('visible');
    formularioValido = false;
  } else {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase) {
      const errorLabel = document.getElementById('errorPassword');
      errorLabel.textContent = "La contraseña debe incluir al menos una letra mayúscula.";
      errorLabel.classList.add('visible');
      formularioValido = false;
    }

    if (!hasLowerCase) {
      const errorLabel = document.getElementById('errorPassword');
      errorLabel.textContent = "La contraseña debe incluir al menos una letra minúscula.";
      errorLabel.classList.add('visible');
      formularioValido = false;
    }

    if (!hasNumber) {
      const errorLabel = document.getElementById('errorPassword');
      errorLabel.textContent = "La contraseña debe incluir al menos un número.";
      errorLabel.classList.add('visible');
      formularioValido = false;
    }

    if (!hasSpecialChar) {
      const errorLabel = document.getElementById('errorPassword');
      errorLabel.textContent = "La contraseña debe incluir al menos un carácter especial (por ejemplo, !@#$%^&*).";
      errorLabel.classList.add('visible');
      formularioValido = false;
    }
  }

  // Validar que las contraseñas coincidan
  if (password !== confirm) {
    const errorLabel = document.getElementById('errorConfirmPassword');
    errorLabel.textContent = "La contraseña no coincide.";
    errorLabel.classList.add('visible');
    formularioValido = false;
  }

  // Detener el envío si hay errores
  if (!formularioValido) return;

  // Si todas las validaciones pasan, proceder con el envío al servidor
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, password, confirm, wallet }),
    });

    if (!res.ok) {
      res.json().then(data => {
        const errorLabel = document.getElementById('error');
        errorLabel.textContent = data.message || 'Ha ocurrido un error desconocido';  // Corregido: `data.message` en lugar de `data.error`
        errorLabel.classList.add('visible');
        formularioValido = false;
      }).catch(error => {
        console.error('Error al procesar la respuesta:', error);
      });
      return;
    }
    

    const resJson = await res.json();
    if (resJson.redirect) {
      window.location.href = resJson.redirect;
    }
  } catch (error) {
    const errorLabel = document.getElementById('error');
    errorLabel.textContent = error.message || 'Ha ocurrido un error desconocido';
    errorLabel.classList.add('visible');
    formularioValido = false;
    return;
  }
});

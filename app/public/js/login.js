const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = e.target.children.user.value;
  const password = e.target.children.password.value;

  // Validación de campos vacíos
  if (!user || !password) {
    const errorLabel = document.getElementById('errorConfirmPassword');
    errorLabel.textContent = "Por favor, completa todos los campos.";
    errorLabel.classList.add('visible');
    return; // Detiene el envío del formulario
  }

  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user,
      password,
    }),
  });

  if (!res.ok) {
    const errorLabel = document.getElementById('errorConfirmPassword');
    errorLabel.textContent = "Usuario o contraseña incorrectos. Por favor, verifica tus datos.";
    errorLabel.classList.add('visible');
    return;
  }

  const resJson = await res.json();
  if (resJson.redirect) {
    window.location.href = resJson.redirect;
  }
});

import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { insertarUsuarios, obtenerUsuarios } from './database.js';
import dotenv from "dotenv";

dotenv.config();


async function login(req, res) {
  const usuarios = await obtenerUsuarios();
  const user = req.body.user;
  const password = req.body.password;
  if (!user || !password) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  const usuarioAResvisar = usuarios.find(usuario => usuario.user === user);
  if (!usuarioAResvisar) {
    return res.status(400).send({ status: "Error", message: "Error durante login" });
  }

  const loginCorrecto = await bcryptjs.compare(password, usuarioAResvisar.password);
  if (!loginCorrecto) {
    return res.status(400).send({ status: "Error", message: "Error durante login" });
  }

  const token = jsonwebtoken.sign(
    { user: usuarioAResvisar.user },
      process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    path: "/"
  };

  res.cookie("jwt", token, cookieOption);
  res.send({ status: "ok", message: "Usuario loggeado", redirect: "/admin" });
}



async function register(req, res) {
  const { user, password, confirm, wallet } = req.body;
  const usuarios = await obtenerUsuarios();
  // Validaciones
  if (!user || !password || !confirm || !wallet) {
    return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
  }

  // Validar nombre de usuario (mínimo 6 caracteres)
  if (user.length < 6) {
    return res.status(400).send({ status: "Error", message: "El nombre de usuario debe tener al menos 6 caracteres." });
  }

  // Validar si el usuario ya existe
  const usuarioARevisar = usuarios.find(usuario => usuario.user === user);
  if (usuarioARevisar) {
    return res.status(400).send({ status: "Error", message: "Este usuario ya existe" });
  }

  // Validar contraseña (mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial)
  if (password.length < 8) {
    return res.status(400).send({ status: "Error", message: "La contraseña debe tener al menos 8 caracteres." });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).send({ status: "Error", message: "La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial." });
  }

  // Validar que las contraseñas coincidan
  if (password !== confirm) {
    return res.status(400).send({ status: "Error", message: "La contraseña no coincide." });
  }

  // Encriptar la contraseña
  const salt = await bcryptjs.genSalt(5);
  const hashPassword = await bcryptjs.hash(password, salt);

  // Crear el nuevo usuario
  const nuevoUsuario = {
    user, 
    password: hashPassword,
    wallet
  };

  // Insertar el usuario en la base de datos
  insertarUsuarios(nuevoUsuario.user, nuevoUsuario.password,nuevoUsuario.wallet);

  // Respuesta exitosa
  return res.status(201).send({ status: "ok", message: `Usuario ${nuevoUsuario.user} agregado`, redirect: "/" });
}

export const methods = {
  login,
  register
};

import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { obtenerUsuarios } from './../controllers/database.js';

dotenv.config();

async function soloAdmin(req,res,next){
  const logueado = await revisarCookie(req);
  if(logueado) return next();
  return res.redirect("/")
}

async function soloPublico(req,res,next){
  const logueado = await revisarCookie(req);
  if(!logueado) return next();
  return res.redirect("/admin")
}

async function revisarCookie(req){
  try{
    const usuarios = await obtenerUsuarios();
    const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
    const usuarioAResvisar = usuarios.find(usuario => usuario.user === decodificada.user);
    if(!usuarioAResvisar){
      return false
    }
    return true;
  }
  catch{
    return false;
  }
}


export const methods = {
  soloAdmin,
  soloPublico,
}


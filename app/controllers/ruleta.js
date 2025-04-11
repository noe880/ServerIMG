import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import { obtenerCreditos, ActualizarCreditos, obtenerUsuarios } from './../controllers/database.js';

dotenv.config();


// Premios para cada figura
const premios = {
  manzana: 5,
  sandia: 20,
  estrella: 30,
  siete: 40,
  bar50: 50,
  bar: 100,
  campana: 20,
  limon: 15,
  naranja: 10,
  cereza: 2,
  diamante: 0
};


function obtenerFigura(numero) {
  const figuras = {
      0: "naranja", 23: "naranja",
      1: "campana", 22: "campana",
      2: "bar50", 
      3: "bar",
      4: "manzana", 9: "manzana", 10: "manzana", 14: "manzana", 19: "manzana",
      5: "cereza", 7: "cereza", 10: "cereza", 12: "cereza", 13: "cereza", 16: "cereza", 18: "cereza", 21: "cereza",
      6: "limon", 17: "limon",
      8: "sandia",
      11: "diamante", 12: "diamante",
      15: "estrella",
      20: "siete"
  };
  return figuras[numero] || "Número no reconocido";
}


async function actualizarCreditos(req, res) {
  try {
    const usuarios = await obtenerUsuarios();
    const { manzana, sandia, estrella, siete, bar, campana, limon, naranja, cereza} = req.body;
    const frutas = { manzana, sandia, estrella, siete, bar, campana, limon, naranja, cereza, bar50: bar};
    // Verificar si todos los valores son números enteros positivos
    const valores = [manzana, sandia, estrella, siete, bar, campana, limon, naranja, cereza];
    if (!valores.every(v => v >= 0)) {
      return res.status(400).json({ status: "Error", message: "Todos los valores deben ser números enteros positivos" });
    }
    

    const cookieJWT = req.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);
    if (!cookieJWT) {
      return res.status(401).json({ status: "Error", message: "No autenticado" });
    }

    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    const usuarioARevisar = usuarios.find(usuario => usuario.user === decodificada.user);

    if (!usuarioARevisar) {
      return res.status(404).json({ status: "Error", message: "Usuario no encontrado" });
    }

    const creditos = await obtenerCreditos(usuarioARevisar.id_usuario);
    const sumaCreditos = valores.reduce((acc, val) => acc + val, 0);

    if (creditos[0].creditos < sumaCreditos) {
      return res.status(400).json({ status: "Error", message: "No tienes suficientes créditos" });
    }
    const numeroAleatorioPorcentaje = Math.floor(Math.random() * 100) + 1;
    let numeroAleatorio = Math.floor(Math.random() * 24);

    if (numeroAleatorioPorcentaje >= 70) {
      let menorPremio = Infinity;
      let indicesMenorPremio = [];
      
      for (let i = 0; i < 24; i++) {
        const figuraGanada = obtenerFigura(i);
        const premio = premios[figuraGanada] * frutas[figuraGanada];
      
        if (premio < menorPremio) {
          menorPremio = premio;
          indicesMenorPremio = [i]; // Reinicia la lista con el nuevo menor premio
        } else if (premio === menorPremio) {
          indicesMenorPremio.push(i); // Agrega otro índice con el mismo menor premio
        }
      }

      numeroAleatorio = indicesMenorPremio[Math.floor(Math.random() * indicesMenorPremio.length)];
    }

    const figuraGanada = obtenerFigura(numeroAleatorio);
    if(figuraGanada === "diamante"){
      res.status(200).json({
        status: 'OK',
        message: 'Otra ves',
        figura: numeroAleatorio,
        premio: 'repite'
      });
    }else{
      const premio = premios[figuraGanada] * frutas[figuraGanada];
      const creditosActualizados = creditos[0].creditos - sumaCreditos + premio;
      await ActualizarCreditos(usuarioARevisar.id_usuario, creditosActualizados);
  
      res.status(200).json({
        status: 'OK',
        message: 'Datos recibidos correctamente',
        figura: numeroAleatorio,
        premio
      });
    }


  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ status: 'Error', message: 'Error al procesar la solicitud' });
  }
}



  async function consultarCreditos(req, res) {
      try{
        const usuarios = await obtenerUsuarios();
        const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
        const decodificada = jsonwebtoken.verify(cookieJWT,process.env.JWT_SECRET);
        const usuarioAResvisar = usuarios.find(usuario => usuario.user === decodificada.user);
        if(!usuarioAResvisar){
          return false
        }
        try {
          const creditos = await obtenerCreditos(usuarioAResvisar.id_usuario);
          res.status(200).json({ 
            status: 'OK', 
            message: 'Datos recibidos correctamente', 
            creditos,
          });
        } catch (error) {
          console.error('Error al procesar la solicitud:', error);
          res.status(500).json({ status: 'Error', message: 'Error al procesar la solicitud' });
        }
      }
      catch{
        return false;
      }
  }

export const methods = {
  actualizarCreditos,
  consultarCreditos
};
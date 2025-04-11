import { encodeURL, createQR} from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import dotenv from "dotenv";
import { obtenerUsuarios, obtenerReferencias, cancelarReferencia } from "./../controllers/database.js";
import jsonwebtoken from "jsonwebtoken";

dotenv.config();

const RECEIVER_WALLET = new PublicKey(process.env.RECEIVER_WALLET);
const tasaConversion = 0.00031;

async function TransactionQRModal(req, res) {
  try {
    // Obtener usuarios y validar JWT
    const usuarios = await obtenerUsuarios();
    const cookieJWT = req.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);

    if (!cookieJWT) {
      return res.status(400).json({ error: "Token JWT no encontrado" });
    }

    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    const usuario = usuarios.find(u => u.user === decodificada.user);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtener referencias del usuario
    const referencias = await obtenerReferencias(usuario.id_usuario);
    const total = referencias.total * tasaConversion;
    const reference = [new PublicKey(referencias.referencia)];

    const urlParams = {
      recipient: RECEIVER_WALLET,
      amount: new BigNumber(total),
      reference: reference,
      label: "Frutalcoin",
      message: `${referencias.total} Creditos`,
    };

    // Generar la URL
    const url = encodeURL(urlParams);
    res.status(200).json({ url: url, amount: total, reference: reference });
  } catch (error) {
    console.error("Error generando el QR:", error);
    res.status(500).json({ error: "Error generando el QR" });
  }
}


async function TransactionPendiente(req, res) {
  try {
    // Obtener usuarios y validar JWT
    const usuarios = await obtenerUsuarios();
    const cookieJWT = req.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);

    if (!cookieJWT) {
      return res.status(400).json({ error: "Token JWT no encontrado" });
    }

    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    const usuario = usuarios.find(u => u.user === decodificada.user);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtener referencias del usuario
    const referencias = await obtenerReferencias(usuario.id_usuario);
    if(referencias.status === 1 || referencias.status === 2){
      res.status(400).json({ error: "Sin pago pendiente" });
    }else{
      res.status(200).json({ redirect: "/pago" });
    }
  } catch (error) {
    res.status(400).json({ error: "Sin pago pendiente" });
  }
}


async function cancelarTransaction(req, res) {
  try {
    const {referenceTotal} = req.body
    // Obtener usuarios y validar JWT
    const usuarios = await obtenerUsuarios();
    const cookieJWT = req.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);

    if (!cookieJWT) {
      return res.status(400).json({ error: "Token JWT no encontrado" });
    }

    const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
    const usuario = usuarios.find(u => u.user === decodificada.user);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    await cancelarReferencia(referenceTotal);
    res.status(200).json({ redirect: "/admin" });
  } catch (error) {
    res.status(400).json({ error: "Sin pago pendiente" });
  }
}

export const methods = {
  TransactionQRModal, TransactionPendiente, cancelarTransaction
};




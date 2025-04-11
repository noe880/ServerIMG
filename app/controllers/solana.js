import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { encodeURL, findReference, validateTransfer, FindReferenceError } from '@solana/pay';
import BigNumber from 'bignumber.js';
import dotenv from "dotenv";
import jsonwebtoken from "jsonwebtoken";
import { ActualizarCreditos, obtenerCreditosWallet, actualizarCreditosYEstado,insertarPago, obtenerReferencias, obtenerUsuarios } from './../controllers/database.js';
import bs58 from 'bs58';

dotenv.config();

const connection = new Connection(process.env.SOLANA_RPC, 'confirmed');
const RECEIVER_WALLET = new PublicKey(process.env.RECEIVER_WALLET);
const tasaConversion = 0.00031;
const secretKey = process.env.SENDER_SECRET_KEY;
if (!secretKey) throw new Error("La clave secreta del remitente no está definida");
const SENDER_KEYPAIR = Keypair.fromSecretKey(bs58.decode(secretKey));

async function generarPago(req, res) {
    try {
        const usuarios = await obtenerUsuarios();
        const cookieJWT = req.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);
        if (!cookieJWT) return res.status(400).json({ error: "Token JWT no encontrado" });

        const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
        const usuario = usuarios.find(u => u.user === decodificada.user);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const { amount } = req.body;
        if (!amount) return res.status(400).json({ error: 'Faltan parámetros' });

        const amountBigNumber = new BigNumber(amount);
        if (amountBigNumber.isNaN() || amountBigNumber.isLessThanOrEqualTo(0)) {
            return res.status(400).json({ error: 'Monto inválido' });
        }

        const total = amount/tasaConversion
        const referenceKey = Keypair.generate().publicKey;
        await insertarPago(usuario.id_usuario, referenceKey.toBase58(), total)
        res.json({ status: "ok", redirect: "/pago" });
    } catch (error) {
        console.error('Error generando pago:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

async function transferirSOL(req, res) {
    try {
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

        const creditos = await obtenerCreditosWallet(usuario.id_usuario);
        if (!creditos || !creditos.wallet || parseInt(creditos.creditos) <= 0) {
            return res.status(400).json({ error: "Saldo insuficiente o datos incorrectos" });
        }

        const amountSOL = parseFloat(creditos.creditos) * tasaConversion;
        if (isNaN(amountSOL) || amountSOL <= 0) {
            return res.status(400).json({ error: "Monto inválido para la transacción" });
        }

        // **Convertir a lamports**
        const amount = BigInt(Math.floor(amountSOL * 1_000_000_000));
        const receiver = new PublicKey(creditos.wallet);
        const transaction = new Transaction().add(
            SystemProgram.transfer({ fromPubkey: SENDER_KEYPAIR.publicKey, toPubkey: receiver, lamports: amount })
        );

        // **Enviar transacción**
        const signature = await connection.sendTransaction(transaction, [SENDER_KEYPAIR]);

        // **Actualizar créditos solo después de una transacción exitosa**
        await ActualizarCreditos(usuario.id_usuario, 0);

        // **Enviar respuesta solo una vez**
        return res.json({ success: true, transactionId: signature });

    } catch (error) {
        console.error("Error en la transferencia:", error);

        // **Evitar enviar múltiples respuestas**
        if (!res.headersSent) {
            return res.status(500).json({ error: "Error en la transferencia" });
        }
    }
}

async function checkTransactionStatus(request, response) {
    try {
        // Obtener usuarios y JWT
        const usuarios = await obtenerUsuarios();
        const cookieJWT = request.headers.cookie?.split("; ").find(cookie => cookie.startsWith("jwt="))?.slice(4);

        // Validar si se encontró el token JWT
        if (!cookieJWT) {
            return response.status(400).json({ error: "Token JWT no encontrado" });
        }

        // Verificar el token JWT
        const decodificada = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);
        const usuario = usuarios.find(u => u.user === decodificada.user);

        // Validar si se encontró el usuario
        if (!usuario) {
            return response.status(404).json({ error: "Usuario no encontrado" });
        }

        const info = await obtenerReferencias(usuario.id_usuario);
        if (info.status === 1) {
            return response.status(200).send({ message: "Transaction validated", redirect: "/admin" });
        } else {
            const amount = new BigNumber(info.total).multipliedBy(tasaConversion);
            const reference = info.referencia;
            // Validar información de cantidad y referencia
            if (!amount || !reference) {
                return response.status(400).send({ message: "Invalid info: check payment amount or ref" });
            }

            // Encontrar la firma de la referencia
            const referenceKey = new PublicKey(reference);
            const { signature } = await findReference(connection, referenceKey, { finality: 'confirmed' });

            // Validar si se encontró la firma
            if (signature) {
                // Validar la transferencia
                let transactionResponse = await validateTransfer(connection, signature, { recipient: RECEIVER_WALLET, amount });

                // Si la respuesta de la transacción es válida, actualizar créditos y estado
                if (transactionResponse) {
                    await actualizarCreditosYEstado(reference);
                    return response.status(200).send({ message: "Transaction validated", redirect: "/admin" });
                } else {
                    return response.status(400).send({ message: "Transaction response not valid" });
                }
            } else {
                return response.status(400).send({ message: "No signature found for the given reference" });
            }
        }
    } catch (error) {
        return response.status(400).send({ message: error.message });
    }
}

export const methods = { generarPago, transferirSOL, checkTransactionStatus};

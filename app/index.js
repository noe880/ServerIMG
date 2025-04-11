import  express  from "express";
import cookieParser from 'cookie-parser';
//Fix para __direname
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {methods as authentication} from "./controllers/authentication.controller.js"
import {methods as authorization} from "./middlewares/authorization.js";
import {methods as ruleta} from "./controllers/ruleta.js"
import {methods as generarPago} from "./controllers/solana.js"
import {methods as QR} from "./controllers/TransactionQRModal.js"
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.set("port",process.env.PORT);
app.listen(app.get("port"));
console.log("Servidor corriendo en puerto",app.get("port"));

//Configuración
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser())


//Rutas
app.get("/",authorization.soloPublico, (req,res)=> res.sendFile(__dirname + "/pages/index.html"));
app.get("/login",authorization.soloPublico, (req,res)=> res.sendFile(__dirname + "/pages/login.html"));
app.get("/register",authorization.soloPublico,(req,res)=> res.sendFile(__dirname + "/pages/register.html"));
app.get("/admin",authorization.soloAdmin,(req,res)=> res.sendFile(__dirname + "/pages/admin/admin.html"));
app.get("/pago",authorization.soloAdmin,(req,res)=> res.sendFile(__dirname + "/pages/admin/pago.html"));
app.post("/api/login",authentication.login);
app.post("/api/register",authentication.register);
app.post("/api/actualizarCreditos",ruleta.actualizarCreditos);
app.post("/api/consultarCreditos",ruleta.consultarCreditos);
app.post("/api/generate-payment",generarPago.generarPago);
app.post("/api/cobrar", authorization.soloAdmin, (req, res) => {generarPago.transferirSOL(req, res);});
app.post("/api/check-transaction", generarPago.checkTransactionStatus);
app.post("/api/QR", QR.TransactionQRModal);
app.post("/api/transaccionPendiente", QR.TransactionPendiente);
app.post("/api/cancelar-transaction", QR.cancelarTransaction);
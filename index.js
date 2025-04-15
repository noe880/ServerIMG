const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp'); // Reemplazamos sharp por Jimp
const { guardarArchivoEnDB, consultarArchivoEnDB, consultarArchivoPeso } = require('./database');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Crear el directorio 'uploads' si no existe
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/thumbs')) fs.mkdirSync('uploads/thumbs');

// Configuración de Multer con límite de tamaño de archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2 GB por archivo
  }
});

// Función para generar miniaturas con Jimp
const generarMiniatura = async (filename) => {
    const inputPath = path.join(__dirname, 'uploads', filename);
    const outputPath = path.join(__dirname, 'uploads', 'thumbs', filename);
  
    try {
      // Verificar si el directorio de thumbs existe, si no, crearlo
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  
      // Cargar la imagen con Jimp
      const image = await Jimp.read(inputPath);
      
      // Redimensionar y guardar la miniatura
      await image
        .resize(200, 200, Jimp.RESIZE_INSIDE) // Equivalente a fit: inside
        .quality(60) // Calidad del 60%
        .writeAsync(outputPath);
      
      return {
        format: image.getExtension(),
        width: image.getWidth(),
        height: image.getHeight(),
        size: fs.statSync(outputPath).size
      };
    } catch (err) {
      console.error('Error al generar miniatura:', err);
      throw err;
    }
};

app.post('/upload', upload.array('files[]'), async (req, res) => {
    const files = req.files;
  
    try {
      await Promise.all(
        files.map(async (file) => {
            const extension = path.extname(file.filename).substring(1);
            const mimeType = file.mimetype;
            const fileSize = file.size; // Tamaño del archivo en bytes
            const tipo = obtenerTipoArchivo(extension);
            
            // Guardar archivo en la base de datos, incluyendo la extensión y el tamaño
            await guardarArchivoEnDB(file.filename, extension, fileSize, tipo);
            
            // Verificar si el archivo es una imagen antes de generar la miniatura
            if (mimeType.startsWith('image/')) {
              await generarMiniatura(file.filename);
            }
        })          
      );
  
      res.json({
        message: 'Archivos subidos y nombres guardados en la base de datos',
        files: files.map((f) => ({
          name: f.filename,
          mimetype: f.mimetype,
          url: `/uploads/${f.filename}`,
          thumbnail: f.mimetype.startsWith('image/')
            ? `/uploads/thumbs/${f.filename}`
            : null
        }))
      });
    } catch (err) {
      console.error('Error al guardar en la base de datos:', err);
      res.status(500).json({ error: 'Error al guardar nombres en la base de datos' });
    }
});
  
function obtenerTipoArchivo(extension) {
    // Definir las extensiones para cada tipo de archivo
    const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];
    const videos = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
    
    if (imagenes.includes(extension)) {
      return 'Imagenes';
    } else if (videos.includes(extension)) {
      return 'Videos';
    } else {
      return 'Documentos';
    }
}

// Cargar archivos en la carpeta
app.get('/archivos', async (req, res) => {
    const tipo = req.query.tipo;
    try {
        const archivos = await consultarArchivoEnDB(tipo);
        const direccion = (tipo === "Imagenes") ? "/uploads/thumbs/" : "/uploads/";
        if (archivos && archivos.length > 0) {
            const archivosConRuta = archivos.map(archivo => ({
                nombre: archivo.nombre_archivo,
                url: `${direccion}${archivo.nombre_archivo}`,
            }));
            res.json(archivosConRuta);
        } else {
            console.warn('No se encontraron archivos en la DB');
            res.status(404).json({ error: 'No se encontraron archivos' });
        }
    } catch (err) {
        console.error('Error al obtener archivos:', err);
        res.status(500).json({ 
            error: 'Error al obtener archivos',
            details: err.message 
        });
    }
});

app.get('/archivos-peso', async (req, res) => {
    try {
        const archivos = await consultarArchivoPeso();
        if (archivos && archivos.length > 0) {
            const archivosConRuta = archivos.map(archivo => ({
                peso: archivo.peso,
                identificador: archivo.identificador,
            }));
            res.json(archivosConRuta);
        } else {
            res.status(404).json({ error: 'No se encontraron archivos' });
        }
    } catch (err) {
        console.error('Error al obtener archivos:', err);
        res.status(500).json({ 
            error: 'Error al obtener archivos',
            details: err.message 
        });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
const mysql = require('mysql2');

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'skrillex123',
  database: 'archivos'
});

// Conectar
db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');
});

// Función para guardar archivo en la base de datos
function guardarArchivoEnDB(nombreArchivo, identificador, peso, tipo) { 
    return new Promise((resolve, reject) => {
      if (!identificador) {
        return reject(new Error("El campo identificador no puede ser nulo"));
      }
      const sql = 'INSERT INTO archivos (nombre_archivo, fecha_subida, identificador, peso, tipo) VALUES (?, NOW(), ?, ?, ?)';
      db.query(sql, [nombreArchivo, identificador, peso, tipo], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
  
  async function consultarArchivoEnDB(tipo) {
    const sql = 'SELECT nombre_archivo, fecha_subida FROM archivos WHERE tipo = ?';
    try {
      const resultados = await new Promise((resolve, reject) => {
        db.query(sql, [tipo], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
      if (resultados.length === 0) {
        return [];
      }
      return resultados;
    } catch (error) {
      throw new Error('No se pudieron obtener los archivos de la base de datos');
    }
  }
  

  async function consultarArchivoPeso() {
    const sql = 'SELECT peso, identificador FROM archivos';
    try {
      const resultados = await new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      if (resultados.length === 0) {
        return [];
      }
      return resultados;
    } catch (error) {
      throw new Error('No se pudieron obtener los archivos de la base de datos');
    }
  }
  

module.exports = { guardarArchivoEnDB, consultarArchivoEnDB, consultarArchivoPeso };

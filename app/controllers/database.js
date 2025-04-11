// database.js
import mysql from 'mysql2';
import crypto  from 'crypto';
import dotenv from "dotenv";

dotenv.config();

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORTDB,
});


// Intentar conectarse a la base de datos
export function conectarDB() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function insertarUsuarios(usuario, password, wallet) {
  return new Promise((resolve, reject) => {
    // Genera un token aleatorio para el id_usuario
    const token = crypto.randomBytes(16).toString('hex');

    // Query para insertar en la tabla usuarios
    const sqlUsuarios = 'INSERT INTO usuarios (id_usuario, user, password, wallet) VALUES (?, ?, ?, ?)';
    const valuesUsuarios = [token, usuario, password, wallet];

    // Query para insertar en la tabla creditos
    const sqlCreditos = 'INSERT INTO creditos (id_usuario, creditos) VALUES (?, 0)';
    const valuesCreditos = [token];

    // Ejecuta las consultas en transacción para asegurar la consistencia
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error beginning transaction:', err);
        reject(err);
        return;
      }

      // Inserta en la tabla usuarios
      connection.query(sqlUsuarios, valuesUsuarios, (err, resultsUsuarios) => {
        if (err) {
          connection.rollback(() => {
            console.error('Error inserting data into usuarios:', err);
            reject(err);
          });
        } else {
          // Inserta en la tabla creditos
          connection.query(sqlCreditos, valuesCreditos, (err, resultsCreditos) => {
            if (err) {
              connection.rollback(() => {
                console.error('Error inserting data into creditos:', err);
                reject(err);
              });
            } else {
              connection.commit(err => {
                if (err) {
                  connection.rollback(() => {
                    console.error('Error committing transaction:', err);
                    reject(err);
                  });
                } else {
                  resolve({ usuarios: resultsUsuarios, creditos: resultsCreditos });
                }
              });
            }
          });
        }
      });
    });
  });
}


// Función para obtener todos los usuarios de la base de datos
export function obtenerUsuarios() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id_usuario, user, password FROM usuarios'; // Consulta SQL para obtener todos los usuarios
  
      connection.query(sql, (err, results) => {
        if (err) {
          console.error('Error fetching data:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }


  export function obtenerCreditos(id_usuario) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT creditos FROM creditos WHERE id_usuario = ?';
      const values = [id_usuario];
      
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error al obtener créditos:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  export function obtenerReferencias(id_usuario) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT referencia, total, status FROM pagos WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 1';
        const values = [id_usuario];

        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error al obtener la referencia más reciente:', err);
                reject(err);
            } else {
                resolve(results.length > 0 ? results[0] : null);
            }
        });
    });
}

  

  export function obtenerCreditosWallet(id_usuario) { 
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.wallet, c.creditos 
        FROM usuarios u 
        LEFT JOIN creditos c ON u.id_usuario = c.id_usuario 
        WHERE u.id_usuario = ?`;
      
      const values = [id_usuario];
      
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error al obtener créditos y wallet:', err);
          reject(err);
        } else {
          resolve(results[0]); // Retorna solo el primer resultado
        }
      });
    });
}

  export function ActualizarCreditos(id_usuario, creditos) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE creditos SET creditos = ? WHERE id_usuario = ?';
      const values = [creditos, id_usuario];
      
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error al obtener créditos:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  export function insertarPago(usuario, referencia, total) {
    return new Promise((resolve, reject) => {
      const token = crypto.randomBytes(16).toString('hex');
      const sql = 'INSERT INTO pagos (id_pago, id_usuario, referencia, total) VALUES (?, ?, ?, ?)';
      const values = [token, usuario, referencia, total];
      
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error inserting data:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  export function actualizarCreditosYEstado(referencia) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                return reject(err);
            }

            // Obtener id_usuario y total del pago con bloqueo FOR UPDATE
            const getPagoSQL = `SELECT id_usuario, total FROM pagos WHERE referencia = ? AND status = 0 FOR UPDATE;`;

            connection.query(getPagoSQL, [referencia], (err, results) => {
                if (err) {
                    return connection.rollback(() => reject(err));
                }

                if (results.length === 0) {
                    return connection.rollback(() => reject(new Error("No se encontró el pago o ya está procesado")));
                }

                const { id_usuario, total } = results[0];

                // Actualizar el estado del pago a 1 (procesado)
                const updatePagoSQL = `UPDATE pagos SET status = 1 WHERE referencia = ?;`;

                connection.query(updatePagoSQL, [referencia], (err) => {
                    if (err) {
                        return connection.rollback(() => reject(err));
                    }

                    // Actualizar los créditos del usuario
                    const updateCreditosSQL = `UPDATE creditos SET creditos = creditos + ? WHERE id_usuario = ?;`;

                    connection.query(updateCreditosSQL, [total, id_usuario], (err) => {
                        if (err) {
                            return connection.rollback(() => reject(err));
                        }

                        // Confirmar la transacción
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => reject(err));
                            }
                            resolve("Créditos actualizados correctamente");
                        });
                    });
                });
            });
        });
    });
}

  
  

  export function cancelarReferencia(referencia) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE pagos SET status = 2 WHERE referencia = ?`;
      const values = [referencia];
      connection.query(sql, values, (err, results) => {
        if (err) {
          console.error('Error al cancelar la referencia:', err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }





  
  
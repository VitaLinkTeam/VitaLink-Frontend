// api/doctor/especializacion.js (en tu proyecto de Render)
const { Client } = require('pg');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar token de Firebase
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    // Verificar el token y obtener el UID
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    await client.connect();

    // Consultar la especialización del doctor
    const result = await client.query(`
      SELECT 
        e.in_id as id, 
        e.va_nombre as nombre
      FROM "Doctor" d
      JOIN "Especializacion" e ON d."IN_FK_especializacion" = e.in_id
      WHERE d."va_fk_uid" = $1
    `, [uid]);

    if (result.rows.length === 0) {
      // Si no se encuentra, devolver especialización vacía
      return res.status(200).json({ 
        uid: uid,
        especializacion: {
          id: 0,
          nombre: 'Sin especialización'
        }
      });
    }

    const especializacion = result.rows[0];
    
    res.status(200).json({ 
      uid: uid,
      especializacion: {
        id: especializacion.id,
        nombre: especializacion.nombre
      }
    });

  } catch (error) {
    console.error('Error obteniendo especialización:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
};
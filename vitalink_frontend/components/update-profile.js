// update-profile.js (en tu proyecto de Render)
import { Client } from 'pg';
import admin from 'firebase-admin';
if (!admin.apps.length) admin.initializeApp();

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const { uid } = await admin.auth().verifyIdToken(token);
    const { nombre, numeroTelefonico, especializacionId, clinica } = req.body;

    await client.connect();

    const updates = [];
    const values = [];
    let i = 1;
    if (nombre !== undefined) { updates.push(`VA_nombre = $${i++}`); values.push(nombre); }
    if (numeroTelefonico !== undefined) { updates.push(`VA_numerotelefonico = $${i++}`); values.push(numeroTelefonico); }
    if (updates.length > 0) {
      values.push(uid);
      await client.query(`UPDATE "Usuario" SET ${updates.join(', ')} WHERE "VA_uid" = $${i}`, values);
    }

    if (especializacionId !== undefined) {
      await client.query(`UPDATE "Doctor" SET "IN_FK_especializacion" = $1 WHERE "va_fk_uid" = $2`, [especializacionId, uid]);
    }

    if (clinica) {
      const { id, nombre, direccion, numeroTelefonico, email } = clinica;
      await client.query(
        `UPDATE "clinica" SET "va_nombre" = $1, "va_direccion" = $2, "va_numerotelefonico" = $3, "va_email" = $4 WHERE "in_id" = $5`,
        [nombre, direccion, numeroTelefonico, email, id]
      );
    }

    res.status(200).json({ message: 'OK' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await client.end();
  }
}
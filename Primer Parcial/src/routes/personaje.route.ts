import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Obtener todos los personajes no eliminados
router.get('/', async (req, res) => {
  try {
    const personajes = await prisma.personaje.findMany({
      where: {
        estado: {
          not: 'Eliminado',
        },
      },
    });
    res.json(personajes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener personajes', error });
  }
});

// Obtener un personaje por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const personaje = await prisma.personaje.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (personaje && personaje.estado!== 'Eliminado') {
      res.json(personaje);
    } else {
      res.status(404).json({ message: 'Personaje no encontrado o eliminado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener personaje', error });
  }
});

// Crear un nuevo personaje
router.post('/', async (req, res) => {
  const { nombre, anosExperiencia } = req.body;
  try {
    const personaje = await prisma.personaje.create({
      data: {
        nombre,
        anosExperiencia,
        estado: 'Activo', // Estado predeterminado
      },
    });
    res.json(personaje);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear personaje', error });
  }
});

// Actualizar un personaje por ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, anosExperiencia, estado } = req.body;
  try {
    const personaje = await prisma.personaje.update({
      where: {
        id: parseInt(id),
      },
      data: {
        nombre,
        anosExperiencia,
        estado,
      },
    });
    res.json(personaje);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar personaje', error });
  }
});

// Eliminar un personaje por su ID, cambiando su estado a 'Eliminado'
router.delete('/:id', async (req, res) => { // Corrección aquí
  const { id } = req.params;
  try {
    const personaje = await prisma.personaje.update({ // Asegúrate de que el modelo sea correcto
      where: {
        id: parseInt(id)
      },
      data: {
        estado: 'Eliminado'
      }
    });

    // Crear un nuevo registro en la tabla Auditoria con el ID correcto
    const registroAuditoria = await prisma.auditoria.create({
      data: {
        entidad: 'Personaje',
        detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Personaje`,
        fecha: new Date(),
        auditado: parseInt(id), // Aquí usamos el ID del registro eliminado
        estado: 'Activo'
      }
    });

    res.json({ personaje, registroAuditoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el personaje.' });
  }
});

export default router;

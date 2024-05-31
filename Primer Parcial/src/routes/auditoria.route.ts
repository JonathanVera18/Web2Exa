import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Obtener todas las auditorias
router.get('/', async (req, res) => {
  try {
    const auditorias = await prisma.auditoria.findMany({
      where: {
        estado: {
          not: 'Eliminado',
        },
      },
    });
    res.json(auditorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener auditorias.' });
  }
});

// Obtener una auditoria por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const auditoria = await prisma.auditoria.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (auditoria && auditoria.estado !== 'Eliminado') {
      res.json(auditoria);
    } else {
      res.status(404).json({ message: 'Auditoria no encontrada o eliminada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la auditoria.' });
  }
});

// Crear una nueva auditoria
router.post('/', async (req, res) => {
  const { entidad, detalle, fecha, auditado } = req.body;

  if (!entidad || !detalle || !fecha || !auditado) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    const auditoria = await prisma.auditoria.create({
      data: {
        entidad,
        detalle,
        fecha: new Date(fecha),
        auditado,
        estado: 'Activo',
      },
    });
    res.status(201).json(auditoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la auditoria.' });
  }
});

// Actualizar una auditoria por ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { entidad, detalle, fecha, auditado, estado } = req.body;

  try {
    const auditoria = await prisma.auditoria.update({
      where: {
        id: parseInt(id),
      },
      data: {
        entidad,
        detalle,
        fecha: fecha ? new Date(fecha) : undefined,
        auditado,
        estado,
      },
    });
    res.json(auditoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la auditoria.' });
  }
});

// Eliminar una serie por su ID, cambiando su estado a 'Eliminado'
router.delete('/serie/:id', async (req, res) => {
  const { id } = req.params;
  const serie = await prisma.serie.update({
    where: {
      id: parseInt(id)
    },
    data: {
      estado: 'Eliminado' // Cambio de estado en lugar de eliminación física
    }
  });

  // Crear un nuevo registro en la tabla Auditoria
  const registroAuditoria = await prisma.auditoria.create({
    data: {
      entidad: 'Serie',
      detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Serie`,
      fecha: new Date(),
      auditado: 1, // reemplaza esto con el ID del usuario que realizó la acción
      estado: 'Activo'
    }
  });

  res.json({ serie, registroAuditoria });
});

// Eliminar un personaje por su ID, cambiando su estado a 'Eliminado'
router.delete('/personaje/:id', async (req, res) => {
  const { id } = req.params;
  const personaje = await prisma.personaje.update({
    where: {
      id: parseInt(id)
    },
    data: {
      estado: 'Eliminado'
    }
  });

  // Crear un nuevo registro en la tabla Auditoria
  const registroAuditoria = await prisma.auditoria.create({
    data: {
      entidad: 'Personaje',
      detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Personaje`,
      fecha: new Date(),
      auditado: 1, // reemplaza esto con el ID del usuario que realizó la acción
      estado: 'Activo'
    }
  });

  res.json({ personaje, registroAuditoria });
});




// Eliminar una auditoria (eliminación física) y reactivar el registro original
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la auditoria antes de eliminarla
    const auditoria = await prisma.auditoria.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!auditoria) {
      return res.status(404).json({ message: 'Auditoria no encontrada.' });
    }

    // Verificar que el campo auditado exista y tenga un valor válido
    if (!auditoria.auditado || typeof auditoria.auditado !== 'number') {
      return res.status(400).json({ message: 'El campo auditado no está definido o tiene un formato inválido.' });
    }

    // Reactivar el registro original
    const entidad = auditoria.entidad;
    const idOriginal = auditoria.auditado;

    console.log(`Entidad: ${entidad}, ID Original: ${idOriginal}`);

    // Eliminar la auditoria
    await prisma.auditoria.delete({
      where: {
        id: parseInt(id),
      },
    });

    let updatedRecord;
    // Reactivar el registro original basado en la entidad
    switch (entidad) {
      case 'Serie':
        updatedRecord = await prisma.serie.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
        break;
      case 'Personaje':
        updatedRecord = await prisma.personaje.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
        break;
      case 'Asignacion':
        updatedRecord = await prisma.asignacion.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
        break;
      default:
        return res.status(400).json({ message: 'Entidad no válida.' });
    }

    res.json({ message: 'Auditoria eliminada y registro original reactivado.', updatedRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la auditoria.' });
  }
});







export default router;

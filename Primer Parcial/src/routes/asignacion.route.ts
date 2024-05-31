import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// Obtener todas las asignaciones
router.get('/', async (req, res) => {
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      estado: {
        not: 'Eliminado'
      }
    }
  })
  res.json(asignaciones)
})

// Obtener una asignación por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const asignacion = await prisma.asignacion.findUnique({
    where: {
      id: parseInt(id),
      estado: {
        not: 'Eliminado'
      }
    }
  })
  if (asignacion) {
    res.json(asignacion)
  } else {
    res.status(404).json({ message: 'Asignación no encontrada o eliminada' })
  }
})

// Crear una nueva asignación
router.post('/', async (req, res) => {
  const { serieId, personajeId, papel, tipoPapel, fechaInicio, fechaFin, temporadas } = req.body
  const asignacion = await prisma.asignacion.create({
    data: {
      serieId,
      personajeId,
      papel,
      tipoPapel,
      fechaInicio,
      fechaFin,
      temporadas,
      estado: 'Activo'
    }
  })
  res.json(asignacion)
})

// Eliminar una asignacion por su ID, cambiando su estado a 'Eliminado'
router.delete('/asignacion/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const asignacion = await prisma.asignacion.update({
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
        entidad: 'Asignacion',
        detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Asignacion`,
        fecha: new Date(),
        auditado: parseInt(id), // Aquí usamos el ID del registro eliminado
        estado: 'Activo'
      }
    });

    res.json({ asignacion, registroAuditoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la asignacion.' });
  }
});


export default router

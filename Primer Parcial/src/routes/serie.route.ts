import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router = Router()

// Obtener todas las series que no están en estado 'Eliminado'
router.get('/', async (req, res) => {
  const series = await prisma.serie.findMany({
    where: {
      estado: {
        not: 'Eliminado'
      }
    }
  })
  res.json(series)
})

// Obtener una serie por su ID, asegurándose de que no esté en estado 'Eliminado'
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const serie = await prisma.serie.findUnique({
    where: {
      id: parseInt(id)
    }
  })
  if (serie && serie.estado !== 'Eliminado') {
    res.json(serie)
  } else {
    res.status(404).json({ message: 'Serie no encontrada o eliminada' })
  }
})

// Crear una nueva serie con estado 'Activo' por defecto
router.post('/', async (req, res) => {
  const { nombre, clasificacion } = req.body
  const serie = await prisma.serie.create({
    data: {
        clasificacion: clasificacion,
        estado: "Activo",
        nombre: nombre  // Estado por defecto al crear
    }
  })
  res.json(serie)
})

// Actualizar una serie por su ID
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, clasificacion, estado } = req.body
  const serie = await prisma.serie.update({
    where: {
      id: parseInt(id)
    },
    data: {
      nombre,
      clasificacion,
      estado
    }
  })
  res.json(serie)
})

// Eliminar una serie por su ID, cambiando su estado a 'Eliminado'
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const serie = await prisma.serie.update({
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
        entidad: 'Serie',
        detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Serie`,
        fecha: new Date(),
        auditado: parseInt(id), // Aquí usamos el ID del registro eliminado
        estado: 'Activo'
      }
    });

    res.json({ serie, registroAuditoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la serie.' });
  }
});






router.post('/:restore', async (req, res) => {
  try {
    // Obtener todos los registros de auditoria
    const auditorias = await prisma.auditoria.findMany();

    // Reactivar los registros de origen basados en la auditoria
    for (const auditoria of auditorias) {
      const entidad = auditoria.entidad;
      const idOriginal = auditoria.auditado;

      if (entidad === 'Serie') {
        await prisma.serie.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
      } else if (entidad === 'Personaje') {
        await prisma.personaje.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
      } else if (entidad === 'Asignacion') {
        await prisma.asignacion.update({
          where: {
            id: idOriginal,
          },
          data: {
            estado: 'Activo',
          },
        });
      }
    }

    // Eliminar físicamente todos los registros de auditoria
    await prisma.auditoria.deleteMany();

    res.json({ message: 'Todos los registros de auditoria han sido eliminados y las entidades de origen reactivadas.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al restaurar las entidades y eliminar auditorias.' });
  }
});



export default router

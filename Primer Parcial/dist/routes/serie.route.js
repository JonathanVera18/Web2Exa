"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Obtener todas las series que no están en estado 'Eliminado'
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const series = yield prisma.serie.findMany({
        where: {
            estado: {
                not: 'Eliminado'
            }
        }
    });
    res.json(series);
}));
// Obtener una serie por su ID, asegurándose de que no esté en estado 'Eliminado'
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const serie = yield prisma.serie.findUnique({
        where: {
            id: parseInt(id)
        }
    });
    if (serie && serie.estado !== 'Eliminado') {
        res.json(serie);
    }
    else {
        res.status(404).json({ message: 'Serie no encontrada o eliminada' });
    }
}));
// Crear una nueva serie con estado 'Activo' por defecto
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nombre, clasificacion } = req.body;
    const serie = yield prisma.serie.create({
        data: {
            clasificacion: clasificacion,
            estado: "Activo",
            nombre: nombre // Estado por defecto al crear
        }
    });
    res.json(serie);
}));
// Actualizar una serie por su ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { nombre, clasificacion, estado } = req.body;
    const serie = yield prisma.serie.update({
        where: {
            id: parseInt(id)
        },
        data: {
            nombre,
            clasificacion,
            estado
        }
    });
    res.json(serie);
}));
// Eliminar una serie por su ID, cambiando su estado a 'Eliminado'
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const serie = yield prisma.serie.update({
            where: {
                id: parseInt(id)
            },
            data: {
                estado: 'Eliminado'
            }
        });
        // Crear un nuevo registro en la tabla Auditoria con el ID correcto
        const registroAuditoria = yield prisma.auditoria.create({
            data: {
                entidad: 'Serie',
                detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Serie`,
                fecha: new Date(),
                auditado: parseInt(id), // Aquí usamos el ID del registro eliminado
                estado: 'Activo'
            }
        });
        res.json({ serie, registroAuditoria });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la serie.' });
    }
}));
router.post('/:restore', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener todos los registros de auditoria
        const auditorias = yield prisma.auditoria.findMany();
        // Reactivar los registros de origen basados en la auditoria
        for (const auditoria of auditorias) {
            const entidad = auditoria.entidad;
            const idOriginal = auditoria.auditado;
            if (entidad === 'Serie') {
                yield prisma.serie.update({
                    where: {
                        id: idOriginal,
                    },
                    data: {
                        estado: 'Activo',
                    },
                });
            }
            else if (entidad === 'Personaje') {
                yield prisma.personaje.update({
                    where: {
                        id: idOriginal,
                    },
                    data: {
                        estado: 'Activo',
                    },
                });
            }
            else if (entidad === 'Asignacion') {
                yield prisma.asignacion.update({
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
        yield prisma.auditoria.deleteMany();
        res.json({ message: 'Todos los registros de auditoria han sido eliminados y las entidades de origen reactivadas.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al restaurar las entidades y eliminar auditorias.' });
    }
}));
exports.default = router;

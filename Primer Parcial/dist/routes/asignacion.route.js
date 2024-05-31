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
// Obtener todas las asignaciones
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const asignaciones = yield prisma.asignacion.findMany({
        where: {
            estado: {
                not: 'Eliminado'
            }
        }
    });
    res.json(asignaciones);
}));
// Obtener una asignación por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const asignacion = yield prisma.asignacion.findUnique({
        where: {
            id: parseInt(id),
            estado: {
                not: 'Eliminado'
            }
        }
    });
    if (asignacion) {
        res.json(asignacion);
    }
    else {
        res.status(404).json({ message: 'Asignación no encontrada o eliminada' });
    }
}));
// Crear una nueva asignación
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serieId, personajeId, papel, tipoPapel, fechaInicio, fechaFin, temporadas } = req.body;
    const asignacion = yield prisma.asignacion.create({
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
    });
    res.json(asignacion);
}));
// Eliminar una asignacion por su ID, cambiando su estado a 'Eliminado'
router.delete('/asignacion/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const asignacion = yield prisma.asignacion.update({
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
                entidad: 'Asignacion',
                detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Asignacion`,
                fecha: new Date(),
                auditado: parseInt(id), // Aquí usamos el ID del registro eliminado
                estado: 'Activo'
            }
        });
        res.json({ asignacion, registroAuditoria });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la asignacion.' });
    }
}));
exports.default = router;

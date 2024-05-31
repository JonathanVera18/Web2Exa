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
// Obtener todas las auditorias
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const auditorias = yield prisma.auditoria.findMany({
            where: {
                estado: {
                    not: 'Eliminado',
                },
            },
        });
        res.json(auditorias);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener auditorias.' });
    }
}));
// Obtener una auditoria por ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const auditoria = yield prisma.auditoria.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        if (auditoria && auditoria.estado !== 'Eliminado') {
            res.json(auditoria);
        }
        else {
            res.status(404).json({ message: 'Auditoria no encontrada o eliminada' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la auditoria.' });
    }
}));
// Crear una nueva auditoria
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { entidad, detalle, fecha, auditado } = req.body;
    if (!entidad || !detalle || !fecha || !auditado) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    try {
        const auditoria = yield prisma.auditoria.create({
            data: {
                entidad,
                detalle,
                fecha: new Date(fecha),
                auditado,
                estado: 'Activo',
            },
        });
        res.status(201).json(auditoria);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la auditoria.' });
    }
}));
// Actualizar una auditoria por ID
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { entidad, detalle, fecha, auditado, estado } = req.body;
    try {
        const auditoria = yield prisma.auditoria.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la auditoria.' });
    }
}));
// Eliminar una serie por su ID, cambiando su estado a 'Eliminado'
router.delete('/serie/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const serie = yield prisma.serie.update({
        where: {
            id: parseInt(id)
        },
        data: {
            estado: 'Eliminado' // Cambio de estado en lugar de eliminación física
        }
    });
    // Crear un nuevo registro en la tabla Auditoria
    const registroAuditoria = yield prisma.auditoria.create({
        data: {
            entidad: 'Serie',
            detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Serie`,
            fecha: new Date(),
            auditado: 1, // reemplaza esto con el ID del usuario que realizó la acción
            estado: 'Activo'
        }
    });
    res.json({ serie, registroAuditoria });
}));
// Eliminar un personaje por su ID, cambiando su estado a 'Eliminado'
router.delete('/personaje/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const personaje = yield prisma.personaje.update({
        where: {
            id: parseInt(id)
        },
        data: {
            estado: 'Eliminado'
        }
    });
    // Crear un nuevo registro en la tabla Auditoria
    const registroAuditoria = yield prisma.auditoria.create({
        data: {
            entidad: 'Personaje',
            detalle: `ELIMINO EL ELEMENTO CON ID ${id} en la entidad Personaje`,
            fecha: new Date(),
            auditado: 1, // reemplaza esto con el ID del usuario que realizó la acción
            estado: 'Activo'
        }
    });
    res.json({ personaje, registroAuditoria });
}));
// Eliminar una auditoria (eliminación física) y reactivar el registro original
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Obtener la auditoria antes de eliminarla
        const auditoria = yield prisma.auditoria.findUnique({
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
        yield prisma.auditoria.delete({
            where: {
                id: parseInt(id),
            },
        });
        let updatedRecord;
        // Reactivar el registro original basado en la entidad
        switch (entidad) {
            case 'Serie':
                updatedRecord = yield prisma.serie.update({
                    where: {
                        id: idOriginal,
                    },
                    data: {
                        estado: 'Activo',
                    },
                });
                break;
            case 'Personaje':
                updatedRecord = yield prisma.personaje.update({
                    where: {
                        id: idOriginal,
                    },
                    data: {
                        estado: 'Activo',
                    },
                });
                break;
            case 'Asignacion':
                updatedRecord = yield prisma.asignacion.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la auditoria.' });
    }
}));
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/personaje', routes_1.personajeRouter);
app.use('/serie', routes_1.serieRouter);
app.use('/asignacionRouter', routes_1.asignacionRouter);
app.use('/auditoria', routes_1.auditoriaRouter);
app.listen(3000, () => {
    console.log('Server on port 3000');
});

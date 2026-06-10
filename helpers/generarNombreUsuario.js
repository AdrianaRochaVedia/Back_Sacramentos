// helpers/generarNombreUsuario.js
const { Op } = require('sequelize');

const normalizar = (texto) =>
  (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar tildes
    .replace(/\s+/g, '_')             // espacios → guión bajo
    .replace(/[^a-z0-9._]/g, '');     // solo letras, números, punto, guión bajo

const generarNombreUsuario = async (Usuario, { nombre, apellido_paterno, apellido_materno, fecha_nacimiento, id_usuario = null }) => {
  const base = `${normalizar(apellido_paterno)}.${normalizar(nombre)}`;

  const existeOtro = async (candidato) => {
    const where = { nombre_usuario: candidato };
    if (id_usuario) where.id_usuario = { [Op.ne]: id_usuario };
    return !!(await Usuario.findOne({ where }));
  };

  if (!(await existeOtro(base))) return base;

  const conInicial = `${base}.${normalizar(apellido_materno).charAt(0)}`;
  if (!(await existeOtro(conInicial))) return conInicial;

  const fecha = new Date(fecha_nacimiento);
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const yyyy = fecha.getFullYear();
  return `${base}.${dd}${mm}${yyyy}`;
};

module.exports = { generarNombreUsuario };
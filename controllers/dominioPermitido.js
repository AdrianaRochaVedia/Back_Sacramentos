const DominioPermitido = require('../models/dominioPermitido');

const getDominiosPermitidos = async (req, res) => {
  try {
    const { search, activo } = req.query;

    const where = {};

    if (activo !== undefined && activo !== '') {
      where.activo = activo === 'true';
    }

    const dominios = await DominioPermitido.findAll({
      where,
      order: [['dominio', 'ASC']],
    });

    const filtrados = search
      ? dominios.filter((d) =>
          d.dominio.toLowerCase().includes(search.toLowerCase()) ||
          (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
        )
      : dominios;

    return res.json({
      ok: true,
      dominios: filtrados,
    });
  } catch (error) {
    console.error('Error al obtener dominios permitidos:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener dominios permitidos',
    });
  }
};

const getDominioPermitidoById = async (req, res) => {
  try {
    const { id } = req.params;

    const dominio = await DominioPermitido.findByPk(id);

    if (!dominio) {
      return res.status(404).json({
        ok: false,
        msg: 'Dominio permitido no encontrado',
      });
    }

    return res.json({
      ok: true,
      dominio,
    });
  } catch (error) {
    console.error('Error al obtener dominio permitido:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al obtener dominio permitido',
    });
  }
};

const createDominioPermitido = async (req, res) => {
  try {
    let { dominio, descripcion, activo } = req.body;

    if (!dominio || !dominio.trim()) {
      return res.status(400).json({
        ok: false,
        msg: 'El dominio es obligatorio',
      });
    }

    dominio = dominio.trim().toLowerCase();

    const regexDominio = /^[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!regexDominio.test(dominio)) {
      return res.status(400).json({
        ok: false,
        msg: 'El formato del dominio no es válido',
      });
    }

    const existe = await DominioPermitido.findOne({
      where: { dominio },
    });

    if (existe) {
      return res.status(400).json({
        ok: false,
        msg: 'El dominio ya está registrado',
      });
    }

    const nuevoDominio = await DominioPermitido.create({
      dominio,
      descripcion: descripcion?.trim() || null,
      activo: activo !== undefined ? activo : true,
    });

    return res.status(201).json({
      ok: true,
      msg: 'Dominio permitido creado correctamente',
      dominio: nuevoDominio,
    });
  } catch (error) {
    console.error('Error al crear dominio permitido:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al crear dominio permitido',
    });
  }
};

const updateDominioPermitido = async (req, res) => {
  try {
    const { id } = req.params;
    let { dominio, descripcion, activo } = req.body;

    const dominioExistente = await DominioPermitido.findByPk(id);

    if (!dominioExistente) {
      return res.status(404).json({
        ok: false,
        msg: 'Dominio permitido no encontrado',
      });
    }

    if (dominio !== undefined) {
      dominio = dominio.trim().toLowerCase();

      const regexDominio = /^[a-z0-9.-]+\.[a-z]{2,}$/;

      if (!regexDominio.test(dominio)) {
        return res.status(400).json({
          ok: false,
          msg: 'El formato del dominio no es válido',
        });
      }

      const repetido = await DominioPermitido.findOne({
        where: { dominio },
      });

      if (repetido && repetido.id_dominio !== Number(id)) {
        return res.status(400).json({
          ok: false,
          msg: 'Ya existe otro registro con ese dominio',
        });
      }

      dominioExistente.dominio = dominio;
    }

    if (descripcion !== undefined) {
      dominioExistente.descripcion = descripcion?.trim() || null;
    }

    if (activo !== undefined) {
      dominioExistente.activo =
        activo === true || activo === 'true';
    }

    await dominioExistente.save();

    return res.json({
      ok: true,
      msg: 'Dominio permitido actualizado correctamente',
      dominio: dominioExistente,
    });
  } catch (error) {
    console.error('Error al actualizar dominio permitido:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al actualizar dominio permitido',
    });
  }
};

const deleteDominioPermitido = async (req, res) => {
  try {
    const { id } = req.params;

    const dominio = await DominioPermitido.findByPk(id);

    if (!dominio) {
      return res.status(404).json({
        ok: false,
        msg: 'Dominio permitido no encontrado',
      });
    }

    dominio.activo = false;
    await dominio.save();

    return res.json({
      ok: true,
      msg: 'Dominio permitido desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al desactivar dominio permitido:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error al desactivar dominio permitido',
    });
  }
};

module.exports = {
  getDominiosPermitidos,
  getDominioPermitidoById,
  createDominioPermitido,
  updateDominioPermitido,
  deleteDominioPermitido,
};
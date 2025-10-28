const Comentario = require('../models/Comentario');
const Documento = require('../models/Documento');

// Crear un nuevo comentario
const crearComentario = async (req, res) => {
  try {
    const { comentario, DOCUMENTO_id_documento } = req.body;
    
    // Verificar si el documento existe
    const documento = await Documento.findByPk(DOCUMENTO_id_documento);
    if (!documento) {
      return res.status(404).json({ 
        success: false,
        message: 'Documento no encontrado' 
      });
    }

    const nuevoComentario = await Comentario.create({
      comentario,
      DOCUMENTO_id_documento,
      fecha: new Date(),
      isDeleted: false,
      publicado:false
    });

    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: nuevoComentario
    });

  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear comentario',
      error: error.message
    });
  }
};

// Eliminación lógica de un comentario
const eliminarComentarioLogico = async (req, res) => {
  try {
    const { id_comentario } = req.params;

    const comentario = await Comentario.findByPk(id_comentario);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    if (comentario.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'El comentario ya fue eliminado previamente'
      });
    }

    // Actualización lógica (no borrado físico)
    await comentario.update({ 
      isDeleted: true,
      publicado: false // También podrías ocultarlo cambiando este flag
    });

    res.json({
      success: true,
      message: 'Comentario eliminado lógicamente',
      data: comentario
    });

  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comentario',
      error: error.message
    });
  }
};

// Opcional: Obtener comentarios no eliminados de un documento
const obtenerComentariosPorDocumento = async (req, res) => {
  try {
    const { id_documento } = req.params;

    const comentarios = await Comentario.findAll({
      where: {
        DOCUMENTO_id_documento: id_documento,
        isDeleted: false,
        publicado: true
      },
      order: [['fecha', 'DESC']] // Ordenados por fecha descendente
    });

    res.json({
      success: true,
      data: comentarios
    });

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
};
// Opcional: Obtener comentarios no eliminados de un documento
const getAll = async (req, res) => {
  try {

    const comentarios = await Comentario.findAll();

    res.json({
      success: true,
      data: comentarios
    });

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
};
// Toggle solo para 'publicado'
const togglePublicado = async (req, res) => {
    try {
      const { id_comentario } = req.params;
  
      const comentario = await Comentario.findByPk(id_comentario);
      
      if (!comentario) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }
  
      const nuevoEstado = !comentario.publicado;
      await comentario.update({ publicado: nuevoEstado });
  
      res.json({
        success: true,
        message: 'Estado publicado actualizado',
        data: {
          id_comentario: comentario.id_comentario,
          publicado: nuevoEstado
        }
      });
  
    } catch (error) {
      console.error('Error al cambiar estado publicado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado publicado',
        error: error.message
      });
    }
  };
  
  // Toggle solo para 'isDeleted'
  const toggleEliminado = async (req, res) => {
    try {
      const { id_comentario } = req.params;
  
      const comentario = await Comentario.findByPk(id_comentario);
      
      if (!comentario) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado'
        });
      }
  
      const nuevoEstado = !comentario.isDeleted;
      await comentario.update({ isDeleted: nuevoEstado });
  
      res.json({
        success: true,
        message: 'Estado eliminado actualizado',
        data: {
          id_comentario: comentario.id_comentario,
          isDeleted: nuevoEstado
        }
      });
  
    } catch (error) {
      console.error('Error al cambiar estado eliminado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado eliminado',
        error: error.message
      });
    }
  };

module.exports = {
  crearComentario,
  eliminarComentarioLogico,
  obtenerComentariosPorDocumento,
  getAll,
  togglePublicado,
  toggleEliminado
};
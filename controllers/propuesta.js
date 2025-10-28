const Propuesta = require('../models/Propuesta');
const Documento = require('../models/Documento');

// Crear un nuevo comentario
const crearPropuesta = async (req, res) => {
  try {
    const { propuesta } = req.body;

    const nuevaPropuesta = await Propuesta.create({
      propuesta,
      fecha: new Date(),
      isDeleted: false,
      publicado:false
    });

    res.status(201).json({
      success: true,
      message: 'Propuesta creado exitosamente',
      data: nuevaPropuesta
    });

  } catch (error) {
    console.error('Error al crear propuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear propuiesta',
      error: error.message
    });
  }
};

// Eliminación lógica de un comentario
const eliminarComentarioLogico = async (req, res) => {
  try {
    const { id_propuesta } = req.params;

    const comentario = await Propuesta.findByPk(id_propuesta);
    
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
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
      message: 'Propuesta eliminado lógicamente',
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

const getAll = async (req, res) => {
  try {

    const propuestas = await Propuesta.findAll();

    res.json({
      success: true,
      data: propuestas
    });

  } catch (error) {
    console.error('Error al obtener propuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener propuestas',
      error: error.message
    });
  }
};
// Toggle solo para 'publicado'
const togglePublicado = async (req, res) => {
    try {
      const { id_propuesta } = req.params;
  
      const propuesta = await Propuesta.findByPk(id_propuesta);
      
      if (!propuesta) {
        return res.status(404).json({
          success: false,
          message: 'Propuesta no encontrado'
        });
      }
  
      const nuevoEstado = !propuesta.publicado;
      await propuesta.update({ publicado: nuevoEstado });
  
      res.json({
        success: true,
        message: 'Estado publicado actualizado',
        data: {
          id_propuesta: propuesta.id_propuesta,
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
      const { id_propuesta } = req.params;
  
      const comentario = await Propuesta.findByPk(id_propuesta);
      
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
          id_comentario: comentario.id_propuesta,
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
    crearPropuesta,
  eliminarComentarioLogico,
  getAll,
  togglePublicado,
  toggleEliminado
};
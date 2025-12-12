const requisitosSacramentales = {
  Bautizo: {
    excluir: ["BAUTIZADO"],   // no puede tener este rol todavía
    requeridos: []            // no necesita sacramentos previos
  },
  Comunion: {
    excluir: ["CONFIRMADO"],
    requeridos: ["BAUTIZADO"]
  },
  Confirmacion: {
    excluir: ["CONFIRMADO"],
    requeridos: ["BAUTIZADO", "COMULGADO"]
  },
  Matrimonio: {
    excluir: ["ESPOSO", "ESPOSA"],
    requeridos: ["BAUTIZADO", "CONFIRMADO"]  // opcional
  },
  //para que pueda buscarse un sacerdote
  Sacerdocio: {
    excluir: [],
    requeridos: ["BAUTIZADO", "CONFIRMADO","ESPOSO"]
  }
};

module.exports = requisitosSacramentales;
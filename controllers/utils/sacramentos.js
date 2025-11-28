const requisitosSacramentales = {
  Bautizo: {
    excluir: ["BAUTIZADO"],   // no puede tener este rol todavía
    requeridos: []            // no necesita sacramentos previos
  },
  Comunion: {
    excluir: ["COMULGADO"],
    requeridos: ["BAUTIZADO"]
  },
  Confirmacion: {
    excluir: ["CONFIRMADO"],
    requeridos: ["BAUTIZADO", "COMULGADO"]
  },
  Matrimonio: {
    excluir: ["CASADO"],
    requeridos: ["BAUTIZADO"]  // opcional
  }
};

module.exports = requisitosSacramentales;
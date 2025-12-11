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
    excluir: ["CASADO"],
    requeridos: ["BAUTIZADO", "CONFIRMADO"]  // opcional
  }
};

module.exports = requisitosSacramentales;
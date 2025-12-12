const requisitosRoles = {
  padrino: {
    requeridos: ["BAUTIZADO"],
    excluir: []
  },
  ministro: {
    requeridos: ["BAUTIZADO", "CONFIRMADO"],
    excluir: []
  },
  encargado: {
    requeridos: ["BAUTIZADO", "CONFIRMADO"],
    excluir: ["CASADO"]
  }
};

module.exports = requisitosRoles;
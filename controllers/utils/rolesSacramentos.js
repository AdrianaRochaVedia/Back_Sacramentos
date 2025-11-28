const requisitosRoles = {
  padrino: {
    requeridos: ["BAUTIZADO"],
    excluir: []
  },
  ministro: {
    requeridos: ["BAUTIZADO", "CONFIRMADO"],
    excluir: []
  }
};

module.exports = requisitosRoles;
const requisitosRoles = {
  padrino: {
    requeridos: ["BAUTIZADO"],
    excluir: []   // nada que lo bloquee
  },
  ministro: {
    requeridos: ["BAUTIZADO", "CONFIRMADO"],
    excluir: []
  }
};

module.exports = requisitosRoles;
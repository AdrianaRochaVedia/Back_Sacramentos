// Similitud de strings simple (Levenshtein normalizado) para hacer fuzzy-match
// entre texto detectado por OCR y catálogos existentes (ej. nombres de parroquia).

// El catálogo real mezcla nombres con y sin el prefijo "Parroquia"/"Iglesia"
// ("Parroquia Cristo Rey" vs "San Sebastián"), y el OCR casi nunca lo trae.
// Sin quitarlo, un Levenshtein normal penaliza esas ~10 letras de más como si
// fueran una diferencia real y el score cae por debajo del umbral aunque el
// nombre de fondo sea idéntico — por eso se quita antes de comparar.
const normalizar = (str = '') =>
  str
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(parroquia|iglesia)(\s+de)?\s+/, '');

const distanciaLevenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // eliminación
        dp[i][j - 1] + 1,     // inserción
        dp[i - 1][j - 1] + costo // sustitución
      );
    }
  }
  return dp[m][n];
};

// Devuelve un score entre 0 (nada parecido) y 1 (idéntico) tras normalizar acentos/mayúsculas.
const similitud = (a, b) => {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na || !nb) return 0;
  const distancia = distanciaLevenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 1 : 1 - distancia / maxLen;
};

// Busca en `parroquias` (lista de { id_parroquia, nombre }) la más parecida a `nombreDetectado`.
// Devuelve null si ninguna supera el umbral de similitud.
const encontrarParroquiaSimilar = (nombreDetectado, parroquias = [], umbral = 0.6) => {
  if (!nombreDetectado || parroquias.length === 0) return null;

  let mejor = null;
  let mejorScore = 0;

  for (const p of parroquias) {
    const score = similitud(nombreDetectado, p.nombre);
    if (score > mejorScore) {
      mejorScore = score;
      mejor = p;
    }
  }

  if (mejor && mejorScore >= umbral) {
    return {
      id_parroquia: mejor.id_parroquia,
      nombre: mejor.nombre,
      similitud: Number(mejorScore.toFixed(2))
    };
  }

  return null;
};

module.exports = { normalizar, similitud, encontrarParroquiaSimilar };

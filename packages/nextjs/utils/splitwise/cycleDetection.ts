export async function findCycleAndResolve(
  me: string,
  creditor: string,
  newAmount: number,
  allUsers: string[],
  getDebt: (debtor: string, creditor: string) => Promise<number>,
): Promise<{ hasCycle: boolean; path?: string[]; minAmount?: number; updates?: any[] }> {
  // Normalizar endereços
  const startNode = creditor.toLowerCase();
  const targetNode = me.toLowerCase();

  // === CORREÇÃO AQUI ===
  // Se a lista for nula ou vazia, NÃO É ERRO. É apenas o início do sistema.
  // Retornamos false (sem ciclo) e deixamos a transação prosseguir.
  if (!allUsers || allUsers.length === 0) {
    console.warn("Lista de utilizadores vazia (Normal na 1ª transação). A prosseguir sem verificação de ciclo.");
    // Não mostramos notification.error para não bloquear o utilizador
    return { hasCycle: false };
  }

  const queue: string[][] = [[startNode]];
  const visited = new Set<string>();
  visited.add(startNode);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentNode = path[path.length - 1];

    if (currentNode === targetNode) {
      console.log("✅ CICLO ENCONTRADO:", path);

      let minAmount = newAmount;
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const debt = await getDebt(u, v);
        if (debt < minAmount) minAmount = debt;
      }

      return { hasCycle: true, path, minAmount, updates: [] };
    }

    for (const neighbor of allUsers) {
      const neighborLower = neighbor.toLowerCase();

      if (neighborLower !== currentNode && !visited.has(neighborLower)) {
        const debt = await getDebt(currentNode, neighborLower);

        if (debt > 0) {
          visited.add(neighborLower);
          queue.push([...path, neighborLower]);
        }
      }
    }
  }

  return { hasCycle: false };
}

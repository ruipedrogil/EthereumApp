export async function findCycleAndResolve(
  me: string,
  creditor: string,
  newAmount: number,
  allUsers: string[],
  getDebt: (debtor: string, creditor: string) => Promise<number>,
): Promise<{ hasCycle: boolean; path?: string[]; minAmount?: number; updates?: any[] }> {
  const startNode = creditor.toLowerCase(); // Alice
  const targetNode = me.toLowerCase(); // Carol

  console.log(`Lista de Users (Total: ${allUsers.length}):`, allUsers);

  // VERIFICAÇÃO 1: A lista tem toda a gente?
  if (!allUsers.includes(startNode) || !allUsers.includes(targetNode)) {
    console.error("Erro, o Credor ou o Devedor não estão na lista de users!");
    console.error(`Falta: ${!allUsers.includes(startNode) ? "Credor" : "Eu"}`);
    return { hasCycle: false };
  }

  // A Matriz de Dívidas
  console.log("2. A verificar ligações existentes na Blockchain...");
  let foundEdges = 0;

  // Vamos testar todas as combinações possíveis para ver o que existe
  for (const u of allUsers) {
    for (const v of allUsers) {
      if (u === v) continue;
      // Lê a dívida real
      const debt = await getDebt(u, v);
      if (debt > 0) {
        console.log(`Existe: ${u.slice(0, 6)}... -> ${v.slice(0, 6)}... = ${debt}`);
        foundEdges++;
      }
    }
  }

  if (foundEdges === 0) {
    console.error("Obtenção de dívidas falhou, o sistema lê 0 dívidas. Problema de leitura/endereços.");
    return { hasCycle: false };
  }

  // bfs
  console.log(`A iniciar BFS de ${startNode.slice(0, 6)} para ${targetNode.slice(0, 6)}`);

  const queue: string[][] = [[startNode]];
  const visited = new Set<string>();
  visited.add(startNode);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentNode = path[path.length - 1];

    if (currentNode === targetNode) {
      console.log("Ciclo Encontrado, Caminho:", path);
      // Calcular mínimo
      let minAmount = newAmount;
      for (let i = 0; i < path.length - 1; i++) {
        const d = await getDebt(path[i], path[i + 1]);
        if (d < minAmount) minAmount = d;
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

  console.log("BFS terminou sem encontrar caminho.");
  return { hasCycle: false };
}

/**
 * Algoritmo BFS (Breadth-First Search) para detecção de ciclos em grafos de dívidas
 */

interface DebtUpdate {
  debtor: string;
  creditor: string;
  amount: number;
}

interface CycleResult {
  hasCycle: boolean;
  path?: string[];
  minAmount?: number;
  updates?: DebtUpdate[];
}

/**
 * Encontra um caminho entre dois nós usando BFS
 */
async function findPath(
  start: string,
  end: string,
  users: string[],
  getDebt: (debtor: string, creditor: string) => Promise<number>,
): Promise<string[] | null> {
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node.toLowerCase() === end.toLowerCase()) {
      return path;
    }

    if (visited.has(node.toLowerCase())) {
      continue;
    }

    visited.add(node.toLowerCase());

    // Verificar todos os possíveis credores
    for (const user of users) {
      if (user.toLowerCase() === node.toLowerCase()) continue;

      const debt = await getDebt(node, user);
      if (debt > 0) {
        queue.push({
          node: user,
          path: [...path, user],
        });
      }
    }
  }

  return null;
}

/**
 * Detecta e resolve ciclos de dívida
 */
export async function findCycleAndResolve(
  debtor: string,
  creditor: string,
  amount: number,
  users: string[],
  getDebt: (debtor: string, creditor: string) => Promise<number>,
): Promise<CycleResult> {
  // Verificar se adicionar esta dívida cria um ciclo
  // Um ciclo existe se há um caminho do credor de volta ao devedor
  const path = await findPath(creditor, debtor, users, getDebt);

  if (!path) {
    // Não há ciclo, retornar dívida original
    return {
      hasCycle: false,
      updates: [{ debtor, creditor, amount }],
    };
  }

  // Ciclo detectado! Caminho completo: debtor -> ...path... -> debtor
  const cyclePath = [debtor, ...path];

  // Calcular o valor mínimo no ciclo
  const debtsInCycle: number[] = [];

  for (let i = 0; i < cyclePath.length - 1; i++) {
    const currentDebtor = cyclePath[i];
    const currentCreditor = cyclePath[i + 1];
    const debt = await getDebt(currentDebtor, currentCreditor);
    debtsInCycle.push(debt);
  }

  // Adicionar a nova dívida ao ciclo
  debtsInCycle.push(amount);

  const minAmount = Math.min(...debtsInCycle);

  // Gerar atualizações para resolver o ciclo
  const updates: DebtUpdate[] = [];

  for (let i = 0; i < cyclePath.length - 1; i++) {
    const currentDebtor = cyclePath[i];
    const currentCreditor = cyclePath[i + 1];
    const currentDebt = await getDebt(currentDebtor, currentCreditor);
    const newAmount = currentDebt - minAmount;

    updates.push({
      debtor: currentDebtor,
      creditor: currentCreditor,
      amount: newAmount,
    });
  }

  // Adicionar a nova dívida reduzida
  updates.push({
    debtor,
    creditor,
    amount: amount - minAmount,
  });

  return {
    hasCycle: true,
    path: cyclePath,
    minAmount,
    updates,
  };
}

"use client";

import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface DebtListProps {
  address: string;
}

export const DebtList = ({ address }: DebtListProps) => {
  // Obter lista de utilizadores
  const { data: usersData } = useScaffoldReadContract({
    contractName: "Splitwise",
    functionName: "getAllUsers",
  });

  const users = (usersData as readonly string[] | undefined) ?? [];

  // Componente para cada dívida individual
  const DebtItem = ({ creditorAddress }: { creditorAddress: string }) => {
    const { data: amount } = useScaffoldReadContract({
      contractName: "Splitwise",
      functionName: "lookup",
      args: [address as `0x${string}`, creditorAddress as `0x${string}`],
    });

    if (!amount || Number(amount) === 0) return null;

    return (
      <tr className="hover">
        <td>
          <Address address={creditorAddress} />
        </td>
        <td className="text-right">
          <span className="font-bold text-error">{amount?.toString()} unidades</span>
        </td>
      </tr>
    );
  };

  // Componente para dívidas que outros me devem
  const DebtOwedToMe = ({ debtorAddress }: { debtorAddress: string }) => {
    const { data: amount } = useScaffoldReadContract({
      contractName: "Splitwise",
      functionName: "lookup",
      args: [debtorAddress as `0x${string}`, address as `0x${string}`],
    });

    if (!amount || Number(amount) === 0) return null;

    return (
      <tr className="hover">
        <td>
          <Address address={debtorAddress} />
        </td>
        <td className="text-right">
          <span className="font-bold text-success">{amount?.toString()} unidades</span>
        </td>
      </tr>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Minhas Dívidas */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-error">📤 Dívidas que Eu Devo</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Credor</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((userAddress: string) => <DebtItem key={userAddress} creditorAddress={userAddress} />)
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-base-content/50">
                      Nenhuma dívida registada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dívidas que me Devem */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-success">📥 Dívidas que Me Devem</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Devedor</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((userAddress: string) => <DebtOwedToMe key={userAddress} debtorAddress={userAddress} />)
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-base-content/50">
                      Ninguém lhe deve
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

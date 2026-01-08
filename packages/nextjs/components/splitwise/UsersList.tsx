"use client";

import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const UsersList = () => {
  const { data: usersData, isLoading } = useScaffoldReadContract({
    contractName: "Splitwise",
    functionName: "getAllUsers",
  });

  const users = (usersData as readonly string[] | undefined) ?? [];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">👥 Utilizadores do Sistema</h2>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Endereço</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userAddress: string, index: number) => (
                  <tr key={userAddress} className="hover">
                    <td>{index + 1}</td>
                    <td>
                      <Address address={userAddress} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm text-base-content/50 mt-2">
              Total: {users.length} utilizador{users.length !== 1 ? "es" : ""}
            </div>
          </div>
        ) : (
          <div className="text-center text-base-content/50 py-4">Nenhum utilizador registado ainda</div>
        )}
      </div>
    </div>
  );
};

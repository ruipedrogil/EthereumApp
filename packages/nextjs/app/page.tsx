"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth/Address";
// Estes componentes já contêm toda a lógica (BFS, leituras, escritas) internamente.
import { AddIOUForm } from "~~/components/splitwise/AddIOUForm";
import { DebtList } from "~~/components/splitwise/DebtList";
import { TotalOwedDisplay } from "~~/components/splitwise/TotalOwedDisplay";
import { UsersList } from "~~/components/splitwise/UsersList";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // Estado simples para forçar a atualização das listas quando uma nova dívida é criada
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIOUAdded = () => {
    // Ao alterar este número, o componente DebtList (que usa isto como 'key') vai recarregar
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address
              address={connectedAddress}
              chain={targetNetwork}
              blockExplorerAddressLink={
                targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
              }
            />
          </div>

          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-base-100 px-5 py-16 border-t border-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-primary">💸 Blockchain Splitwise App</h2>
              <p className="text-base-content/70 mt-2">
                Gestão de despesas descentralizada com resolução automática de ciclos.
              </p>
            </div>

            {!connectedAddress ? (
              <div className="alert alert-warning shadow-lg max-w-md mx-auto">
                <span>⚠️ Por favor, conecte a sua carteira (Connect Wallet) para usar o Splitwise.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* COLUNA DA ESQUERDA: Formulário e Total */}
                <div className="flex flex-col gap-6">
                  {/* Componente: Total Devido */}
                  <TotalOwedDisplay address={connectedAddress} />

                  {/* Componente: Formulário de Adicionar Dívida */}
                  <div className="card bg-base-200 shadow-xl border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title mb-2">📝 Adicionar Nova Dívida</h3>
                      <p className="text-xs text-base-content/60 mb-4">
                        O algoritmo DFS verificará se existe um ciclo (ex: A-&gt;B-&gt;C-&gt;A) e resolverá a dívida
                        automaticamente.
                      </p>
                      {/* Passamos a função de refresh para atualizar a lista após sucesso */}
                      <AddIOUForm onIOUAdded={handleIOUAdded} />
                    </div>
                  </div>
                </div>

                {/* COLUNA DA DIREITA: Listagens */}
                <div className="flex flex-col gap-6">
                  {/* Componente: Listas de Dívidas */}
                  {/* Usamos a 'key' para forçar o componente a recarregar quando refreshTrigger muda */}
                  <div key={refreshTrigger}>
                    <DebtList address={connectedAddress} />
                  </div>

                  {/* Componente: Lista de Utilizadores */}
                  <UsersList />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface TotalOwedDisplayProps {
  address: string;
}

export const TotalOwedDisplay = ({ address }: TotalOwedDisplayProps) => {
  const publicClient = usePublicClient();
  const { data: contract } = useScaffoldContract({
    contractName: "Splitwise",
  });

  const [totalOwed, setTotalOwed] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Prevenção de execução se dados essenciais faltarem
    if (!publicClient || !contract || !address) return;

    const loadTotalOwed = async () => {
      setIsLoading(true);
      try {
        // Ler todos os utilizadores
        const usersData = await publicClient.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "getAllUsers",
        });

        // Garantir que é um array
        const usersArray = (usersData as string[]) || [];

        // Se não houver users, não vale a pena continuar
        if (usersArray.length === 0) {
          setTotalOwed(0);
          setIsLoading(false);
          return;
        }

        let sum = 0;

        // Loop protegido
        for (const user of usersArray) {
          // Não verificar dívida comigo mesmo ou endereços inválidos
          if (!user || user.toLowerCase() === address.toLowerCase()) continue;

          try {
            const amount = await publicClient.readContract({
              address: contract.address,
              abi: contract.abi,
              functionName: "lookup",
              args: [address as `0x${string}`, user as `0x${string}`],
            });

            // Conversão segura: O contrato devolve uint32 (number ou bigint)
            // Convertemos para Number para somar fácil (uint32 cabe em Number JS)
            const numericAmount = Number(amount || 0);
            sum += numericAmount;
          } catch (innerError) {
            // Se falhar a ler UM user, ignora e continua para o próximo
            // Isto evita que o componente todo crashe por causa de um erro
            console.warn(`Falha ao ler dívida com ${user}`, innerError);
          }
        }

        setTotalOwed(sum);
      } catch (error) {
        console.error("Erro fatal no TotalOwedDisplay:", error);
        setTotalOwed(0); // Em caso de erro, assume 0 para não partir a UI
      } finally {
        setIsLoading(false);
      }
    };

    // Executar a função
    loadTotalOwed();

    // Polling: Atualizar a cada 5 segundos para manter o valor real
    const interval = setInterval(loadTotalOwed, 5000);
    return () => clearInterval(interval);
  }, [publicClient, contract, address]); // Dependências

  return (
    <div className="stats shadow w-full bg-base-100">
      <div className="stat">
        <div className="stat-figure text-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div className="stat-title font-bold">Total que EU Devo</div>
        <div className="stat-value text-error text-3xl">
          {isLoading && totalOwed === null ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            totalOwed?.toString() || "0"
          )}
        </div>
        <div className="stat-desc text-xs mt-1">Soma das dívidas não pagas</div>
      </div>
    </div>
  );
};

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
  const [totalOwed, setTotalOwed] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTotalOwed = async () => {
      if (!publicClient || !contract || !address) return;
      setIsLoading(true);
      try {
        const users = await publicClient.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "getAllUsers",
        });

        const usersArray = (users as string[]) ?? [];
        let sum = 0n;

        for (const user of usersArray) {
          const amount = await publicClient.readContract({
            address: contract.address,
            abi: contract.abi,
            functionName: "lookup",
            args: [address as `0x${string}`, user as `0x${string}`],
          });

          const numericAmount = BigInt(amount as bigint | number | string);
          sum += numericAmount;
        }

        setTotalOwed(sum);
      } catch (error) {
        console.error("Erro ao calcular total devido:", error);
        setTotalOwed(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTotalOwed();
  }, [publicClient, contract, address]);

  return (
    <div className="stats shadow w-full">
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
        <div className="stat-title">Total Devido</div>
        <div className="stat-value text-error">
          {isLoading ? "..." : totalOwed !== null ? totalOwed.toString() : "0"}
        </div>
        <div className="stat-desc">Soma de todas as suas dívidas ativas</div>
      </div>
    </div>
  );
};

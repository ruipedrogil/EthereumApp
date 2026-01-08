"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { findCycleAndResolve } from "~~/utils/splitwise/cycleDetection";

interface AddIOUFormProps {
  onIOUAdded?: () => void;
}

export const AddIOUForm = ({ onIOUAdded }: AddIOUFormProps) => {
  const { address: connectedAddress } = useAccount();
  const [creditorAddress, setCreditorAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Nome correto do contrato: "Splitwise"
  const { writeContractAsync } = useScaffoldWriteContract("Splitwise");
  const publicClient = usePublicClient();

  const { data: contract } = useScaffoldContract({
    contractName: "Splitwise",
  });

  const { data: users } = useScaffoldReadContract({
    contractName: "Splitwise",
    functionName: "getAllUsers",
  });

  const getDebtFromContract = async (debtor: string, creditor: string): Promise<number> => {
    if (!contract || !publicClient) return 0;
    try {
      const result = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: "lookup",
        args: [debtor as `0x${string}`, creditor as `0x${string}`],
      });
      return Number(result || 0n);
    } catch (error) {
      console.error(`Erro ao ler dívida:`, error);
      return 0;
    }
  };

  const handleAddIOU = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!creditorAddress || !amount || !connectedAddress) {
      notification.error("Preencha todos os campos e conecte a carteira");
      return;
    }

    if (creditorAddress.toLowerCase() === connectedAddress.toLowerCase()) {
      notification.error("Não pode dever a si mesmo!");
      return;
    }

    setIsProcessing(true);

    try {
      const amountValue = parseInt(amount);
      if (amountValue <= 0) {
        notification.error("Valor deve ser maior que zero");
        setIsProcessing(false);
        return;
      }

      notification.info("🔍 A verificar ciclos...");

      // === CORREÇÃO CRÍTICA DE LÓGICA ===
      // Para haver um ciclo quando EU pago ao CREDOR, tem de existir
      // um caminho de dívida que venha do CREDOR até MIM.
      // Ex: Se pago à Alice, e a Alice (indiretamente) deve-me a mim, fecha o ciclo.

      const cycleInfo = await findCycleAndResolve(
        creditorAddress, // START: O Credor (ex: Alice)
        connectedAddress, // END:   Eu (ex: Carol)
        amountValue,
        (users as string[]) || [],
        getDebtFromContract,
      );

      let pathArg: string[] = [];

      if (cycleInfo.hasCycle && cycleInfo.path) {
        notification.warning(`Ciclo detetado! A resolver`, { duration: 4000 });

        // CONSTRUÇÃO DO CICLO PARA O CONTRATO
        // O BFS devolveu o caminho [Alice, Bob, Carol].
        // O ciclo completo é: Eu -> Alice -> Bob -> Eu.
        // pathArg = [Carol, Alice, Bob, Carol]

        pathArg = [connectedAddress, ...cycleInfo.path];
      }

      console.log("Enviar transação:", {
        creditor: creditorAddress,
        amount: amountValue,
        path: pathArg,
      });

      // Enviar transação (usando number em vez de BigInt para o amount)
      await writeContractAsync({
        functionName: "add_IOU",
        args: [creditorAddress as `0x${string}`, amountValue, pathArg as `0x${string}`[]],
      });

      if (pathArg.length > 0) {
        notification.success("Ciclo resolvido e dívida anulada!");
      } else {
        notification.success("Dívida registada!");
      }

      setCreditorAddress("");
      setAmount("");

      if (onIOUAdded) setTimeout(onIOUAdded, 1000);
    } catch (error: any) {
      console.error("Erro:", error);
      notification.error("Erro: " + (error.message || "Falha na transação"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title">📝 Adicionar Dívida (IOU)</h2>
        <form onSubmit={handleAddIOU} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Endereço do Credor</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={creditorAddress}
              onChange={e => setCreditorAddress(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Valor</span>
            </label>
            <input
              type="number"
              placeholder="10"
              className="input input-bordered w-full"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              step="1"
              disabled={isProcessing}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full ${isProcessing ? "loading" : ""}`}
            disabled={isProcessing || !contract}
          >
            {isProcessing ? "A processar..." : "Enviar Dívida"}
          </button>
        </form>
      </div>
    </div>
  );
};

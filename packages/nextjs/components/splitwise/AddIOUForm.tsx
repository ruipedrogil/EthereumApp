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

  const { writeContractAsync } = useScaffoldWriteContract("Splitwise");
  const publicClient = usePublicClient();

  const { data: contract } = useScaffoldContract({
    contractName: "Splitwise",
  });

  const { data: users } = useScaffoldReadContract({
    contractName: "Splitwise",
    functionName: "getAllUsers",
  });

  // Função auxiliar para ler dívidas (com tratamento de erros)
  const getDebtFromContract = async (debtor: string, creditor: string): Promise<number> => {
    if (!contract || !publicClient) return 0;
    try {
      const result = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: "lookup",
        // IMPORTANTE: Normalizar endereços também na leitura
        args: [debtor.toLowerCase() as `0x${string}`, creditor.toLowerCase() as `0x${string}`],
      });
      return Number(result || 0n);
    } catch {
      // Ignorar erros de leitura para não bloquear o fluxo
      return 0;
    }
  };

  const handleAddIOU = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!creditorAddress || !amount || !connectedAddress) {
      notification.error("Preencha todos os campos e conecte a carteira");
      return;
    }

    // Transforma tudo em letras pequenas para garantir que 0xABC == 0xabc
    const safeMe = connectedAddress.toLowerCase();
    const safeCreditor = creditorAddress.toLowerCase();

    if (safeCreditor === safeMe) {
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

      console.log("INÍCIO DEBUG BFS");
      console.log("1. Eu sou (Devedor):", safeMe);
      console.log("2. Vou pagar a (Credor):", safeCreditor);

      notification.info("A verificar ciclos");

      // Procura ciclo usando endereços normalizados
      const cycleInfo = await findCycleAndResolve(
        safeCreditor, // Start: Credor
        safeMe, // End: Eu
        amountValue,
        (users as string[]) || [],
        getDebtFromContract,
      );

      const pathArg: string[] = [];

      if (cycleInfo.hasCycle && cycleInfo.path) {
        console.log("Ciclo detetado! Caminho:", cycleInfo.path);

        notification.warning(`Ciclo detetado! A limpar dívidas`, { duration: 4000 });

        // CONSTRUÇÃO DO CAMINHO
        // Garante que o primeiro e o último são exatamente 'safeMe'
        pathArg.push(safeMe);

        for (let i = 0; i < cycleInfo.path.length - 1; i++) {
          // Normalizar cada passo do caminho também
          pathArg.push(cycleInfo.path[i].toLowerCase());
        }

        pathArg.push(safeMe);

        console.log("Caminho final (Tudo minúsculas):", pathArg);
      } else {
        console.log("Nenhum ciclo encontrado.");
      }

      // Enviar transação
      await writeContractAsync({
        functionName: "add_IOU",
        args: [safeCreditor as `0x${string}`, amountValue, pathArg as `0x${string}`[]],
      });

      if (pathArg.length > 0) {
        notification.success("Ciclo resolvido e dívida anulada! 🎉");
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
            {isProcessing ? "A processar" : "Enviar Dívida"}
          </button>
        </form>
      </div>
    </div>
  );
};

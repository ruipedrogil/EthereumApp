"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface AddIOUFormProps {
  onIOUAdded?: () => void;
}

export const AddIOUForm = ({ onIOUAdded }: AddIOUFormProps) => {
  const { address: connectedAddress } = useAccount();
  const [creditorAddress, setCreditorAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("Splitwise");

  // Precisamos disto para ler o estado DEPOIS da transação
  const publicClient = usePublicClient();
  const { data: contract } = useScaffoldContract({
    contractName: "Splitwise",
  });

  // Função auxiliar para verificar se a dívida desapareceu
  const checkDebtStatus = async (debtor: string, creditor: string): Promise<number> => {
    if (!contract || !publicClient) return 0;
    try {
      const result = await publicClient.readContract({
        address: contract.address,
        abi: contract.abi,
        functionName: "lookup",
        args: [debtor as `0x${string}`, creditor as `0x${string}`],
      });
      return Number(result || 0n);
    } catch {
      return 0;
    }
  };

  const handleAddIOU = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!creditorAddress || !amount || !connectedAddress) {
      notification.error("Preencha todos os campos");
      return;
    }

    const safeCreditor = creditorAddress.toLowerCase();
    const safeMe = connectedAddress.toLowerCase();

    if (safeCreditor === safeMe) {
      notification.error("Não pode dever a si mesmo!");
      return;
    }

    setIsProcessing(true);

    try {
      const amountValue = parseInt(amount);
      if (amountValue <= 0) {
        notification.error("Valor inválido");
        setIsProcessing(false);
        return;
      }

      console.log("A iniciar transação");

      // Ler dívida antes (normalmente é 0, mas se já existisse é importante)
      const debtBefore = await checkDebtStatus(safeMe, safeCreditor);

      // Enviar transação
      await writeContractAsync({
        functionName: "iou",
        args: [safeMe as `0x${string}`, safeCreditor as `0x${string}`, amountValue],
      });

      // Aguardar atualização da blockchain
      await new Promise(r => setTimeout(r, 1000));

      // Ler dívida depois
      const debtAfter = await checkDebtStatus(safeMe, safeCreditor);

      // O valor que eu esperava dever seria: (O que eu devia antes + O que enviei agora)
      const expectedDebt = debtBefore + amountValue;

      console.log(`Antes: ${debtBefore} | Enviei: ${amountValue} | Esperei: ${expectedDebt} | Real: ${debtAfter}`);

      if (debtAfter < expectedDebt) {
        // Se devo menos do que a soma direta, houve corte
        const savedAmount = expectedDebt - debtAfter;

        notification.success(
          <div className="flex flex-col">
            <span className="font-bold text-lg">🪄 CICLO DETETADO!</span>
            <span>
              {debtAfter === 0
                ? "A dívida foi totalmente anulada!"
                : `A dívida foi reduzida em ${savedAmount}. Restam ${debtAfter}.`}
            </span>
          </div>,
          { duration: 8000 },
        );
      } else {
        // Comportamento normal (sem ciclo)
        notification.success("Dívida registada com sucesso!");
      }

      setCreditorAddress("");
      setAmount("");

      if (onIOUAdded) setTimeout(onIOUAdded, 1000);
    } catch (e: any) {
      console.error("Erro:", e);
      notification.error("Falha na transação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h2 className="card-title">📝 Adicionar Dívida</h2>

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
            disabled={isProcessing}
          >
            {isProcessing ? "A processar..." : "Enviar Dívida"}
          </button>
        </form>
      </div>
    </div>
  );
};

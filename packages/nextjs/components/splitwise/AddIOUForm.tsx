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

      // Ler dívida antes
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

      // logica
      const expectedDebt = debtBefore + amountValue;

      console.log(`Antes: ${debtBefore} | Enviei: ${amountValue} | Esperei: ${expectedDebt} | Real: ${debtAfter}`);

      if (debtAfter < expectedDebt) {
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
        notification.success("Dívida registada com sucesso!");
      }

      setCreditorAddress("");
      setAmount("");

      if (onIOUAdded) setTimeout(onIOUAdded, 1000);
    } catch (error: any) {
      console.error("Erro:", error);
      notification.error("Falha na transação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl overflow-hidden border border-base-200 group hover:shadow-2xl transition-all duration-300">
      {/* Cabeçalho Decorativo com Gradiente */}
      <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary to-accent"></div>

      <div className="card-body gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="card-title text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">
            Nova Dívida
          </h2>
          <p className="text-gray-500 text-sm">Registe quem lhe emprestou dinheiro.</p>
        </div>

        <form onSubmit={handleAddIOU} className="flex flex-col gap-5">
          {/* Input de Endereço */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">👤 Endereço do Credor</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full pl-10 focus:input-primary focus:ring-2 ring-primary/20 transition-all font-mono"
                value={creditorAddress}
                onChange={e => setCreditorAddress(e.target.value)}
                disabled={isProcessing}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m19 0V8.625c0-.621-.504-1.125-1.125-1.125h-2.25a2.25 2.25 0 01-2.25-2.25 2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0021 6.375V12z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Input de Valor */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">💰 Valor a Pagar</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                className="input input-bordered w-full pl-10 focus:input-primary focus:ring-2 ring-primary/20 transition-all text-lg font-bold"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="1"
                disabled={isProcessing}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="card-actions justify-end mt-2">
            <button
              type="submit"
              className={`btn btn-primary w-full bg-gradient-to-r from-primary to-secondary border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${isProcessing ? "loading" : ""}`}
              disabled={isProcessing}
            >
              {isProcessing ? "A registar na Blockchain..." : "💸 Enviar Dívida"}
            </button>
          </div>
        </form>

        {/* Rodapé informativo */}
        <div className="text-xs text-center text-gray-400 mt-2 bg-base-200 p-2 rounded-lg">
          O Smart Contract verifica ciclos automaticamente.
        </div>
      </div>
    </div>
  );
};

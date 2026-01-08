// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    address public owner;
    address[] public participantList;
    mapping(address => bool) public participant;

    // Estrutura de lista de adjacência (Quem deve a quem)
    mapping(address => Owing[]) owingData;

    struct Owing {
        uint32 amount;
        address owingAddress;
    }

    constructor() {
        owner = msg.sender;
    }

    function getAllUsers() public view returns (address[] memory) {
        return participantList;
    }

    // Função de leitura compatível com o teu frontend
    function lookup(address debtor, address creditor) public view returns (uint32 ret) {
        Owing[] memory result = owingData[debtor];
        for (uint i = 0; i < result.length; i++) {
            if (result[i].owingAddress == creditor) {
                return result[i].amount;
            }
        }
        return 0;
    }

    function setParticipant(address input) private {
        if (participant[input]) return;
        participant[input] = true;
        participantList.push(input);
    }

    // Função principal (MUDOU NOME DE add_IOU para iou)
    // iAddress = Devedor (Eu), uAddress = Credor (Tu)
    function iou(address iAddress, address uAddress, uint32 amount) public {
        require(iAddress != uAddress, "You can't owe yourself!");
        setParticipant(iAddress);
        setParticipant(uAddress);

        // 1. Otimização: Se tu já me deves, abater essa dívida primeiro
        for (uint i = 0; i < owingData[uAddress].length; i++) {
            Owing storage ourOwingData = owingData[uAddress][i];
            if (ourOwingData.owingAddress == iAddress) {
                if (ourOwingData.amount > amount) {
                    ourOwingData.amount -= amount;
                    return;
                } else if (ourOwingData.amount < amount) {
                    amount -= ourOwingData.amount;
                    delete owingData[uAddress][i]; // Apaga a dívida inversa
                } else {
                    delete owingData[uAddress][i];
                    return;
                }
            }
        }

        // 2. Adicionar ou Atualizar a nova dívida
        bool found = false;
        for (uint i = 0; i < owingData[iAddress].length; i++) {
            if (owingData[iAddress][i].owingAddress == uAddress) {
                owingData[iAddress][i].amount += amount;
                found = true;
                break;
            }
        }
        if (!found) {
            owingData[iAddress].push(Owing(amount, uAddress));
        }
        
        // 3. Resolver ciclos (A magia pesada)
        resolveDebtLoops();
    }

    function resolveDebtLoops() private {
        // Tenta resolver múltiplas vezes para garantir limpeza total
        for (uint iter = 0; iter < participantList.length; iter++) {
            bool foundCycle = false;
            for (uint start = 0; start < participantList.length; start++) {
                address startAddr = participantList[start];
                // Passamos arrays vazios iniciais
                uint32 minDebt = findAndResolveCycle(startAddr, startAddr, new address[](0), new uint32[](0));
                if (minDebt > 0) foundCycle = true;
            }
            if (!foundCycle) break;
        }
    }

    function findAndResolveCycle(
        address current,
        address start,
        address[] memory path,
        uint32[] memory debts
    ) private returns (uint32) {
        Owing[] storage currentDebts = owingData[current];

        for (uint i = 0; i < currentDebts.length; i++) {
            address next = currentDebts[i].owingAddress;
            uint32 debt = currentDebts[i].amount;

            if (debt == 0) continue;

            // Encontrou o ciclo!
            if (next == start && path.length > 0) {
                return resolveCycleNew(path, debts, debt, current);
            }

            // Evitar loops infinitos na recursão
            bool inPath = false;
            for (uint j = 0; j < path.length; j++) {
                if (path[j] == next) inPath = true;
            }
            if (inPath) continue;

            // Continuar a busca (DFS Recursivo)
            address[] memory newPath = new address[](path.length + 1);
            uint32[] memory newDebts = new uint32[](debts.length + 1);
            for (uint j = 0; j < path.length; j++) {
                newPath[j] = path[j];
                newDebts[j] = debts[j];
            }
            newPath[path.length] = current;
            newDebts[debts.length] = debt;

            uint32 result = findAndResolveCycle(next, start, newPath, newDebts);
            if (result > 0) return result;
        }
        return 0;
    }

    function resolveCycleNew(address[] memory path, uint32[] memory debts, uint32 lastDebt, address lastNode) private returns (uint32) {
        uint32 minDebt = lastDebt;
        for (uint i = 0; i < debts.length; i++) {
            if (debts[i] > 0 && debts[i] < minDebt) minDebt = debts[i];
        }

        removeOwing(lastNode, path[0], minDebt);
        for (uint i = 0; i < path.length - 1; i++) {
            removeOwing(path[i], path[i+1], minDebt);
        }
        if (path.length > 0) removeOwing(path[path.length - 1], lastNode, minDebt);

        return minDebt;
    }

    function removeOwing(address debtor, address creditor, uint32 amount) private {
        for (uint i = 0; i < owingData[debtor].length; i++) {
            if (owingData[debtor][i].owingAddress == creditor) {
                if (owingData[debtor][i].amount <= amount) {
                    owingData[debtor][i].amount = 0;
                } else {
                    owingData[debtor][i].amount -= amount;
                }
            }
        }
    }
}
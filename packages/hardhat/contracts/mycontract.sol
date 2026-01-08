// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    mapping(address => mapping(address => uint32)) public debts;
    address[] public users;
    mapping(address => bool) public isUser;
    mapping(address => uint256) public lastActive;

    event IouAdded(address indexed debtor, address indexed creditor, uint32 amount);
    // Novo evento para sabermos se o ciclo correu
    event CycleResolved(address indexed user, uint32 amountReduced, uint pathLength);

    function lookup(address debtor, address creditor) external view returns (uint32) {
        return debts[debtor][creditor];
    }

    function getAllUsers() external view returns (address[] memory) {
        return users;
    }

    // Função que recebe o Caminho (Path)
    function add_IOU(address creditor, uint32 amount, address[] calldata path) external {
        require(msg.sender != creditor, "Nao pode dever a si mesmo");
        require(amount > 0, "O valor tem de ser positivo");

        // 1. Adiciona a dívida PRIMEIRO
        debts[msg.sender][creditor] += amount;
        _updateUser(msg.sender);
        _updateUser(creditor);

        emit IouAdded(msg.sender, creditor, amount);

        // 2. Se o site mandou um caminho, TENTA resolver
        if (path.length > 0) {
            _resolveCycle(path);
        }
    }

    function _resolveCycle(address[] memory path) internal {
        // Validação básica
        require(path.length >= 2, "Caminho muito curto");
        
        // Calcular o mínimo
        uint32 minAmount = type(uint32).max;
        
        // Percorre o ciclo para achar o valor mais baixo
        for (uint i = 0; i < path.length - 1; i++) {
            uint32 d = debts[path[i]][path[i+1]];
            if (d < minAmount) minAmount = d;
        }

        // Se o mínimo for válido, subtrai a toda a gente
        if (minAmount > 0 && minAmount != type(uint32).max) {
            for (uint i = 0; i < path.length - 1; i++) {
                debts[path[i]][path[i+1]] -= minAmount;
            }
            // Emite evento a confirmar a redução
            emit CycleResolved(msg.sender, minAmount, path.length);
        }
    }

    function _updateUser(address user) internal {
        if (!isUser[user]) {
            isUser[user] = true;
            users.push(user);
        }
        lastActive[user] = block.timestamp;
    }
}
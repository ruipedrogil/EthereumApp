// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    mapping(address => mapping(address => uint32)) public debts;
    address[] public users;
    mapping(address => bool) public isUser;
    mapping(address => uint256) public lastActive;

    event IouAdded(address indexed debtor, address indexed creditor, uint32 amount);
    event CycleResolved(address indexed debtor, uint32 amountResolved);

    function lookup(address debtor, address creditor) external view returns (uint32) {
        return debts[debtor][creditor];
    }

    function getAllUsers() external view returns (address[] memory) {
        return users;
    }

    // Recebe 3 argumentos (o caminho do ciclo)
    function add_IOU(address creditor, uint32 amount, address[] calldata path) external {
        require(msg.sender != creditor, "Nao pode dever a si mesmo");
        require(amount > 0, "O valor tem de ser positivo");

        // Adiciona a dívida normalmente
        debts[msg.sender][creditor] += amount;
        _updateUser(msg.sender);
        _updateUser(creditor);
        emit IouAdded(msg.sender, creditor, amount);

        // Se houver um caminho (Ciclo), resolve-o agora!
        if (path.length > 0) {
            _resolveCycle(path);
        }
    }

    // Lógica interna para subtrair a dívida mínima do ciclo
    function _resolveCycle(address[] memory path) internal {
        require(path.length >= 2, "Caminho invalido");
        
        // Achar o valor minimo no ciclo
        uint32 minAmount = type(uint32).max;
        for (uint i = 0; i < path.length - 1; i++) {
            uint32 debt = debts[path[i]][path[i+1]];
            if (debt < minAmount) minAmount = debt;
        }

        // Subtrair esse valor de todas as arestas (Resolver o ciclo)
        for (uint i = 0; i < path.length - 1; i++) {
            debts[path[i]][path[i+1]] -= minAmount;
        }
        
        emit CycleResolved(path[0], minAmount);
    }

    function _updateUser(address user) internal {
        if (!isUser[user]) {
            isUser[user] = true;
            users.push(user);
        }
        lastActive[user] = block.timestamp;
    }
}
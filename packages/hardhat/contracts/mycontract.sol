// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    mapping(address => mapping(address => uint32)) public debts;
    address[] public users;
    mapping(address => bool) public isUser;
    mapping(address => uint256) public lastActive;

    event IouAdded(address indexed debtor, address indexed creditor, uint32 amount);
    event CycleResolved(address indexed user, uint32 amountReduced);

    function lookup(address debtor, address creditor) external view returns (uint32) {
        return debts[debtor][creditor];
    }

    function getAllUsers() external view returns (address[] memory) {
        return users;
    }

    // Função (3 Argumentos)
    function add_IOU(address creditor, uint32 amount, address[] calldata path) external {
        require(msg.sender != creditor, "Nao pode dever a si mesmo");
        require(amount > 0, "O valor tem de ser positivo");

        // Regista a nova dívida (Soma)
        debts[msg.sender][creditor] += amount;
        _updateUser(msg.sender);
        _updateUser(creditor);

        emit IouAdded(msg.sender, creditor, amount);

        // Se houver um ciclo, resolve-o (Subtrai)
        if (path.length > 0) {
            _resolveCycle(path);
        }
    }

    function _resolveCycle(address[] memory path) internal {
        require(path.length >= 2, "Caminho invalido");

        // Descobrir o valor mínimo no ciclo
        uint32 minAmount = type(uint32).max;
        
        for (uint i = 0; i < path.length - 1; i++) {
            address from = path[i];
            address to = path[i+1];
            uint32 debt = debts[from][to];
            
            if (debt < minAmount) {
                minAmount = debt;
            }
        }

        // Subtrair esse valor a toda a gente
        if (minAmount > 0 && minAmount != type(uint32).max) {
            for (uint i = 0; i < path.length - 1; i++) {
                address from = path[i];
                address to = path[i+1];
                debts[from][to] -= minAmount;
            }
            emit CycleResolved(msg.sender, minAmount);
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
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    
    // Mapping -> [Debtor][Creditor], it returns amount, which is, uint32 for gas optimization
    mapping(address => mapping(address => uint32)) public debts;

    // list of all users to facilitate frontend retrieval
    address[] public users;
    mapping(address => bool) public isUser;

    // timestamp of the last activity for each user
    mapping(address => uint256) public lastActive;

    event IouAdded(address indexed debtor, address indexed creditor, uint32 amount);
    event CycleResolved(address indexed starter, uint32 reducedBy);

    // returns the amount that the debtor owes to the creditor
    function lookup(address debtor, address creditor) external view returns (uint32) {
        return debts[debtor][creditor];
    }

    // returns the full list of users
    function getAllUsers() external view returns (address[] memory) {
        return users;
    }

    // adds a debt (I Owe You (IOU)), msg.sender is the debtor.
    // cycle: sequence of addresses forming a cycle starting and ending at msg.sender:
    // [debtor, creditor, ..., debtor]
    function add_IOU(address creditor, uint32 amount, address[] calldata cycle) external {
        require(msg.sender != creditor, "You cannot owe money to yourself");
        require(amount > 0, "The amount must be positive");

        // add the new debt
        debts[msg.sender][creditor] += amount;

        _updateUser(msg.sender);
        _updateUser(creditor);

        emit IouAdded(msg.sender, creditor, amount);

        // if no cycle provided, nothing to resolve
        if (cycle.length == 0) {
            return;
        }

        // structural checks on the cycle
        require(cycle.length >= 2, "Invalid cycle length");
        require(cycle[0] == msg.sender, "Cycle must start at debtor");
        require(cycle[cycle.length - 1] == msg.sender, "Cycle must end at debtor");

        // find minimum edge weight along the cycle
        uint32 minAmount = type(uint32).max;

        for (uint256 i = 0; i < cycle.length - 1; i++) {
            address from = cycle[i];
            address to = cycle[i + 1];
            uint32 debt = debts[from][to];
            require(debt > 0, "Invalid cycle edge with zero debt");
            if (debt < minAmount) {
                minAmount = debt;
            }
        }

        // resolve: subtract minAmount from every edge in the cycle
        for (uint256 i = 0; i < cycle.length - 1; i++) {
            address from = cycle[i];
            address to = cycle[i + 1];
            debts[from][to] -= minAmount;
        }

        emit CycleResolved(msg.sender, minAmount);
        
        emit CycleResolved(msg.sender, minAmount);       
    }

    // internal helper to track new users and update timestamps
    function _updateUser(address user) internal {
        if (!isUser[user]) {
            isUser[user] = true;
            users.push(user);
        }
        lastActive[user] = block.timestamp;
    }
}
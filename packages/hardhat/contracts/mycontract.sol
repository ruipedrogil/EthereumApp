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

    // returns the amount that the debtor owes to the creditor
    function lookup(address debtor, address creditor) external view returns (uint32) {
        return debts[debtor][creditor];
    }

    // returns the full list of users
    function getAllUsers() external view returns (address[] memory) {
        return users;
    }

    // adds a debt (I Owe You (IOU)), msg.sender is the debtor.
    function add_IOU(address creditor, uint32 amount) external {
        require(msg.sender != creditor, "You cannot owe money to yourself");
        require(amount > 0, "The amount must be positive");

        // debts are additive
        debts[msg.sender][creditor] += amount;

        _updateUser(msg.sender);
        _updateUser(creditor);

        emit IouAdded(msg.sender, creditor, amount);
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
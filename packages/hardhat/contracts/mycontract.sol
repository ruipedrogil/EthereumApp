// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Splitwise {
    address public owner;
    address[] public allUsers;
    mapping(address => bool) public userExists;

    // Adjacency list for the debt graph
    mapping(address => DebtNode[]) public debtGraph;

    struct DebtNode {
        uint32 value;
        address creditor;
    }

    constructor() {
        owner = msg.sender;
    }

    function getAllUsers() public view returns (address[] memory) {
        return allUsers;
    }

    function lookup(address debtor, address creditor) public view returns (uint32) {
        DebtNode[] memory edges = debtGraph[debtor];
        for (uint i = 0; i < edges.length; i++) {
            if (edges[i].creditor == creditor) {
                return edges[i].value;
            }
        }
        return 0;
    }

    function _registerUser(address user) private {
        if (!userExists[user]) {
            userExists[user] = true;
            allUsers.push(user);
        }
    }

    function iou(address debtor, address creditor, uint32 amount) public {
        require(debtor != creditor, "You can't owe yourself!");
        require(amount > 0, "Amount must be positive");

        _registerUser(debtor);
        _registerUser(creditor);

        // Check if they owe us first. If yes, then reduce the amount (Netting)
        DebtNode[] storage creditorDebts = debtGraph[creditor];
        for (uint i = 0; i < creditorDebts.length; i++) {
            if (creditorDebts[i].creditor == debtor) {
                if (creditorDebts[i].value > amount) {
                    creditorDebts[i].value -= amount;
                    return;
                } else if (creditorDebts[i].value < amount) {
                    amount -= creditorDebts[i].value;
                    delete debtGraph[creditor][i]; 
                } else {
                    delete debtGraph[creditor][i];
                    return;
                }
            }
        }

        // Add or update the new debt
        bool exists = false;
        DebtNode[] storage debtorDebts = debtGraph[debtor];
        for (uint i = 0; i < debtorDebts.length; i++) {
            if (debtorDebts[i].creditor == creditor) {
                debtorDebts[i].value += amount;
                exists = true;
                break;
            }
        }
        if (!exists) {
            debtGraph[debtor].push(DebtNode(amount, creditor));
        }

        // Resolve debt loops
        _processGraphCycles();
    }

    function _processGraphCycles() private {
        uint totalNodes = allUsers.length;
        
        // Try to resolve cycles multiple times
        for (uint i = 0; i < totalNodes; i++) {
            bool cycleDetected = false;
            for (uint j = 0; j < totalNodes; j++) {
                address startNode = allUsers[j];
                uint32 reduced = _depthFirstSearch(startNode, startNode, new address[](0), new uint32[](0));
                if (reduced > 0) {
                    cycleDetected = true;
                }
            }
            if (!cycleDetected) break;
        }
    }

    function _depthFirstSearch(
        address currentNode,
        address targetNode,
        address[] memory visitedPath,
        uint32[] memory pathWeights
    ) private returns (uint32) {
        DebtNode[] storage edges = debtGraph[currentNode];

        for (uint i = 0; i < edges.length; i++) {
            address neighbor = edges[i].creditor;
            uint32 weight = edges[i].value;

            if (weight == 0) continue;

            // Cycle found
            if (neighbor == targetNode && visitedPath.length > 0) {
                return _reduceCycle(visitedPath, pathWeights, weight, currentNode);
            }

            // Check if already in path to avoid infinite loops
            bool alreadyVisited = false;
            for (uint k = 0; k < visitedPath.length; k++) {
                if (visitedPath[k] == neighbor) {
                    alreadyVisited = true;
                    break;
                }
            }
            if (alreadyVisited) continue;

            // Continue DFS
            address[] memory nextPath = new address[](visitedPath.length + 1);
            uint32[] memory nextWeights = new uint32[](pathWeights.length + 1);
            
            for (uint k = 0; k < visitedPath.length; k++) {
                nextPath[k] = visitedPath[k];
                nextWeights[k] = pathWeights[k];
            }
            nextPath[visitedPath.length] = currentNode;
            nextWeights[pathWeights.length] = weight;

            uint32 result = _depthFirstSearch(neighbor, targetNode, nextPath, nextWeights);
            if (result > 0) return result;
        }

        return 0;
    }

    function _reduceCycle(
        address[] memory path, 
        uint32[] memory weights, 
        uint32 closingWeight, 
        address closingNode
    ) private returns (uint32) {
        // Find minimum flow
        uint32 minFlow = closingWeight;
        for (uint i = 0; i < weights.length; i++) {
            if (weights[i] > 0 && weights[i] < minFlow) {
                minFlow = weights[i];
            }
        }

        // Reduce edges
        _updateEdge(closingNode, path[0], minFlow);
        for (uint i = 0; i < path.length - 1; i++) {
            _updateEdge(path[i], path[i+1], minFlow);
        }
        if (path.length > 0) {
            _updateEdge(path[path.length - 1], closingNode, minFlow);
        }

        return minFlow;
    }

    function _updateEdge(address from, address to, uint32 amountToReduce) private {
        DebtNode[] storage edges = debtGraph[from];
        for (uint i = 0; i < edges.length; i++) {
            if (edges[i].creditor == to) {
                if (edges[i].value <= amountToReduce) {
                    edges[i].value = 0; 
                } else {
                    edges[i].value -= amountToReduce; 
                }
                return;
            }
        }
    }
}
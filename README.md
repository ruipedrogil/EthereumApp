## Blockchain Splitwise (Ethereum Payment App)

A decentralized system for debt and credit management with automatic **on-chain** cycle resolution.

This project is an implementation of a dApp (Decentralized Application) on the **Ethereum** network that allows users to track who owes money to whom, functioning as a blockchain version of **Splitwise**.

The project was developed using the **Scaffold-ETH 2** toolkit, fulfilling the requirements of using **Ethereum, Solidity, and a modern development framework**.

---

## Project Features

This application implements the logic required for tracking IOUs (*I Owe You*) with a robust architecture:

- **Add Debt (IOU)** Allows recording that the current user owes an amount to another.  
  The contract automatically checks if there is a reverse debt and performs immediate netting.

- **On-Chain Cycle Resolution** Implementation of graph logic (**DFS – Depth First Search**) directly in the **Smart Contract**.  
  The system detects debt cycles (e.g., `A → B → C → A`) and resolves them **atomically in the same transaction**, ensuring ledger efficiency and consistency.

- **Check Debts (`lookup`)** Verifies how much a debtor owes to a specific creditor directly on the blockchain.

- **User List (`getAllUsers`)** Retrieves all addresses that have interacted with the system, allowing iteration over the debt graph.

---

## Tech Stack

- **Blockchain**: Ethereum (Hardhat Local Network)
- **Smart Contracts**: Solidity `v0.8.17+`  
  - Type optimization (`uint32`)
  - On-chain graph algorithms
- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Framework**: Scaffold-ETH 2
- **Blockchain Interaction**: Wagmi & Viem

---

## How to Run the Project (Quickstart)

Follow the steps below to start the local development environment.

### 1. Install Dependencies

Ensure you have:
- Node.js `>= v18`
- Yarn

```
yarn install
```

## 2. Start Local Blockchain (Terminal 1)

Starts a local Ethereum network using Hardhat.

```
yarn chain
```

## 3. Deploy the Contract (Terminal 2)

Compiles the Splitwise.sol contract and deploys it to the local network.

- Use `--reset` if you restart the blockchain.

```
yarn deploy --reset
```

## 4. Start the Frontend (Terminal 3)

Starts the web application in React / Next.js.

```
yarn start
``` 

Access at:
- http://localhost:3000

## Project Structure

The main files modified for this exercise are:


###  Smart Contract (Backend)

```
packages/hardhat/contracts/mycontract.sol
```

- Contains business logic

- DebtNode data structures

- Cycle resolution algorithm (`_depthFirstSearch`)

### Frontend
```
packages/nextjs/components/splitwise/AddIOUForm.tsx
```

- Interactive form for transaction submission

- Mathematical verification of the amount effectively deducted by the contract

- Success notifications and cycle detection

## How to Test

- Select User A and add a debt of 10 to User B

- Select User B and add a debt of 10 to User C

- Select User C and add a debt of 10 to User A

## Expected Result

- The Smart Contract detects the closed cycle

- The frontend displays a pop-up:

```
🪄 CYCLE DETECTED
```

- The debt tables become empty (or show 0 values), proving automatic on-chain resolution

---

Project developed within the scope of the Blockchains and Cryptocurrencies course
University of Beira Interior (UBI)

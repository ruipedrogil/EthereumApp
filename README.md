## Blockchain Splitwise (Ethereum Payment App)

Um sistema descentralizado para gestão de dívidas e créditos com resolução automática de ciclos **on-chain**.

Este projeto é uma implementação de uma dApp (Aplicação Descentralizada) na rede **Ethereum** que permite aos utilizadores rastrear quem deve dinheiro a quem, funcionando como uma versão blockchain do **Splitwise**.

O projeto foi desenvolvido utilizando o toolkit **Scaffold-ETH 2**, cumprindo os requisitos de utilização de **Ethereum, Solidity e um framework moderno de desenvolvimento**.

---

## Funcionalidades do Projeto

Esta aplicação implementa a lógica exigida para o controlo de IOUs (*I Owe You*) com uma arquitetura robusta:

- **Adicionar Dívida (IOU)**  
  Permite registar que o utilizador atual deve um valor a outro.  
  O contrato verifica automaticamente se existe uma dívida inversa e faz o abatimento imediato.

- **Resolução de Ciclos On-Chain**  
  Implementação de lógica de grafos (**DFS – Depth First Search**) diretamente no **Smart Contract**.  
  O sistema deteta ciclos de dívida (ex.: `A → B → C → A`) e resolve-os **atomicamente na mesma transação**, garantindo eficiência e consistência do ledger.

- **Consultar Dívidas (`lookup`)**  
  Verifica quanto um devedor deve a um credor específico diretamente na blockchain.

- **Lista de Utilizadores (`getAllUsers`)**  
  Recupera todos os endereços que já interagiram com o sistema, permitindo iterar sobre o grafo de dívidas.

---

## Tech Stack

- **Blockchain**: Ethereum (Hardhat Network local)
- **Smart Contracts**: Solidity `v0.8.17+`  
  - Otimização de tipos (`uint32`)
  - Algoritmos de grafos on-chain
- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Framework**: Scaffold-ETH 2
- **Interação com a Blockchain**: Wagmi & Viem

---

## Como Correr o Projeto (Quickstart)

Siga os passos abaixo para iniciar o ambiente de desenvolvimento local.

### 1. Instalar Dependências

Certifique-se de que tem:
- Node.js `>= v18`
- Yarn

```
yarn install
```

## 2. Iniciar a Blockchain Local (Terminal 1)

Inicia uma rede Ethereum local usando Hardhat.

```
yarn chain
```

## 3. Fazer Deploy do Contrato (Terminal 2)

Compila o contrato Splitwise.sol e faz deploy para a rede local.

- Use --reset se reiniciar a blockchain.

```
yarn deploy --reset
```

## 4. Iniciar o Frontend (Terminal 3)

Inicia a aplicação web em React / Next.js.

```
yarn start
``` 

Aceda a:
- http://localhost:3000

## Estrutura do Projeto

Os ficheiros principais modificados para este exercício são:

###  Smart Contract (Backend)

```
packages/hardhat/contracts/mycontract.sol
```

- Contém a lógica de negócio

- Estruturas de dados DebtNode

- Algoritmo de resolução de ciclos (_depthFirstSearch)

### Frontend
```
packages/nextjs/components/splitwise/AddIOUForm.tsx
```

- Formulário interativo para envio de transações

- Verificação matemática do valor efetivamente abatido pelo contrato

- Notificações de sucesso e deteção de ciclos

## Como Testar

- Selecione o Utilizador A e adicione uma dívida de 10 ao Utilizador B

- Selecione o Utilizador B e adicione uma dívida de 10 ao Utilizador C

- Selecione o Utilizador C e adicione uma dívida de 10 ao Utilizador A

## Resultado Esperado

- O Smart Contract deteta o ciclo fechado

- O frontend exibe um pop-up:

```
🪄 CICLO DETETADO
```

- As tabelas de dívidas ficam vazias (ou com valores a 0), provando a resolução automática on-chain

---

Projeto desenvolvido no âmbito da disciplina de Blockchains e Criptomoedas
Universidade da Beira Interior (UBI)
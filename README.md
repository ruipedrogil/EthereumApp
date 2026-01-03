
## Blockchain Splitwise (Ethereum Payment App)
Um sistema descentralizado para gestão de dívidas e créditos com resolução automática de ciclos.

Este projeto é uma implementação de uma dApp (Aplicação Descentralizada) na rede Ethereum que permite aos utilizadores rastrear quem deve dinheiro a quem, funcionando como uma versão blockchain do Splitwise.

O projeto foi desenvolvido utilizando o toolkit Scaffold-ETH 2, cumprindo os requisitos de utilizar Ethereum, Solidity e um framework moderno de desenvolvimento.


## Funcionalidades do Projeto

Esta aplicação implementa a lógica exigida para o controlo de IOUs (I Owe You):


- **Adicionar Dívida** (add_IOU): Permite registar que o utilizador atual deve um valor a outro utilizador (Credor).


- **Resolução de Ciclos (Loop Resolution)**: Lógica implementada no cliente (Frontend) que deteta ciclos de dívida (Ex: A → B → C → A) e resolve-os automaticamente antes de enviar para a blockchain, minimizando o número de transações e dívidas pendentes.



- **Consultar Dívidas (lookup)**: Verifica quanto um devedor deve a um credor específico diretamente na Blockchain.


- **Lista de Utilizadores (getUsers)**: Recupera todos os endereços que já interagiram com o sistema.


- **Total Devido (getTotalOwed)**: Calcula o montante total que um utilizador deve a todos os outros.

## Tech Stack

Blockchain: Ethereum (Local Hardhat Network).


Smart Contracts: Solidity (v0.8.17+).


Frontend: NextJS, React, TypeScript e TailwindCSS (via Scaffold-ETH 2).

Interação com Blockchain: Wagmi, Viem e Ethers.js.

## Como Correr o Projeto (Quickstart)
Siga os passos abaixo para iniciar o ambiente de desenvolvimento local:

1. Instalar Dependências
Certifique-se de que tem o Node (>= v18) e Yarn instalados.

Bash

yarn install
2. Iniciar a Blockchain Local (Terminal 1)
Este comando inicia uma rede Ethereum local (Hardhat Network) para testes.


```
yarn chain

```

3. Fazer Deploy do Contrato (Terminal 2)
Compila o contrato Splitwise.sol e envia-o para a rede local.

```
yarn deploy --reset

```

4. Iniciar o Frontend (Terminal 3)
Inicia a aplicação web em React.

```
yarn start

```
Visite http://localhost:3000 para interagir com a aplicação.

## Estrutura do Projeto

Os ficheiros principais modificados para este exercício encontram-se em:

**Smart Contract (Backend)**:


packages/hardhat/contracts/Splitwise.sol: Contém a lógica on-chain para armazenar dívidas e utilizadores.

**Frontend & Algoritmos**:


packages/nextjs/app/page.tsx: Contém a interface do utilizador e a lógica JavaScript crítica, incluindo o algoritmo BFS (Breadth-First Search) para deteção e resolução de ciclos.

**Script de Deploy**:

packages/hardhat/deploy/00_deploy_your_contract.ts: Script configurado para fazer o deploy do contrato Splitwise.

## Como Testar (Sanity Check)

Para validar a resolução de ciclos conforme o enunciado:

Use a interface para selecionar o Utilizador A e adicione uma dívida de 10 ao Utilizador B.

Selecione o Utilizador B e adicione uma dívida de 10 ao Utilizador C.

Selecione o Utilizador C e adicione uma dívida de 10 ao Utilizador A.


**Resultado Esperado**: O sistema deve detetar o ciclo, reduzir as dívidas localmente e, no final, todas as dívidas devem ser 0 (ou não aparecerem na lista), pois o ciclo foi resolvido.

--- 

Projeto desenvolvido no âmbito da disciplina de Blockchains e Criptomoedas da Universidade da Beira Interior.
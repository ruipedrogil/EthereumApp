"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";


// Here is implemented the SPLITWISE LOGIC (CLIENT SIDE)

// get all users
async function getUsers(contract: any) {
  return await contract.read.getAllUsers();
}

// BFS to find debt path
async function bfs(contract: any, start: string, end: string) {
  const queue: string[][] = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];

    if (last === end) return path;

    const users = await contract.read.getAllUsers();

    for (const u of users) {
      if (u === last) continue;  // avoids self-loop
      const debt = await contract.read.lookup(last, u);
      if (Number(debt) > 0 && !visited.has(u)) {
        visited.add(u);
        queue.push([...path, u]);
      }
    }
  }

  return null;
}

// get last activity timestamp
async function getLastActive(contract: any, user: string) {
  const ts = await contract.read.lastActive(user);
  const timestamp = Number(ts);

  if (timestamp === 0) {
    return null;
  }

  return timestamp;
}

// add IOU with proper on-chain cycle resolution
async function addIOU(contract: any, debtor: string, creditor: string, amount: number) {
  const path = await bfs(contract, creditor, debtor);  // encontrar caminho creditor -> debtor baseado nas dívidas existentes

  if (!path) {
    return await contract.write.add_IOU([creditor, amount, []]);     // no cicle: empty cycle
  }

  // path: [creditor, ..., debtor]
  // full cicle should be [debtor, creditor, ..., debtor]
  const cycle = [debtor, ...path];

  return await contract.write.add_IOU([creditor, amount, cycle]);
}


// calculate total owed
async function getTotalOwed(contract: any, user: string) {
  const users = await contract.read.getAllUsers();
  let total = 0;

  for (const u of users) {
    const amount = await contract.read.lookup(user, u);
    total += Number(amount);
  }

  return total;
}



const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address
              address={connectedAddress}
              chain={targetNetwork}
              blockExplorerAddressLink={
                targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
              }
            />
          </div>

          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

import { ethers } from "hardhat";

/**
 * Usage:
 *   npx hardhat run scripts/setTreasury.ts --network sepolia \
 *     --contract 0xYourContract \
 *     --treasury 0xda46a64ab8c6beda14677c49d2bdd0fc4bf7b72d
 */

async function main() {
  const args = process.argv.join(" ");
  const contractAddrMatch = args.match(/--contract\s+(0x[a-fA-F0-9]{40})/);
  const treasuryMatch = args.match(/--treasury\s+(0x[a-fA-F0-9]{40})/);

  if (!contractAddrMatch || !treasuryMatch) {
    console.error("Usage: --contract <address> --treasury <address>");
    process.exit(1);
  }

  const contractAddress = contractAddrMatch[1];
  const treasury = treasuryMatch[1];

  const [signer] = await ethers.getSigners();
  console.log("Setting treasury with signer:", signer.address);
  console.log("Contract:", contractAddress);
  console.log("New treasury:", treasury);

  const Subscriptions = await ethers.getContractFactory("Subscriptions");
  const contract = Subscriptions.attach(contractAddress).connect(signer);

  const tx = await contract.setTreasury(treasury);
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Treasury updated.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});



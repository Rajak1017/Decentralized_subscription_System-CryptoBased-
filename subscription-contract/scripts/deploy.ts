import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Subscriptions = await ethers.getContractFactory("Subscriptions");

  // Treasury address where payments are received (user-provided or from env)
  const DEFAULT_TREASURY = "0xda46a64ab8c6beda14677c49d2bdd0fc4bf7b72d";
  const treasury = process.env.TREASURY?.trim() || DEFAULT_TREASURY;
  const relayer = process.env.RELAYER?.trim() || deployer.address;

  console.log("Using treasury:", treasury);
  console.log("Using relayer:", relayer);

  console.log("Deploying Subscriptions contract...");
  const contract = await Subscriptions.deploy(treasury, relayer);
  await contract.waitForDeployment();

  console.log("Subscriptions deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

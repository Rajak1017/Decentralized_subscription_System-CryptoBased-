import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up plans with:", deployer.address);

  // Contract address from deployment
  const contractAddress = "0xE3EC5B846277a2c31c9d52CE097f3313280C4b49";
  
  const Subscriptions = await ethers.getContractFactory("Subscriptions");
  const contract = Subscriptions.attach(contractAddress);

  console.log("Contract attached to:", contractAddress);

  // Plan configurations matching the frontend store
  const plans = [
    {
      name: "Starter",
      price: "10", // 10 ETH (for testing, this is high - in production would be much lower)
      duration: 30, // 30 days
    },
    {
      name: "Professional", 
      price: "50", // 50 ETH (for testing)
      duration: 30, // 30 days
    },
    {
      name: "Enterprise",
      price: "0.1", // 0.1 ETH
      duration: 90, // 90 days
    },
  ];

  console.log("Creating plans on-chain...");

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    console.log(`\nCreating plan ${i + 1}: ${plan.name}`);
    console.log(`Price: ${plan.price} ETH`);
    console.log(`Duration: ${plan.duration} days`);

    try {
      // Convert price to wei
      const priceWei = ethers.parseEther(plan.price);
      // Convert duration to seconds
      const durationSec = BigInt(plan.duration) * BigInt(24 * 60 * 60);

      // Create plan (token address 0x0 for native ETH)
      const tx = await contract.createPlan(
        "0x0000000000000000000000000000000000000000", // Native ETH
        priceWei,
        durationSec
      );

      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Plan ${plan.name} created successfully!`);

      // Get the plan ID
      const nextId = await contract.nextPlanId();
      const planId = Number(nextId) - 1;
      console.log(`Plan ID: ${planId}`);

    } catch (error) {
      console.error(`Error creating plan ${plan.name}:`, error);
    }
  }

  console.log("\nAll plans created successfully!");
  
  // Verify plans exist
  console.log("\nVerifying plans...");
  for (let i = 0; i < plans.length; i++) {
    try {
      const exists = await contract.planExists(i);
      if (exists) {
        const planData = await contract.plans(i);
        console.log(`Plan ${i}: exists, price: ${ethers.formatEther(planData.price)} ETH, duration: ${Number(planData.duration) / (24 * 60 * 60)} days, active: ${planData.active}`);
      } else {
        console.log(`Plan ${i}: does not exist`);
      }
    } catch (error) {
      console.error(`Error checking plan ${i}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

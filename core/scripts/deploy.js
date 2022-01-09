// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const ethernal = require("hardhat-ethernal");
const stableArtifact = require("../artifacts/contracts/Stable.sol/Stable.json");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Stable = await hre.ethers.getContractFactory("Stable");
  const stable = await Stable.deploy("USD", 20220101, 5, "cid");

  await stable.deployed();

  await hre.ethernal.push({
    name: "Stable",
    address: stable.address,
  });

  console.log("Stable deployed to:", stable.address);

  console.log("Updating subgraph ABI");

  fs.writeFileSync(
    path.join(__dirname, "../../subgraph/abis/Stable.json"),
    JSON.stringify(stableArtifact.abi, null, 2)
  );

  console.log("Updated subgraph ABI successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

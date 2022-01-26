// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
// require("hardhat-ethernal");
const stableArtifact = require("../artifacts/contracts/Stable.sol/Stable.json");
const stableFactoryArtifact = require("../artifacts/contracts/Stable.sol/StableFactory.json");

const productDetailsCid =
  "bafkreid43zvcrxhfemobxktdi7wtkproeebi3asanp3b7wyet5nwglxvzq";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  await hre.network.provider.send("hardhat_reset");

  const productDetailsJson = await axios.get(
    "https://ipfs.io/ipfs/" + productDetailsCid
  );

  const productDetails = productDetailsJson.data;

  console.log("Products", productDetails);

  const StableFactory = await hre.ethers.getContractFactory("StableFactory");

  const stableFactory = await StableFactory.deploy();

  console.log("Stable factory deployed to:", stableFactory.address);

  await stableFactory.createStable(
    "US",
    "USD",
    20220101,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1),
    productDetailsCid
  );

  await stableFactory.createStable(
    "UK",
    "GBP",
    20220101,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1),
    productDetailsCid
  );

  await stableFactory.createStable(
    "IN",
    "INR",
    20220101,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1),
    productDetailsCid
  );

  // await hre.ethernal.push({
  //   name: "Stable",
  //   address: address,
  // });

  console.log("Updating subgraph ABI");

  fs.writeFileSync(
    path.join(__dirname, "../../subgraph/abis/StableFactory.json"),
    JSON.stringify(stableFactoryArtifact.abi, null, 2)
  );

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

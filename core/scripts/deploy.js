/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const stableArtifact = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerArtifact = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");
const szrTokenArtifact = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");

const productDetailsCID =
  "bafkreibtqzflynmgaboqfbkfxhrhygherd4bht6egvlxlonl32dac5oxoy";

async function main() {
  await hre.run("compile");
  await hre.network.provider.send("hardhat_reset");

  const productDetailsJson = await axios.get(
    `https://ipfs.io/ipfs/${productDetailsCID}`
  );

  const productDetails = productDetailsJson.data;

  console.log("Products", productDetails);

  const Stable = await hre.ethers.getContractFactory("Stable");

  const stable = await Stable.deploy(
    1000000,
    20,
    Math.round(new Date("2022-01-01").getTime() / 1000),
    productDetails.map((p) => p.id),
    productDetailsCID
  );

  console.log("Stable factory deployed to:", stable.address);

  await stable.createCountryTracker(
    "US",
    "USD",
    10,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1)
  );

  await stable.createCountryTracker(
    "UK",
    "GBP",
    10,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1)
  );

  await stable.createCountryTracker(
    "IN",
    "INR",
    10,
    productDetails.map((p) => p.id),
    productDetails.map(() => 1)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../subgraph/abis/Stable.json"),
    JSON.stringify(stableArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../subgraph/abis/CountryTracker.json"),
    JSON.stringify(countryTrackerArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../aggregator/abis/Stable.json"),
    JSON.stringify(stableArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../aggregator/abis/CountryTracker.json"),
    JSON.stringify(countryTrackerArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../aggregator/abis/StabilizerToken.json"),
    JSON.stringify(szrTokenArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../ui/src/abis/Stable.json"),
    JSON.stringify(stableArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../ui/src/abis/CountryTracker.json"),
    JSON.stringify(countryTrackerArtifact.abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../../ui/src/abis/StabilizerToken.json"),
    JSON.stringify(szrTokenArtifact.abi, null, 2)
  );

  console.log("Updated subgraph ABI successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const stableArtifact = require("../artifacts/contracts/Stable.sol/Stable.json");
const countryTrackerArtifact = require("../artifacts/contracts/CountryTracker.sol/CountryTracker.json");
const szrTokenArtifact = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");
const stableTokenArtifact = require("../artifacts/contracts/StableToken.sol/StableToken.json");

async function copyAbis() {
  await hre.run("compile");

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

  fs.writeFileSync(
    path.join(__dirname, "../../ui/src/abis/StableToken.json"),
    JSON.stringify(stableTokenArtifact.abi, null, 2)
  );

  console.log("Updated all ABI successfully");
}

copyAbis()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/* eslint-disable import/no-extraneous-dependencies */
const { ethers } = require("hardhat");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const { stable: stableContractAddress } = require("./deployed.json");

const address = "0xAB797f723DCC4C63E8ac1f374B40809fD8FB03A9";
const name = "ABC Hypermarket";
const stablesRedeemable = ethers.utils.parseEther("1000");
const claimPercent = 50;
const rewards = ethers.utils.parseEther("1"); // SZR

async function addSupplier() {
  const { provider } = ethers;

  const owner = provider.getSigner();

  /** @type {import("../typechain-types/Stable").Stable} */
  const stableContract = new ethers.Contract(
    stableContractAddress,
    stableAbi.abi,
    provider
  ).connect(owner);

  await stableContract.addSupplier(
    address,
    name,
    stablesRedeemable,
    claimPercent,
    rewards
  );

  console.log(address, " added as supplier");
}

addSupplier()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

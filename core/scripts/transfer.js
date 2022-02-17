/* eslint-disable import/no-extraneous-dependencies */
const ethers = require("ethers");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const szrAbi = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");

const amount = 100;
const recipient = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const stableContractAddress = "0x91aCa8560669FaEC15a8bc277137b54f702b79A8";

async function transfer() {
  const provider = new ethers.providers.JsonRpcProvider();

  const owner = provider.getSigner();

  /** @type {import("../typechain-types/Stable").Stable} */
  const stableContract = new ethers.Contract(
    stableContractAddress,
    stableAbi.abi,
    provider
  ).connect(owner);

  /** @type {import("../typechain-types/SZRToken").SZRToken} */
  const SZRToken = new ethers.Contract(
    await stableContract.szrToken(),
    szrAbi.abi,
    provider
  ).connect(owner);

  await SZRToken.transfer(recipient, 100);

  console.log(amount, "SZR transferref to", recipient);
}

transfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

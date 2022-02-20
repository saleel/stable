/* eslint-disable import/no-extraneous-dependencies */
const { ethers } = require("hardhat");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const szrAbi = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");
const { stable: stableContractAddress } = require("./deployed.json");

const amount = ethers.utils.parseEther("100");
const recipient = "0xbaae37Fc606c8d7c54366911Db142F7C0abA11ab";

async function transfer() {
  const { provider } = ethers;

  const owner = ethers.provider.getSigner();

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

  await SZRToken.transfer(recipient, amount);
  console.log(amount.toString(), "SZR transferref to", recipient);
}
transfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

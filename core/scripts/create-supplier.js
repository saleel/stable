/* eslint-disable import/no-extraneous-dependencies */
const ethers = require("ethers");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");

const stableContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const address = "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc";
const name = "ABC Hypermarket";
const stablesRedeemable = ethers.utils.parseEther("1000");
const claimPercent = 50;
const rewards = ethers.utils.parseEther("1"); // SZR

async function addSupplier() {
  const provider = new ethers.providers.JsonRpcProvider();

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

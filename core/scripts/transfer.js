/* eslint-disable import/no-extraneous-dependencies */
const ethers = require("ethers");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const szrAbi = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");

const amount = ethers.utils.parseEther("100");
const recipient = "0x9c54052c214e7a2Aa2F6Cc8092ef2dd774da4FbD";
const stableContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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

  await SZRToken.transfer(recipient, amount);
  console.log(amount.toString(), "SZR transferref to", recipient);
}
transfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

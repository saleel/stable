/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");
const szrAbi = require("../artifacts/contracts/StabilizerToken.sol/StabilizerToken.json");

const amount = 100;
const recipient = "0x9c54052c214e7a2Aa2F6Cc8092ef2dd774da4FbD";
const stableContractAddress = "0xe630868e440D2A595632959297a4Cb9d170036f2";

async function transfer() {
  const [owner] = await hre.ethers.getSigners();

  /** @type {import("../typechain-types/Stable").Stable} */
  const stableContract = new hre.ethers.Contract(
    stableContractAddress,
    stableAbi.abi
  ).connect(owner);

  /** @type {import("../typechain-types/SZRToken").SZRToken} */
  const SZRToken = new hre.ethers.Contract(
    await stableContract.szrToken(),
    szrAbi.abi
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

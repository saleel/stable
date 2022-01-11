const { ethers } = require("ethers");
const stableAbi = require("../core/artifacts/contracts/Stable.sol/Stable.json");

const stableAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function generate() {
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();

  console.log("Staring at block", await provider.getBlockNumber());

  const stableContract = new ethers.Contract(
    stableAddress,
    stableAbi.abi,
    provider
  );

  const contractWithSigner = await stableContract.connect(signer);

  console.log(
    "Contract loaded. Currency:",
    await contractWithSigner.currency()
  );

  let currentDate = await contractWithSigner.currentDate();

  await contractWithSigner.submitPrices(currentDate, ["ZW", "ZC"], [275, 575]);
  await contractWithSigner.calculate();
  currentDate++;

  await contractWithSigner.submitPrices(currentDate, ["ZW", "ZC"], [1275, 975]);
  await contractWithSigner.calculate();
}

generate();

//

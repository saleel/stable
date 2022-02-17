/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const axios = require("axios");
const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");

const productDetailsCID =
  "bafkreibroamdx2xuh4p3vjqiuhk7564vz7kgz2lyed5v4jqyuhmdsyrtpa";

const existingStable = "0x91aCa8560669FaEC15a8bc277137b54f702b79A8";

const sleep = (time = 5) =>
  new Promise((resolve) => {
    setTimeout(resolve, time * 1000);
  });

async function deploy() {
  await hre.run("compile");
  // await hre.network.provider.send("hardhat_reset");

  const productDetailsJson = await axios.get(
    `https://ipfs.io/ipfs/${productDetailsCID}`
  );

  const productDetails = productDetailsJson.data.filter(
    (p) => p.category !== "Cryptocurrency"
  );

  const cryptoDetails = productDetailsJson.data.filter(
    (p) => p.category === "Cryptocurrency"
  );

  console.log(`Found ${productDetails.length} from IPFS`);

  const Stable = await hre.ethers.getContractFactory("Stable");

  const batchLimit = 10;

  let stable;

  if (existingStable) {
    const [owner] = await hre.ethers.getSigners();
    stable = new hre.ethers.Contract(existingStable, stableAbi.abi, owner);
  } else {
    stable = await Stable.deploy(
      1000000,
      20,
      Math.round(new Date("2022-01-01").getTime() / 1000),
      productDetails.slice(0, batchLimit), // deploy with first products and add later
      productDetailsCID
    );
  }

  console.log("Stable contract deployed to:", stable.address);

  // Add products in batches
  // for (let i = batchLimit; i < productDetails.length; i += batchLimit) {
  //   const slice = productDetails.slice(
  //     i,
  //     Math.min(i + batchLimit, productDetails.length)
  //   );

  //   // eslint-disable-next-line no-await-in-loop
  //   await stable.addProducts(
  //     slice.map((s) => s.id),
  //     productDetailsCID
  //   );

  //   console.log(`Added ${slice.length} products to the contract`);

  //   // eslint-disable-next-line no-await-in-loop
  //   await sleep();
  // }

  console.log(productDetails.slice(0, 10).map(a => a.id))

  await stable.createCountryTracker(
    "US",
    "USD",
    75,
    productDetails.slice(0, 1).map(a => a.id), // will copy products from Stable
    [] // defaults to 1
  );

  return;

  console.log("Created country tracker for US");

  await sleep();

  await stable.createCountryTracker(
    "UK",
    "GBP",
    100,
    [], // will copy products from Stable
    [] // defaults to 1
  );

  console.log("Created country tracker for UK");

  await sleep();

  await stable.createCountryTracker(
    "IN",
    "INR",
    1,
    [], // will copy products from Stable
    [] // defaults to 1
  );

  console.log("Created country tracker for India");

  await sleep();

  await stable.addProducts(
    cryptoDetails.map((s) => s.id),
    productDetailsCID
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

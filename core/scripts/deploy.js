/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const axios = require("axios");
// const stableAbi = require("../artifacts/contracts/Stable.sol/Stable.json");

const productsCID =
  "bafkreifmf5gcccn3dry4ddhsrqhhnexlyyyr7ntrmqw3usfwa4ohsyt55e";

const sleep = (sec = 10) =>
  new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });

async function deploy() {
  await hre.run("compile");
  // await hre.network.provider.send("hardhat_reset");

  const productDetailsJson = await axios.get(
    `https://ipfs.io/ipfs/${productsCID}`
  );

  const cryptos = productDetailsJson.data.filter(
    (p) => p.category === "Cryptocurrency"
  );

  const foodItems = productDetailsJson.data.filter(
    (p) => p.category === "Food"
  );

  const futures = productDetailsJson.data.filter(
    (p) => p.category === "Futures"
  );

  const otherItems = productDetailsJson.data.filter(
    (p) =>
      p.category !== "Futures" &&
      p.category !== "Food" &&
      p.category !== "Cryptocurrency"
  );

  console.log(`Downloaded products from IPFS`, {
    food: foodItems.length,
    futures: futures.length,
    cryptos: cryptos.length,
    others: otherItems.length,
  });

  const Stable = await hre.ethers.getContractFactory("Stable");
  const stable = await Stable.deploy(
    hre.ethers.utils.parseEther("100000000"), // 100M initial supply
    20,
    Math.round(new Date("2022-02-01").getTime() / 1000),
    productsCID
  );

  // const stable = (
  //   await new hre.ethers.Contract(
  //     "0xaFB36003d119b3976D915D74887F9568ca635854",
  //     stableAbi.abi,
  //     hre.ethers.provider
  //   ).deployed()
  // ).connect(hre.ethers.provider.getSigner());

  console.log("Stable contract deployed to:", stable.address);

  await sleep();

  await stable.createCountryTracker("US", "USD", 75); // equal weightage to reflect currency value

  console.log("Created country tracker for US");

  await sleep();

  await stable.createCountryTracker("UK", "GBP", 100);

  console.log("Created country tracker for UK");

  await sleep();

  await stable.createCountryTracker("IN", "INR", 1);

  console.log("Created country tracker for IN");

  await sleep();

  const batchLimit = 17;
  // Add products in batches
  for (let i = 0; i < foodItems.length; i += batchLimit) {
    const slice = foodItems.slice(
      i,
      Math.min(i + batchLimit, foodItems.length)
    );

    await stable.updateBasket(
      "US",
      slice.map((s) => s.id),
      []
    );

    await sleep();

    await stable.updateBasket(
      "UK",
      slice.map((s) => s.id),
      []
    );

    await sleep();

    await stable.updateBasket(
      "IN",
      slice.map((s) => s.id),
      []
    );

    await sleep();
    console.log(`Added ${slice.length} product to the contract`);
  }

  // Futures for US
  await stable.updateBasket(
    "US",
    futures.map((s) => s.id),
    futures.map(() => 150)
  );

  console.log(`Added futures`);

  await sleep();

  await stable.updateBasket(
    "US",
    otherItems.map((s) => s.id),
    otherItems.map(() => 125)
  );
  await sleep();

  await stable.updateBasket(
    "UK",
    otherItems.map((s) => s.id),
    otherItems.map(() => 125)
  );
  await sleep();

  await stable.updateBasket(
    "IN",
    otherItems.map((s) => s.id),
    otherItems.map(() => 125)
  );
  await sleep();

  console.log(`Added other items`);

  // cryptos with no weightage
  await stable.updateBasket(
    "US",
    cryptos.map((s) => s.id),
    cryptos.map(() => 0)
  );
  await sleep();

  await stable.updateBasket(
    "UK",
    cryptos.map((s) => s.id),
    cryptos.map(() => 0)
  );
  await sleep();

  await stable.updateBasket(
    "IN",
    cryptos.map((s) => s.id),
    cryptos.map(() => 0)
  );

  console.log(`Added cryptos`);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

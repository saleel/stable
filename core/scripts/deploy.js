/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
const hre = require("hardhat");
const axios = require("axios");

const productsCID =
  "bafkreibroamdx2xuh4p3vjqiuhk7564vz7kgz2lyed5v4jqyuhmdsyrtpa";

const sleep = (sec = 0) =>
  new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });

async function deploy() {
  await hre.run("compile");
  await hre.network.provider.send("hardhat_reset");

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
    1000000,
    20,
    Math.round(new Date("2022-01-01").getTime() / 1000),
    productsCID
  );

  console.log("Stable contract deployed to:", stable.address);

  await sleep();

  await stable.createCountryTracker("US", "USD", 75); // weightage to reflect currency value

  console.log("Created country tracker for US");

  await sleep();

  await stable.createCountryTracker("UK", "GBP", 100);

  console.log("Created country tracker for UK");

  await sleep();

  await stable.createCountryTracker("IN", "INR", 1);

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
    []
  );

  console.log(`Added futures`);

  await sleep();

  await stable.updateBasket(
    "US",
    otherItems.map((s) => s.id),
    []
  );
  await sleep();

  await stable.updateBasket(
    "UK",
    otherItems.map((s) => s.id),
    []
  );
  await sleep();

  await stable.updateBasket(
    "IN",
    otherItems.map((s) => s.id),
    []
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

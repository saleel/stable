const redstone = require("redstone-api");

(async function a() {
  const price = await redstone.getHistoricalPrice("ZC=F", {
    startDate: new Date("2022-01-01"),
    endDate: new Date("2022-01-09"),
    interval: 24 * 60 * 60 * 1000,
    verifySignature: false,
  });

  console.log(price.map(p => [new Date(p.timestamp), p.value])); 
})();

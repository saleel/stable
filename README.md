# Project Stable

Project Stable is a decentralized, on-chain, price-history and inflation dashboard.
It tracks price change of various daily-use products and commodities and allow users to 
see true inflation rates.

Demo: [https://inflation.netlify.app/](https://inflation.netlify.app/)

Status: Alpha/POC phase
Deployed to aurora mainnet (because TheGraph had trouble indexing the aurora testnet).
Contract address: 

## How it works

- `Stable` is a smart contract on Aurora (NEAR) chain.
- `Stabilizer (SZR)` is a ERC20 token responsible for governance (DAO voting) and rewards in the ecosystem.
- `Stable` smart contract create `CountryTracker` contracts to track prices within a country. It only store the latest price of each product and a **Price Index** (like CPI) on the contract.
- The products that are tracked and their weightage is decided by the DAO for each country.
- The product details are stored on IPFS and the hash/CID is stored in the contract.
- **Consumers** submit prices of various products they use to the `CountryTracker` contract.
This is very `gas` efficient as the function only emits an event.
- **Aggregators** watch for price submission round and aggregate all submissions made in a day, calculate aggregated price for each product and Price Index, and submit them back to the contract. The rule (logic name) to be used for aggregation is set in the contract.
- Aggregators need to lock `SZR` token in order to get aggregator role - the more they lock, they more chanced they have to claim next agg. round. 
- Aggregators receive rewards in `SZR` (amount set by DAO) for completing each agg. round. They are also responsible for sending the rewards to consumers who submit the prices.
- Since major activities are verifiable on chain, DAO can easily slash aggregator's locked tokens if they are not honest or not doing their job.
- There is also a **Global Price Index** in `Stable` which is the weighted average of Price Index of each participating country. The weightage for each country is stored in `Stable` contract and is again, set by the DAO. DAO can choose to reduce the weightage of country if they have inflation due to any poor/temporary political reasons.
- Price Index for a country is the measure of inflation in that country, and the Global Price Index is a measure of global inflation.
- Since the contract only store the latest value, history of price changes is index using `The Graph` protocol. The `subgraph` keep track of all product details, product basket, price submissions, latest prices, Price Index, etc.
- Aggregators can also use the same `subgraph` to query the price submissions and product weightage (basket) needed for aggregation.


## StableToken
- StableToken (`STABLE`) is ERC20 token which is pegged to the Global Price Index.
- The peg is maintained using the `SZR` token. Users can exchange 1 USD worth of `SZR` for 1 USD worth of `STABLE`.
- This is backed by another entity in the ecosystem called by **Suppliers**
- Suppliers stake their reputation, and promise to redeem all the products in the basket in exchange for one `STABLE` token. These can be super-market chains, wholesale retailers, etc.
- Suppliers can borrow `SZR` tokens from the contract (which the contract receive when users exchange them for `STABLE`) equivalent to the amount of `STABLE` they promised to redeem.
- Suppliers are added to the contract by DAO. DAO also set a limit on the percentage of `SZR` they can withdraw with respect to the `STABLE` they promise to redeem. DAO can slow increase these limited based on the behaviour of the supplier.
- The incentive for the Supplier is they can borrow money without any interest, which they can use to run their business. Even when a user redeem their Stable token with the supplier, they make profits on the sales. In addition to that they get rewards in `SZR` for each redemption they do.
- On the other hand if the inflation increases, they would have to deliver products worth more than the amount they claimed. i.e if the Stable Token was 100 USD when they claimed and if the inflation increase by 5%, then they would have to deliver products worth 105 USD, though the basket of the products remains the same. So suppliers need to evaluate these and set their promised redemption amount accordingly.
- Users can only exchange `SZR` for `STABLE` if there are suppliers backing the `STABLE`. However, there is a `over-collateralization ratio` in the contract which can be set by the DAO to allow mining of more `STABLE` than that are in the contract.
- As the ecosystem grows, more `STABLE`  than that are backed can be minted because all users wont redeem them at once. Also, users can always choose to exchange `STABLE` for `SZR` instead of redeeming with a supplier. This would increase the supply of `SZR` and reduces its value.
- When users exchange `SZR` for `STABLE`, `SZR` equivalent to over collateralization is burned, as this amount is seignorage. This will also make `SZR` a deflationary asset as the ecosystem grows.
- `STABLE` can be seen as a "stable" coin with constant purchasing power - which is a potential store of value.



## Technologies

- Contract deployed on `Aurora` chain (`0xaFB36003d119b3976D915D74887F9568ca635854`).
- `TheGraph` for indexing contract - to track price submission, price history, etc.
- `IPFS` for storing product details - CID stored in contract.
- `React` for the UI.


## TODO
- Improve overall quality - fix bugs, refactoring, test for security/errors.
- Implement the DAO functionality - proposal and voting options.
- Implement Chainlink like AggregatorInterface in the contract so the price index can be used by oracles.
- The contract to derive the price of SZR from an oracle (once the token live).
- Allow contract to accept price submissions as an IPFS CID.
- Allow users to track Price Index based on their choice of product basket.
- Rewards for price submitters to be made in the same contract.
- A lot of these would depend on the direction of this project.
- Responsive design for app
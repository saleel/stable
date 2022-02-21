# Project Stable

Project Stable is a decentralized, on-chain, price-history and inflation dashboard.
It tracks price change of various daily-use products and commodities and allow users to 
see true inflation rates.

It also allow users to mint an anti-inflationary asset called `STABLE` token.

Demo: [https://inflation.netlify.app/](https://inflation.netlify.app/)

Subgraph: [https://thegraph.com/hosted-service/subgraph/saleel/stable-price-history](https://thegraph.com/hosted-service/subgraph/saleel/stable-price-history)

[Presentation Slides](https://docs.google.com/presentation/d/1mJleFKS5Iu1r3NbQ3BMaUVnFMGz821PPpLterQprfFA/)

[Presentation Video](https://youtu.be/gRjCPNxg-lM)


Status: Testing/POC phase

<br />


## Inspiration
Prices of daily-use products and services has been increasing drastically in the last couple of months. Many claims that govt. reported inflation numbers are not accurate.
The starting idea for this was inspired by [this tweet](https://twitter.com/balajis/status/1423330960481816582).


<br />

## What it does

- Track prices of daily-use products and services, in multiple countries, on the chain.
- Prices collected from users.
- Tracks Price Index (weighted average of all prices) - measure of true inflation.
- Products to track and weightage chosen by DAO.
- Project token Stabilizer `$SZR`  - used for governance and rewards.
- Allow users to mint an anti inflationary crypto-currency `$STABLE`, that is pegged to the Global Price Index, and is "stable" in terms of purchasing power.
<br />

## How it works
<img src="https://raw.githubusercontent.com/saleel/stable/main/screenshots/architecture.png" width="800" style="margin-left:20px;margin-bottom:20px" alt="Architecture" />

- `Stable` is the main smart contract deployed on Aurora blockchain. A gas efficient chain like Aurora is optimal for a public facing application like this.
- The product details are stored on IPFS and the hash/CID is stored in the contract.
 - `Stable` contract create child contracts called `CountryTracker` to track prices within a country.
- Users submit prices to the `CountryTracker` contract (which only emits an event).
- **Aggregators** watch for price submission event and aggregate all submissions made in a day, calculate aggregated price for each product and the Price Index, and submit them back to the contract. The rule (logic name) to be used for aggregation is set in the contract.
- Aggregators need to lockup `SZR` to get claims for aggregation rounds - the more they lock, more rounds they can get. DAO can slash their locked SZR if they don't do aggregations properly.
- The price submission events are indexed by a subgraph in the `TheGraph` protocol, which aggregators can use to query submission data.
- `CountryTracker` contract stores the latest prices of all products and the price index.
- The subgraph also index price and price index history - which powers the web app.
- Aggregators receive rewards in `SZR` (amount set by DAO) for completing each agg. round. Users with winning submissions are also rewarded at the same time. Rules to chose winners is also decided by the DAO.
- There is also a **Global Price Index** in `Stable` which is the weighted average of Price Index of each participating country. The weightage for each country is stored in `Stable` contract and is again, set by the DAO.
<br />

### StableToken
- StableToken (`STABLE`) is a token pegged to the Global Price Index.
- The peg is maintained using the `SZR` token. Users can exchange 1 USD worth of `SZR` for 1 USD worth of `STABLE`. This is similar to how Terra/Luna works.
- If a user mint 1000USD worth `STABLE` by exchanging 1000USD worth of `SZR`, and if the inflation increase by 10%, then they can burn their `STABLE` tokens and get 1100USD (10% extra) worth of `SZR`.
<br />

### Suppliers
<img src="https://raw.githubusercontent.com/saleel/stable/main/screenshots/supplier.png" width="500" style="margin-left:20px;margin-bottom:20px;" alt="Suppliers" />

- StableToken is backed by another entity in the ecosystem called by **Suppliers**
- Suppliers (super-market chains for example) stake their reputation, and  promise to redeem $STABLE in exchange of the goods in the product basket - and borrow equivalent $SZR. 
- Instead of paying an interest, they would pay/redeem the product basket even if the price increase in the future.
- Suppliers are approved and added to the contract by DAO. DAO also set a limit on the percentage of `SZR` they can withdraw with respect to the `STABLE` they promise to redeem. DAO can slow increase these limited based on the behavior of the supplier.
- Suppliers are added to the contract by DAO after verification. Suppliers will have to show their identity publicly in the proposal they create for adding them. If they don't redeem the `STABLES` they promised, it can lead to bad reputation on the brand.
- The incentive for the Supplier is they can borrow money without any interest, which they can use to run their business. Even when a user redeem their Stable token with the supplier, they make profits on the sales. In addition to that they get rewards in `SZR` for each redemption they do.
<br />

### Exchange
<img src="https://raw.githubusercontent.com/saleel/stable/main/screenshots/exchange.png" width="500" style="margin-left:20px;margin-bottom:20px;" alt="Exchange" />

- Users can only exchange `SZR` for `STABLE` if there are suppliers backing the `STABLE`. However, there is a `over-collateralization ratio` in the contract which can be set by the DAO to allow mining of more `STABLE` than that are in the contract.
- As the ecosystem grows, more `STABLE`  than that are backed can be minted because all users wont redeem them at once.
- Also, users can always choose to burn `STABLE` to mint `SZR` instead of redeeming with a supplier. This would increase the supply of `SZR` and reduces its value.
- When users exchange `SZR` for `STABLE`, `SZR` equivalent to over collateralization is burned, as this amount is seignorage. This will also make `SZR` a deflationary asset as the ecosystem grows.
<br />

## Tech stack
- Contract deployed on Aurora - [`0xaFB36003d119b3976D915D74887F9568ca635854`](https://aurorascan.dev/address/0xaFB36003d119b3976D915D74887F9568ca635854) (deployed to mainnet as TheGraph has trouble indexing testnet).
- TheGraph for indexing - to track price submission, price and price index history, etc.
- IPFS for storing product meta - CID stored in contract.
- React for the UI.
<br />


## Repo structure

Entire code for this project is in this repo

- `/core` : Contains code for smart-contract, hardhat setup, and some scripts for transferring SZR, creating suppliers, generating sample data, etc.
- `/subgraph` : Contains the subgraph definition and mappers that index price submissions, price and price index, etc.
- `/aggregator` : Contains script for becoming an aggregator - lockup SZR and run aggregations.
- `/ui` : React project web-app that renders the UI by connecting to subgraph and the contract.
<br />


## Things that can be done
- Suppliers backing STABLE token is only one model. **DAO can have a smart contract where users can lock BTC, ETH as collateral and borrow STABLE (i.e equivalent SZR).**
- Instead of paying interest, they would be paying the inflation rate as excess when they return.
- The contract can also act as an Oracle feed for the Defi apps. And also can bridge the tokens to other chains.

<br />

## TODOs:
- Allow users to view inflation based on their choice of products and weightage.
- Improve overall quality - fix bugs, test for security/errors.
- Implement the DAO functionality - proposal and voting features. Currently the `owner` of the contract is one address, but the ownership can be transferred to the DAO. 
- The contract to derive the price of SZR from an oracle. It is currently simulated (based on supply) in the contract as the token is not traded on any exchange.
- `subgraph` to also index the price submissions made through IPFS.
- Implement a better logic to select one/few winners from price submissions. Currently all submissions which equal aggregated price is decided as winner.
- A lot of these would depend on the direction of this project.

<br />


## Testing
Please contact me if you would like to test the app. I can transfer `SZR` tokens and also add you as a supplier if you would like to.

<br />


### Contracts

Deployed to Aurora mainnet during POC/testing phase, as TheGraph has trouble indexing testnet

Contract on Aurora: [0xaFB36003d119b3976D915D74887F9568ca635854](https://aurorascan.dev/address/0xaFB36003d119b3976D915D74887F9568ca635854)

SZR Token: [0x2f6ee7ee17647ed9cd0e449d893b5f2a285ef316](https://aurorascan.dev/token/0x2f6ee7ee17647ed9cd0e449d893b5f2a285ef316)

STABLE Token: [0x264cA4C59e24Dc7424CDf75f57ac14B2cc2eF3F3](https://aurorascan.dev/token/0x264cA4C59e24Dc7424CDf75f57ac14B2cc2eF3F3)

<br />


*Icons and logo from [icons8](https://icons8.com)*

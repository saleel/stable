# Stable Project


## Entities

- **Product**: An item that is tracked by the project, which is ideally consumed by the people on day to day basis.

- **Price**: Price of the product on a given day.

- **LatestPrice**: Most recent price of the product.

- **Basket**: List of products and their weightage used to calculate the price index.

- **PriceIndex**: Weighted average of all prices in the product basket.

- **GlobalPriceIndex**: Weighted average of price indices of all countries.


## Contracts

- Stable: Manages the protocol settings, product details (IPFS hash), country weightage, global price index. Also allow creation of Child contract for each country (factory model)

- Stable: Manage Basket, PriceIndex for a given country. Allow users to submit price and validators to update index and aggregated price.


## Persona

- Data provider: Users of the application/contract who submit prices for a country. This can be eCommerce stores, supermarket chains, regular consumers, scrapers...etc. Data providers submit price to contract by calling `submitPrice` method. This method is very cheap in terms of Gas as all it do is emit an event with details of the product and price.

- Aggregator: Aggregate price submitted by data providers, calculate price index and submit them to chain. Gets rewarded for submission, and is responsible to distribute rewards to data providers. Aggregators query all price submissions at 11:59PM and calculate the aggregated price for each product. The aggregated price is then submitted back to the contract.


TODO
- Icons for all
- IPFS for price submission


- Check math, 
- Test for multiple agg, suppliers..etc
- Div by zero
- IPFS indexing for prices
- Rename countrytracker
- i32 time
- Reduce gas fee
- Use clone factory method for country trackers
- V3 agg interface
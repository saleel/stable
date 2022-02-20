import React from 'react';
import { Route, Routes } from 'react-router-dom';
import SubmitPricePage from './pages/submit-price';
import HomePage from './pages/home';
import Layout from './components/layout';
import ProductPage from './pages/product';
import ExchangePage from './pages/exchange';
import SupplierPage from './pages/supplier';
import RewardsPage from './pages/rewards';
import PriceIndexPAge from './pages/price-index';
import GlobalPriceIndexPAge from './pages/global-price-index';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/price-index" element={<PriceIndexPAge />} />
        <Route path="/global-price-index" element={<GlobalPriceIndexPAge />} />
        <Route path="/submit-price" element={<SubmitPricePage />} />
        <Route path="/exchange" element={<ExchangePage />} />
        <Route path="/supplier" element={<SupplierPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

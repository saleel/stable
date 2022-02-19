import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AddPricePage from './pages/add-price';
import HomePage from './pages/home';
import Layout from './components/layout';
import ProductPage from './pages/product';
import ExchangePage from './pages/exchange';
import SupplierPage from './pages/supplier';
import RewardsPage from './pages/rewards';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/products/:productId" index element={<ProductPage />} />
        <Route path="/submit" index element={<AddPricePage />} />
        <Route path="/exchange" index element={<ExchangePage />} />
        <Route path="/supplier" index element={<SupplierPage />} />
        <Route path="/rewards" index element={<RewardsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

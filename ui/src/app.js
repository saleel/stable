import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AddPricePage from './pages/add-price';
import HomePage from './pages/home';
import Layout from './pages/layout';
import ProductPage from './pages/product';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/products/:productId" index element={<ProductPage />} />
        <Route path="/add-price" index element={<AddPricePage />} />
      </Route>
    </Routes>
  );
}

export default App;

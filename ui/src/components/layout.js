import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <>

      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-menu">
          <div className="navbar-start">
            <Link to="/" className="navbar-item">
              Home
            </Link>

            <Link to="/submit" className="navbar-item">
              Submit Price
            </Link>
          </div>

          <div className="navbar-end" />
        </div>
      </nav>

      <div className="container">
        <Outlet />
      </div>

    </>
  );
}

export default Layout;

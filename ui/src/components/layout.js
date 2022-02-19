import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { writeStorage, useLocalStorage } from '@rehooks/local-storage';
import { Countries } from '../constants';

function Layout() {
  const [country] = useLocalStorage('country');

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
            <Link to="/exchange" className="navbar-item">
              Exchange
            </Link>
            <Link to="/supplier" className="navbar-item">
              Supplier
            </Link>
          </div>

          <div className="navbar-end" />

          <div className="dropdown is-hoverable">
            <div className="dropdown-trigger">
              <button type="button" className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <span>{country}</span>
                <span className="icon is-small">
                  <i className="fas fa-angle-down" aria-hidden="true" />
                </span>
              </button>
            </div>
            <div className="dropdown-menu" id="dropdown-menu" role="menu">
              <div className="dropdown-content">
                {Object.keys(Countries).map((countryCode) => (
                  <a
                    key={countryCode}
                    className="dropdown-item"
                    onClick={() => writeStorage('country', countryCode)}
                  >
                    {Countries[countryCode]}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </nav>

      <div className="container">
        <Outlet />
      </div>

    </>
  );
}

export default Layout;

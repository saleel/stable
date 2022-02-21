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
            <div className="logo">
              <img src="/assets/logo.png" alt="Project Stable" />
            </div>
            <Link to="/" className="navbar-item">
              Home
            </Link>
            <Link to="/submit-price" className="navbar-item">
              Submit Price
            </Link>
            <Link to="/exchange" className="navbar-item">
              Exchange
            </Link>
            <Link to="/supplier" className="navbar-item">
              Supplier
            </Link>
            <Link to="/rewards" className="navbar-item">
              Rewards
            </Link>
          </div>

          <div className="navbar-end" />

          <div className="country-dropdown dropdown is-hoverable">
            <div className="dropdown-trigger">
              <button type="button" className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <span>&#127758;&nbsp; {country}</span>
                <span>▼</span>
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

      <div className="container main">
        <Outlet />
      </div>

      <div className="copyright">
        <hr />

        <div>
          Copyright &copy; 2022 Project Stable.
          Logo and icons from <a target="_blank" href="https://icons8.com/" rel="noreferrer">icons8.com</a>
        </div>
        <div>
          {'Status: POC/Testing. '}
          {'Contract on Aurora: '}
          <a
            target="_blank"
            href={`https://aurorascan.dev/address/${process.env.REACT_APP_STABLE_CONTRACT_ADDRESS}`}
            rel="noreferrer"
          >{process.env.REACT_APP_STABLE_CONTRACT_ADDRESS}
          </a>
        </div>
        <div>
          {'SZR Token: '}
          <a
            target="_blank"
            href={`https://aurorascan.dev/token/${process.env.REACT_APP_SZR_CONTRACT_ADDRESS}`}
            rel="noreferrer"
          >{process.env.REACT_APP_SZR_CONTRACT_ADDRESS}
          </a>
          <span> | </span>
          {'STABLE Token: '}
          <a
            target="_blank"
            href={`https://aurorascan.dev/token/${process.env.REACT_APP_STABLE_TOKEN_CONTRACT_ADDRESS}`}
            rel="noreferrer"
          >{process.env.REACT_APP_STABLE_TOKEN_CONTRACT_ADDRESS}
          </a>
        </div>
      </div>

    </>
  );
}

export default Layout;

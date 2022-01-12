import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>

      <nav className="navbar mb-5 px-5" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className='navbar-item' to="/">
            <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" />
          </Link>

          <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbar">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div id="navbar" className="navbar-menu">
          <div className="navbar-start">
            <Link className='navbar-item' to="/">Home</Link>
            <Link className='navbar-item' to="/">Submit Price</Link>
            <Link className='navbar-item' to="/">Exchange</Link>
          </div>
        </div>
      </nav>

      <div className='container'>
        <Outlet />
      </div>

    </div>
  );
}

export default Layout;



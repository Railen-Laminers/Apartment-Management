import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ links, lockNavigation }) {
    return (
        <div className="bg-light border-end vh-100 p-3" style={{ width: '250px' }}>
            <ul className="nav flex-column">
                {links.map(link => (
                    <li key={link.path} className="nav-item mb-2">
                        {lockNavigation ? (
                            <span className="nav-link text-muted" style={{ pointerEvents: 'none', opacity: 0.5 }}>
                                <i className={`bi ${link.icon} me-2`}></i>{link.label}
                            </span>
                        ) : (
                            <NavLink to={link.path} className="nav-link">
                                <i className={`bi ${link.icon} me-2`}></i>{link.label}
                            </NavLink>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

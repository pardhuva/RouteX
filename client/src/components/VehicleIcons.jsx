import React from "react";

// 1. RouteX Moto (Bike / Scooter)
export function BikeIcon({ className = "h-6 w-6", active = false }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Back Wheel */}
      <circle cx="11" cy="34" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="11" cy="34" r="3" fill="currentColor" />
      {/* Front Wheel */}
      <circle cx="37" cy="34" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="37" cy="34" r="3" fill="currentColor" />
      {/* Bike Chassis & Frame */}
      <path
        d="M11 34L20 22H27L33 34"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fork & Handlebar */}
      <path
        d="M37 34L30 14H25M30 14L34 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Seat & Fuel Tank / Scooter Footboard */}
      <path
        d="M15 22H24C26 22 27.5 20.5 27 18L26 15H20L15 22Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity={active ? "0.9" : "0.75"}
      />
      {/* Headlight Beam / Accent */}
      <circle cx="34" cy="16" r="1.5" fill="#F59E0B" />
    </svg>
  );
}

// 2. RouteX Auto (3-Wheeler Auto Rickshaw)
export function AutoIcon({ className = "h-6 w-6", active = false }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rear Wheel */}
      <circle cx="34" cy="36" r="6.5" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="34" cy="36" r="2.5" fill="currentColor" />
      {/* Front Wheel */}
      <circle cx="12" cy="36" r="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="12" cy="36" r="2" fill="currentColor" />
      {/* Auto Body & Iconic Curved Roof Canopy */}
      <path
        d="M10 33L15 17C16 13 19 11 23 11H36C39 11 41 13.5 41 16.5V33H34M10 33H28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windshield */}
      <path
        d="M16 18H26V27H13L16 18Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Passenger Cabin Opening */}
      <path
        d="M28 17H38V30H28V17Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Auto Rickshaw Classic Green/Yellow Mudguard Strip */}
      <path d="M9 31C9 28 14 28 15 31" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 3. RouteX Go (Compact AC Hatchback)
export function HatchbackIcon({ className = "h-6 w-6", active = false }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wheels */}
      <circle cx="13" cy="34" r="6" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="13" cy="34" r="2" fill="currentColor" />
      <circle cx="35" cy="34" r="6" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="35" cy="34" r="2" fill="currentColor" />
      {/* Compact Hatchback Silhouette */}
      <path
        d="M5 28L8 23C9 21 11.5 20.5 13.5 20.5L19 15C20.5 13.5 22.5 13 24.5 13H33C35 13 36.5 14 37.5 15.5L42 23.5C43.5 25 44 26.5 44 28.5V32C44 33.5 43 34 41 34H39M7 34H5C3.5 34 3 33 3 31.5V29C3 28 4 27.5 5 28ZM19 34H29"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windows */}
      <path
        d="M20 16L15.5 21H23V16H20ZM25 16V21H34L31 16H25Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity="0.3"
      />
    </svg>
  );
}

// 4. RouteX Premier (Executive Sedan)
export function SedanIcon({ className = "h-6 w-6", active = false }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wheels */}
      <circle cx="12" cy="34" r="6" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="12" cy="34" r="2" fill="currentColor" />
      <circle cx="36" cy="34" r="6" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="36" cy="34" r="2" fill="currentColor" />
      {/* Long Wheelbase Sedan Silhouette */}
      <path
        d="M3 30L6 24C7 22.5 8.5 22 10.5 22L16 16C17.5 14.5 19.5 14 22 14H31C33.5 14 35 15 36.5 16.5L41 22L45 24C46 25 46.5 26.5 46.5 28V31.5C46.5 33 45.5 34 43.5 34H40M18 34H30M6 34H3.5C2.5 34 2 33 2 31.5V29C2 28 2.5 27.5 3 27"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sleek Windows */}
      <path
        d="M17.5 16.5L13.5 22H23V16.5H17.5ZM25 16.5V22H34.5L31.5 16.5H25Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity="0.35"
      />
      {/* Subtle Luxury Door Crease */}
      <path d="M16 25H32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 5. RouteX XL (6-Seater SUV)
export function SUVIcon({ className = "h-6 w-6", active = false }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Roof Rails */}
      <path d="M16 10H36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M19 10V12M33 10V12" stroke="currentColor" strokeWidth="2" />
      {/* Wheels */}
      <circle cx="12" cy="35" r="6.5" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="12" cy="35" r="2.5" fill="currentColor" />
      <circle cx="36" cy="35" r="6.5" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="36" cy="35" r="2.5" fill="currentColor" />
      {/* Tall SUV Silhouette */}
      <path
        d="M3 29L7 21C8 19.5 9.5 19 11.5 19L16 12.5C17.5 11.5 19 11 21 11H37C39 11 40.5 12 41.5 13.5L45 20C46 21.5 46.5 23 46.5 25V32C46.5 34 45 35 43 35H40.5M18 35H30M6 35H3.5C2 35 1.5 34 1.5 32V29C1.5 27.5 2.5 27 3 26.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3-Row Windows */}
      <path
        d="M17 14L13.5 19H22V14H17ZM24 14V19H31V14H24ZM33 14V19H39L36.5 14H33Z"
        fill={active ? "currentColor" : "currentColor"}
        fillOpacity="0.3"
      />
    </svg>
  );
}

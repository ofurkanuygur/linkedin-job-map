# Privacy Policy — LinkedIn Job Map

**Last updated:** February 22, 2026

## Overview

LinkedIn Job Map is a Chrome extension that visualizes LinkedIn job listings on an interactive map. Your privacy is important to us, and this extension is designed with a privacy-first approach.

## Data Collection

**We do not collect, store, or transmit any personal data.** Specifically:

- No analytics or telemetry
- No tracking cookies or identifiers
- No user accounts or sign-ups required
- No data is sent to any server we own or operate

## Data Processing

All data processing happens **locally in your browser**:

- **Job listing data** is read from the LinkedIn page you are viewing and is used solely to display jobs on the map. This data is never transmitted externally.
- **Geocoding requests** are sent to the Mapbox API to convert job location addresses into map coordinates. Only the job location address string is sent — no personal information.
- **Routing requests** are sent to the OSRM (Open Source Routing Machine) API when you explicitly request a route. Only geographic coordinates are sent.
- **Geocoding cache** is stored in your browser's `localStorage` to reduce redundant API calls. This data never leaves your browser.
- **Map tiles** are loaded from Mapbox to render the map interface.

## Third-Party Services

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| [Mapbox](https://www.mapbox.com/legal/privacy) | Map tiles and geocoding | Job location addresses, map viewport coordinates |
| [OSRM](https://project-osrm.org/) | Route calculation | Geographic coordinates (when user requests a route) |

No personal information is shared with these services.

## Permissions

- **storage**: Save your Mapbox API token preference (configured in the Options page)
- **Host permissions**: Connect to LinkedIn's API (job data), Mapbox (maps/geocoding), and OSRM (routing)

## Local Storage

The extension stores the following data locally in your browser:

- Geocoding cache (address-to-coordinate mappings)
- Your location preference (if you set a location on the map)
- Mapbox API token (if you configure a custom token)

All local data can be cleared using the "Clear Cache" buttons in the extension interface.

## Changes to This Policy

Any changes to this privacy policy will be posted in this repository. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/ofurkanuygur/linkedin-job-map/issues).

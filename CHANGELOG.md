# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-09-24

### Added
- Surcharge docker compose for prod + github deploy action workflow
- Track package-lock.json

### Fixed
- Fix prod caddy file

### Chore
- Untrack data directory
- Add root .env file
- allow .env file to be tracked
- ignore class data

### Docs
- Update CHANGELOG for v1.1.0

## [1.1.0] - 2025-09-23

### Added
- Docker support for both frontend and backend services.
- Caddy reverse proxy for local development.

### Fixed
- Several bugs in the frontend application.
- Database persistence and networking issues in the Docker environment.

## [1.0.0] - 2025-09-22

### Added
- **Student Drawing:** Core feature to draw students randomly based on weighted probabilities.
- **Administration Panel:** UI to manage classes, students, and application settings.
- **Drawing History:** View a history of past draws for each class.
- **Probability View:** Compact and visual grid display for student probabilities and weights.
- **Dynamic Font Sizing:** Long student names are dynamically resized in the slot machine to prevent UI bugs.
- **Alphabetical Sorting:** Classes are now sorted alphabetically in all views.
- **Database Initialization:** The database is now populated from CSV files in the `/backend/data` folder.
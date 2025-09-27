# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-27

### Added
- **CI/CD:** The deployment workflow has been updated to generate a `.env` file on the VPS using secrets. This is a more secure way to handle the `SECRET_KEY` and other environment variables.

### Removed
- The `python-dotenv` dependency has been removed from the backend.

## [1.1.2] - 2025-09-26

### Changed
- **UI:** The "Add Student" and "Remove Student" buttons have been moved to the header of the draw panel for a more intuitive and streamlined user experience. The button text has been replaced with icons for a cleaner and more compact interface.

### Fixed
- **Drawing History:** Fixed a critical bug where students who were deselected from a draw were still being recorded in the drawing history and having their `draw_count` incremented. The backend logic has been refactored to only create the `DrawingHistory` entry after the user confirms the draw, ensuring data accuracy.

## [1.1.1] - 2025-09-24

### Added

- **CI/CD:** Implemented a GitHub Actions workflow for continuous deployment to a Virtual Private Server (VPS). This automates the process of deploying the application to the production environment.
- **Production Docker Configuration:** Introduced a `docker-compose.prod.yml` to manage production-specific configurations, starting with the Caddy reverse proxy.

### Changed

- **Versioning:** The `package-lock.json` file for the frontend is now tracked by Git to ensure deterministic dependency installation.
- **Configuration:** The main `.env` file is now tracked by Git.
- **Production Environment:** The production Caddy configuration (`Caddyfile.prod`) has been updated to use a direct IP address and a new path handling strategy for the backend API.
- **Docker Configuration:** Removed the `env_file` directive from the `docker-compose.yml` for the backend service.

### Removed

- **Versioned Data:** The `data` directory, containing class CSV files, is no longer tracked by Git. This prevents sensitive or large data files from being stored in the repository.

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
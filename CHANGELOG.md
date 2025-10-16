# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2025-10-16

### Changed

- **Slot Machine Animation:** Streamlined reel generation to avoid multiplying the student list and tuned easing so each spin decelerates smoothly toward the selected winner, improving performance without sacrificing suspense.
- **Student Selection UI:** Default selections now stay highlighted when switching classes or groups, eliminating the red flash and keeping the default state visually consistent.

## [1.3.2] - 2025-10-07

### Added

- **Group Management:** Added the ability to create and manage groups within a classroom. Students can be assigned to one or more groups, and drawings can be performed on a specific group.
- **API Documentation:** Organized the Swagger UI by grouping related endpoints with tags for improved readability and navigation.

## [1.3.1] - 2025-10-03

### Changed

- **Drawing Logic:** Adjusted the weight calculation formula to make the probability of drawing a student decrease more sharply as their draw count increases.
- **Admin Panel:** The student editing logic has been refactored. Admins can now only modify the `draw_count`, and the `weight` is automatically recalculated on the backend.

### Added

- **Admin Panel:** Added a "Reset All Classes" button and confirmation modals for all destructive actions (delete class, reset class, reset all) to improve classroom management and prevent accidental data loss.

### Fixed

- **Slot Machine Randomness:** Fixed a persistent issue where multiple slot machine instances would display visually similar reels. Each machine now uses a seeded pseudo-random number generator (PRNG) to guarantee a unique and deterministic reel for each draw.

## [1.3.0] - 2025-09-29

### Changed

- **Backend Refactoring:** Overhauled the backend structure by separating business logic from the CRUD layer into a dedicated service module (`services/drawing_service.py`). This improves separation of concerns and maintainability.
- **Frontend Refactoring:** Refactored frontend data-fetching logic into custom hooks (`useClassrooms`, `useClassroom`) to simplify components and remove scattered `useEffect` calls.
- **Atomic Transactions:** Backend operations that involve multiple database steps (e.g., confirming a draw) are now wrapped in atomic transactions to ensure data integrity.

### Added

- **Admin-Only Routes:** Added a new authorization dependency to protect sensitive backend endpoints (e.g., resetting a classroom), restricting them to admin users.
- **Input Validation:** The drawing endpoint now validates that all selected student IDs belong to the specified classroom, preventing invalid data submissions.

### Fixed

- **Backend Import Error:** Corrected a `ModuleNotFoundError` for `CORSMiddleware` that was introduced during refactoring.
- **Frontend Build Errors:** Resolved multiple TypeScript compilation errors in the frontend related to variable declarations, unused variables, and incorrect hook dependencies.

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

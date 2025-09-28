# Student Drawing App

A modern and engaging React application designed for middle school teachers. This tool helps randomly select students for lessons while intelligently adjusting drawing probabilities based on their participation history and performance. The goal is to ensure fair and targeted student engagement in the classroom.

## ✨ Key Features

- 🧑‍🏫 **Admin Dashboard**: Easily manage classes, add students, and track their drawing history and test results.
- 🎰 **Interactive Drawing Page**: Draw one or more students for a lesson with a fun, slot-machine-like animation to engage the class.
- ⚖️ **Dynamic Probabilities**: The drawing logic automatically adjusts probabilities. Students who were recently drawn or who have performed well are less likely to be chosen again, while students who need more opportunities are prioritized.
- 📊 **Probability Visualization**: A clear and intuitive interface to see how probabilities are weighted for the next draw, providing transparency to the teacher.

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Heroui](https://www.heroui.com/)
- **Backend**: [Python](https.python.org/), [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy](https://www.sqlalchemy.org/), [Alembic](https://alembic.sqlalchemy.org/)
- **Database**: [SQLite](https://www.sqlite.org/index.html)
- **DevOps**: [Docker](https://www.docker.com/), [Caddy](https://caddyserver.com/), [GitHub Actions](https://github.com/features/actions)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Python](https://www.python.org/) (v3.10 or later)
- [Conda](https://docs.conda.io/en/latest/miniconda.html) for Python environment management
- [Docker](https://www.docker.com/get-started) (for containerized deployment)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/OliRsn/drawing-app.git
    cd drawing-app
    ```

2.  **Backend Setup:**
    ```bash
    # Create and activate the conda environment
    conda env create -f backend/environment.yml
    conda activate drawer-app-env

    # Apply database migrations
    alembic -c backend/alembic.ini upgrade head

    # Start the backend server
    uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
    ```

3.  **Frontend Setup:**
    (In a new terminal)
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 🐳 Docker Deployment

This project is configured for production deployment using Docker and Caddy.

- **Production:**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```

- **Local (Development):**
  ```bash
  docker-compose up -d
  ```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](frontend/LICENSE) file for details.

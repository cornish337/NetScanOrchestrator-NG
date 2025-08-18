# Frontend Documentation

This document provides an overview of the frontend application, which is a single-page application (SPA) built with React.

## Technology Stack

-   **Framework:** [React](https://reactjs.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **State Management:** [Tanstack Query](https://tanstack.com/query/latest)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

The frontend code is located in the `frontend/` directory. Key files and directories include:

-   `frontend/src/main.tsx`: The entry point of the application.
-   `frontend/src/App.tsx`: The root component of the application.
-   `frontend/src/components/`: Contains reusable React components.
-   `frontend/src/lib/`: Contains modules for interacting with the API and defining types.
-   `frontend/index.html`: The main HTML file for the SPA.
-   `frontend/vite.config.ts`: The configuration file for Vite.

## Core Components

### `App.tsx`

This is the main component that orchestrates the entire UI. It is responsible for:
-   Fetching and displaying the list of projects.
-   Providing a form to create new projects.
-   Providing a form to start new scans.
-   Managing the state of the active scan.
-   Rendering the `LiveLog` and `NmapRunner` components.

### `NmapRunner.tsx`

This component provides a simple UI to run a one-off Nmap scan. It directly calls the `/api/nmap/run` endpoint and displays the raw output. This is primarily a utility for testing and debugging.

### `LiveLog.tsx`

This component is responsible for displaying the live output of a scan. It takes a `scanId` as a prop and establishes a WebSocket connection to the backend. It then listens for incoming messages and appends them to a log viewer.

## State Management

The frontend uses [Tanstack Query](https://tanstack.com/query/latest) (formerly React Query) for server state management. This library simplifies the process of fetching, caching, and updating data from the backend.

-   **Queries (`useQuery`):** Used for fetching data, such as the list of projects. Tanstack Query handles caching, background refetching, and stale-while-revalidate logic.
-   **Mutations (`useMutation`):** Used for creating, updating, or deleting data, such as creating a project or starting a scan. Tanstack Query manages the loading, error, and success states of these operations.

This approach eliminates the need for a global state management library like Redux or Zustand for handling server data.

## API Interaction

All interactions with the backend API are encapsulated in the `frontend/src/lib/api.ts` module. This module provides a set of functions that correspond to the backend's REST endpoints.

-   `listProjects()`: Fetches the list of projects.
-   `createProject()`: Creates a new project.
-   `startScan()`: Starts a new scan.
-   `runNmap()`: Executes a one-off Nmap scan.

This module also provides a `wsUrl()` function for generating the correct WebSocket URL for a given path.

## Features

### Completed
-   Project creation and listing.
-   Form for starting a new scan with custom targets and flags.
-   Live streaming of scan logs via WebSockets.
-   A separate utility for running ad-hoc Nmap commands.
-   Responsive design that works on different screen sizes.

### To Be Done
-   **Scan History:** A view to see the history of scans for a project.
-   **Scan Results:** A component to display parsed Nmap results in a structured format.
-   **User Authentication:** Login and registration forms.
-   **UI Feedback:** More granular feedback for loading and error states.

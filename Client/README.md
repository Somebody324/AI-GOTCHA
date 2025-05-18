
# AI·GOTCHA - Chat Application

This is a Next.js application featuring a chat interface, built with Firebase Studio, named AI·GOTCHA.

## Features

- Real-time like chat interface
- Message history stored in Firebase Realtime Database under a ticket structure
- Input area for sending messages
- Initial query suggestion buttons
- Option to delete chat history for the current ticket

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- ShadCN UI Components
- Tailwind CSS
- Firebase (Realtime Database for chat messages)
- Genkit (for AI capabilities, to be integrated)

## Getting Started

To get started with development:

1.  **Configure Firebase**:
    *   Create a `.env` file in the root of your project (if it doesn't exist).
    *   Add your Firebase project's web app configuration to the `.env` file. You can find these values in your Firebase project settings (Project Overview -> Project settings -> General tab -> Your apps -> Web app).
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        NEXT_PUBLIC_FIREBASE_DATABASE_URL="YOUR_DATABASE_URL"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
        ```
    *   Ensure your Firebase Realtime Database rules allow read/write access. For development, you might start with:
        ```json
        {
          "rules": {
            ".read": true,
            ".write": true
          }
        }
        ```
        **Caution**: These are insecure for production. Secure your rules before deploying.

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will typically start the app on `http://localhost:9002`.

4.  If you plan to use Genkit AI features, you might also need to run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    # or
    yarn genkit:dev
    ```

Explore the code in the `src` directory, particularly `src/app/page.tsx` for the main chat page logic and `src/components/chat` for the UI components. The Firebase configuration is in `src/lib/firebase.ts`.
User chat messages are stored under the `tickets/{ticketId}/{userId}/messages/` path in Firebase Realtime Database.
```

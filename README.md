# TreeGPT

TreeGPT is a branching conversation application that allows users to explore multiple AI responses to the same prompt, creating a tree-like conversation structure instead of a linear chat.

## Features

- Branching conversations with AI
- User authentication system
- Tree visualization of conversation paths
- Branch creation from any point in a conversation
- Conversation history management
- Responsive UI

## Technology Stack

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- Axios for API calls
- Vercel for deployment

### Backend
- Node.js/Express server
- MongoDB database
- JWT authentication
- Claude and OpenAI API integration
- Render for deployment

## Deployment

### Backend Deployment (Render)

1. Create a Render account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the Root Directory to `backend` (if in a subdirectory)
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add these environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret for JWT token generation
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (optional)
   - `FRONTEND_URL`: Your frontend URL (e.g., https://treegpt-six.vercel.app)

### Frontend Deployment (Vercel)

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set the Root Directory to `frontend` (if in a subdirectory)
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL
   - `NEXT_PUBLIC_SHARE_ENABLED`: "true" (optional feature flag)
   - `NEXT_PUBLIC_EXPORT_ENABLED`: "true" (optional feature flag)
5. Deploy

## Local Development

### Backend

```bash
cd backend
npm install
# Create a .env file with required environment variables
npm start
```

### Frontend

```bash
cd frontend
npm install
# Create a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

## Common Issues

### API Connection Issues

If you're experiencing connection issues between frontend and backend:

1. Make sure your environment variables are set correctly
2. Check that CORS is properly configured
3. Ensure your frontend is using the correct API URL

### Environment Variables

- Backend: Create a `.env` file in the backend directory
- Frontend: Create a `.env.local` file in the frontend directory

## Project Structure

```
treegpt/
├── frontend/                # Next.js frontend
│   ├── app/                 # Next.js app directory  
│   ├── components/          # React components
│   └── lib/                 # Utility functions
│
└── backend/                 # Express backend
    ├── controllers/         # API route controllers
    ├── models/              # MongoDB schemas
    ├── routes/              # API route definitions
    ├── middleware/          # Express middlewares
    └── server.js            # Main server file
```

## License

[MIT License](LICENSE)
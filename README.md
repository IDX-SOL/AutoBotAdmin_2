# AutoBot Admin Panel

A modern, responsive admin panel built with Next.js 14, TypeScript, and Tailwind CSS for managing the AutoBot platform.

## Features

- **Dashboard**: Overview of platform statistics and recent activity
- **User Management**: View, edit, and manage platform users
- **Bot Management**: Monitor and control trading bots
- **Admin Management**: Manage admin accounts and permissions
- **Responsive Design**: Mobile-first design with dark theme
- **TypeScript**: Full type safety and better development experience
- **Modern UI**: Built with Tailwind CSS and Lucide React icons

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your backend URL:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/     # Dashboard page ✅
│   │   ├── users/         # User management ⚠️ (needs TypeScript fixes)
│   │   ├── bots/          # Bot management ⚠️ (needs TypeScript fixes)
│   │   ├── admins/        # Admin management ✅
│   │   └── login/         # Admin login ✅
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout ✅
│   └── page.tsx           # Home page (redirects to login) ✅
├── components/
│   └── admin/
│       └── AdminLayout.tsx # Main admin layout component ✅
├── utils/
│   └── adminApiService.ts # API service for admin operations ✅
└── types/                  # TypeScript type definitions ✅
```

## Current Status

### ✅ Completed
- **Dashboard**: Fully functional with TypeScript
- **Admin Layout**: Responsive sidebar and navigation
- **Admin Login**: Authentication form with validation
- **Admin Management**: View and manage admin accounts
- **API Service**: Complete admin API integration
- **Type Definitions**: All interfaces and types defined

### ⚠️ Needs TypeScript Fixes
- **Users Page**: Basic functionality works, needs type annotations
- **Bots Page**: Basic functionality works, needs type annotations

### 🔧 Quick Fixes Needed
The remaining TypeScript errors are mainly:
1. Missing type annotations for function parameters
2. State type definitions
3. URLSearchParams type compatibility

## API Integration

The admin panel integrates with the AutoBot backend API through the `adminApiService`. Key endpoints include:

- **Authentication**: `/admin/login`
- **Dashboard**: `/admin/dashboard/stats`
- **Users**: `/admin/users`
- **Bots**: `/admin/bots`
- **Admins**: `/admin/admins`

## Development

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Features

### Dashboard
- Platform statistics overview
- Recent user registrations
- Recent bot activities
- Quick action buttons

### User Management
- View all users
- Search and filter users
- Edit user details
- Delete users

### Bot Management
- Monitor bot status
- View bot configurations
- Manage bot trade wallets
- Bot analytics

### Admin Management
- Manage admin accounts
- Role-based permissions
- Admin activity logs

## Security

- JWT-based authentication
- Secure API communication
- Role-based access control
- Automatic token refresh

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for the AutoBot platform.

## Support

For support and questions, please contact the development team.

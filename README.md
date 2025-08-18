# RallyUp Frontend

A modern, responsive web application built with Next.js 14, TypeScript, and Tailwind CSS for managing sports clubs, events, and memberships.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.17 or later
- **pnpm** (recommended) or npm
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RallyUp/Frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
Frontend/
├── app/                          # Next.js 14 App Router
│   ├── dashboard/               # Protected dashboard routes
│   │   ├── admin/              # Admin-only pages
│   │   ├── user/               # User dashboard pages
│   │   └── membership-cards/   # Membership card management
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                  # Reusable UI components
│   ├── ui/                     # Shadcn/ui components
│   ├── dashboard-layout.tsx    # Dashboard layout wrapper
│   ├── protected-route.tsx     # Authentication guard
│   └── membership-card.tsx     # Membership card component
├── contexts/                    # React contexts
│   └── auth-context.tsx        # Authentication state management
├── hooks/                      # Custom React hooks
├── lib/                        # Utility libraries
│   ├── api.ts                  # API client configuration
│   ├── config.ts               # App configuration
│   └── utils.ts                # Helper functions
├── public/                     # Static assets
├── styles/                     # Additional styles
└── package.json                # Dependencies and scripts
```

## 🎨 Tech Stack

### Core Technologies
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library with hooks

### UI Components
- **Shadcn/ui** - High-quality, accessible components
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

### State Management
- **React Context** - Global state (auth, user data)
- **React Hooks** - Local component state

### Styling & Design
- **Tailwind CSS** - Utility classes and responsive design
- **CSS Variables** - Theme customization
- **Dark Mode** - Built-in theme switching

## 🔐 Authentication & Authorization

### Protected Routes
The app uses a `ProtectedRoute` component to guard dashboard pages:

```tsx
<ProtectedRoute>
  <DashboardLayout>
    {/* Your protected content */}
  </DashboardLayout>
</ProtectedRoute>
```

### User Roles
- **System Owner** - Full system access
- **Admin** - Club management
- **User** - Basic member access

### Auth Context
```tsx
const { user, login, logout, refreshUser } = useAuth()
```

## 🎯 Key Components

### Dashboard Layout
`components/dashboard-layout.tsx` provides:
- Responsive sidebar navigation
- User profile dropdown
- Theme switching
- Mobile menu

### Membership Card System
`components/membership-card.tsx` features:
- Digital membership card display
- Customizable colors and fonts
- Plan-based card mapping
- User name integration

### API Client
`lib/api.ts` handles:
- HTTP requests to backend
- Authentication headers
- Response handling
- Error management

## 🌐 Environment Configuration

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## 🔄 Switching Backend API Endpoints

### Using NPM Scripts (Recommended)

The frontend has built-in scripts to switch between different environments:

```bash
# Switch to development API (localhost:5000)
npm run env:dev

# Switch to staging API
npm run env:staging

# Switch to production API
npm run env:production

# Check current environment
npm run env:current
```

### What These Scripts Do

- **`npm run env:dev`** → Sets API to `http://localhost:5000/api`
- **`npm run env:production`** → Sets API to production server
- **`npm run env:current`** → Shows which API you're currently using

### After Switching

1. **Restart your development server**:
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Verify the switch**:
   ```bash
   npm run env:current
   ```

### Manual Override (if needed)

You can also manually edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note**: After manual changes, restart your dev server for changes to take effect.

## 📱 Responsive Design

The app is fully responsive with:
- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly** interactions
- **Progressive enhancement**

## 🎨 Theme System

### Light/Dark Mode
- Automatic theme detection
- Manual theme switching
- Persistent theme preference
- CSS variable-based theming

### Customization
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

## 🚀 Deployment

### Build for Production

1. **Create production build**
   ```bash
   pnpm build
   # or
   npm run build
   ```

2. **Test production build locally**
   ```bash
   pnpm start
   # or
   npm start
   ```

### Deployment Options

#### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Netlify
1. Build command: `pnpm build`
2. Publish directory: `out`
3. Set environment variables

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Static Export
```bash
pnpm build
pnpm export
# Serves static files from 'out' directory
```

### Environment Variables for Production

Set these in your hosting platform:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
NODE_ENV=production
```

## 🔧 Development Workflow

### Code Style
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

### Git Workflow
1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push and create PR: `git push origin feature/name`
4. Merge after review

### Testing
```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests (when implemented)
pnpm test
```

## 📚 API Integration

### Backend Communication
The frontend communicates with the backend via REST API:

```typescript
// Example API call
const response = await apiClient.getMyClubMembershipCards()
if (response.success) {
  setCards(response.data)
}
```

### Error Handling
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks for failed requests

## 🎯 Key Features

### Dashboard
- **User Dashboard** - Personal overview and quick actions
- **Admin Dashboard** - Club and member management
- **System Owner Dashboard** - System-wide administration

### Membership Management
- **Digital Cards** - Customizable membership cards
- **Plan Management** - Membership plan administration
- **User Roles** - Role-based access control

### Event System
- **Event Creation** - Admin event management
- **Registration** - User event registration
- **Attendance Tracking** - Event participation monitoring

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

#### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript Errors
```bash
# Check types
pnpm type-check
# Fix auto-fixable issues
pnpm lint --fix
```

### Debug Mode
Enable debug logging:
```typescript
console.log('Debug info:', { user, cards, selectedCard })
```

## 📖 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)

### Team Communication
- **Slack/Discord**: #frontend-dev channel
- **Code Reviews**: Required for all PRs
- **Documentation**: Update this README for major changes

## 🤝 Contributing

### Before Contributing
1. Read this README thoroughly
2. Understand the project structure
3. Check existing issues and PRs
4. Follow the coding standards

### Code Standards
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include JSDoc comments for complex functions
- Test your changes thoroughly

### Pull Request Process
1. **Description**: Clear description of changes
2. **Testing**: Test on multiple devices/browsers
3. **Screenshots**: Include UI changes if applicable
4. **Review**: Address all review comments

---

**Need Help?** Contact the frontend team or create an issue in the repository.

**Last Updated**: December 2024
**Version**: 1.0.0

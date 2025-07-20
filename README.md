# InmoTech Platform

A modern, full-featured real estate technology and investment platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Dashboard & Analytics
- **Portfolio Overview**: Real-time portfolio value tracking with performance metrics
- **Investment Analytics**: Detailed charts and graphs showing investment performance
- **Portfolio Score**: AI-powered portfolio health scoring system
- **Risk Assessment**: Comprehensive risk level analysis and recommendations

### Investment Management
- **Browse Projects**: Discover new real estate investment opportunities
- **Project Tracking**: Monitor progress of active investments
- **Investment Calculator**: Calculate potential returns and risks
- **Diversification Analysis**: Portfolio allocation tracking across property types

### User Experience
- **Dark/Light Mode**: Full theme switching support
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Real-time Updates**: Live portfolio updates and notifications
- **Interactive Charts**: Dynamic performance visualizations

### Project Types
- **Residential**: Single-family homes, apartments, condos
- **Commercial**: Office buildings, retail spaces, warehouses
- **Mixed Use**: Combined residential and commercial developments

## 🛠 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Framer Motion**: Animation library
- **Recharts**: Chart and data visualization

### Backend (Planned)
- **Express.js**: Node.js web framework
- **PostgreSQL**: Primary database
- **Drizzle ORM**: Type-safe database interactions
- **JWT**: Authentication and authorization
- **Stripe**: Payment processing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crowdlending-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit environment variables
   nano .env.local
   ```

5. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately
   npm run dev          # Frontend only
   npm run server       # Backend only
   ```

## 🌟 Key Components

### Dashboard Layout
- Responsive sidebar navigation with collapsible mobile menu
- Dark/light theme toggle
- User profile management
- Quick action buttons

### Portfolio Analytics
- Real-time portfolio value tracking
- Performance charts with multiple time periods
- Investment breakdown by property type
- Risk assessment and recommendations

### Investment Projects
- Grid view of available and active investments
- Project progress tracking
- Financial metrics and ROI calculations
- Filtering and sorting capabilities

### Recent Activity
- Transaction history
- Project updates
- Dividend payments
- Document notifications

## 🎨 Design System

### Colors
- **Primary**: Orange gradient (#f97316 to #ea580c)
- **Neutral**: Gray scale for backgrounds and text
- **Status**: Green (success), Red (error), Yellow (warning), Blue (info)

### Typography
- **Font**: Inter (system fallback)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Primary, secondary, and ghost variants
- **Form Elements**: Consistent styling with focus states
- **Charts**: Animated with hover interactions

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

## 🔧 Development Scripts

```bash
# Development
npm run dev                 # Start frontend development server
npm run server             # Start backend development server
npm run dev:full           # Start both frontend and backend

# Production
npm run build              # Build frontend for production
npm run start              # Start production frontend server
npm run server:build       # Build backend for production
npm run server:start       # Start production backend server

# Utilities
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript compiler
npm install:all            # Install all dependencies (frontend + backend)
```

## 🚦 Project Status

### ✅ Completed
- [x] Dashboard layout and navigation
- [x] Portfolio overview components
- [x] Investment project listings
- [x] Performance charts and analytics
- [x] Recent activity tracking
- [x] Dark/light theme support
- [x] Responsive design
- [x] TypeScript integration

### 🚧 In Progress
- [ ] Backend API implementation
- [ ] User authentication system
- [ ] Payment integration
- [ ] Real-time data updates

### 📋 Planned
- [ ] Investment calculator
- [ ] Document management
- [ ] Push notifications
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@inmobi.mobi
- Documentation: [docs.inmobi.mobi](https://docs.inmobi.mobi)
- GitHub Issues: [Create an issue](https://github.com/inmobimobi/crowdlending/issues)

---

**Built with ❤️ by the Inmobi Development Team**# inmotech
# inmotech
# InmoTech - Live! 🚀

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SearchPage from './pages/SearchPage';
import MyMovies from './pages/MyMovies';
import MovieDetails from './pages/MovieDetails';
import TVDetails from './pages/TVDetails';
import PersonDetails from './pages/PersonDetails';
import PageTransition from './components/PageTransition';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Wrap page components with transition animation
const TransitionWrapper = ({ component: Component, ...rest }: { component: React.ElementType }) => {
  return (
    <PageTransition direction="left">
      <Component {...rest} />
    </PageTransition>
  );
};

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="app">
      <Navbar />
      <div className="content">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<TransitionWrapper component={Home} />} />
          <Route path="/login" element={<TransitionWrapper component={Login} />} />
          <Route path="/register" element={<TransitionWrapper component={Register} />} />
          <Route path="/forgot-password" element={<TransitionWrapper component={ForgotPassword} />} />
          <Route path="/reset-password" element={<TransitionWrapper component={ResetPassword} />} />
          <Route path="/search" element={<TransitionWrapper component={SearchPage} />} />
          <Route path="/movie/:id" element={<TransitionWrapper component={MovieDetails} />} />
          <Route path="/tv/:id" element={<TransitionWrapper component={TVDetails} />} />
          <Route path="/person/:id" element={<TransitionWrapper component={PersonDetails} />} />
          <Route path="/user/:id" element={<TransitionWrapper component={UserProfile} />} />
          
          {/* Protected routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <TransitionWrapper component={Profile} />
            </ProtectedRoute>
          } />
          <Route path="/my-movies" element={
            <ProtectedRoute>
              <TransitionWrapper component={MyMovies} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
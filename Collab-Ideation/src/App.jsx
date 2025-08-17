import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthGuard from './components/auth/AuthGuard';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProjectDetail from './components/projects/ProjectDetail';
import ProjectsPage from './components/projects/ProjectsPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-white text-black">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/project/:id"
                element={
                  <AuthGuard>
                    <Layout>
                      <ProjectDetail />
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                  path="/projects"
                  element={
                    <AuthGuard>
                      <Layout>
                        <ProjectsPage />
                      </Layout>
                    </AuthGuard>
                  }
                />
              <Route
                path="/messages"
                element={
                  <AuthGuard>
                    <Layout>
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold">Messages Page</h1>
                        <p className="text-gray-600 mt-2">Coming Soon</p>
                      </div>
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/documents"
                element={
                  <AuthGuard>
                    <Layout>
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold">Documents Page</h1>
                        <p className="text-gray-600 mt-2">Coming Soon</p>
                      </div>
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/analytics"
                element={
                  <AuthGuard>
                    <Layout>
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold">Analytics Page</h1>
                        <p className="text-gray-600 mt-2">Coming Soon</p>
                      </div>
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthGuard>
                    <Layout>
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold">Settings Page</h1>
                        <p className="text-gray-600 mt-2">Coming Soon</p>
                      </div>
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1f2937',
                  color: '#ffffff',
                  border: '1px solid #374151',
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutDashboard, Lightbulb, FileText, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';

const Dashboard = ({ onLogout }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="bg-gray-800 p-6 md:w-64 w-full flex-shrink-0 border-r border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-bold text-white tracking-wide">
            Workspace
          </div>
        </div>
        <nav>
          <motion.ul variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            <motion.li variants={itemVariants}>
              <a href="#" className="flex items-center p-4 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors duration-200">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </a>
            </motion.li>
            <motion.li variants={itemVariants}>
              <a href="#" className="flex items-center p-4 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200">
                <Lightbulb className="w-5 h-5 mr-3" />
                <span>AI Ideation</span>
              </a>
            </motion.li>
            <motion.li variants={itemVariants}>
              <a href="#" className="flex items-center p-4 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200">
                <FileText className="w-5 h-5 mr-3" />
                <span>Kanban Boards</span>
              </a>
            </motion.li>
            <motion.li variants={itemVariants}>
              <a href="#" className="flex items-center p-4 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200">
                <MessageSquare className="w-5 h-5 mr-3" />
                <span>Real-time Chat</span>
              </a>
            </motion.li>
          </motion.ul>
        </nav>
        <div className="mt-8">
          <Button onClick={onLogout}>
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-5xl font-extrabold text-white mb-6">
            Welcome, Team!
          </h1>
          <p className="text-lg text-gray-800 mb-8">
            This is your central hub for all collaborative projects.
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Card Components */}
            <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 cursor-pointer">
              <h3 className="text-xl font-bold text-white mb-2">AI Ideation</h3>
              <p className="text-gray-400">
                Generate creative ideas and solve problems with AI assistance.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 cursor-pointer">
              <h3 className="text-xl font-bold text-white mb-2">Kanban Boards</h3>
              <p className="text-gray-400">
                Visualize and manage your project tasks in a dynamic board.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 cursor-pointer">
              <h3 className="text-xl font-bold text-white mb-2">Real-time Chat</h3>
              <p className="text-gray-400">
                Communicate instantly with your team on any project.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 cursor-pointer">
              <h3 className="text-xl font-bold text-white mb-2">Version Control</h3>
              <p className="text-gray-400">
                Track and manage changes to all your collaborative documents.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
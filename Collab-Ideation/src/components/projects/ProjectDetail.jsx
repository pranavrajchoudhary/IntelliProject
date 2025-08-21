import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Users, MessageSquare, Lightbulb } from 'lucide-react';
import { projectAPI, taskAPI } from '../../services/api';
import TaskCard from '../tasks/TaskCard';
import CreateTaskModal from '../tasks/CreateTaskModal';
import AIIdeaGenerator from '../ai/AIIdeaGenerator';
import Chat from '../chat/Chat';
import EditTaskModal from '../tasks/EditTaskModal';
import { useAuth } from '../../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeColumn, setActiveColumn] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const { user } = useAuth();


  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-gray-300' },
    { id: 'inprogress', title: 'In Progress', color: 'border-yellow-300' },
    { id: 'done', title: 'Done', color: 'border-green-300' }
  ];

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchTasks();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getProject(id);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const canDragTask = (task) => {
  const isAdmin = user.role === 'admin';
  const isProjectManager = project?.owner === user._id;
  // Support both new multi-assignee and legacy single-assignee
  const isAssignee = 
    Array.isArray(task.assignees) && task.assignees.length
      ? task.assignees.some(a => a.user?._id === user._id)
      : (task.assignee && task.assignee._id === user._id);

  return isAdmin || isProjectManager || isAssignee;
};


  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getProjectTasks(id);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]); // Always ensures tasks is an array
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status) || [];
  };

  const handleEditTask = (task) => {
  setEditingTask(task);
};

const handleDeleteTask = (taskId) => {
  setTasks(tasks.filter(task => task._id !== taskId));
};

const handleTaskUpdated = (updatedTask) => {
  setTasks(tasks.map(task => 
    task._id === updatedTask._id ? updatedTask : task
  ));
  setEditingTask(null);
};

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    const draggedTask = tasks.find(task => task._id === draggableId);
    if (!canDragTask(draggedTask)) {
    toast.error('Only assigned users or project managers can change task status');
    return;
  }
    // If no destination, return
    if (!destination) return;

    // If dropped in the same place, return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    try {
      // Update task status in backend
      await taskAPI.updateTask(draggableId, {
        status: destination.droppableId,
        position: destination.index
      });
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task._id === draggableId 
          ? { ...task, status: destination.droppableId }
          : task
      ));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-black mb-2">Project not found</h2>
        <p className="text-gray-600">The project you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black mb-2">{project.title}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {project.members?.length || 0} members
              </span>
            </div>
            <div className="flex -space-x-2">
              {project.members?.filter(m => m && m.name).slice(0, 5).map((member, index) => (
                <div
                  key={index}
                  className="w-8 h-8 bg-black rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            <span>AI Ideas</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(!showChat)}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateTask(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </motion.button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed right-0 top-0 h-full w-80 bg-white border-l-2 border-black z-40"
        >
          <Chat projectId={id} onClose={() => setShowChat(false)} />
        </motion.div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <div key={column.id} className="space-y-4">
                <div className={`border-2 ${column.color} p-4 bg-gray-50`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-black">{column.title}</h3>
                    <span className="bg-black text-white px-2 py-1 text-xs rounded">
                      {columnTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[500px] space-y-3 ${
                          snapshot.isDraggingOver ? 'bg-gray-100' : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            isDragDisabled={!canDragTask(task)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                                }`}
                              >
                               <TaskCard 
                                    key={task._id}
                                    task={task}
                                    project={project}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                  />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <button
                    onClick={() => {
                      setActiveColumn(column.id);
                      setShowCreateTask(true);
                    }}
                    className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 hover:border-black transition-colors text-gray-600 hover:text-black"
                  >
                    + Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          projectMembers={project?.members || []}
          initialStatus={activeColumn}
          onClose={() => {
            setShowCreateTask(false);
            setActiveColumn('');
          }}
          onSuccess={(newTask) => {
            setTasks([...tasks, newTask]);
            setShowCreateTask(false);
            setActiveColumn('');
          }}
        />
      )}

      {showAIGenerator && (
        <AIIdeaGenerator
          projectId={id}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projectMembers={project?.members || []}
          onClose={() => setEditingTask(null)}
          onSuccess={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default ProjectDetail;

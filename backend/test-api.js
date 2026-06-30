import fs from 'fs';

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let projectId = '';
let taskId = '';
let ticketId = '';
let commentId = '';

const log = (msg) => console.log(`\n🔹 ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const errorLog = (msg, err) => console.error(`❌ ${msg}:`, err);

// Helper function to make HTTP requests
const request = async (endpoint, method = 'GET', body = null, useAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || JSON.stringify(data));
  }
  return data;
};

const runTests = async () => {
  try {
    const testUser = {
      name: 'Test Admin',
      email: `admin${Date.now()}@test.com`,
      password: 'password123',
      role: 'Admin'
    };

    // ----------------------------------------------------
    // 1. Test Authentication Module
    // ----------------------------------------------------
    log('Testing Authentication Module...');
    await request('/auth/register', 'POST', testUser, false);
    success('Registered new Admin user');

    const loginRes = await request('/auth/login', 'POST', { 
      email: testUser.email, 
      password: testUser.password 
    }, false);
    authToken = loginRes.accessToken;
    success('User logged in and received JWT Token');

    // ----------------------------------------------------
    // 2. Test Project Module
    // ----------------------------------------------------
    log('Testing Project Module...');
    const projectRes = await request('/projects', 'POST', { 
      name: 'Test Project', 
      description: 'Created from automated test' 
    });
    projectId = projectRes.project.id;
    success(`Project created with ID: ${projectId}`);

    const allProjects = await request('/projects', 'GET');
    success(`Fetched ${allProjects.projects.length} projects`);

    // ----------------------------------------------------
    // 3. Test Task Module
    // ----------------------------------------------------
    log('Testing Task Module...');
    const taskRes = await request('/tasks', 'POST', { 
      title: 'Automated Test Task', 
      description: 'Verifying task endpoints', 
      project_id: projectId,
      priority: 'High'
    });
    taskId = taskRes.task.id;
    success(`Task created with ID: ${taskId}`);

    const projectTasks = await request(`/tasks/project/${projectId}`, 'GET');
    success(`Fetched ${projectTasks.tasks.length} tasks for the project`);

    // ----------------------------------------------------
    // 4. Test Comment Module
    // ----------------------------------------------------
    log('Testing Comment Module...');
    const commentRes = await request('/comments', 'POST', {
      task_id: taskId,
      comment: 'This is an automated test comment'
    });
    commentId = commentRes.comment.id;
    success(`Comment added to Task ${taskId} with ID: ${commentId}`);

    const taskComments = await request(`/comments/task/${taskId}`, 'GET');
    success(`Fetched ${taskComments.comments.length} comments for the task`);

    // ----------------------------------------------------
    // 5. Test Ticket Module
    // ----------------------------------------------------
    log('Testing Ticket Module...');
    const ticketRes = await request('/tickets', 'POST', {
      subject: 'Test Server Issue',
      description: 'Automated ticket testing',
      priority: 'High'
    });
    ticketId = ticketRes.ticket.id;
    success(`Ticket created with ID: ${ticketId}`);

    const allTickets = await request('/tickets', 'GET');
    success(`Fetched ${allTickets.tickets.length} tickets`);

    // Update ticket
    await request(`/tickets/${ticketId}`, 'PUT', { status: 'In Progress' });
    success('Updated ticket status to In Progress');

    // ----------------------------------------------------
    // 6. Test Chat/Message Module (HTTP History)
    // ----------------------------------------------------
    log('Testing Chat/Messages Module...');
    const messagesRes = await request(`/messages/ticket/${ticketId}`, 'GET');
    success(`Fetched ${messagesRes.messages.length} message history for ticket`);

    log('ALL API ENDPOINTS TESTED SUCCESSFULLY! 🎉🚀');

  } catch (error) {
    errorLog('Test Failed', error.message);
  }
};

runTests();

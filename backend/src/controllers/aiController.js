import { getGeminiModel } from '../config/gemini.js';
import { getUserTasks } from '../models/aiModel.js';
import { getAllProjects } from '../models/projectModel.js';
import { getTicketById, getTicketsByUser } from '../models/ticketModel.js';
import { getMessagesByTicket } from '../models/messageModel.js';

export const chatWithAI = async (req, res, next) => {
  try {
    const { message, history = [], action, ticketId } = req.body;
    const userId = req.user.id;
    const role = req.user.role; // e.g. Admin, Manager, Employee, Agent
    const organizationId = req.user.organization_id;
    const department = req.user.department;

    // Map history to Gemini format first so it is available to both action handlers and conversational chat
    const geminiHistory = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    // Define default system prompt first so we can pass it to getGeminiModel options
    const systemInstruction = `You are "TaskXpertAI", a custom-built large language model and smart workspace assistant for TaskXpert, a project management and support ticketing platform.
You are communicating with a user (Role: ${role}, Department: ${department}).

Guidelines:
1. Provide structured, precise, and professional markdown responses.
2. Use lists, tables, bold text, and emojis where appropriate to format responses.
3. Keep the tone helpful, professional, and encouraging.
4. Answer questions relative to projects, tasks, or tickets using the provided context. If the user asks about something not in the context or database, explain politely, but you can also answer general professional queries.
5. NEVER expose database/system metadata to the user (such as User IDs, Organization IDs, or Ticket/Project IDs). Refer to user accounts by their names, and projects/tasks/tickets by their subjects or titles. Never say "User ID: 5" or "(User ID: 5)" in your responses. Keep IDs completely hidden.
6. If the user asks who created you or what LLM you are, respond that you are "TaskXpertAI", a custom language model created by the TaskXpert team. Do not mention Google, Gemini, or external LLM providers.
7. CRITICAL: Pay close attention to the conversation history (the previous messages in the chat). If the user asks a follow-up question (e.g. using pronouns like "them", "those", "it", or referring to "pending ones" or "that ticket"), resolve these references using the previous history and the provided workspace context. Always respond from history context if relevant.`;

    // Initialize Gemini Model with the systemInstruction
    const model = getGeminiModel({ systemInstruction });

    // 1. Check if we need to perform a specific action
    if (action === 'summarize_tasks') {
      const tasks = await getUserTasks(userId, organizationId);
      
      if (tasks.length === 0) {
        return res.status(200).json({
          reply: "It looks like you don't have any tasks assigned or created right now! Enjoy the clean board, or ask me to draft a new task idea for you. 😊"
        });
      }

      const taskListStr = tasks.map(t => `- **${t.title}** (Project: ${t.project_name}, Status: ${t.status}, Priority: ${t.priority}, Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}) - Description: ${t.description || 'N/A'}`).join('\n');

      const prompt = `Based on the following tasks assigned to me or created by me, please provide a professional, structured overview and executive summary. Categorize them by status and priority, highlight any immediate deadlines, and give me a quick motivational 2-3 bullet point action plan for today.

Tasks Context:
${taskListStr}`;

      const chat = model.startChat({
        history: geminiHistory
      });
      const chatResult = await chat.sendMessage(prompt);
      const responseText = chatResult.response.text();
      return res.status(200).json({ reply: responseText });
    }

    if (action === 'analyze_projects') {
      const projects = await getAllProjects(userId, role, organizationId);

      if (projects.length === 0) {
        return res.status(200).json({
          reply: "There are no projects available in your workspace right now. Let me know if you would like me to outline a template or proposal for a new project!"
        });
      }

      const projectListStr = projects.map(p => `- **${p.name}** (Owner: ${p.owner_name || 'N/A'}, Dept: ${p.department}, Type: ${p.project_type}, Active Tasks: ${p.active_task_count}) - Description: ${p.description || 'N/A'}`).join('\n');

      const prompt = `Based on the following projects list in my workspace, please analyze their status, compare active workload across projects, call out potential bottlenecks (e.g. projects with high active task counts or vague descriptions), and give structured recommendations on project coordination.

Projects Context:
${projectListStr}`;

      const chat = model.startChat({
        history: geminiHistory
      });
      const chatResult = await chat.sendMessage(prompt);
      const responseText = chatResult.response.text();
      return res.status(200).json({ reply: responseText });
    }

    if (action === 'draft_ticket_reply') {
      if (!ticketId) {
        return res.status(400).json({ error: { message: 'Ticket ID is required to draft a reply.' } });
      }

      const ticket = await getTicketById(ticketId, organizationId);
      if (!ticket) {
        return res.status(404).json({ error: { message: 'Ticket not found.' } });
      }

      const messages = await getMessagesByTicket(ticketId);
      const lastMessagesStr = messages.slice(-10).map(m => `[${m.is_from_agent ? 'Agent' : 'User'} - ${m.sender_name}]: ${m.message}`).join('\n');

      const prompt = `Help me draft a professional response for this support ticket.
  
Ticket Info:
- Subject: ${ticket.subject}
- Description: ${ticket.description}
- Priority: ${ticket.priority}
- Department: ${ticket.department}
- Status: ${ticket.status}

Chat history (Last 10 messages):
${lastMessagesStr || '(No messages yet)'}

Write a professional draft reply from the perspective of ${role === 'Agent' || role === 'Admin' || role === 'Manager' ? 'the Support Representative/Agent helping the customer' : 'the User/Client asking for help/updates'}. Keep it concise, helpful, and matching the platform's professional standards. Wrap your draft in a clean, blockquote markdown block so it's easy to read.`;

      const chat = model.startChat({
        history: geminiHistory
      });
      const chatResult = await chat.sendMessage(prompt);
      const responseText = chatResult.response.text();
      return res.status(200).json({ reply: responseText });
    }

    // 2. Otherwise: Conversational Chat
    // To provide standard context of projects/tasks/tickets, fetch it and add as helper background context
    const tasks = await getUserTasks(userId, organizationId);
    const projects = await getAllProjects(userId, role, organizationId);
    const tickets = await getTicketsByUser(userId, organizationId);
    
    const simpleTaskList = tasks.slice(0, 15).map(t => `- [Task #${t.id}] ${t.title} (Project: ${t.project_name}, Status: ${t.status}, Priority: ${t.priority}, Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None'})`);
    const simpleProjectList = projects.map(p => `- [Project #${p.id}] ${p.name} (Owner ID: ${p.owner_id}, Owner Name: ${p.owner_name || 'N/A'}, Active tasks: ${p.active_task_count})`);
    const simpleTicketList = tickets.map(t => `- [Ticket #${t.id}] "${t.subject}" (Status: ${t.status}, Priority: ${t.priority}, Department: ${t.department}, Created By ID: ${t.user_id}, Assigned Agent ID: ${t.agent_id || 'None'}, Created By Name: ${t.user_name || 'N/A'}, Assigned Agent Name: ${t.agent_name || 'None'})`);

    const contextSection = `
Active Workspace Context:
- User: ${req.user.name || 'User'}
- User ID: ${userId}
- Role: ${role}
- Department: ${department}
- Projects:
${simpleProjectList.join('\n') || 'No active projects'}
- Tasks:
${simpleTaskList.join('\n') || 'No active tasks'}
- Tickets:
${simpleTicketList.join('\n') || 'No active tickets'}
`;

    // Add the user's latest query to contents
    const currentPrompt = `
You have access to the conversation history above and the active workspace context below.
Always cross-reference the User Query with the conversation history to answer accurately, especially when the user is asking follow-up questions or using pronouns referencing earlier topics.

Active Workspace Context:
${contextSection}

User Query:
${message}
`;

    const chat = model.startChat({
      history: geminiHistory
    });

    const chatResult = await chat.sendMessage(currentPrompt);
    const reply = chatResult.response.text();

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error in chatWithAI:', error);
    next(error);
  }
};

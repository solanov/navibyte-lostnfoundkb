# Prompt Log: Fullstack Developer - Peja Escares

## Entry 1 - (04/17/2026)

### **Task(s)**

- CREATED DATABASE STRUCTURE, TRIGGER FUNCTIONS  
- CONFIGURED AUTHENTICATION  
- ENABLED RLS and CREATED RLS POLICIES  

### **Prompt (or Summary) provided to the AI**

- Suggest a secure db structure for this application -- This is the web app. It's a lost and found system. You can check more of the details in the docs folder.

### **Output**

The agent gave me a proper checklist on creating the database. It also suggested security features specifically RLS and trigger functions. It also gave me a sample of the database structure and the trigger functions.

### **What you changed/improved/rejected from the AI's output**

I refined the database structure to fit the needs of the application. I also added some additional security features that were not mentioned in the original output.

### **Reason (Why?)**

The trigger that is given by the AI agent prevents me from creating a new user.

```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **What you learned or the decision you made as a result**

I learned that you should always double check and test the codes that the AI agent gives you.

---

## Entry 2 - (04/17/2026)

### **Task(s)**

- FIXED AUTHENTICATION  
- IMPLEMENTED LOGIN WITH GOOGLE  
- FIXED ACCOUNT CREATION  
- IMPLEMENTED PASSWORD RESET  

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a login and registration page.  
- How do I implement sign in with google?  

### **Output**

- The AI agent gave me a very comprehensive guide on creating a login and registration page. It also gave me a sample of the login and registration page.  

- The AI agent gave me a sample code of how to implement sign in with google. I tested it and it worked perfectly.  

### **What you changed/improved/rejected from the AI's output**

- I added a landing page after registration instead of logging the user in immediately.

### **Reason (Why?)**

- The AI agent didn't think that we need to verify the email of the user first before logging them in. So I added a landing page after registration.

### **What you learned or the decision you made as a result**

- I learned that it's better to have a multi-step onboarding process for new users. It gives them a sense of accomplishment and allows them to familiarize themselves with the application.  

- I also learned that email verification is a must use for modern systems to prevent spam and abuse.

---

## Entry 3 - (04/24/2026)

### **Task(s)**

- FIXED NAVIGATION BAR AND HEADER  

### **Prompt (or Summary) provided to the AI**

- Fix the header. It is appearing on the login page. It should only be appearing on the board page.

### **Output**

- The AI agent gave me a new code for the layout which removed the top navigation bar from the authentication pages.

### **What you changed/improved/rejected from the AI's output**

- I didn't change anything in this task. The AI agent's approach handled the issue very well.

### **Reason (Why?)**

- It's a simple bug and I'm satisfied with the solution.

### **What you learned or the decision you made as a result**

- I have learned that sometimes you don't need to over-engineer a solution. A simple fix can go a long way.

---

## Entry 4 - (04/24/2026)

### **Task(s)**

- IMPLEMENTED EMAIL VERIFICATION  

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a landing page after registration that will serve as a verification page. The user needs to click a link in their email to verify their account.

### **Output**

- The AI agent provided a very comprehensive guide on creating a landing page after registration that will serve as a verification page. It also created a sample routing code for the landing page.

### **What you changed/improved/rejected from the AI's output**

- I changed a little bit in the code specifically on redirecting the user after the email verification. The AI agent immediately redirected the user to the dashboard. So I changed it to redirect the user to the login page instead to let the new verified user log in with their credentials.

### **Reason (Why?)**

- It's a must fix since it can be a security risk if we allow users to be redirected to the board page without logging in first.

### **What you learned or the decision you made as a result**

- Having a keen eye for security is a must in software development.

---

## Entry 5 - (04/27/2026)

### **Task(s)**

- IMPLEMENTED A CREATION PAGE  
- IMPLEMENTED A DRAG/DROP/BROWSE IMAGE FEATURE  

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a creation page for the lost/found items. It should have a form that will allow the user to create a new lost/found item.  
- Guide me into creating a drag/drop/browse image feature for the creation page. It should allow the user to drag and drop an image to the creation page, browse for an image, or take a picture of an image.

### **Output**

- The AI agent provided a very comprehensive guide on creating a creation page for the lost/found items. It also created a sample routing code for the creation page.  

- The AI agent provided a very comprehensive guide on creating a drag/drop/browse image feature for the creation page. It also created a sample code for the drag/drop/browse image feature.

### **What you changed/improved/rejected from the AI's output**

- I changed a little bit in the code specifically on the image upload feature.

### **Reason (Why?)**

- I refined the upload handling to better fit the user flow and improve usability.

### **What you learned or the decision you made as a result**

- Having a keen eye for usability and user experience is important when implementing user-facing features.

---

## Entry 6 - (04/26/2026)

### **Task(s)**

- Implemented Mobile View with Bottom Nav Bar on Public Dashboard  

### **Prompt (or Summary) provided to the AI**

- How do implement a mobile view with a bottom navigation bar on the public dashboard?

### **Output**

- The AI agent gave me a proper sample code for a bottom navigation bar that is only visible on mobile view.

### **What you changed/improved/rejected from the AI's output**

- I didn't change a thing. The AI agent's approach handled the issue very well.

### **Reason (Why?)**

- The AI agent satisfied me with its solution and it passed the testing phase.

### **What you learned or the decision you made as a result**

- Being concise to the AI agent can lead to a more precise output.

---

## Entry 7 - (04/27/2026)

### **Task(s)**

- Implemented Forgot Password Feature  

### **Prompt (or Summary) provided to the AI**

- Suggest a secured flow on implementing a forgot-password feature.

### **Output**

- The AI agent gave me a comprehensive guide on how to implement a forgot-password feature. It provided an algorithm and proper routing codes for the feature.

### **What you changed/improved/rejected from the AI's output**

- I changed some flows in the forgot-password feature. The initial suggestion of the agent was a bit overkill since it involved creating a new table for OTP verification. So I opted for a simpler flow that uses the existing database structure.

### **Reason (Why?)**

- Although we used a simple solution, it was able to pass the security testing phase. I also included session cookies to prevent session hijacking. The reset-password link sent is also only valid for 1 hour.

### **What you learned or the decision you made as a result**

- Security is one of the most important things to consider in software development, especially in today's era where AI-generated code is becoming more common.

---

## Entry 8 - (04/29/2026)

### **Task(s)**

- Implemented admin page and core logic for admin and user roles  

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a proper admin page for the lost and found system. It should have a dashboard that shows the statistics of the application, a page for user management, a page for item management, and a page for message management.

### **Output**

- The AI agent gave me a very comprehensive guide on how to implement an admin page for the lost and found system. It provided an algorithm and proper routing codes for the feature.

### **What you changed/improved/rejected from the AI's output**

- I changed the flow of routing since the AI agent still passed through the user dashboard.

### **Reason (Why?)**

- Users should be redirected to the admin dashboard directly after login if they are an admin.

### **What you learned or the decision you made as a result**

- I learned that even a powerful AI agent can still make mistakes, so it's important to always double-check the output and make sure it's correct.

---

## Entry 9 - (05/02/2026)

### **Task(s)**

- Implemented user-to-user conversation system  

### **Prompt (or Summary) provided to the AI**

- Implement a chat system between users. It should have a page for the user's conversations, a page for the user's messages, and a page for the user's chatroom.

### **Output**

- The AI agent had a hard time generating the chat system. It provided a lot of sample codes and algorithms but none of them worked. I watched tutorials from YouTube and other resources to understand how to implement a chat system.

### **What you changed/improved/rejected from the AI's output**

- I didn't accept the output of the AI agent since I think its approach was too complicated and inefficient.

### **Reason (Why?)**

- The approach was too complicated and inefficient.

### **What you learned or the decision you made as a result**

- I learned that AI agents are great for generating ideas and sample codes, but they are not always the best for solving complex problems. Sometimes, it's better to rely on human intuition and creativity.

---

## Entry 10 - (05/06/2026)

### **Task(s)**

- Refined UI Design on Public Board  

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a more refined UI design on the public board. It should be more modern and user-friendly.

### **Output**

- The AI agent couldn't create the design itself, but it gave me sample designs and taught me how to implement them. I implemented my own design by looking at templates and existing software designs as inspiration.

### **What you changed/improved/rejected from the AI's output**

- I changed the UI design to make it more modern and user-friendly.

### **Reason (Why?)**

- The AI agent didn't meet my expectations. I think its approach was too simple and not modern enough.

### **What you learned or the decision you made as a result**

- I think designing a good UI/UX is one of AI's weaknesses.

---

## Entry 11 - (05/09/2026)

### **Task(s)**

- EDITED ADMIN AND USER NAVIGATION FLOW  


### **Prompt (or Summary) provided to the AI**

- Suggest a cleaner navigation flow between admin and user routes.  
- How should I implement a notification system for claims, item updates, and account activities?  
- Suggest a proper audit logging structure for a lost and found system.  
- Help me simplify a dual-claim process where users can claim items either from another user or from the university department office.

### **Output**

- The AI agent suggested a cleaner routing structure separating admin and user flows.  
- It provided ideas for implementing notifications for claim requests, item status updates, and account-related actions.  
- The AI agent also suggested categorizing audit logs into separate processes for user-to-user returns and department-handled releases.  
- It helped refine the dual-claim process by simplifying the workflow into two fulfillment paths depending on where the item is currently held.

### **What you changed/improved/rejected from the AI's output**

- I simplified the notification system to avoid overcomplicating the application with unnecessary real-time features.  
- I refined the audit log structure into categorized logs for easier tracking and accountability.  
- I also changed the claim process logic by basing the process on the item's current holder instead of who originally posted the item.

### **Reason (Why?)**

- The original suggestions were too complex for the scope of the project and introduced unnecessary implementation overhead.  
- Using the item's current holder as the basis of the process created a more accurate and scalable workflow since items can move between users and the department office over time.  
- Categorizing logs also improves maintainability and allows easier auditing of transactions.

### **What you learned or the decision you made as a result**

- I learned that simplifying workflows is important when designing systems. A simpler but well-structured process is often more maintainable and easier to scale than an over-engineered solution.  
- I also learned that audit logging and process tracking are important for accountability and system transparency, especially in transaction-based systems like a lost and found application.

## Entry 12 - (05/10/2026)

### **Task(s)**

- IMPLEMENTED NOTIFICATION CENTER UI  
- IMPLEMENTED CLAIM STATUS NOTIFICATIONS  
- IMPLEMENTED ITEM UPDATE NOTIFICATIONS  

### **Prompt (or Summary) provided to the AI**

- Suggest a clean and user-friendly notification system for the lost and found application.  
- How should I structure notifications for claims, item updates, and account activities?

### **Output**

- The AI agent suggested creating a centralized notification system that can handle claim updates, item activity, and account-related alerts.  
- It also suggested organizing notifications by category and status for easier tracking.

### **What you changed/improved/rejected from the AI's output**

- I simplified the implementation by avoiding unnecessary real-time technologies and instead focused on a lightweight and maintainable notification flow.  
- I also refined the UI structure to better fit the overall design of the application.

### **Reason (Why?)**

- The original suggestion introduced unnecessary complexity for the scope of the project.  
- A simpler notification flow is easier to maintain while still delivering the required functionality.

### **What you learned or the decision you made as a result**

- I learned that not all systems require advanced real-time solutions. Sometimes, a simpler implementation can provide a better balance between functionality and maintainability.

---

## Entry 13 - (05/10/2026)

### **Task(s)**

- REFINED AUDIT LOG STRUCTURE  
- IMPLEMENTED CATEGORIZED TRANSACTION LOGS  
- IMPROVED TRACKING AND ACCOUNTABILITY FLOW  

### **Prompt (or Summary) provided to the AI**

- Suggest a better audit logging structure for a lost and found system.  
- How should I separate logs between user transactions and department transactions?

### **Output**

- The AI agent suggested separating audit logs into categorized processes depending on how the item was claimed and released.  
- It also suggested storing transaction history for accountability and verification purposes.

### **What you changed/improved/rejected from the AI's output**

- I refined the audit logs further by separating peer-to-peer returns from department-handled releases.  
- I also simplified some of the logging structure to avoid redundant records.

### **Reason (Why?)**

- Categorized logs make it easier to trace transactions and improve maintainability.  
- Simplifying the structure also reduces unnecessary data duplication.

### **What you learned or the decision you made as a result**

- I learned that audit logging is important for transparency and accountability in transaction-based systems.  
- Properly categorized logs also make future maintenance and debugging easier.

---

## Entry 14 - (05/11/2026)

### **Task(s)**

- IMPLEMENTED DUAL CLAIM PROCESS  
- REFINED CLAIM ROUTING LOGIC  
- IMPLEMENTED CURRENT HOLDER-BASED CLAIM FLOW  

### **Prompt (or Summary) provided to the AI**

- Help me simplify a dual-claim process where users can claim items either from another user or from the university department office.  
- Suggest a clean workflow for handling both user-to-user and department-managed item claims.

### **Output**

- The AI agent suggested creating two fulfillment paths within the same claim system:
  - Student-to-student return flow  
  - Student-to-department pickup flow  
- It also suggested using the item's current holder as the basis for determining the process flow.

### **What you changed/improved/rejected from the AI's output**

- I simplified the workflow further by keeping a single claim system while only changing the fulfillment process depending on who currently holds the item.  
- I also refined the tracking logic to ensure all transactions generate proper audit records.

### **Reason (Why?)**

- The original workflow was becoming too complex and difficult to maintain.  
- Using the item's current holder created a cleaner and more scalable process since items can move between users and the department office.

### **What you learned or the decision you made as a result**

- I learned that separating workflows based on item custody is more reliable than basing it on who originally posted the item.  
- I also learned that simplifying system logic improves maintainability without sacrificing functionality.
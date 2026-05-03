# Prompt Log: Fullstack Developer - Peja Escares

## Entry 1 - (04/17/2026)

### **Task(s)**

-CREATED DATABASE STRUCTURE, TRIGGER FUNCTIONS
-CONFIGURED AUTHENTICATION
-ENABLED RLS and CREATED RLS POLICIES

### **Prompt (or Summary) provided to the AI**

**Suggest a secure db structure for this application -- This is the web app. It's a lost and found system. You can check more of the details in the docs folder.

### **Output**

The agent gave me a proper checklist on creating the database. It also suggested security features specifically RLS and trigger functions. It also gave me a sample of the database structure and the trigger functions.

### **What you changed/improved/rejected fom the AI's output**

I refined the database structure to fit the needs of the application. I also added some additional security features that were not mentioned in the original output. 

### **Reason (Why?)**

The trigger that is given by the AI agent prevents me from creating a new user. 

```SQL
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



### **What you learned or the decision you made as a result**

I learned that you should always double check and test the codes that the AI agent gives you. 

## Entry 2 - (04/17/2026)

### **Task(s)**

-FIXED AUTHENTICATION
-IMPLEMENTED LOGIN WITH GOOGLE
-FIXED ACCOUNT CREATION
-IMPLEMENTED PASSWORD RESET

### **Prompt (or Summary) provided to the AI**

-Guide me into creating a login and registration page.
-How do I implement sign in with google?

### **Output**

-The AI agent gave me a very comprehensive guide on creating a login and registration page. It also gave me a sample of the login and registration page.

-The AI agent gave me a sample code of how to implement sign in with google. I tested it and it worked perfectly. I 

### **What you changed/improved/rejected fom the AI's output**

- I added a landing page after registration instead of logging the user in immediately. 


### **Reason (Why?)**

-The AI agent didn't thought that we need to verify the email of the user first before logging them in. So I added a landing page after registration. 

### **What you learned or the decision you made as a result**

- I learned that it's better to have a multi-step onboarding process for new users. It gives them a sense of accomplishment and allows them to familiarize themselves with the application.

-I also learned that email verification is a must use for modern systems to prevent spam and abuse.


## Entry 3 - (04/24/2026)

### **Task(s)**

-FIXED NAVIGATION BAR AND HEADER

### **Prompt (or Summary) provided to the AI**

-Fix the header. It is appearing on the login page. It should only be appearing on the board page.

### **Output**

- The ai agent gave me a new code for the layout. Which took away the top nav in the auth pages. 
### **What you changed/improved/rejected fom the AI's output**
 
- I didn't change anything in this task, the ai agent's approach handled the issue very well.

### **Reason (Why?)**

- It's a simple bug and I'm satisfied with the solution. 

### **What you learned or the decision you made as a result**

- I have learned that sometimes you don't need to over-engineer a solution. A simple fix can go a long way.

## Entry 4 - (04/24/2026)

### **Task(s)**

-IMPLEMENTED EMAIL VERIFICATION

### **Prompt (or Summary) provided to the AI**

-Guide me into creating a landing page after registration that will serve as a verification page. The user needs to click a link in their email to verify their account. 

### **Output**

- The AI agent provided a very comprehensive guide on creating a landing page after registration that will serve as a verification page. It also created a sample routing code for the landing page.

### **What you changed/improved/rejected fom the AI's output**
 
- I changed a little bit in the code specifically on redirecting the user after the email verification. The ai agent immediately redirected the user to the dashboard. So I changed it to redirect the user to login page instead to let the new verified user log-in with their credentials.

### **Reason (Why?)**

- It's a must fix since it can be a security risk if we allow users to be redirected in the board page without logging in first. 

### **What you learned or the decision you made as a result**

- Having a keen eye for security is a must in software development. 

## Entry 5 - (04/27/2026)

### **Task(s)**

-IMPLEMENTED A CREATION PAGE
-IMPLEMENTED A DRAG/DROP/BROWSE IMAGE FEATURE

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a creation page for the lost/found items. It should have a form that will allow the user to create a new lost/found item. 
- Guide me into creating a drag/drop/browse image feature for the creation page. It should allow the user to drag and drop an image to the creation page, browse for an image, or take a picture of an image. 

### **Output**

- The AI agent provided a very comprehensive guide on creating a creation page for the lost/found items. It also created a sample routing code for the creation page. 

- The AI agent provided a very comprehensive guide on creating a drag/drop/browse image feature for the creation page. It also created a sample code for the drag/drop/browse image feature. 

### **What you changed/improved/rejected fom the AI's output**
 
- I changed a little bit in the code specifically on the image upload feature. The ai agent didn't thought that we need to verify the email of the user first before logging them in. So I added a landing page after registration. 

### **Reason (Why?)**

- It's a must fix since it can be a security risk if we allow users to be redirected in the board page without logging in first. 

### **What you learned or the decision you made as a result**

- Having a keen eye for security is a must in software development. 

## Entry 6 - (04/26/2026)

### **Task(s)**

- Implemented Mobile View with Bottom Nav Bar on public dashboard

### **Prompt (or Summary) provided to the AI**

- How do implement a mobile view with a bottom navigation bar on the public dashboard?  
 

### **Output**

-  The ai agent gave me a proper sample code for a bottom navigation bar that is only visible on mobile view. 

### **What you changed/improved/rejected fom the AI's output**
 
-I didn't changed a thing, the AI agent's approach handled the issue very well. 


### **Reason (Why?)**

- The AI agent saitisfied me with its solution. And it passed the testing phase. 

### **What you learned or the decision you made as a result**

- Being concise to the AI agent can lead to a more precise output. 

## Entry 7 - (04/27/2026)

### **Task(s)**

-Implemented Forgot Password Feature.

### **Prompt (or Summary) provided to the AI**

- Suggest a secured flow on implementing a forgot-password feature.  

### **Output**

- The AI agent gave me a comprehensive guide on how to implement a forgot-password feature. It provided an algorithm and proper routing codes for the feature.  

### **What you changed/improved/rejected fom the AI's output**
 
- I changed some flows in the forgot-password feature. The initial suggestion of the agent was a bit overkill since it involved creating a new table for the OTP verification. So I opted for a simpler flow that uses the existing database structure.  


### **Reason (Why?)**

- Although we used a simple solution, it was able to pass the security testing phase. And I also included session cookies to prevent session hijacking. The link sent for the reset password is also only valid for 1 hour. 

### **What you learned or the decision you made as a result**

- Security is by far the most important thing to consider in software development especially in todays era where you can just easily use ai to code. We should prioritize on learning security best practices since I think that is where AI agents usually overlook things.

## Entry 8 - (04/29/2026)

### **Task(s)**

-Implemented admin page and core logic for admin and user roles.

### **Prompt (or Summary) provided to the AI**

- Guide me into creating a proper admin page for the lost and found system. It should have a dashboard that shows the statistics of the application, a page for user management, a page for item management, and a page for message management. 
 
### **Output**

- The AI agent gave me a very comprehensive guide on how to implement an admin page for the lost and found system. It provided an algorithm and proper routing codes for the feature.  
 
### **What you changed/improved/rejected fom the AI's output**
 
-I changed the flow of routing since the ai agent still passes through user dashboard.
 
### **Reason (Why?)**
 
- Users should be redirected to the admin dashboard directly after login if they are an admin.  
 
### **What you learned or the decision you made as a result**
 
- I learned that even a powerful AI agent can still make a mistake, so it's important to always double-check the output and make sure it's correct. 

## Entry 9 - (05/02/2026)

### **Task(s)**

- Implemented user - user conversation.

### **Prompt (or Summary) provided to the AI**

- Implement a chat system between users. It should have a page for the user's conversations, a page for the user's messages, and a page for the user's chatroom.
 
### **Output**

- The AI agent had a hard time generating the chat system. It provided a lot of sample codes and algorithms but none of them worked. I watched tutorials from youtube and other resources to understand how to implement a chat system. 
 
### **What you changed/improved/rejected fom the AI's output**
 
- I didn't accept the output of the ai agent since I think its approach was too complicated and inefficient.
 
### **Reason (Why?)**
 
- Too complicated and inefficient approach.  
 
### **What you learned or the decision you made as a result**
 
- I learned that AI agents are great for generating ideas and sample codes, but they are not always the best for complex problems. Sometimes, it's better to rely on human intuition and creativity. 

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



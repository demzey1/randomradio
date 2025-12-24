# Simple Radio Setup Instructions

## Prerequisites
Make sure you have Node.js installed. Download from: https://nodejs.org/

## Step 1: Install Dependencies
Open PowerShell in the `simple radio` folder and run:
```powershell
npm install express firebase-admin cors
```

## Step 2: Run the Server
You have two options:

### Option A: Firebase Version (Recommended - uses real database)
```powershell
node server.js
```
Then open your browser and go to: **http://localhost:3000**

### Option B: Mock Version (for testing without Firebase)
Open a new PowerShell window and navigate to the `random radio` folder:
```powershell
cd "random radio"
node app.js
```
Then open your browser and go to: **http://localhost:3001**

## Troubleshooting

**Port already in use?**
- If port 3000 or 3001 is busy, edit the `PORT` variable in the respective .js file

**Firebase connection issues?**
- Make sure `demas-c0d1d-firebase-adminsdk-fbsvc-21ce59eb28.json` is in the root folder
- Check your internet connection

**Module not found errors?**
- Run `npm install` again in the root folder

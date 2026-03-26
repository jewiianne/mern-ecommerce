### How To Set Up Mern Ecommerce Website For Selenium Testing

### Prerequisites:
- Node.js (v21.1.0 or later)
- MongoDB installed and running locally
- Nodemon installed globally

MongoDB Installation:
- download MongoDB Community Server at https://www.mongodb.com/try/download/community
- download MongoDB Compass at https://www.mongodb.com/try/download/compass
- (optional) download MongoDB Shell at https://www.mongodb.com/try/download/shell

### MongoDB Compass Setup:
- create a database and create a new collection
- copy the connection string for the backend
### MongoDB Shell Setup (If downloaded):
- navigate to the bin folder of MongoDB (eg. C:\Program Files\MongoDB\Server\8.2\bin) in file explorer and copy the directory
- search editing the environment variables and click environment variables
- click the path variable and click edit
- click new and past the directory, after click ok

### Mern Ecommerce Website Setup:
- clone the GitHub repository: https://github.com/je1ii/Selenium-MernEcommerce.git
- follow the readMe file in the GitHub clone
- install dependencies for frontend and backend separately
- if there are errors installing dependencies for frontend, ignore and run: 

```bash
npm install --legacy-peer-deps
```

- replace all the placeholders for the environment variables
- populate the created database in MongoDB with sample data
- unzip user.collections
- import mern.users in users collections


### IF RUNNING THE WEBSITE HAVE VERSION CONFLICTS:

# For frontend:
- delete the folder node-modules and file package-lock.json
- add: "ajv": "^8.12.0" in the list of dependencies in frontend package.json script
- install dependencies again. if there are errors, enter:

```bash
npm install --legacy-peer-deps
```


# For backend:
- install nvm-setup.exe at: https://github.com/coreybutler/nvm-windows/releases
- run PowerShell as admin and enter the following:

```bash
nvm install 18.19.0
nvm use 18.19.0
```

- check node current node version with: node -v
- delete the folder node-modules and file package-lock.json
- install dependencies again: 

```bash
npm install
```


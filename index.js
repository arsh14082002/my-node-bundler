#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

program
  .command('create <project-name>')
  .description(
    'Create a new Node.js project with Express, CORS, dotenv, Mongoose, and default user routes',
  )
  .action(async (projectName) => {
    await createProject(projectName);
  });

async function createProject(name) {
  const dir = `./${name}`;
  await fs.ensureDir(dir);

  // Create folder structure
  await fs.ensureDir(`${dir}/public`);
  await fs.ensureDir(`${dir}/src`);
  await fs.ensureDir(`${dir}/src/config`);
  await fs.ensureDir(`${dir}/src/controllers`);
  await fs.ensureDir(`${dir}/src/models`);
  await fs.ensureDir(`${dir}/src/routes`);
  await fs.ensureDir(`${dir}/src/utils`);

  // Create package.json
  const packageJson = {
    name,
    version: '1.0.0',
    main: 'server.js',
    type: 'module',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js',
    },
    dependencies: {
      express: '^4.17.1',
      cors: '^2.8.5',
      dotenv: '^10.0.0',
      mongoose: '^6.0.0',
    },
    devDependencies: {
      nodemon: '^3.1.7',
    },
  };
  await fs.writeFile(`${dir}/package.json`, JSON.stringify(packageJson, null, 2));

  // Create app.js
  const appJsContent = `
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Use routes from the routes folder
app.use('/api/user', userRoutes);

export default app;`;

  await fs.writeFile(`${dir}/src/app.js`, appJsContent);

  // Create server.js
  const serverJsContent = `
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import http from 'http';
import app from './src/app.js'; // Correctly import app

dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

// Function to find an available port
const findAvailablePort = (port, maxPort = 65535) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close();
      resolve(port);
    });
    server.on('error', () => {
      if (port < maxPort) {
        resolve(findAvailablePort(port + 1, maxPort));
      } else {
        resolve(null); // No available port found
      }
    });
  });
};

// Start the server
findAvailablePort(PORT).then((availablePort) => {
  if (availablePort) {
    app.listen(availablePort, () => {
      console.log(\`Server is running on port \${availablePort}\`);
    });
  } else {
    console.error('No available ports found.');
  }
});`;

  await fs.writeFile(`${dir}/server.js`, serverJsContent);

  // Create db.js for Mongoose configuration
  const dbJsContent = `import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
        });

        mongoose.connection.on('error', (err) => {
            console.log('MongoDB error: ' + err);
        });

        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};`;

  await fs.writeFile(`${dir}/src/config/db.js`, dbJsContent);

  // Create an initial index.js file for routes
  const routesIndexContent = `import express from 'express';
import userRoutes from './userRoutes.js';

const router = express.Router();

// Use user routes
router.use('/users', userRoutes);

export default router;`;

  await fs.writeFile(`${dir}/src/routes/index.js`, routesIndexContent);

  // Create userRoutes.js
  const userRoutesContent = `import express from 'express';

const userRouter = express.Router();

// Sample user routes
userRouter.get('/', (req, res) => {
    res.send('Get all users');
});

userRouter.post('/', (req, res) => {
    res.send('Create a user');
});

// Define other user-related routes here

export default userRouter;`;

  await fs.writeFile(`${dir}/src/routes/userRoutes.js`, userRoutesContent);

  console.log(`Project ${name} created successfully!`);
  console.log(
    'You can now navigate to the project directory and run "npm install" to install dependencies.',
  );
}

program.parse(process.argv);

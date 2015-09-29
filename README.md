# Music Service 
## Advanced Data Models Master's Degree Unit of Study Project

Project to demonstrate the abilities and use of Polyglot Persitence within a real Application

# Project Structure

The project consists of

1. MongoDB and NEO4j Databases
2. Web application using Node,Express and Angular
3. Tests Using Mocha framework
4. Grunt for task automation and Bower for Lib management
3. Files with sample data imported through Node functions

# How to install

1. npm install 
2. bower install

The project now would be ready to run.

# Starting the application

1. nodemon bin/www
2. grunt serve

The application is dependent on an environment variable called NODE_ENV which has the following properties

1. "development": does not run a static files server which means that all html/js front-end files needs to be serve by grunt webserver. The backend application is being run on port 3000
2. "test": Same "development" properties but it connects to a test database
3. "production": Runs the application in production mode, running also a static content server (Express) eliminating the need of running grunt embedded web server

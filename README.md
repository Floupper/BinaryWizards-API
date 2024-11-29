# Installation
```
git clone <project_remote_URL>
```

Before launching the API, you need to create a *.env* file containing the following information:
```
PORT=33012
DATABASE_URL="file:./dev.db"
JWT_SECRET=<a secret key>
JWT_EXPIRES_IN=10h
```

Once the *.env* file is created and filled out, you can install the dependencies and launch the application with the following commands:
```
npm install
npx prisma db push
npx prisma generate
npm start
```

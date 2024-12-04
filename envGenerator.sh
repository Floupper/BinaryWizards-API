#!/bin/bash
echo "DATABASE_URL=$DATABASE_URL" > .env
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "JWT_EXPIRES_IN=$JWT_EXPIRES_IN" >> .env
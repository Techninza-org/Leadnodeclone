# Use the official Node.js image as the base image
FROM node:20.13.1

# Set the working directory
WORKDIR /src

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma client with the correct binary targets
RUN npx prisma db push

# Build the application
RUN yarn build

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["yarn", "start"]

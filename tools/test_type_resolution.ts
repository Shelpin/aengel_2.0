// Test file to verify type resolution in dependent packages
import { Memory } from "./packages/core/dist/public-api";

// Create a Memory object to verify the types work
const memory: Memory = {
  userId: "user123-aaaa-bbbb-cccc-ddddeeeeefff",
  agentId: "agent123-aaaa-bbbb-cccc-ddddeeeeefff",
  roomId: "room123-aaaa-bbbb-cccc-ddddeeeeefff",
  content: {
    text: "Hello, world!"
  }
};

console.log("Memory object created:", memory); 
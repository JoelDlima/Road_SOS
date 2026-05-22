import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "roadsos-server",
  version: "1.0.0",
});

// Tool: Look up emergency numbers
server.tool(
  "get_emergency_number",
  "Get emergency contact numbers for a specific service type or region",
  {
    service: z.enum(["ambulance", "police", "fire", "highway", "child"]).describe("Emergency service type"),
    region: z.string().optional().describe("Indian state or city"),
  },
  async ({ service, region }) => {
    const numbers = {
      ambulance: "108",
      police: "100",
      fire: "101",
      highway: "1033",
      child: "1098",
    };
    const msg = region
      ? `For ${service} in ${region}, dial ${numbers[service]}`
      : `National ${service} number: ${numbers[service]}`;
    return { content: [{ type: "text", text: msg }] };
  }
);

// Tool: First aid instructions
server.tool(
  "get_first_aid",
  "Get first aid instructions for common emergency scenarios",
  {
    scenario: z.enum([
      "bleeding", "burns", "fracture", "unconscious",
      "heart_attack", "choking", "drowning", "snake_bite",
    ]).describe("Emergency scenario"),
  },
  async ({ scenario }) => {
    const guides = {
      bleeding: "1. Apply direct pressure. 2. Elevate injury. 3. Call 108.",
      burns: "1. Cool under running water 10 min. 2. Cover with cloth. 3. No ice or toothpaste.",
      fracture: "1. Immobilize limb. 2. Apply splint. 3. Call 108.",
      unconscious: "1. Check breathing. 2. Recovery position. 3. Call 108.",
      heart_attack: "1. Keep person sitting. 2. Aspirin if available. 3. Call 108 immediately.",
      choking: "1. Stand behind person. 2. Heimlich maneuver. 3. Call 108 if ineffective.",
      drowning: "1. Remove from water. 2. Check breathing. 3. CPR if needed. 4. Call 108.",
      snake_bite: "1. Keep calm. 2. Immobilize bitten area. 3. Remove jewelry. 4. Call 108. DO NOT suck venom.",
    };
    return {
      content: [{ type: "text", text: guides[scenario] || "Call 108 for emergency assistance." }],
    };
  }
);

// Resource: Road safety knowledge
server.resource(
  "roadsos://knowledge/first-aid",
  "First aid knowledge base module",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify({
        module: "first-aid",
        scenarios: ["bleeding", "burns", "fracture", "unconscious", "heart_attack", "choking", "drowning", "snake_bite"],
      }, null, 2),
      mimeType: "application/json",
    }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);

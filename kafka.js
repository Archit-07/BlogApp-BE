const { Kafka } = require('kafkajs');
const WebSocket = require('ws');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'blogService',
  brokers: ['localhost:9092'], // Ensure the broker address is correct
});

// Initialize Kafka producer
const producer = kafka.producer();

// Initialize Kafka consumer
const consumer = kafka.consumer({ groupId: 'blogGroup' });

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server running on port 8080

// Function to connect the producer
const runProducer = async () => {
  try {
    await producer.connect(); // Connect to Kafka broker
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Error connecting producer:', error);
  }
};

// Function to send a message
const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: message }],
    });
    console.log(`Message sent to topic ${topic}: ${message}`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to connect the consumer
const runConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'blog-events', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageContent = message.value.toString();
        console.log(`Received message: ${messageContent}`);
        
        // Broadcast message to all connected WebSocket clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageContent);
          }
        });
      },
    });

    console.log('Kafka consumer connected');
  } catch (error) {
    console.error('Error connecting consumer:', error);
  }
};

// WebSocket server handling connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    console.log(`Received message from client: ${message}`);
    // Handle incoming messages from WebSocket clients if needed
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start the producer and consumer
const startServices = async () => {
  await runProducer();
  await runConsumer();
};

// Start services and handle any initialization errors
startServices().catch(error => {
  console.error('Error starting services:', error);
});

// Export modules for testing or further use
module.exports = { producer, runProducer, sendMessage, consumer, runConsumer };

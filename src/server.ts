import app from "./app";
import config from "./app/config";
// import transporter from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";

const port = config.port;
const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    await redisClient.connect();
    console.log("Redis connected successfully");

    // await transporter.verify();
    console.log('node mailer connect')
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();

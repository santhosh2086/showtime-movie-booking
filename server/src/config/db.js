import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDB(uri) {
  // Some ISPs/routers/VPNs block the DNS SRV lookup that Atlas "mongodb+srv://" URIs need
  // (error: "querySrv ECONNREFUSED"). Setting DNS_SERVERS=8.8.8.8,1.1.1.1 works around it.
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean));
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

// functions/src/index.ts
import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

export const notifyOnSensorChange = onValueWritten(
  {
    ref: "/sensor_data",
    region: "asia-southeast1",
  },
  async (event) => {
    const after = event.data?.after.val() || {};
    const { humidity, temperature_ds18b20 } = after;

    // Validasi suhu dan kelembaban
    const isTempBad = temperature_ds18b20 > -9 || temperature_ds18b20 < -18;
    const isHumidityBad = humidity < 75 || humidity > 90;

    if (isTempBad || isHumidityBad) {
      const tokensSnap = await admin.database().ref("fcm_tokens").once("value");
      const tokens = Object.keys(tokensSnap.val() || {});

      if (tokens.length === 0) return;

      const payload: admin.messaging.MulticastMessage = {
        notification: {
          title: "⚠️ Kondisi Tidak Ideal!",
          body: `Suhu: ${temperature_ds18b20}°C, Kelembaban: ${humidity}%`,
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(payload);

      console.log("Notification sent to", response.successCount, "devices");
    }
  }
);

export const logSensorDataEveryMinute = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-southeast1",
  },
  async () => {
    // Ambil data sensor
    const snapshot = await admin.database().ref("/sensor_data").get();
    const data = snapshot.val();

    // Ambil status tracking dari path lain
    const trackingSnap = await admin.database().ref("/track/status").get();
    const trackingStatus = trackingSnap.val();

    if (!data || trackingStatus !== true) return;

    const { temperature_ds18b20, humidity, latitude, longitude } = data;

    const newLogRef = admin.firestore().collection("tracking_logs").doc();
    await newLogRef.set({
      temperature: temperature_ds18b20,
      humidity,
      location: {
        lat: latitude,
        lng: longitude,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Logged data at", new Date().toISOString());
  }
);

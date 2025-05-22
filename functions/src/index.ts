// functions/src/index.ts
import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

admin.initializeApp();

export const notifyOnSensorChange = onValueWritten(
  {
    ref: "/sensor_data",
    region: "asia-southeast1",
  },
  async (event) => {
    const after = event.data?.after.val() || {};
    const { humidity, temperature_ds18b20 } = after;

    // Validasi suhu dan kelembapan
    const isTempBad = temperature_ds18b20 > -9 || temperature_ds18b20 < -18;
    const isHumidityBad = humidity < 75 || humidity > 90;

    if (isTempBad || isHumidityBad) {
      const tokensSnap = await admin.database().ref("fcm_tokens").once("value");
      const tokens = Object.keys(tokensSnap.val() || {});

      if (tokens.length === 0) return;

      const payload: admin.messaging.MulticastMessage = {
        notification: {
          title: "⚠️ Kondisi Tidak Ideal!",
          body: `Suhu: ${temperature_ds18b20}°C, Kelembapan: ${humidity}%`,
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(payload);

      console.log("Notification sent to", response.successCount, "devices");
    }
  }
);

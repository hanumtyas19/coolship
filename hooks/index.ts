// functions/index.ts
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const notifyOnSensorChange = functions.database
  .ref("/sensor_data")
  .onUpdate(async (change, context) => {
    const after = change.after.val();
    const { humidity, temperature_ds18b20 } = after;

    const isTempBad = temperature_ds18b20 > -9 || temperature_ds18b20 < -18;
    const isHumidityBad = humidity < 75 || humidity > 90;

    if (isTempBad || isHumidityBad) {
      const tokensSnap = await admin.database().ref("fcm_tokens").once("value");
      const tokens = Object.keys(tokensSnap.val() || {});

      if (tokens.length === 0) return;

      const payload = {
        notification: {
          title: "⚠️ Kondisi Tidak Ideal!",
          body: `Suhu: ${temperature_ds18b20}°C, Kelembapan: ${humidity}%`,
        },
      };

      await admin.messaging().sendMulticast({
        tokens,
        ...payload,
      });
      console.log("Notification sent to", tokens.length, "devices");
    }
  });

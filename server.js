import express from "express";

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const amount = data?.payload?.payment?.entity?.amount || 0;
    const email = data?.payload?.payment?.entity?.email || "";
    const phone = data?.payload?.payment?.entity?.contact || "";

    const event = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: email ? [email] : [],
            ph: phone ? [phone] : []
          },
          custom_data: {
            currency: "INR",
            value: amount / 100
          }
        }
      ]
    };

    console.log("EVENT:", event);

    res.send("OK");
  } catch (e) {
    console.log(e);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => console.log("Server running"));

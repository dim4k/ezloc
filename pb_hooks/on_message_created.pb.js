/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: Send email notification via Resend API when a new contact message is created.
 */
onRecordAfterCreateRequest((e) => {
    const record = e.record;

    const apiKey = $os.getenv("RESEND_API_KEY");
    if (!apiKey) {
        console.warn("⚠️ RESEND_API_KEY is not set. Skipping email notification.");
        return;
    }

    const toEmail = $os.getenv("RESEND_TO_EMAIL");
    if (!toEmail) {
        console.warn("⚠️ RESEND_TO_EMAIL is not set. Skipping email notification.");
        return;
    }

    const name           = record.getString("name");
    const email          = record.getString("email");
    const arrival        = record.getString("arrival")  || "Non précisée";
    const departure      = record.getString("departure") || "Non précisée";
    const message        = record.getString("message");
    const priceEstimation = record.getString("price_estimation") || "Non calculée";

    const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📨 Nouvelle demande de réservation</h1>
    <p style="color: #94a3b8; margin: 4px 0 0;">Location Île-aux-Moines</p>
  </div>

  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Nom</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Email</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Arrivée</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${arrival}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Départ</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${departure}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Estimation</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a5f;">${priceEstimation}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; background: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
      <p style="font-weight: bold; margin: 0 0 8px;">Message :</p>
      <p style="margin: 0; white-space: pre-wrap; color: #475569;">${message}</p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="mailto:${email}?subject=Réponse à votre demande de réservation - Île-aux-Moines"
         style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">
        Répondre à ${name}
      </a>
    </div>
  </div>

  <div style="padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
    Notification automatique — location-ile-aux-moines.fr
  </div>
</div>
    `.trim();

    try {
        const res = $http.send({
            url: "https://api.resend.com/emails",
            method: "POST",
            headers: {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "contact@location-ile-aux-moines.fr",
                to: [toEmail],
                reply_to: email,
                subject: `📨 Nouvelle demande de ${name} (${arrival} → ${departure})`,
                html: html,
            }),
        });

        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Email notification sent for message from ${name} (${email})`);
        } else {
            console.error(`❌ Resend API error ${res.statusCode}:`, res.raw);
        }
    } catch (err) {
        console.error("❌ Failed to send email via Resend:", err);
    }
}, "messages");

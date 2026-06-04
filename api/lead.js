const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

async function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

const buildContext = ({ urgency, sensitivity, tried }) =>
  [
    urgency ? `Mức cấp bách: ${urgency}` : "",
    sensitivity ? `Mức nhạy cảm: ${sensitivity}` : "",
    tried ? `Đã thử: ${tried}` : ""
  ]
    .filter(Boolean)
    .join("\n");

async function insertLead({ email, role, goal, urgency, sensitivity, tried }) {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_leads?on_conflict=email`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      email,
      role,
      goal: [goal, buildContext({ urgency, sensitivity, tried })].filter(Boolean).join("\n\n"),
      source: "9fifi-life-compass"
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase insert failed: ${detail}`);
  }
}

async function inviteUser({ email, role, goal, urgency, sensitivity, tried }) {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = process.env.PUBLIC_SITE_URL || "https://example.com";

  const response = await fetch(`${supabaseUrl}/auth/v1/invite`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      data: {
        role,
        goal,
        urgency,
        sensitivity,
        tried,
        source: "9fifi-life-compass"
      },
      redirect_to: `${siteUrl}/dashboard.html`
    })
  });

  if (!response.ok && response.status !== 422) {
    const detail = await response.text();
    throw new Error(`Supabase invite failed: ${detail}`);
  }
}

async function sendEmail({ to, subject, html }) {
  const resendKey = requiredEnv("RESEND_API_KEY");
  const from = process.env.RESEND_FROM || "Life Compass <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend failed: ${detail}`);
  }
}

function welcomeEmail({ role, goal, urgency, sensitivity, tried }) {
  const safeRole = escapeHtml(role);
  const safeGoal = escapeHtml(goal);
  const safeUrgency = escapeHtml(urgency || "Chưa chọn");
  const safeSensitivity = escapeHtml(sensitivity || "Chưa chọn");
  const safeTried = escapeHtml(tried || "Chưa có");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#16211f">
      <h1 style="font-size:24px">Life Compass đã nhận câu hỏi của bạn</h1>
      <p>Cảm ơn bạn đã đăng ký bước định hướng đầu tiên.</p>
      <p><strong>Nhóm vấn đề:</strong> ${safeRole}</p>
      <p><strong>Bối cảnh:</strong> ${safeGoal}</p>
      <p><strong>Mức cấp bách:</strong> ${safeUrgency}</p>
      <p><strong>Mức nhạy cảm:</strong> ${safeSensitivity}</p>
      <p><strong>Đã thử:</strong> ${safeTried}</p>
      <p>Team sẽ gửi email tiếp theo với các câu hỏi chuẩn bị và hướng follow-up phù hợp.</p>
    </div>
  `;
}

function ownerEmail({ email, role, goal, urgency, sensitivity, tried }) {
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role);
  const safeGoal = escapeHtml(goal);
  const safeUrgency = escapeHtml(urgency || "Chưa chọn");
  const safeSensitivity = escapeHtml(sensitivity || "Chưa chọn");
  const safeTried = escapeHtml(tried || "Chưa có");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#16211f">
      <h1 style="font-size:22px">Lead mới từ Life Compass</h1>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Nhóm vấn đề:</strong> ${safeRole}</p>
      <p><strong>Bối cảnh:</strong> ${safeGoal}</p>
      <p><strong>Mức cấp bách:</strong> ${safeUrgency}</p>
      <p><strong>Mức nhạy cảm:</strong> ${safeSensitivity}</p>
      <p><strong>Đã thử:</strong> ${safeTried}</p>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { message: "Method not allowed" });
  }

  try {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim();
    const goal = String(body.goal || "").trim();
    const urgency = String(body.urgency || "").trim();
    const sensitivity = String(body.sensitivity || "").trim();
    const tried = String(body.tried || "").trim();
    const honeypot = String(body.company || "").trim();

    if (honeypot) {
      return json(res, 200, { message: "Đã nhận thông tin." });
    }

    if (!isEmail(email) || !role || goal.length < 12) {
      return json(res, 400, {
        message: "Điền email hợp lệ, nhóm vấn đề và bối cảnh cụ thể hơn một chút nhé."
      });
    }

    await insertLead({ email, role, goal, urgency, sensitivity, tried });
    await inviteUser({ email, role, goal, urgency, sensitivity, tried });
    await sendEmail({
      to: email,
      subject: "Life Compass: đã nhận câu hỏi của bạn",
      html: welcomeEmail({ role, goal, urgency, sensitivity, tried })
    });

    if (process.env.OWNER_NOTIFY_EMAIL) {
      await sendEmail({
        to: process.env.OWNER_NOTIFY_EMAIL,
        subject: `Lead mới: ${email}`,
        html: ownerEmail({ email, role, goal, urgency, sensitivity, tried })
      });
    }

    return json(res, 200, {
      message: "Đã nhận nhu cầu. Email xác nhận đang được gửi tới bạn."
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      message: "Server chưa xử lý được form. Kiểm tra API keys và thử lại."
    });
  }
}
